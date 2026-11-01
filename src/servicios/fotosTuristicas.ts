/**
 * Fuentes públicas de fotografías turísticas identificadas por nombre.
 * Evitamos depender exclusivamente de los thumbs de Wikimedia Commons:
 * Android puede recibir HTTP 403 al intentar descargarlos (verificado en Expo).
 *
 * Estas URLs son enlaces a páginas de organismos oficiales, no fotografías
 * empaquetadas en la app. Respetar términos de uso y atribución de cada sitio.
 * Solo asignar una foto cuando corresponda al lugar exacto.
 */
const fuentes: Record<string, string[]> = {
  'molino forclaz': [
    'https://www.argentina.gob.ar/sites/default/files/molinoforclazcnm.jpg',
  ],
  'parque nacional el palmar': [
    'https://www.argentina.gob.ar/sites/default/files/pn_el_palmar_ecosistema_ph_parquesnacionales.jpg',
  ],
  'termas de colon': [
    'https://termascolon.gov.ar/wp-content/uploads/2018/06/DSC_0219.jpg',
  ],
  'museo historico regional de colon': [
    'https://colon.gov.ar/wp-content/uploads/2021/06/el-sonido-a-travez-de-los-tiempos-02-06-2021-1.jpg',
  ],
  'paseo costanera': [
    'https://colon.gov.ar/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-01-at-20.14.08-1024x768.jpeg',
  ],
  'costanera gobernador quiros': [
    'https://colon.gov.ar/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-01-at-20.14.08-1024x768.jpeg',
  ],
};

function clave(nombre: string) {
  return nombre.toLocaleLowerCase('es')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

export function fotosOficialesParaLugar(nombre: string): string[] {
  return fuentes[clave(nombre)] ?? [];
}
