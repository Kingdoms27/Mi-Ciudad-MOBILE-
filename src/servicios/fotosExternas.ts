import type { Lugar } from '@/src/tipos';

/**
 * Fotografías reales, del lugar concreto, con origen y licencia verificados.
 * Sólo se aplica a fichas que todavía no tienen foto propia empaquetada.
 * El hook useImagenLugar descarga y guarda la imagen para siguientes visitas.
 * Nunca se asigna una fotografía de un comercio genérico a otro comercio.
 */
const FOTOS_EXTERIORES: Record<string, string> = {
  'lug-001': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Toboganes_Acuaticos.JPG',
  'lug-008': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG',
};

export function imagenesParaLugar(lugar: Lugar): string[] {
  const verificada = FOTOS_EXTERIORES[lugar.id];
  return [...new Set([verificada, ...(Array.isArray(lugar.imagenes) ? lugar.imagenes : [])]
    .filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url)))];
}
