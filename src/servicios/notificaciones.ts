import Storage from 'expo-sqlite/kv-store';
import { Evento, Lugar } from '@/src/tipos';

type ExpoNotifications = typeof import('expo-notifications');

async function cargarNotificaciones(): Promise<ExpoNotifications | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function pedirPermisoNotificaciones() {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;
  const permiso = await Notifications.requestPermissionsAsync();
  return permiso.granted;
}

export async function programarRecordatorioEvento(evento: Evento): Promise<string | null> {
  if (evento.estado !== 'programado') return null;

  const inicio = new Date(evento.inicio);
  const ahora = Date.now();
  if (!Number.isFinite(inicio.getTime()) || inicio.getTime() <= ahora) return null;

  const Notifications = await cargarNotificaciones();
  if (!Notifications) return null;

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return null;

  let fecha = new Date(inicio.getTime() - 60 * 60 * 1000);
  if (fecha.getTime() <= ahora) fecha = new Date(ahora + 5000);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Próximo: ${evento.titulo}`,
      body: 'Abrí Mi Ciudad para ver horario, ubicación y detalles.',
      data: { eventoId: evento.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fecha,
    },
  });
}

export async function cancelarRecordatorio(id: string | null) {
  if (!id) return;
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
}

function fechaLocal() {
  const actual = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${actual.getFullYear()}-${pad(actual.getMonth() + 1)}-${pad(actual.getDate())}`;
}

export async function notificarProximidad(lugar: Lugar) {
  const key = `proximidad:${fechaLocal()}:${lugar.id}`;
  if (await Storage.getItem(key)) return false;

  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Estás cerca de ${lugar.nombre}`,
      body: lugar.descripcionCorta,
      data: { lugarId: lugar.id },
    },
    trigger: null,
  });
  await Storage.setItem(key, '1');
  return true;
}

export async function notificarCambioEvento(evento: Evento) {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Cambio en ${evento.titulo}`,
      body: `El evento figura como ${evento.estado}. Revisá la agenda antes de ir.`,
      data: { eventoId: evento.id },
    },
    trigger: null,
  });
  return true;
}
