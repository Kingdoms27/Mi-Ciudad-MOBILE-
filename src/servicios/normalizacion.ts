import { Evento, Lugar, Usuario, Visita } from '@/src/tipos';
import { urlArchivoParaDispositivo } from '@/src/servicios/api';

/** Transformaciones de lectura para los archivos servidos por el backend. */
export function normalizarLugar(lugar: Lugar): Lugar {
  return {
    ...lugar,
    // Un lugar sin imagen en la API debe renderizar el respaldo, no romper
    // la pantalla por un valor null o un arreglo incompleto.
    imagenes: (Array.isArray(lugar.imagenes) ? lugar.imagenes : [])
      .filter((url): url is string => typeof url === 'string' && url.length > 0)
      .map(url => urlArchivoParaDispositivo(url) ?? url),
    audioguia: lugar.audioguia
      ? { ...lugar.audioguia, url: urlArchivoParaDispositivo(lugar.audioguia.url) ?? lugar.audioguia.url }
      : null,
  };
}

export function normalizarEvento(evento: Evento): Evento {
  return { ...evento, imagenUrl: urlArchivoParaDispositivo(evento.imagenUrl) };
}

export function normalizarVisita(visita: Visita): Visita {
  return { ...visita, fotoUri: urlArchivoParaDispositivo(visita.fotoUri) };
}

export function normalizarUsuario(usuario: Usuario): Usuario {
  return { ...usuario, avatarUrl: urlArchivoParaDispositivo(usuario.avatarUrl) };
}
