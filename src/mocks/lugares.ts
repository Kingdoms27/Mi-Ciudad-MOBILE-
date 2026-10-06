import { Lugar } from '@/src/tipos';

const todosLosDias = (abre: string, cierra: string) => [0,1,2,3,4,5,6].map(dia=>({dia:dia as 0|1|2|3|4|5|6,abre,cierra}));

export const lugaresMock: Lugar[] = [
 {
  id:'lug-004',nombre:'Molino Forclaz',categoriaId:'cat-museos',descripcionCorta:'Molino histórico de 1888 levantado por colonos suizos.',
  descripcion:'Monumento histórico y uno de los símbolos patrimoniales de la zona de Colón y San José. El recorrido permite conocer la historia de la familia Forclaz y la vida de los primeros colonos.',
  coordenadas:{latitud:-32.216958,longitud:-58.186797},direccion:'Primeros Colonos s/nº, Ejido Colón',
  imagenes:['https://upload.wikimedia.org/wikipedia/commons/c/c9/Molino_Forclaz_en_Col%C3%B3n.JPG'],
  horarios:[{dia:2,abre:'09:00',cierra:'19:00'},{dia:3,abre:'09:00',cierra:'19:00'},{dia:4,abre:'09:00',cierra:'19:00'},{dia:5,abre:'09:00',cierra:'19:00'},{dia:6,abre:'10:00',cierra:'20:00'}],
  telefono:'3447-470000',sitioWeb:null,precioEntrada:1500,
  audioguia:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',duracionSegundos:252,idioma:'es'},
  codigoQr:'COLON:lug-004',accesible:false,activo:true,actualizadoEn:'2026-08-01T10:30:00-03:00'
 },
 {
  id:'lug-001',nombre:'Termas de Colón',categoriaId:'cat-termas',descripcionCorta:'Complejo termal junto al río Uruguay.',
  descripcion:'Piscinas termales, sectores de descanso y propuestas para disfrutar durante todo el año. Consultá los horarios vigentes antes de tu visita.',
  coordenadas:{latitud:-32.2076,longitud:-58.1377},direccion:'Batalla de Cepeda 100, Colón',
  imagenes:['https://www.termasdecolon.com.ar/assets/img/header-1.jpg'],horarios:todosLosDias('09:00','20:00'),
  telefono:'3447-434761',sitioWeb:'https://termascolon.gov.ar/',precioEntrada:9000,audioguia:null,codigoQr:'COLON:lug-001',accesible:true,activo:true,actualizadoEn:'2026-09-20T11:00:00-03:00'
 },
 {
  id:'lug-002',nombre:'Playa Norte',categoriaId:'cat-playas',descripcionCorta:'Playa amplia sobre el río Uruguay, ideal para disfrutar el día.',
  descripcion:'Sector de arena y costa con acceso cercano al centro turístico. La disponibilidad de servicios puede variar según temporada.',
  coordenadas:{latitud:-32.2106,longitud:-58.1352},direccion:'Costanera Norte, Colón',
  imagenes:['https://colon.gov.ar/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-06-at-08.12.15.jpeg'],horarios:todosLosDias('08:00','20:00'),
  telefono:null,sitioWeb:null,precioEntrada:0,audioguia:null,codigoQr:'COLON:lug-002',accesible:true,activo:true,actualizadoEn:'2026-09-12T09:00:00-03:00'
 },
 {
  id:'lug-003',nombre:'Parque Nacional El Palmar',categoriaId:'cat-naturaleza',descripcionCorta:'Paisaje de palmares de yatay y senderos naturales.',
  descripcion:'Área protegida emblemática de Entre Ríos. Ideal para senderismo, observación de fauna y recorridos interpretativos. En varios sectores la conectividad móvil es limitada.',
  coordenadas:{latitud:-31.8886,longitud:-58.2398},direccion:'Ruta Nacional 14 km 198, Ubajay',
  imagenes:['https://www.argentina.gob.ar/sites/default/files/pn_el_palmar_paisaje_ph_parquesnacionales.jpg'],horarios:todosLosDias('08:00','18:00'),
  telefono:null,sitioWeb:'https://www.argentina.gob.ar/parquesnacionales/elpalmar',precioEntrada:0,
  audioguia:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',duracionSegundos:205,idioma:'es'},codigoQr:'COLON:lug-003',accesible:false,activo:true,actualizadoEn:'2026-09-25T08:00:00-03:00'
 },
 {
  id:'lug-005',nombre:'Museo Histórico Regional de Colón',categoriaId:'cat-museos',descripcionCorta:'Museo local dedicado a la historia y la memoria de la ciudad.',
  descripcion:'Museo de la ciudad con objetos, documentos, herramientas y colecciones que recorren los orígenes y el desarrollo histórico de Colón.',
  coordenadas:{latitud:-32.2238,longitud:-58.1434},direccion:'12 de Abril 461, Colón',
  imagenes:['https://www.colonturismo.tur.ar/wp-content/uploads/2022/01/Museo-Colon-2-1-1024x576.jpg'],
  horarios:[{dia:1,abre:'09:00',cierra:'18:00'},{dia:2,abre:'09:00',cierra:'18:00'},{dia:3,abre:'09:00',cierra:'18:00'},{dia:4,abre:'09:00',cierra:'18:00'},{dia:5,abre:'09:00',cierra:'18:00'}],
  telefono:'3447-426002',sitioWeb:'https://www.colonturismo.tur.ar/directorio/museo-historico-regional-de-colon/',precioEntrada:0,
  audioguia:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',duracionSegundos:221,idioma:'es'},codigoQr:'COLON:lug-005',accesible:true,activo:true,actualizadoEn:'2026-09-30T10:00:00-03:00'
 },
 {
  id:'lug-006',nombre:'Puerto Viejo',categoriaId:'cat-museos',descripcionCorta:'Sector histórico junto al río y la costanera.',
  descripcion:'Un punto para interpretar el crecimiento de la ciudad vinculado al río Uruguay y la actividad portuaria. Ideal para recorrer a pie.',
  coordenadas:{latitud:-32.2209,longitud:-58.1377},direccion:'Costanera de Colón',
  imagenes:['https://upload.wikimedia.org/wikipedia/commons/2/26/Puerto_viejo%2C_Col%C3%B3n_-_1.jpg'],horarios:todosLosDias('00:00','23:59'),
  telefono:null,sitioWeb:null,precioEntrada:0,audioguia:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',duracionSegundos:198,idioma:'es'},
  codigoQr:'COLON:lug-006',accesible:true,activo:true,actualizadoEn:'2026-10-01T10:00:00-03:00'
 },
 {
  id:'lug-007',nombre:'Feria Costanera',categoriaId:'cat-artesanias',descripcionCorta:'Puestos de producción local, diseño y recuerdos regionales.',
  descripcion:'Espacio de encuentro con artesanos y emprendedores de la región. Los días y horarios pueden variar según temporada y eventos.',
  coordenadas:{latitud:-32.2208,longitud:-58.1385},direccion:'Av. Costanera Quirós, entre San Martín y Bolívar',
  imagenes:['https://www.colonturismo.tur.ar/wp-content/uploads/2022/08/Feria-Costanera-1-576x1024.jpeg'],
  horarios:[{dia:5,abre:'17:00',cierra:'23:00'},{dia:6,abre:'17:00',cierra:'23:00'},{dia:0,abre:'17:00',cierra:'22:00'}],
  telefono:null,sitioWeb:null,precioEntrada:0,audioguia:null,codigoQr:'COLON:lug-007',accesible:true,activo:true,actualizadoEn:'2026-10-02T16:00:00-03:00'
 },
 {
  id:'lug-008',nombre:'Bodega Vulliez Sermet',categoriaId:'cat-gastro',descripcionCorta:'Experiencia de vinos y productos regionales cerca de Colón.',
  descripcion:'Propuesta enoturística de la zona. Las visitas pueden depender de horarios y disponibilidad, por lo que conviene consultar antes de ir.',
  coordenadas:{latitud:-32.1736,longitud:-58.1835},direccion:'Ruta 135 km 8, Colón',
  imagenes:['https://www.colonturismo.tur.ar/wp-content/uploads/2022/01/WhatsApp-Image-2025-08-10-at-15.22.22-819x1024.jpeg'],
  horarios:[{dia:2,abre:'10:00',cierra:'17:00'},{dia:3,abre:'10:00',cierra:'17:00'},{dia:4,abre:'10:00',cierra:'17:00'},{dia:5,abre:'10:00',cierra:'17:00'},{dia:6,abre:'10:00',cierra:'17:00'}],
  telefono:'3447-505095',sitioWeb:'https://www.vulliezsermet.com/',precioEntrada:null,audioguia:null,codigoQr:null,accesible:true,activo:true,actualizadoEn:'2026-10-01T09:00:00-03:00'
 },
 {
  id:'lug-009',nombre:'Paseo Costanera',categoriaId:'cat-naturaleza',descripcionCorta:'Recorrido junto al río para caminar, descansar y ver el atardecer.',
  descripcion:'Un paseo urbano abierto, con vistas al río Uruguay y acceso a distintos puntos de la ciudad.',
  coordenadas:{latitud:-32.2202,longitud:-58.1369},direccion:'Costanera, Colón',
  imagenes:['https://upload.wikimedia.org/wikipedia/commons/8/83/Costanera_de_Col%C3%B3n%2C_Entre_R%C3%ADos.jpg'],horarios:todosLosDias('00:00','23:59'),
  telefono:null,sitioWeb:null,precioEntrada:0,audioguia:null,codigoQr:'COLON:lug-009',accesible:true,activo:true,actualizadoEn:'2026-10-01T09:00:00-03:00'
 },
 {
  id:'lug-010',nombre:'Hotel Plaza',categoriaId:'cat-alojamiento',descripcionCorta:'Hotel céntrico frente a Plaza San Martín, a pocas cuadras de la costanera.',
  descripcion:'Alojamiento céntrico con servicios para huéspedes, piscina climatizada y piscina exterior. La disponibilidad y las tarifas se consultan con el establecimiento.',
  coordenadas:{latitud:-32.2234,longitud:-58.1431},direccion:'Belgrano 20, Colón',
  imagenes:['https://www.colonturismo.tur.ar/wp-content/uploads/2021/11/1-frente-1024x603.jpg'],horarios:todosLosDias('00:00','23:59'),
  telefono:'3447-421043',sitioWeb:'https://www.hotel-plaza.com.ar/',precioEntrada:null,audioguia:null,codigoQr:null,accesible:true,activo:true,actualizadoEn:'2026-10-01T09:00:00-03:00'
 }
];
