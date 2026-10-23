import { eventosMock } from '@/src/mocks/eventos';
import { Evento, RespuestaApi } from '@/src/tipos';
import { guardarCache, leerCache } from '@/src/servicios/cache';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiGet, apiListarTodos, obtenerBaseApi } from '@/src/servicios/api';
import { normalizarEvento } from '@/src/servicios/normalizacion';

const CACHE_EVENTOS = 'eventos:api-v2:' + obtenerBaseApi();

function ordenar(eventos: Evento[]) {
  return [...eventos].sort((a,b)=>new Date(a.inicio).getTime()-new Date(b.inicio).getTime());
}
function lista(datos: Evento[]): RespuestaApi<Evento[]> {
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}

export async function obtenerEventos(): Promise<RespuestaApi<Evento[]>> {
  if (!apiConfigurada()) return lista(ordenar(eventosMock));

  const cache = await leerCache<Evento[]>(CACHE_EVENTOS);
  if (await hayConexion().catch(()=>false)) {
    const respuesta = await apiListarTodos<Evento>('/eventos', 100);
    if ('datos' in respuesta) {
      const datos = ordenar([...new Map(respuesta.datos.map(e=>[e.id,normalizarEvento(e)])).values()]);
      await guardarCache(CACHE_EVENTOS, datos);
      return lista(datos);
    }
    if (!cache) return respuesta;
  }

  return cache
    ? lista(cache)
    : { error: { codigo: 'SIN_CACHE', mensaje: 'Abrí la agenda una vez con conexión para consultarla sin Internet.' } };
}

export async function obtenerEventoPorId(id: string): Promise<RespuestaApi<Evento>> {
  if (apiConfigurada() && await hayConexion().catch(()=>false)) {
    const remoto = await apiGet<Evento>('/eventos/' + encodeURIComponent(id));
    if ('datos' in remoto) return { datos: normalizarEvento(remoto.datos) };
    if (remoto.error.codigo === 'EVENTO_NO_ENCONTRADO') return remoto;
  }
  const resultado = await obtenerEventos();
  if ('error' in resultado) return resultado;
  const evento = resultado.datos.find(e=>e.id===id);
  return evento
    ? { datos: evento }
    : { error: { codigo: 'EVENTO_NO_ENCONTRADO', mensaje: 'No encontramos ese evento.' } };
}

/** Permite demostrar con la cuenta administradora la suspensión/cancelación de un evento. */
export async function cambiarEstadoEvento(id: string, estado: 'programado'|'suspendido'|'cancelado') {
  const { apiPatch } = await import('@/src/servicios/api');
  return apiPatch<Evento>('/eventos/' + encodeURIComponent(id) + '/estado', { estado });
}
