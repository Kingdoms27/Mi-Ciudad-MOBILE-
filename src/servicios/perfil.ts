import { guardarUsuario } from '@/src/servicios/auth';
import { apiConfigurada, apiPatch, apiSubirImagen } from '@/src/servicios/api';
import { normalizarUsuario } from '@/src/servicios/normalizacion';
import { persistirFotoVisita } from '@/src/servicios/archivos';
import { Usuario } from '@/src/tipos';

export async function actualizarPerfil(
  actual: Usuario,
  cambios: { nombre?: string; avatarUri?: string | null },
): Promise<Usuario> {
  const nombre = cambios.nombre?.trim();
  if (nombre !== undefined && !nombre) throw new Error('Ingresá un nombre.');

  let avatarUrl: string | null | undefined = cambios.avatarUri;
  if (apiConfigurada()) {
    if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
      const subida = await apiSubirImagen(avatarUrl);
      if ('error' in subida) throw new Error(subida.error.mensaje);
      avatarUrl = subida.datos.url;
    }
    const respuesta = await apiPatch<Usuario>('/yo', {
      ...(nombre !== undefined ? { nombre } : {}),
      ...(cambios.avatarUri !== undefined ? { avatarUrl: avatarUrl ?? null } : {}),
    });
    if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
    const usuario = normalizarUsuario(respuesta.datos);
    await guardarUsuario(usuario);
    return usuario;
  }

  if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
    avatarUrl = await persistirFotoVisita(avatarUrl, 'perfil-' + actual.id);
  }
  const usuario = {
    ...actual,
    ...(nombre !== undefined ? { nombre } : {}),
    ...(cambios.avatarUri !== undefined ? { avatarUrl: avatarUrl ?? null } : {}),
  };
  await guardarUsuario(usuario);
  return usuario;
}
