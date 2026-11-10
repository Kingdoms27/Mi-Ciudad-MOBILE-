import { categoriasMock } from '@/src/mocks/categorias';
import { lugaresMock } from '@/src/mocks/lugares';
import { Categoria, Lugar, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { apiConfigurada, apiGet, apiListarTodos, obtenerBaseApi } from '@/src/servicios/api';
import { normalizarLugar } from '@/src/servicios/normalizacion';

/**
 * Al conectarse a la API docente, conservar exclusivamente las fotografías
 * que ésta entrega, en el orden original. No anteponer mocks ni otras fuentes.
 */
function conImagenesDeApi(lugar: Lugar): Lugar {
  const remoto = normalizarLugar(lugar);
  return {
    ...remoto,
    imagenes: [...new Set(remoto.imagenes.filter(url => typeof url === 'string' && /^https?:\/\//i.test(url)))],
  };
}

const CACHE_CATEGORIAS = 'categorias:api-v2:' + obtenerBaseApi();
// Nueva versión: descartar registros anteriores con URLs localhost/cache antiguas.
const CACHE_LUGARES = 'lugares:api-v5:' + obtenerBaseApi();

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

  // El catálogo docente es pequeño (26 lugares activos). Pedirlo completo
  // evita conservar fotos anteriores si el docente reemplaza archivos pero
  // su registro no actualiza el campo actualizadoEn.
  const remoto = await apiListarTodos<Lugar>('/lugares', 500);
  if ('datos' in remoto) {
    const activos = remoto.datos.filter(lugar => lugar.activo)
      .map(conImagenesDeApi)
      .sort((a,b) => a.nombre.localeCompare(b.nombre));
    await guardarCache(CACHE_LUGARES, activos);
    return respuestaLista(activos);
  }

  // Sólo recurrir a la última respuesta de la API ante fallos de red.
  // No introducir mocks mezclados mientras la URL docente esté configurada.
  return cache
    ? respuestaLista(cache.filter(lugar=>lugar.activo).map(conImagenesDeApi))
    : remoto;
}

export async function obtenerLugarPorId(id: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada()) {
    const remoto = await apiGet<Lugar>('/lugares/' + encodeURIComponent(id));
    if ('datos' in remoto) return { datos: conImagenesDeApi(remoto.datos) };
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
    if ('datos' in remoto) return { datos: conImagenesDeApi(remoto.datos) };
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
