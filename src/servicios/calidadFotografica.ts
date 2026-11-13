import type { Lugar } from '@/src/tipos';

/** Los binarios son autorizados, pero estas dos fotos no documentan el punto exacto. */
export function fotoLocalEsReferencial(lugar: Pick<Lugar,'id'|'nombre'>): boolean {
  const nombre=(lugar.nombre??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return (lugar.id==='lug-002' && nombre.includes('playa norte')) ||
    (lugar.id==='lug-007' && nombre.includes('puerto viejo')) ||
    (lugar.id==='lug-016' && nombre.includes('mirador') && nombre.includes('artigas'));
}
