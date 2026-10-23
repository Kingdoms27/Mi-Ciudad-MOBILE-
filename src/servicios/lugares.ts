import { categoriasMock } from '@/src/mocks/categorias';
import { lugaresMock } from '@/src/mocks/lugares';
import { Categoria, Lugar, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet, apiListarTodos, obtenerBaseApi } from '@/src/servicios/api';
import { normalizarLugar } from '@/src/servicios/normalizacion';

const CACHE_CATEGORIAS = 'categorias:api-v2:' + obtenerBaseApi();
const CACHE_LUGARES = 'lugares:api-v2:' + obtenerBaseApi();

function respuestaLista<T>(datos: T[]): RespuestaApi<T[]> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}

export async function obtenerCategorias(): Promise<RespuestaApi<Categoria[]>> {
  if (!apiConfigurada()) return respuestaLista([...categoriasMock].sort((a,b)=>a.orden-b.orden));
  const cache = await leerCache<Categoria[]>(CACHE_CATEGORIAS);
  if (await hayConexion().catch(()=>false)) {
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
  if (await hayConexion().catch(()=>false)) {
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
        else mapa.set(cambio.id, normalizarLugar(cambio));
      }
      const activos = [...mapa.values()].filter(l=>l.activo).sort((a,b)=>a.nombre.localeCompare(b.nombre));
      await guardarCache(CACHE_LUGARES, activos);
      return respuestaLista(activos);
    }
    if (!cache) return remoto;
  }

  return cache
    ? respuestaLista(cache)
    : { error: { codigo: 'SIN_CACHE', mensaje: 'Abrí el catálogo una vez con conexión para usarlo sin Internet.' } };
}

export async function obtenerLugarPorId(id: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada() && await hayConexion().catch(()=>false)) {
    const remoto = await apiGet<Lugar>('/lugares/' + encodeURIComponent(id));
    if ('datos' in remoto) return { datos: normalizarLugar(remoto.datos) };
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
  if (apiConfigurada() && await hayConexion().catch(()=>false)) {
    const remoto = await apiGet<Lugar>('/lugares/qr/' + encodeURIComponent(codigoQr));
    return 'datos' in remoto ? { datos: normalizarLugar(remoto.datos) } : remoto;
  }
  const lista = await obtenerLugares();
  if ('error' in lista) return lista;
  const lugar = lista.datos.find(l=>l.codigoQr===codigoQr);
  return lugar
    ? { datos: lugar }
    : { error: { codigo: 'QR_NO_RECONOCIDO', mensaje: 'Ese código no pertenece a Mi Ciudad.' } };
}
