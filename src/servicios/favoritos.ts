import { Favorito } from '@/src/tipos';
import { apiConfigurada, apiDelete, apiListarTodos, apiPut } from '@/src/servicios/api';
import { hayConexion } from '@/src/servicios/red';
import {
  alternarFavorito as alternarFavoritoLocal,
  listarFavoritos as listarFavoritosLocales,
  actualizarFavoritosDesdeServidor,
} from '@/src/servicios/db';

async function desdeServidor(usuarioId: string): Promise<Favorito[] | null> {
  if (!apiConfigurada() || !(await hayConexion().catch(() => false))) return null;

  const respuesta = await apiListarTodos<Favorito>('/yo/favoritos', 100);
  if ('error' in respuesta) throw new Error(respuesta.error.mensaje);

  const favoritos = respuesta.datos.filter(item => item.usuarioId === usuarioId);
  await actualizarFavoritosDesdeServidor(usuarioId, favoritos);
  return favoritos;
}

export async function listarFavoritos(usuarioId: string): Promise<Favorito[]> {
  const remotos = await desdeServidor(usuarioId);
  return remotos ?? listarFavoritosLocales(usuarioId);
}

export async function esFavorito(usuarioId: string, lugarId: string) {
  const favoritos = await listarFavoritos(usuarioId);
  return favoritos.some(item => item.lugarId === lugarId);
}

export async function alternarFavorito(usuarioId: string, lugarId: string) {
  if (!apiConfigurada()) return alternarFavoritoLocal(usuarioId, lugarId);
  if (!(await hayConexion().catch(() => false))) {
    throw new Error('Necesitás conexión para cambiar favoritos de tu cuenta. Los guardados siguen disponibles sin Internet.');
  }

  const actual = await esFavorito(usuarioId, lugarId);
  const ruta = `/yo/favoritos/${encodeURIComponent(lugarId)}`;
  const respuesta = actual ? await apiDelete(ruta) : await apiPut<Favorito>(ruta);
  if ('error' in respuesta) throw new Error(respuesta.error.mensaje);
  await listarFavoritos(usuarioId);
  return !actual;
}
