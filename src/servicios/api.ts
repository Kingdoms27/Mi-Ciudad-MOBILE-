import * as SecureStore from 'expo-secure-store';
import { RespuestaApi } from '@/src/tipos';

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
const TOKEN_KEY = 'mi-ciudad.token';

export type ArchivoSubido = { url: string; tipo: 'imagen' | 'audio' | 'video'; bytes: number };

export function apiConfigurada() {
  return /^https?:\/\//i.test(BASE);
}

export function obtenerBaseApi() {
  return BASE;
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function error(codigo: string, mensaje: string) {
  return { error: { codigo, mensaje } };
}

async function ejecutar<T>(
  method: Metodo,
  path: string,
  body?: unknown,
  multipart = false,
): Promise<RespuestaApi<T>> {
  if (!apiConfigurada()) {
    return error('API_NO_CONFIGURADA', 'Configurá EXPO_PUBLIC_API_URL para usar la API de Mi Ciudad.');
  }

  const controller = new AbortController();
  // Las consultas públicas no deben congelar la interfaz 30 segundos cuando
  // el teléfono está en 4G y la API funciona sólo en la Wi-Fi de la PC.
  const timeout = setTimeout(() => controller.abort(), method === 'GET' ? 10000 : 30000);

  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    const cabeceras: Record<string, string> = {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    };

    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: cabeceras,
      ...(body === undefined ? {} : { body: multipart ? body as BodyInit : JSON.stringify(body) }),
      signal: controller.signal,
    });

    if (response.status === 204) return { datos: null as T };
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (data && typeof data === 'object' && 'error' in data) return data as RespuestaApi<T>;
      return error(`HTTP_${response.status}`, 'La API no pudo completar la operación.');
    }
    if (!data || typeof data !== 'object' || !('datos' in data)) {
      return error('RESPUESTA_INVALIDA', 'La API respondió en un formato inesperado.');
    }
    return data as RespuestaApi<T>;
  } catch (err) {
    const expirado = err instanceof Error && err.name === 'AbortError';
    const hostLocal = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(BASE);
    const redPrivada = /^https?:\/\/(?:192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/i.test(BASE);
    return error(
      'RED',
      hostLocal
        ? 'La API usa localhost, que en Android apunta al propio teléfono. Conectala a la IP de tu PC.'
        : redPrivada
          ? 'La API de la PC no responde. Activá el servidor y conectá celular y computadora a la misma Wi-Fi (no 4G).'
          : expirado
            ? 'La API tardó demasiado en responder. Revisá que el servidor siga encendido.'
            : 'No se pudo conectar con la API. Revisá la dirección del servidor y tu conexión.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function apiGet<T>(path: string) {
  return ejecutar<T>('GET', path);
}

export function apiPost<T>(path: string, body: unknown) {
  return ejecutar<T>('POST', path, body);
}

export function apiPut<T>(path: string, body?: unknown) {
  return ejecutar<T>('PUT', path, body);
}

export function apiPatch<T>(path: string, body: unknown) {
  return ejecutar<T>('PATCH', path, body);
}

export function apiDelete(path: string) {
  return ejecutar<null>('DELETE', path);
}

export function apiSubirImagen(uri: string): Promise<RespuestaApi<ArchivoSubido>> {
  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  const mime = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('archivo', { uri, name: `visita.${extension === 'png' || extension === 'webp' ? extension : 'jpg'}`, type: mime } as any);
  return ejecutar<ArchivoSubido>('POST', '/archivos', form, true);
}


/**
 * Lee todas las páginas de un endpoint del contrato (datos + meta).
 * No devuelve una lista parcial como si estuviera completa si falla una página.
 */
export async function apiListarTodos<T>(
  path: string,
  porPagina = 100,
  maxPaginas = 30,
): Promise<RespuestaApi<T[]>> {
  const datos: T[] = [];
  const sinPaginacion = path.replace(/([?&])pagina=[^&]*/g, '$1')
    .replace(/([?&])porPagina=[^&]*/g, '$1')
    .replace(/[?&]$/, '');
  const separador = sinPaginacion.includes('?') ? '&' : '?';
  let total = 0;

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const ruta = sinPaginacion + separador + 'pagina=' + pagina + '&porPagina=' + porPagina;
    const respuesta = await apiGet<T[]>(ruta);
    if ('error' in respuesta) return respuesta;
    if (!Array.isArray(respuesta.datos) || !respuesta.meta) {
      return { error: { codigo: 'RESPUESTA_INVALIDA', mensaje: 'La API no devolvió la paginación esperada.' } };
    }

    datos.push(...respuesta.datos);
    total = respuesta.meta.total;
    if (datos.length >= total || respuesta.datos.length === 0) {
      return { datos, meta: { total, pagina: 1, porPagina: datos.length } };
    }
  }
  return { error: { codigo: 'LIMITE_PAGINAS', mensaje: 'El catálogo contiene más páginas de las admitidas.' } };
}

/**
 * Los archivos de NestJS pueden traer URLs `localhost` o la IP antigua
 * de la computadora. Desde Expo Go deben solicitarse al mismo origen
 * actualmente configurado en EXPO_PUBLIC_API_URL.
 *
 * Sólo se reescriben archivos del propio servidor (/archivos/); las
 * fotografías externas se mantienen intactas.
 */
export function urlArchivoParaDispositivo(url: string | null): string | null {
  if (!url || !apiConfigurada()) return url;
  const origen = BASE.match(/^https?:\/\/[^/]+/i)?.[0];
  if (!origen) return url;

  if (url.startsWith('/archivos/')) return origen + url;

  try {
    const archivo = new URL(url);
    if (!/^\/archivos\//i.test(archivo.pathname)) return url;
    const host = archivo.hostname.toLowerCase();
    const hostLocal = ['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(host);
    const hostLan = /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)/.test(host);
    // Cloudflare/Render reciben HTTPS pero NestJS puede construir URLs HTTP
    // cuando CONFIAR_PROXY=false. Para archivos del MISMO host de API, usar
    // siempre el origen HTTPS configurado en Expo; no tocar sitios externos.
    const urlApi = new URL(origen);
    const mismoHostHttp = urlApi.protocol === 'https:' &&
      archivo.protocol === 'http:' && archivo.hostname.toLowerCase() === urlApi.hostname.toLowerCase();
    if (hostLocal || hostLan || mismoHostHttp) {
      return origen + archivo.pathname + archivo.search + archivo.hash;
    }
  } catch {
    // Las URL inválidas se descartan más adelante al cargar las imágenes.
  }
  return url;
}
