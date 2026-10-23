import { categoriasMock } from '@/src/mocks/categorias';
import { lugaresMock } from '@/src/mocks/lugares';
import { Categoria, Lugar, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet } from '@/src/servicios/api';

const esperar = (ms = 180) => new Promise(r => setTimeout(r, ms));
const CACHE_LUGARES = 'lugares:api-v1';
const CACHE_CATEGORIAS = 'categorias:api-v1';

function respuestaLista<T>(datos: T[], porPagina: number): RespuestaApi<T[]> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina } };
}

export async function obtenerCategorias(): Promise<RespuestaApi<Categoria[]>> {
  await esperar();
  const online = await hayConexion().catch(() => false);

  if (apiConfigurada()) {
    if (online) {
      const remoto = await apiGet<Categoria[]>('/categorias');
      if ('datos' in remoto) {
        const datos = [...remoto.datos].sort((a, b) => a.orden - b.orden);
        await guardarCache(CACHE_CATEGORIAS, datos);
        return { ...remoto, datos, meta: remoto.meta ?? { total: datos.length, pagina: 1, porPagina: 50 } };
      }
      const cache = await leerCache<Categoria[]>(CACHE_CATEGORIAS);
      if (cache) return respuestaLista(cache, 50);
      return remoto;
    }

    const cache = await leerCache<Categoria[]>(CACHE_CATEGORIAS);
    if (cache) return respuestaLista(cache, 50);
  }

  const datos = [...categoriasMock].sort((a, b) => a.orden - b.orden);
  return respuestaLista(datos, 50);
}

export async function obtenerLugares(): Promise<RespuestaApi<Lugar[]>> {
  await esperar();
  const online = await hayConexion().catch(() => false);

  if (apiConfigurada()) {
    if (online) {
      const remoto = await apiGet<Lugar[]>('/lugares?porPagina=500&actualizadoDesde=2000-01-01T00%3A00%3A00-03%3A00');
      if ('datos' in remoto) {
        const datos = remoto.datos;
        await guardarCache(CACHE_LUGARES, datos.filter(l => l.activo));
        const activos = datos.filter(l => l.activo);
        return { ...remoto, datos: activos, meta: { total: activos.length, pagina: 1, porPagina: 500 } };
      }
      const cache = await leerCache<Lugar[]>(CACHE_LUGARES);
      if (cache) return respuestaLista(cache, 20);
      return remoto;
    }

    const cache = await leerCache<Lugar[]>(CACHE_LUGARES);
    if (cache) return respuestaLista(cache, 20);
  }

  return respuestaLista(lugaresMock.filter(l => l.activo), 20);
}

export async function obtenerLugarPorId(id: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada() && await hayConexion().catch(() => false)) {
    const remoto = await apiGet<Lugar>(`/lugares/${encodeURIComponent(id)}`);
    if ('datos' in remoto || remoto.error.codigo === 'LUGAR_NO_ENCONTRADO') return remoto;
  }
  const lista = await obtenerLugares();
  if ('error' in lista) return lista;
  const lugar = lista.datos.find(l => l.id === id && l.activo);
  return lugar
    ? { datos: lugar }
    : { error: { codigo: 'LUGAR_NO_ENCONTRADO', mensaje: 'No existe ese lugar.' } };
}

export async function obtenerLugarPorQr(codigoQr: string): Promise<RespuestaApi<Lugar>> {
  if (apiConfigurada() && await hayConexion().catch(() => false)) {
    const remoto = await apiGet<Lugar>(`/lugares/qr/${encodeURIComponent(codigoQr)}`);
    return remoto;
  }
  // Sin señal, validar el código contra el catálogo previamente descargado.
  const lista = await obtenerLugares();
  if ('error' in lista) return lista;
  const lugar = lista.datos.find(l => l.codigoQr === codigoQr && l.activo);
  return lugar
    ? { datos: lugar }
    : { error: { codigo: 'QR_INVALIDO', mensaje: 'El código QR no pertenece a Mi Ciudad.' } };
}
