import { cancelarRecordatorio, notificarCambioEvento, programarRecordatorioEvento } from '@/src/servicios/notificaciones';
import { eliminarEventoGuardado, guardarEventoLocal, listarEventosGuardados, obtenerEventoGuardado } from '@/src/servicios/db';
import { obtenerEventos } from '@/src/servicios/eventos';
import { Evento, EventoGuardado } from '@/src/tipos';
export async function estaEventoGuardado(usuarioId:string,eventoId:string){return Boolean(await obtenerEventoGuardado(usuarioId,eventoId));}
export async function guardarEvento(usuarioId:string,evento:Evento){const actual=await obtenerEventoGuardado(usuarioId,evento.id);if(actual)return actual;const notificationId=evento.estado==='programado'?await programarRecordatorioEvento(evento).catch(()=>null):null;const item:EventoGuardado={id:`egu-${Date.now()}`,usuarioId,eventoId:evento.id,creadoEn:new Date().toISOString(),notificationId,ultimoEstado:evento.estado};await guardarEventoLocal(item);return item;}
export async function quitarEvento(usuarioId:string,eventoId:string){const actual=await obtenerEventoGuardado(usuarioId,eventoId);if(actual)await cancelarRecordatorio(actual.notificationId);await eliminarEventoGuardado(usuarioId,eventoId);}
export async function sincronizarEstadoEventos(usuarioId:string){const guardados=await listarEventosGuardados(usuarioId);const r=await obtenerEventos();if('error'in r)return;for(const g of guardados){const e=r.datos.find(x=>x.id===g.eventoId);if(e&&e.estado!==g.ultimoEstado){await notificarCambioEvento(e);await guardarEventoLocal({...g,ultimoEstado:e.estado});}}}
