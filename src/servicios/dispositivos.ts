import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Storage from 'expo-sqlite/kv-store';
import { apiConfigurada, apiDelete, apiPost } from '@/src/servicios/api';

type Dispositivo = { tokenExpo: string; plataforma: 'ios' | 'android' };
type Prueba = { enviadas: number };
const CLAVE_TOKEN = 'mi-ciudad:push-token';
const CLAVE_PROPIETARIO = 'mi-ciudad:push-usuario';

/**
 * Registro bajo petición del usuario. Push remoto NO funciona en Expo Go Android.
 * La API docente devuelve NO_IMPLEMENTADO hasta que se complete su módulo.
 */
export async function registrarAvisosPush(usuarioId: string) {
  if (!apiConfigurada()) throw new Error('Primero configurá y ejecutá la API de Mi Ciudad.');
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('Los avisos requieren un teléfono iOS o Android.');
  }
  if (Constants.appOwnership === 'expo') {
    throw new Error('Los avisos push remotos se prueban en un build de desarrollo o APK, no desde Expo Go.');
  }

  const Notifications = await import('expo-notifications');
  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) throw new Error('El permiso de notificaciones fue rechazado.');

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Falta vincular el proyecto con EAS para obtener el token Expo Push.');

  let tokenExpo: string;
  try {
    tokenExpo = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    throw new Error('No pudimos obtener el token de notificaciones. Verificá red y configuración de EAS.');
  }

  const plataforma = Platform.OS as 'ios' | 'android';
  const respuesta = await apiPost<Dispositivo>('/dispositivos', { tokenExpo, plataforma });
  if ('error' in respuesta) {
    throw new Error(
      respuesta.error.codigo === 'NO_IMPLEMENTADO'
        ? 'El backend de la cátedra todavía no tiene implementado el registro de dispositivos.'
        : respuesta.error.mensaje,
    );
  }

  await Storage.setItem(CLAVE_TOKEN, tokenExpo);
  await Storage.setItem(CLAVE_PROPIETARIO, usuarioId);
  return respuesta.datos;
}

export async function enviarAvisoPrueba() {
  const respuesta = await apiPost<Prueba>('/dispositivos/prueba', {});
  if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
  return respuesta.datos.enviadas;
}

export async function desvincularAvisosPush(usuarioId: string) {
  const [token, propietario] = await Promise.all([
    Storage.getItem(CLAVE_TOKEN),
    Storage.getItem(CLAVE_PROPIETARIO),
  ]);
  if (!token || propietario !== usuarioId) return;
  if (apiConfigurada()) {
    const respuesta = await apiDelete('/dispositivos/' + encodeURIComponent(token));
    if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
  }
  await Storage.removeItem(CLAVE_TOKEN);
  await Storage.removeItem(CLAVE_PROPIETARIO);
}
