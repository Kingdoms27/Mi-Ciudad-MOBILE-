import { Evento, Lugar, Usuario, Visita } from '@/src/tipos';
import { urlArchivoParaDispositivo } from '@/src/servicios/api';

/** Transformaciones de lectura para los archivos servidos por el backend. */
export function normalizarLugar(lugar: Lugar): Lugar {
  return {
    ...lugar,
    imagenes: lugar.imagenes.map(url => urlArchivoParaDispositivo(url) ?? url),
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
