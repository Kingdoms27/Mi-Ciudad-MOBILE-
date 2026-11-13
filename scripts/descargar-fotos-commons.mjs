/**
 * Descarga fotografías de lugares turísticos concretos publicadas con licencia
 * reutilizable en Wikimedia Commons, y las instala en assets/lugares.
 *
 *   npm run fotos:commons
 *
 * No modifica backend/SQLite ni reemplaza fotografías propias ya existentes.
 * Descarga 7 fotografías originales más 2 verificadas y una vista de playa
 * de Colón etiquetada expresamente como REFERENCIAL (no acredita Playa Norte).
 * También prepara una foto histórica específica del antiguo puerto.
 * No inventa fotos para los lugares sin fuente autorizada.
 * Ver docs/CREDITOS-FOTOS-COMMONS.md.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const destino=join(root,'assets','lugares');
const maxBytes=12_000_000;
const maxWait=20_000;
const entries=[
  // La fotografía fue tomada en una playa de la ciudad de Colón en 2020,
  // después de una tormenta; NO está acreditado que sea Playa Norte.
  // Se presenta en la UI como vista general de playa, nunca como imagen
  // documentada del sector exacto.
  {
    lugar:'Playa Norte — vista general de una playa de Colón (referencial)',
    archivo:'lug-002.jpg',
    titulo:'Playa en Colón, Entre Ríos.jpg',
  },
  // Archivo del antiguo puerto identificado específicamente como
  // "Puerto viejo, Colón". Foto histórica de 2006; el JPG anterior del
  // entorno se conserva, y el selector del catálogo prefiere esta foto.
  {
    lugar:'Puerto Viejo — edificio histórico del puerto (2006)',
    archivo:'lug-007.jpg',
    titulo:'Puerto viejo, Colón - 1.jpg',
  },
  // La API docente usa estas dos fichas: lug-001 = Termas y
  // lug-008 = Iglesia Santos Justo y Pastor. Usamos el ID para no depender
  // de una variante del nombre; la app sólo aplica la foto con la API activa.
  {
    lugar:'Termas de Colón', archivo:'lug-001.jpg',
    titulo:'Toboganes Acuaticos.JPG',
  },
  {
    lugar:'Iglesia Santos Justo y Pastor', archivo:'lug-008.jpg',
    titulo:'Iglesia Santos Justo y Pastor Colon Entre Rios.JPG',
  },
  {
    lugar:'Molino Forclaz', archivo:'molino-forclaz.jpg',
    titulo:'Molino Forclaz en Colón.JPG',
  },
  {
    lugar:'Parque Nacional El Palmar', archivo:'parque-nacional-el-palmar.jpg',
    titulo:'Parque Nacional El Palmar (3).jpg',
  },
  {
    lugar:'Palacio San José', archivo:'palacio-san-jose.jpg',
    titulo:'Palacio San José 1.jpg',
  },
  {
    lugar:'Puerto Viejo', archivo:'puerto-viejo.jpg',
    titulo:'Puerto de Colón - Entre Ríos.jpg',
  },
  {
    lugar:'Costanera Gobernador Quirós', archivo:'costanera-gobernador-quiros.jpg',
    titulo:'Costanera de Colon, Entre Rios.JPG',
  },
  {
    lugar:'Parque Dr. Herminio J. Quirós', archivo:'parque-dr-herminio-j-quiros.jpg',
    titulo:'Parque Quirós, Colón - 1.jpg',
  },
  {
    lugar:'Mirador del Puente General Artigas', archivo:'mirador-del-puente-general-artigas.jpg',
    titulo:'Puente General Artigas.jpg',
  },
];

async function existe(ruta) {
  try{await access(ruta);return true;}catch{return false;}
}

async function leerJpeg(url) {
  const parsed=new URL(url);
  if(parsed.protocol!=='https:' || !/(^|\.)wikimedia\.org$/i.test(parsed.hostname)){
    throw new Error('Origen no permitido: '+parsed.hostname);
  }
  const respuesta=await fetch(url,{
    headers:{'User-Agent':'MiCiudadColonEducational/1.0 (https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-; photo attribution)'},
    signal:AbortSignal.timeout(maxWait),
  });
  if(!respuesta.ok)throw new Error('Imagen HTTP '+respuesta.status);
  const tamano=Number(respuesta.headers.get('content-length')||0);
  if(tamano>maxBytes)throw new Error('Archivo demasiado grande');
  const tipo=(respuesta.headers.get('content-type')||'').toLowerCase();
  if(tipo && !tipo.startsWith('image/jpeg') && !tipo.startsWith('image/jpg')){
    throw new Error('La descarga no entregó JPEG: '+tipo);
  }
  const bytes=Buffer.from(await respuesta.arrayBuffer());
  if(bytes.length<1500||bytes.length>maxBytes ||
     bytes[0]!==255||bytes[1]!==216||bytes[2]!==255){
    throw new Error('Los datos no contienen una fotografía JPEG válida');
  }
  return bytes;
}

async function urlCommons(titulo) {
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  u.searchParams.set('action','query');
  u.searchParams.set('format','json');
  u.searchParams.set('formatversion','2');
  u.searchParams.set('prop','imageinfo');
  u.searchParams.set('iiprop','url');
  u.searchParams.set('iiurlwidth','1200');
  u.searchParams.set('titles','File:'+titulo);
  const respuesta=await fetch(u,{
    headers:{Accept:'application/json','User-Agent':'MiCiudadColonEducational/1.0 (https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-; photo attribution)'},
    signal:AbortSignal.timeout(maxWait),
  });
  if(!respuesta.ok)throw new Error('Wikimedia API HTTP '+respuesta.status);
  const datos=await respuesta.json();
  const pagina=datos?.query?.pages?.[0];
  const info=pagina?.imageinfo?.[0];
  if(!info?.url)throw new Error('Archivo no encontrado en Wikimedia Commons');
  return [info.thumburl,info.url].filter(Boolean);
}

await mkdir(destino,{recursive:true});
let guardadas=0,omitidas=0,fallidas=0;
for(const item of entries){
  const ruta=join(destino,item.archivo);
  if(await existe(ruta)){
    console.log('[EXISTE] '+item.lugar+' — conservando tu foto actual');
    omitidas++;
    continue;
  }
  try{
    const urls=await urlCommons(item.titulo);
    let bytes=null,ultimoError='';
    for(const url of urls){
      try{bytes=await leerJpeg(url);break;}
      catch(e){ultimoError=e instanceof Error?e.message:String(e);}
    }
    if(!bytes)throw new Error(ultimoError);
    // Sólo escribir después de validar tamaño, formato y respuesta.
    if(await existe(ruta)){
      console.log('[EXISTE] '+item.lugar);
      omitidas++;
      continue;
    }
    await writeFile(ruta,bytes,{flag:'wx'});
    guardadas++;
    console.log('[OK] '+item.lugar+' — '+Math.round(bytes.length/1024)+' KB');
  }catch(e){
    fallidas++;
    console.warn('[PENDIENTE] '+item.lugar+': '+(e instanceof Error?e.message:String(e)));
  }
}

console.log('\nResultado Commons: '+guardadas+' descargadas; '+omitidas+' existentes; '+fallidas+' no disponibles.');
if(guardadas+omitidas>0){
  // Reutilizar el instalador existente para crear requires estáticos de Metro
  // para las fotos descargadas Y las que ya tenías en assets/lugares.
  process.argv[2]=destino;
  await import('./instalar-fotos-locales.mjs');
  console.log('\nReiniciá Expo con npx expo start --clear para ver las nuevas fotos.');
  console.log('Créditos: docs/CREDITOS-FOTOS-COMMONS.md');
}else{
  console.error('No fue posible obtener ninguna foto. No se modificó el catálogo.');
  process.exitCode=1;
}
