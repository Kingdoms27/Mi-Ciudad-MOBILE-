import { guardarUsuario } from '@/src/servicios/auth';
import { apiConfigurada, apiPatch } from '@/src/servicios/api';
import { hayConexion } from '@/src/servicios/red';
import { Preferencias, Usuario } from '@/src/tipos';

export async function actualizarPreferencias(usuario: Usuario, cambios: Partial<Preferencias>) {
  let nuevo: Usuario = { ...usuario, preferencias: { ...usuario.preferencias, ...cambios } };

  if (apiConfigurada()) {
    if (!(await hayConexion().catch(() => false))) {
      throw new Error('Necesitás conexión para actualizar las preferencias de tu cuenta.');
    }
    const respuesta = await apiPatch<Usuario>('/yo', { preferencias: cambios });
    if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
    nuevo = respuesta.datos;
  }

  await guardarUsuario(nuevo);
  return nuevo;
}
