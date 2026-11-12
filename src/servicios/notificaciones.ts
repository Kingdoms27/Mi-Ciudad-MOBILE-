import Storage from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Evento, Lugar } from '@/src/tipos';

type ExpoNotifications = typeof import('expo-notifications');
// Un canal nuevo permite HIGH incluso si Android ya creó el canal viejo con DEFAULT.
const CANAL = 'mi-ciudad-recordatorios-v2';
let carga: Promise<ExpoNotifications | null> | null = null;
let canalAndroidDisponible = false;

/**
 * Locales (Expo Go + APK): eventos, cambio de estado y proximidad.
 * No intenta obtener tokens push ni consultar /dispositivos de la API,
 * que devuelve NO_IMPLEMENTADO en la versión de la cátedra.
 */
async function cargarNotificaciones(): Promise<ExpoNotifications | null> {
  if (!carga) {
    carga = (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
        // Expo Go incluye una implementación nativa compartida. En ciertos
        // teléfonos setNotificationChannelAsync arroja NullPointerException;
        // no debe inutilizar TODAS las notificaciones locales.
        //
        // Las builds nativas propias sí pueden crear el canal HIGH. Si falla,
        // permitir que Expo use el canal Android de reserva (Miscellaneous).
        if (Platform.OS === 'android' && Constants.appOwnership !== 'expo') {
          try {
            await Notifications.setNotificationChannelAsync(CANAL, {
              name: 'Recordatorios y proximidad',
              importance: Notifications.AndroidImportance.HIGH,
            });
            canalAndroidDisponible = true;
          } catch (error) {
            canalAndroidDisponible = false;
            if (__DEV__) console.info('[Mi Ciudad] Canal Android no disponible; usando canal del sistema:', error);
          }
        }
        return Notifications;
      } catch (error) {
        if (__DEV__) console.warn('[Mi Ciudad] No se pudieron preparar avisos locales', error);
        return null;
      }
    })();
  }
  return carga;
}

export async function prepararNotificacionesLocales() {
  return Boolean(await cargarNotificaciones());
}

export async function permisoNotificacionesConcedido() {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function pedirPermisoNotificaciones() {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;
  const anterior = await Notifications.getPermissionsAsync();
  if (anterior.granted) return true;
  const permiso = await Notifications.requestPermissionsAsync();
  return permiso.granted;
}

/** Prueba opcional desde Mi cuenta; los avisos reales se programan al guardar
 * eventos y al acercarse a un lugar, sin depender de este botón de prueba. */
export async function programarAvisoLocalDePrueba(): Promise<boolean> {
  const Notifications = await cargarNotificaciones();
  if (!Notifications || !(await pedirPermisoNotificaciones())) return false;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mi Ciudad Colón',
      body: 'Los recordatorios locales están funcionando en este teléfono.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(Platform.OS === 'android' && canalAndroidDisponible ? { channelId: CANAL } : {}),
    },
  }).catch(error => {
    if (__DEV__) console.info('[Mi Ciudad] El dispositivo rechazó el aviso de prueba', error);
    return null;
  }).then(id => Boolean(id));
}

export async function programarRecordatorioEvento(evento: Evento): Promise<string | null> {
  if (evento.estado !== 'programado') return null;

  const inicio = new Date(evento.inicio);
  const ahora = Date.now();
  if (!Number.isFinite(inicio.getTime()) || inicio.getTime() <= ahora) return null;

  const Notifications = await cargarNotificaciones();
  if (!Notifications) return null;

  if (!(await pedirPermisoNotificaciones())) return null;

  // El docente propuso 15 o 30 minutos: fijamos 30 como política de la app.
  let fecha = new Date(inicio.getTime() - 30 * 60 * 1000);
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
      ...(Platform.OS === 'android' && canalAndroidDisponible ? { channelId: CANAL } : {}),
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

  // No interrumpir el inicio de sesión con una petición automática:
  // los permisos se solicitan al usuario en Mi cuenta o al guardar evento.
  if (!(await permisoNotificacionesConcedido())) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Estás cerca de ${lugar.nombre}`,
      body: lugar.descripcionCorta,
      data: { lugarId: lugar.id },
    },
    trigger: Platform.OS === 'android'
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1,
          ...(canalAndroidDisponible ? { channelId: CANAL } : {}) }
      : null,
  });
  await Storage.setItem(key, '1');
  return true;
}

export async function notificarCambioEvento(evento: Evento) {
  const Notifications = await cargarNotificaciones();
  if (!Notifications) return false;

  if (!(await permisoNotificacionesConcedido())) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Cambio en ${evento.titulo}`,
      body: `El evento figura como ${evento.estado}. Revisá la agenda antes de ir.`,
      data: { eventoId: evento.id },
    },
    trigger: Platform.OS === 'android'
      ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1,
          ...(canalAndroidDisponible ? { channelId: CANAL } : {}) }
      : null,
  });
  return true;
}
