import type { Lugar } from '@/src/tipos';

/** Fotografía identificada con certeza, fuente y licencia pública verificadas.
 * En Android/iPhone se descarga al almacenamiento local con useImagenLugar.
 * Si la URL no está disponible, se intenta el medio de la API docente.
 */
const FOTOS: Record<string,string> = {
  // Parque acuático Termas de Colón (Leisuregroup, CC BY-SA 3.0).
  'lug-001': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Toboganes_Acuaticos.JPG',
  // Parroquia Santos Justo y Pastor, Colón (Juandrovandi, CC BY-SA 4.0).
  'lug-008': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG',
};

export function imagenesParaLugar(lugar: Lugar): string[] {
  const propia = FOTOS[lugar.id];
  const delServidor = Array.isArray(lugar.imagenes) ? lugar.imagenes : [];
  return [...new Set([propia, ...delServidor]
    .filter((valor): valor is string => typeof valor==='string' && /^https?:\/\//i.test(valor)))];
}

/** Permite distinguir fotografías acreditadas de ilustraciones que
 * la API docente entrega como semillas de demostración. */
export function tieneFotoExternaCurada(lugar: Lugar): boolean {
  return Boolean(FOTOS[lugar.id]);
}

export function tieneImagenDemostrativaApi(lugar: Lugar): boolean {
  return Array.isArray(lugar.imagenes) && lugar.imagenes.some(
    url => typeof url === 'string' && /\/semilla-[^/?]+\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url),
  );
}
