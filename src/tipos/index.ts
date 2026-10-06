export interface Coordenadas { latitud: number; longitud: number; }
export interface Horario { dia: 0|1|2|3|4|5|6; abre: string; cierra: string; }
export interface Audioguia { url: string; duracionSegundos: number; idioma: 'es'|'en'|'pt'; }
export interface Lugar {
  id: string; nombre: string; categoriaId: string; descripcionCorta: string; descripcion: string;
  coordenadas: Coordenadas; direccion: string; imagenes: string[]; horarios: Horario[];
  telefono: string|null; sitioWeb: string|null; precioEntrada: number|null; audioguia: Audioguia|null;
  codigoQr: string|null; accesible: boolean; activo: boolean; actualizadoEn: string;
}
export interface Categoria { id: string; nombre: string; icono: string; color: string; orden: number; }
export type EstadoEvento = 'programado'|'suspendido'|'cancelado'|'finalizado';
export interface Evento {
  id: string; titulo: string; descripcion: string; lugarId: string|null; direccionLibre: string|null;
  coordenadas: Coordenadas|null; inicio: string; fin: string|null; imagenUrl: string|null; precio: number|null; estado: EstadoEvento;
}
export interface Preferencias {
  categoriasFavoritas: string[]; avisarProximidad: boolean; radioAvisoMetros: 100|250|500; tema: 'claro'|'oscuro'|'sistema';
}
export interface Usuario { id: string; nombre: string; email: string; avatarUrl: string|null; creadoEn: string; preferencias: Preferencias; }
export interface Favorito { id: string; usuarioId: string; lugarId: string; creadoEn: string; }
export type OrigenVisita = 'qr'|'gps'|'manual';
export interface Visita { id: string; usuarioId: string; lugarId: string; fechaHora: string; origen: OrigenVisita; fotoUri: string|null; nota: string|null; sincronizada: boolean; }
export interface EventoGuardado { id: string; usuarioId: string; eventoId: string; creadoEn: string; notificationId: string|null; ultimoEstado: EstadoEvento; }
export type RespuestaApi<T> = { datos: T; meta?: { total: number; pagina: number; porPagina: number } } | { error: { codigo: string; mensaje: string } };
export interface Sesion { token: string; usuario: Usuario; }
