import type { Lugar } from '@/src/tipos';
import { apiConfigurada } from '@/src/servicios/api';

/**
 * Catálogo de fotografías propias empaquetadas con Expo.
 * El comando `npm run fotos:instalar -- "C:\\carpeta-con-fotos"`
 * actualiza este objeto con require() ESTÁTICOS de Metro.
 * No editar manualmente, ni referenciar una foto externa desde aquí.
 */
const FOTOS: Record<string, number> = {};

function slug(nombre: string): string {
  return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function fotoLocalParaLugar(lugar: Lugar): number | undefined {
  // La API y los mocks pueden asignar el mismo ID a lugares diferentes.
  // El nombre es la clave segura para ambos modos. Los IDs se aceptan
  // solamente cuando la API está configurada.
  return FOTOS[slug(lugar.nombre)] ?? (apiConfigurada() ? FOTOS[lugar.id] : undefined);
}
