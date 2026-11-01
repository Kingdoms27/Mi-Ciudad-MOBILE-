import { categoriasMock } from '@/src/mocks/categorias';
import { lugaresMock } from '@/src/mocks/lugares';
import { Categoria, Lugar, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { apiConfigurada, apiGet, apiListarTodos, obtenerBaseApi } from '@/src/servicios/api';
import { normalizarLugar } from '@/src/servicios/normalizacion';
import { fotosOficialesParaLugar } from '@/src/servicios/fotosTuristicas';

/**
 * El backend de la cátedra proporciona PNG de demostración, no fotos de turismo.
 * Para lugares con nombre idéntico a nuestro catálogo visual, mostrar primero
 * las fotos públicas ya usadas en la app y conservar los PNG oficiales de respaldo.
 * Nunca combinar por ID: los IDs de los dos catálogos no coinciden en todos los lugares.
 */
function conFotosTuristicas(lugar: Lugar): Lugar {
  const remoto = normalizarLugar(lugar);
  const foto = lugaresMock.find(
    candidato => candidato.nombre.trim().toLocaleLowerCase('es') === lugar.nombre.trim().toLocaleLowerCase('es'),
  );
  const oficiales = fotosOficialesParaLugar(lugar.nombre);
  // El backend docente entrega ilustraciones demo. Intentar antes fotografías
  // oficiales del lugar, y conservar sus archivos como respaldo offline.
  return {
    ...remoto,
    imagenes: [...new Set([...oficiales, ...(foto?.imagenes ?? []), ...remoto.imagenes])],
  };
}

const CACHE_CATEGORIAS = 'categorias:api-v2:' + obtenerBaseApi();
// Nueva versión: descartar registros anteriores con URLs localhost/cache antiguas.
const CACHE_LUGARES = 'lugares:api-v4:' + obtenerBaseApi();

function respuestaLista<T>(datos: T[]): RespuestaApi<T[]> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}

export async function obtenerCategorias(): Promise<RespuestaApi<Categoria[]>> {
  if (!apiConfigurada()) return respuestaLista([...categoriasMock].sort((a,b)=>a.orden-b.orden));
  const cache = await leerCache<Categoria[]>(CACHE_CATEGORIAS);
  {
    const remoto = await apiGet<Categoria[]>('/categorias');
    if ('datos' in remoto) {
      const datos = [...remoto.datos].sort((a,b)=>a.orden-b.orden);
      await guardarCache(CACHE_CATEGORIAS, datos);
      return respuestaLista(datos);
    }
    if (!cache) return remoto;
  }
  return cache
    ? respuestaLista(cache)
    : { error: { codigo: 'SIN_CACHE', mensaje: 'Abrí las categorías una vez con conexión para consultarlas offline.' } };
}

export async function obtenerLugares(): Promise<RespuestaApi<Lugar[]>> {
  if (!apiConfigurada()) return respuestaLista(lugaresMock.filter(l=>l.activo));

  const cache = await leerCache<Lugar[]>(CACHE_LUGARES);
  {
    const ultimaActualizacion = cache?.reduce<string | null>(
      (mayor, lugar) => !mayor || lugar.actualizadoEn > mayor ? lugar.actualizadoEn : mayor,
      null,
    );

    // Si hay caché se solicitan sólo cambios, incluidas las bajas. Sin caché se obtiene todo.
    const actualizadoDesde = ultimaActualizacion ?? '2000-01-01T00:00:00-03:00';
    const ruta = '/lugares?actualizadoDesde=' + encodeURIComponent(actualizadoDesde);
    const remoto = await apiListarTodos<Lugar>(ruta, 500);

    if ('datos' in remoto) {
      const mapa = new Map((cache ?? []).map(lugar => [lugar.id, lugar]));
      for (const cambio of remoto.datos) {
        if (!cambio.activo) mapa.delete(cambio.id);
        else mapa.set(cambio.id, conFotosTuristicas(cambio));
      }
      // Las entradas que no cambiaron en la API también deben volver a normalizarse.
      // De lo contrario conservan URLs viejas aunque el código ya esté corregido.
      const activos = [...mapa.values()]
        .filter(l=>l.activo)
        .map(conFotosTuristicas)
        .sort((a,b)=>a.nombre.localeCompare(b.nombre));
      await guardarCache(CACHE_LUGARES, activos);
      return respuestaLista(activos);
    }
    if (!cache) return remoto;
  }

  return cache
    ? respuestaLista(cache.filter(l=>l.activo).map(conFotosTuristicas))
    : { error: { codigo: 'SIN_CACHE', mensaje: 'Abrí el catálogo una vez con conexión para usarlo sin Internet.' } };
}

export async function obtenerLugarPorId(id: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada()) {
    const remoto = await apiGet<Lugar>('/lugares/' + encodeURIComponent(id));
    if ('datos' in remoto) return { datos: conFotosTuristicas(remoto.datos) };
    if (remoto.error.codigo === 'LUGAR_NO_ENCONTRADO') return remoto;
  }
  const lista = await obtenerLugares();
  if ('error' in lista) return lista;
  const lugar = lista.datos.find(l=>l.id===id);
  return lugar
    ? { datos: lugar }
    : { error: { codigo: 'LUGAR_NO_ENCONTRADO', mensaje: 'No encontramos ese lugar.' } };
}

export async function obtenerLugarPorQr(codigoQr: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada()) {
    const remoto = await apiGet<Lugar>('/lugares/qr/' + encodeURIComponent(codigoQr));
    if ('datos' in remoto) return { datos: conFotosTuristicas(remoto.datos) };
    if (remoto.error.codigo !== 'RED') return remoto;
    // La cámara puede leer QR con la API desconectada; consultar caché local.
  }
  const lista = await obtenerLugares();
  if ('error' in lista) return lista;
  const lugar = lista.datos.find(l=>l.codigoQr===codigoQr);
  return lugar
    ? { datos: lugar }
    : { error: { codigo: 'QR_NO_RECONOCIDO', mensaje: 'Ese código no pertenece a Mi Ciudad.' } };
}
