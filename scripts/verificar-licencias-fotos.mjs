/**
 * Auditoría local de correspondencia y atribuciones de fotografías.
 * No altera la API docente ni descarga archivos. En modo --estricto exige
 * que estén todos los archivos ya acreditados en el manifiesto.
 *
 * npm run fotos:licencias
 * npm run fotos:licencias -- --estricto
 */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, resolve, extname } from 'node:path';

const raiz=fileURLToPath(new URL('../',import.meta.url));
const rutaManifest=join(raiz,'docs','LICENCIAS-FOTOS-20261112.json');
const carpeta=join(raiz,'assets','lugares');
const estricta=process.argv.includes('--estricto');
const permitido=new Set(['.jpg','.jpeg','.png','.webp']);
const errores=[],avisos=[],presentes=[],ausentes=[];
const texto=await readFile(rutaManifest,'utf8');
const manifest=JSON.parse(texto);
const fichas=manifest.lugares;
const ids=new Set();
const archivos=new Map();
if(!Array.isArray(fichas)||fichas.length!==26)
  errores.push('El manifiesto no contiene exactamente los 26 lugares activos.');

for(const item of fichas){
  if(!/^lug-\d{3}$/.test(item.id||''))errores.push('ID inválido: '+item.id);
  if(ids.has(item.id))errores.push('ID duplicado: '+item.id);
  ids.add(item.id);
  if(!['sitio','referencial','pendiente'].includes(item.estado))
    errores.push('Estado desconocido en '+item.id);
  if(item.estado==='pendiente'){
    if(item.archivo)errores.push('Foto asignada sin fuente autorizada: '+item.id);
    continue;
  }
  if(!item.archivo||!item.autor||!item.licencia||!item.fuente)
    errores.push('Faltan datos de atribución para '+item.id);
  if(!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(item.fuente||''))
    errores.push('Fuente no validada para '+item.id);
  if(!item.archivo||item.archivo.includes('/')||item.archivo.includes('\\')||
    !permitido.has(extname(item.archivo).toLowerCase()))
    errores.push('Nombre de archivo no seguro o incorrecto para '+item.id);
  if(archivos.has(item.archivo))
    errores.push('Un mismo archivo se atribuye a dos fichas: '+item.archivo);
  archivos.set(item.archivo,item);
}

const jpg=bytes=>bytes.length>=1500 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
const png=bytes=>bytes.length>=1500 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
const webp=bytes=>bytes.length>=1500 && bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
const hashes=new Map();

for(const [archivo,item] of archivos){
  let bytes;
  try{bytes=await readFile(join(carpeta,archivo));}
  catch(e){
    if(e.code!=='ENOENT')errores.push('No se puede leer '+archivo+': '+e.message);
    else {
      ausentes.push({id:item.id,archivo});
      (estricta?errores:avisos).push('Foto acreditada pero no descargada en esta copia: '+item.id+' '+archivo);
    }
    continue;
  }
  const ext=extname(archivo).toLowerCase();
  if(!(ext==='.jpg'||ext==='.jpeg'?jpg(bytes):ext==='.png'?png(bytes):webp(bytes))){
    errores.push('Archivo no parece imagen válida: '+archivo);
    continue;
  }
  const sha=createHash('sha256').update(bytes).digest('hex');
  if(hashes.has(sha))errores.push('Imágenes binarias duplicadas: '+hashes.get(sha)+' y '+archivo);
  hashes.set(sha,archivo);
  presentes.push({id:item.id,archivo,estado:item.estado,kb:Math.round(bytes.length/1024)});
}
let existentes=[];
try{existentes=await readdir(carpeta,{withFileTypes:true});}
catch(e){if(e.code!=='ENOENT')errores.push('Error leyendo carpeta: '+e.message);}
for(const d of existentes){
  if(!d.isFile()||!permitido.has(extname(d.name).toLowerCase()))continue;
  if(!archivos.has(d.name))errores.push('Foto local SIN atribución en manifiesto: '+d.name+
    ' (no distribuir hasta documentar autor, licencia y lugar exacto)');
}

const exactas=fichas.filter(x=>x.estado==='sitio').length;
const referenciales=fichas.filter(x=>x.estado==='referencial').length;
const pendientes=fichas.filter(x=>x.estado==='pendiente').length;
const resultado={
  fecha:new Date().toISOString(),fichas:fichas.length,
  fuentesDocumentadas:exactas+referenciales,
  fotosEspecificasDocumentadas:exactas,
  fotosReferencialesDocumentadas:referenciales,
  sinFotoAutorizada:pendientes,
  presentes,ausentes,avisos,errores,
};
await mkdir(join(raiz,'reportes'),{recursive:true});
const ruta=join(raiz,'reportes','licencias-fotos.json');
await writeFile(ruta,JSON.stringify(resultado,null,2)+'\n','utf8');
console.log('\nMI CIUDAD — AUDITORÍA DE LICENCIAS Y CORRESPONDENCIAS');
console.log('Fichas: '+fichas.length+'; fuentes documentadas: '+(exactas+referenciales)+
  ' ('+exactas+' del sitio, '+referenciales+' referenciales); pendientes: '+pendientes);
console.log('Archivos locales verificados: '+presentes.length+'; por instalar: '+ausentes.length);
for(const msg of avisos)console.warn('[AVISO] '+msg);
for(const msg of errores)console.error('[ERROR] '+msg);
console.log('Reporte: '+ruta);
if(errores.length)process.exitCode=1;
