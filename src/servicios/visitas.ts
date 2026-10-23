import * as Location from 'expo-location';
import { marcarVisitaSincronizada, guardarVisitaLocal, listarVisitasLocales, listarVisitasPendientes } from '@/src/servicios/db';
import { persistirFotoVisita } from '@/src/servicios/archivos';
import { obtenerLugarPorId } from '@/src/servicios/lugares';
import { hayConexion } from '@/src/servicios/red';
import { apiConfigurada, apiListarTodos, apiPatch, apiPost, apiSubirImagen } from '@/src/servicios/api';
import { normalizarVisita } from '@/src/servicios/normalizacion';
import { distanciaKm } from '@/src/utilidades/distancia';
import { OrigenVisita, Visita } from '@/src/tipos';

export type ResultadoSincronizacionVisitas = {
  sincronizadas: number;
  pendientes: number;
  estado: 'completa' | 'sin-conexion' | 'api-no-configurada' | 'fallida';
};

export async function registrarVisita(
  usuarioId: string,
  lugarId: string,
  origen: OrigenVisita,
  nota: string | null = null,
  fotoTemporal: string | null = null,
) {
  const id = `vis-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  let fotoUri: string | null = null;
  if (fotoTemporal) fotoUri = await persistirFotoVisita(fotoTemporal, id);
  const visita: Visita = {
    id,
    usuarioId,
    lugarId,
    fechaHora: new Date().toISOString(),
    origen,
    fotoUri,
    nota: nota?.trim() || null,
    sincronizada: false,
  };
  await guardarVisitaLocal(visita);
  return visita;
}

export async function obtenerRecorrido(usuarioId?: string) {
  if (apiConfigurada() && usuarioId && await hayConexion().catch(() => false)) {
    const respuesta = await apiListarTodos<Visita>('/yo/visitas', 500);
    if ('datos' in respuesta) {
      const locales = await listarVisitasLocales(usuarioId);
      const porId = new Map(locales.map(v=>[v.id,v]));
      for (const visita of respuesta.datos) {
        if (visita.usuarioId !== usuarioId) continue;
        const local = porId.get(visita.id);
        // Conservar la fotografía local si se descargó/capturó en este dispositivo.
        const fotoUri = local?.fotoUri?.startsWith('file:') ? local.fotoUri : normalizarVisita(visita).fotoUri;
        await guardarVisitaLocal({ ...visita, fotoUri, sincronizada: true });
      }
    }
  }
  return listarVisitasLocales(usuarioId);
}

export async function validarCercania(lugarId: string, maxMetros = 200) {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (!permiso.granted) {
    return { ok: false, mensaje: 'Necesitamos ubicación para validar que estás cerca. Podés registrar la visita manualmente.' };
  }
  const resultado = await obtenerLugarPorId(lugarId);
  if ('error' in resultado) return { ok: false, mensaje: resultado.error.mensaje };
  const ubicacion = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const km = distanciaKm(
    { latitud: ubicacion.coords.latitude, longitud: ubicacion.coords.longitude },
    resultado.datos.coordenadas,
  );
  return {
    ok: km * 1000 <= maxMetros,
    mensaje: km * 1000 <= maxMetros
      ? 'Ubicación validada.'
      : `Estás a ${Math.round(km * 1000)} m. Acercate a menos de ${maxMetros} m o usá el registro manual.`,
  };
}

export async function sincronizarVisitasPendientes(usuarioId: string): Promise<ResultadoSincronizacionVisitas> {
  const iniciales = await listarVisitasPendientes(usuarioId);
  if (iniciales.length === 0) return { sincronizadas: 0, pendientes: 0, estado: 'completa' };

  const online = await hayConexion().catch(() => false);
  if (!online) return { sincronizadas: 0, pendientes: iniciales.length, estado: 'sin-conexion' };
  if (!apiConfigurada()) return { sincronizadas: 0, pendientes: iniciales.length, estado: 'api-no-configurada' };

  let sincronizadas = 0;
  for (const visita of iniciales) {
    let fotoRemota: string | null = visita.fotoUri;
    if (fotoRemota && !/^https?:\/\//.test(fotoRemota)) {
      const subida = await apiSubirImagen(fotoRemota);
      if ('error' in subida) continue;
      fotoRemota = subida.datos.url;
    }
    const respuesta = await apiPost<Visita>('/yo/visitas', {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      fotoUri: fotoRemota,
      nota: visita.nota,
    });
    if ('error' in respuesta) continue;
    await marcarVisitaSincronizada(visita.id);
    sincronizadas++;
  }

  const restantes = await listarVisitasPendientes(usuarioId);
  return {
    sincronizadas,
    pendientes: restantes.length,
    estado: restantes.length === 0 ? 'completa' : 'fallida',
  };
}

/** Cambiar una nota o foto de una visita ya guardada en el servidor. */
export async function actualizarVisitaServidor(
  visita: Visita,
  cambios: { nota?: string | null; fotoUri?: string | null },
) {
  if (!apiConfigurada() || !(await hayConexion().catch(()=>false))) {
    return { error: { codigo: 'SIN_CONEXION', mensaje: 'Necesitás Internet para actualizar una visita sincronizada.' } } as const;
  }
  let fotoUri = cambios.fotoUri;
  if (fotoUri && !/^https?:\\/\\//.test(fotoUri)) {
    const subida = await apiSubirImagen(fotoUri);
    if ('error' in subida) return subida;
    fotoUri = subida.datos.url;
  }
  const respuesta = await apiPatch<Visita>('/yo/visitas/' + encodeURIComponent(visita.id), {
    ...('nota' in cambios ? { nota: cambios.nota } : {}),
    ...('fotoUri' in cambios ? { fotoUri: fotoUri ?? null } : {}),
  });
  if ('datos' in respuesta) {
    await guardarVisitaLocal({
      ...normalizarVisita(respuesta.datos),
      fotoUri: cambios.fotoUri?.startsWith('file:') ? cambios.fotoUri : normalizarVisita(respuesta.datos).fotoUri,
      sincronizada: true,
    });
  }
  return respuesta;
}
