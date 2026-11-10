import { Platform } from 'react-native';
import Storage from 'expo-sqlite/kv-store';
import { Evento, Lugar } from '@/src/tipos';

type ExpoNotifications = typeof import('expo-notifications');
const CANAL = 'mi-ciudad-recordatorios';
let inicializado = false;

async function cargarNotificaciones(): Promise<ExpoNotifications | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/** Las alertas de eventos y proximidad son LOCALES: no necesitan token Expo
 * ni el endpoint /dispositivos (que la API docente deja sin implementar).
 * El handler permite ver el aviso incluso con Mi Ciudad abierta.
 */
export async function inicializarAvisosLocales(): Promise<ExpoNotifications | null> {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return null;
  if (!inicializado) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    inicializado = true;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Recordatorios de Mi Ciudad',
      description: 'Eventos que guardaste y avisos de lugares cercanos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }
  return Notifications;
}

export async function permisosAvisosLocales(): Promise<boolean> {
  const Notifications = await inicializarAvisosLocales();
  if (!Notifications) return false;
  const permiso = await Notifications.getPermissionsAsync();
  return permiso.granted;
}

export async function pedirPermisoNotificaciones() {
  const Notifications = await inicializarAvisosLocales();
  if (!Notifications) return false;
  const actual = await Notifications.getPermissionsAsync();
  if (actual.granted) return true;
  const nuevo = await Notifications.requestPermissionsAsync();
  return nuevo.granted;
}

export async function programarRecordatorioEvento(evento: Evento): Promise<string | null> {
  if (evento.estado !== 'programado') return null;

  const inicio = new Date(evento.inicio);
  const ahora = Date.now();
  if (!Number.isFinite(inicio.getTime()) || inicio.getTime() <= ahora) return null;

  // El permiso se solicita como consecuencia de GUARDAR un evento real,
  // no por un botón artificial de prueba.
  if (!(await pedirPermisoNotificaciones())) return null;
  const Notifications = await inicializarAvisosLocales();
  if (!Notifications) return null;

  let fecha = new Date(inicio.getTime() - 60 * 60 * 1000);
  // Si faltan menos de 60 minutos se avisa poco después de guardarlo.
  if (fecha.getTime() <= ahora) fecha = new Date(ahora + 5000);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Próximo: ${evento.titulo}`,
      body: 'Abrí Mi Ciudad para ver horario, ubicación y detalles.',
      data: { eventoId: evento.id },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fecha,
      channelId: CANAL,
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

  // No solicitar permisos automáticamente por el seguimiento de GPS.
  if (!(await permisosAvisosLocales())) return false;
  const Notifications = await inicializarAvisosLocales();
  if (!Notifications) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Estás cerca de ${lugar.nombre}`,
      body: lugar.descripcionCorta,
      data: { lugarId: lugar.id },
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
  });
  await Storage.setItem(key, '1');
  return true;
}

export async function notificarCambioEvento(evento: Evento) {
  if (!(await permisosAvisosLocales())) return false;
  const Notifications = await inicializarAvisosLocales();
  if (!Notifications) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Cambio en ${evento.titulo}`,
      body: `El evento figura como ${evento.estado}. Revisá la agenda antes de ir.`,
      data: { eventoId: evento.id },
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
  });
  return true;
}
