import { cancelarRecordatorio, notificarCambioEvento, programarRecordatorioEvento } from '@/src/servicios/notificaciones';
import {
  eliminarEventoGuardado, guardarEventoLocal, listarEventosGuardados, obtenerEventoGuardado,
} from '@/src/servicios/db';
import { obtenerEventos } from '@/src/servicios/eventos';
import { apiConfigurada, apiDelete, apiGet, apiPut } from '@/src/servicios/api';
import { hayConexion } from '@/src/servicios/red';
import { Evento, EventoGuardado } from '@/src/tipos';

async function guardarEstadoRemoto(usuarioId: string) {
  if (!apiConfigurada() || !(await hayConexion().catch(() => false))) return;
  const respuesta = await apiGet<Evento[]>('/yo/eventos-guardados?porPagina=100');
  if ('error' in respuesta) throw new Error(respuesta.error.mensaje);

  const actuales = await listarEventosGuardados(usuarioId);
  const porId = new Map(actuales.map(g => [g.eventoId, g]));
  const idsRemotos = new Set(respuesta.datos.map(e => e.id));

  for (const evento of respuesta.datos) {
    const local = porId.get(evento.id);
    if (local) continue;
    await guardarEventoLocal({
      id: `egu-${usuarioId}-${evento.id}`,
      usuarioId,
      eventoId: evento.id,
      creadoEn: new Date().toISOString(),
      notificationId: null,
      ultimoEstado: evento.estado,
    });
  }

  for (const local of actuales) {
    if (idsRemotos.has(local.eventoId)) continue;
    await cancelarRecordatorio(local.notificationId);
    await eliminarEventoGuardado(usuarioId, local.eventoId);
  }
}

export async function cargarEventosGuardados(usuarioId: string) {
  await guardarEstadoRemoto(usuarioId);
  return listarEventosGuardados(usuarioId);
}

export async function estaEventoGuardado(usuarioId: string, eventoId: string) {
  return Boolean(await obtenerEventoGuardado(usuarioId, eventoId));
}

export async function guardarEvento(
  usuarioId: string,
  evento: Evento,
): Promise<{ item: EventoGuardado; recordatorioProgramado: boolean }> {
  const actual = await obtenerEventoGuardado(usuarioId, evento.id);
  if (actual) return { item: actual, recordatorioProgramado: Boolean(actual.notificationId) };

  if (apiConfigurada()) {
    if (!(await hayConexion().catch(() => false))) {
      throw new Error('Necesitás conexión para guardar el evento en tu cuenta.');
    }
    const respuesta = await apiPut<Evento>(`/yo/eventos-guardados/${encodeURIComponent(evento.id)}`);
    if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
  }

  const notificationId = evento.estado === 'programado'
    ? await programarRecordatorioEvento(evento).catch(() => null)
    : null;

  const item: EventoGuardado = {
    id: `egu-${Date.now()}`,
    usuarioId,
    eventoId: evento.id,
    creadoEn: new Date().toISOString(),
    notificationId,
    ultimoEstado: evento.estado,
  };
  await guardarEventoLocal(item);
  return { item, recordatorioProgramado: Boolean(notificationId) };
}

export async function quitarEvento(usuarioId: string, eventoId: string) {
  if (apiConfigurada()) {
    if (!(await hayConexion().catch(() => false))) throw new Error('Necesitás conexión para quitar este evento de tu cuenta.');
    const respuesta = await apiDelete(`/yo/eventos-guardados/${encodeURIComponent(eventoId)}`);
    if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
  }
  const actual = await obtenerEventoGuardado(usuarioId, eventoId);
  if (actual) await cancelarRecordatorio(actual.notificationId);
  await eliminarEventoGuardado(usuarioId, eventoId);
}

export async function sincronizarEstadoEventos(usuarioId: string) {
  await guardarEstadoRemoto(usuarioId).catch(() => undefined);
  const guardados = await listarEventosGuardados(usuarioId);
  const resultado = await obtenerEventos();
  if ('error' in resultado) return;

  for (const guardado of guardados) {
    const evento = resultado.datos.find(e => e.id === guardado.eventoId);
    if (!evento || evento.estado === guardado.ultimoEstado) continue;

    let notificationId = guardado.notificationId;
    if (evento.estado !== 'programado') {
      await cancelarRecordatorio(notificationId);
      notificationId = null;
    } else if (guardado.ultimoEstado !== 'programado') {
      await cancelarRecordatorio(notificationId);
      notificationId = await programarRecordatorioEvento(evento).catch(() => null);
    }
    await notificarCambioEvento(evento).catch(() => false);
    await guardarEventoLocal({ ...guardado, ultimoEstado: evento.estado, notificationId });
  }
}
