import type { Lugar } from '@/src/tipos';

/**
 * Fotografías de Commons verificadas para una ficha concreta de la API.
 * Controlamos también el nombre: los mocks reutilizan algunos identificadores
 * para lugares distintos y no deben mostrar la iglesia en una bodega.
 */
const FOTOS: Record<string, { url: string; palabras: string[] }> = {
  // Toboganes de las Termas de Colón: Leisuregroup, CC BY-SA 3.0.
  'lug-001': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Toboganes_Acuaticos.JPG',
    palabras: ['termas', 'colon'],
  },
  // Iglesia Santos Justo y Pastor: Juandrovandi, CC BY-SA 4.0.
  'lug-008': {
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG',
    palabras: ['justo', 'pastor'],
  },
};

function normalizar(nombre: string): string {
  return nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function fotoVerificada(lugar: Lugar): string | null {
  const candidata = FOTOS[lugar.id];
  if (!candidata || typeof lugar.nombre !== 'string') return null;
  const nombre = normalizar(lugar.nombre);
  return candidata.palabras.every(palabra => nombre.includes(palabra))
    ? candidata.url
    : null;
}

/** La foto específica va primero; luego las imágenes de la API original. */
export function imagenesParaLugar(lugar: Lugar): string[] {
  const propia = fotoVerificada(lugar);
  const delServidor = Array.isArray(lugar.imagenes) ? lugar.imagenes : [];
  return [...new Set([propia, ...delServidor]
    .filter((valor): valor is string => typeof valor === 'string' && /^https?:\/\//i.test(valor)))];
}

export function tieneFotoExternaCurada(lugar: Lugar): boolean {
  return Boolean(fotoVerificada(lugar));
}

/** Las semillas son imágenes de demostración, no fotos del lugar. */
export function tieneImagenDemostrativaApi(lugar: Lugar): boolean {
  return Array.isArray(lugar.imagenes) && lugar.imagenes.some(
    url => typeof url === 'string' && /\/semilla-[^/?]+\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url),
  );
}
