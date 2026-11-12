import { Linking, Platform } from 'react-native';
import type { Coordenadas } from '@/src/tipos';

export type ModoViaje = 'walking' | 'driving';

/**
 * No forzar Google Maps: Android usa el manejador predeterminado para geo:,
 * e iOS abre Mapas del sistema. El usuario puede iniciar la ruta allí.
 * El esquema web es sólo un respaldo para la previsualización en navegador.
 */
export function urlNavegacion(
  lugar: Coordenadas,
  modo: ModoViaje,
  plataforma: string = Platform.OS,
): string {
  const { latitud, longitud } = lugar;
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud) ||
      Math.abs(latitud) > 90 || Math.abs(longitud) > 180) {
    throw new Error('El lugar no tiene coordenadas válidas para navegar.');
  }
  const punto = latitud + ',' + longitud;
  if (plataforma === 'android') {
    return 'geo:0,0?q=' + encodeURIComponent(punto);
  }
  if (plataforma === 'ios') {
    return 'http://maps.apple.com/?daddr=' + encodeURIComponent(punto) +
      '&dirflg=' + (modo === 'walking' ? 'w' : 'd');
  }
  return 'https://www.openstreetmap.org/?mlat=' + latitud +
    '&mlon=' + longitud + '#map=15/' + latitud + '/' + longitud;
}

export async function abrirNavegacion(lugar: Coordenadas, modo: ModoViaje): Promise<void> {
  await Linking.openURL(urlNavegacion(lugar, modo));
}
