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
  const timeout = setTimeout(() => controller.abort(), 30000);

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
    return error(
      'RED',
      err instanceof Error && err.name === 'AbortError'
        ? 'La API tardó demasiado en responder.'
        : 'No se pudo conectar con la API.',
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
  const url = new URL(path, 'https://mi-ciudad.local');
  const pathname = url.pathname;
  let total = 0;
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    url.searchParams.set('pagina', String(pagina));
    url.searchParams.set('porPagina', String(porPagina));
    const respuesta = await apiGet<T[]>(pathname + url.search);
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
  return { error: { codigo: 'LIMITE_PAGINAS', mensaje: 'El servidor devolvió más páginas de las que admite la sincronización.' } };
}

/**
 * Los assets del backend de desarrollo pueden venir como localhost.
 * En un teléfono, localhost apunta al teléfono, no al PC.
 * Sólo convertimos rutas /archivos del propio backend.
 */
export function urlArchivoParaDispositivo(url: string | null): string | null {
  if (!url || !apiConfigurada()) return url;
  try {
    const origen = new URL(url);
    const base = new URL(BASE);
    if (
      /^\/archivos\//.test(origen.pathname) &&
      ['localhost', '127.0.0.1', '0.0.0.0'].includes(origen.hostname)
    ) return base.origin + origen.pathname + origen.search;
  } catch {
    return url;
  }
  return url;
}
