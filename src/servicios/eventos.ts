import { eventosMock } from '@/src/mocks/eventos';
import { Evento, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet } from '@/src/servicios/api';

const CACHE_EVENTOS = 'eventos:api-v1';

function ordenar(eventos: Evento[]) {
  return [...eventos].sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
}

function respuestaLista(datos: Evento[]): RespuestaApi<Evento[]> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: 20 } };
}

export async function obtenerEventos(): Promise<RespuestaApi<Evento[]>> {
  await new Promise(r => setTimeout(r, 150));
  const online = await hayConexion().catch(() => false);

  if (apiConfigurada()) {
    if (online) {
      const remoto = await apiGet<Evento[]>('/eventos?porPagina=100');
      if ('datos' in remoto) {
        const datos = ordenar(remoto.datos);
        await guardarCache(CACHE_EVENTOS, datos);
        return { ...remoto, datos, meta: remoto.meta ?? { total: datos.length, pagina: 1, porPagina: 20 } };
      }
      const cache = await leerCache<Evento[]>(CACHE_EVENTOS);
      if (cache) return respuestaLista(cache);
      return remoto;
    }

    const cache = await leerCache<Evento[]>(CACHE_EVENTOS);
    if (cache) return respuestaLista(cache);
    return { error: { codigo: 'SIN_CACHE', mensaje: 'Abrí la agenda una vez con conexión para consultarla después sin Internet.' } };
  }

  return respuestaLista(ordenar(eventosMock));
}

export async function obtenerEventoPorId(id: string): Promise<RespuestaApi<Evento>> {
  if (apiConfigurada() && await hayConexion().catch(() => false)) {
    const remoto = await apiGet<Evento>(`/eventos/${encodeURIComponent(id)}`);
    if ('datos' in remoto || remoto.error.codigo === 'EVENTO_NO_ENCONTRADO') return remoto;
  }
  const resultado = await obtenerEventos();
  if ('error' in resultado) return resultado;
  const evento = resultado.datos.find(e => e.id === id);
  return evento
    ? { datos: evento }
    : { error: { codigo: 'EVENTO_NO_ENCONTRADO', mensaje: 'No existe ese evento.' } };
}
