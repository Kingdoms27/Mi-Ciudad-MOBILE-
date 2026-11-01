import type { Lugar } from '@/src/tipos';

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
  return FOTOS[lugar.id] ?? FOTOS[slug(lugar.nombre)];
}
