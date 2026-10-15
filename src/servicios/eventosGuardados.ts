import { cancelarRecordatorio, notificarCambioEvento, programarRecordatorioEvento } from '@/src/servicios/notificaciones';
import { eliminarEventoGuardado, guardarEventoLocal, listarEventosGuardados, obtenerEventoGuardado } from '@/src/servicios/db';
import { obtenerEventos } from '@/src/servicios/eventos';
import { Evento, EventoGuardado } from '@/src/tipos';

export async function estaEventoGuardado(usuarioId: string, eventoId: string) {
  return Boolean(await obtenerEventoGuardado(usuarioId, eventoId));
}

export async function guardarEvento(
  usuarioId: string,
  evento: Evento,
): Promise<{ item: EventoGuardado; recordatorioProgramado: boolean }> {
  const actual = await obtenerEventoGuardado(usuarioId, evento.id);
  if (actual) return { item: actual, recordatorioProgramado: Boolean(actual.notificationId) };

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
  const actual = await obtenerEventoGuardado(usuarioId, eventoId);
  if (actual) await cancelarRecordatorio(actual.notificationId);
  await eliminarEventoGuardado(usuarioId, eventoId);
}

export async function sincronizarEstadoEventos(usuarioId: string) {
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
