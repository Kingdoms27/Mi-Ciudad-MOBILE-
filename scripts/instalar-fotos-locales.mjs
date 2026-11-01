/**
 * Incluye fotos propias/autorizadas dentro de la app (y del APK).
 *   npm run fotos:instalar -- "C:\Fotos Mi Ciudad"
 * Nombres válidos: Molino Forclaz.jpg o lug-004.jpg.
 */
import { readdir, mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { join, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(fileURLToPath(new URL('..', import.meta.url)));
const origen=process.argv[2];
if(!origen) {
  console.error('USO: npm run fotos:instalar -- "C:\\Ruta\\Mis Fotos de Colón"');
  process.exit(2);
}
const dirOrigen=resolve(origen);
const dirDestino=join(root,'assets','lugares');
const manifiesto=join(root,'src','servicios','fotosLocales.ts');
const extensiones=new Set(['.jpg','.jpeg','.png','.webp']);
const slug=nombre=>nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

async function fotoReal(ruta,ext) {
  const buffer=await readFile(ruta);
  const jpeg=buffer.length>1000 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff;
  const png=buffer.length>1000 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=buffer.length>1000 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP';
  return ext==='.jpg'||ext==='.jpeg'?jpeg:ext==='.png'?png:webp;
}

const items=(await readdir(dirOrigen,{withFileTypes:true}))
  .filter(x=>x.isFile()&&extensiones.has(extname(x.name).toLowerCase()));
if(!items.length)throw new Error('No encontré imágenes JPG, PNG o WEBP en esa carpeta.');
await mkdir(dirDestino,{recursive:true});
const nuevas=new Map();
let invalidas=0;
for(const item of items){
  const ext=extname(item.name).toLowerCase();
  const ruta=join(dirOrigen,item.name);
  if(!(await fotoReal(ruta,ext))){
    console.warn('Archivo vacío o no reconocido:',item.name);
    invalidas++;continue;
  }
  const clave=slug(basename(item.name,ext));
  if(!clave)continue;
  if(nuevas.has(clave)){
    console.warn('Nombre duplicado; se usará la primera foto:',item.name);
    continue;
  }
  const archivo=clave+ext;
  if(resolve(ruta)!==resolve(join(dirDestino,archivo)))await copyFile(ruta,join(dirDestino,archivo));
  nuevas.set(clave,archivo);
}
for(const item of await readdir(dirDestino,{withFileTypes:true})){
  if(!item.isFile())continue;
  const ext=extname(item.name).toLowerCase();
  if(!extensiones.has(ext))continue;
  const clave=slug(basename(item.name,ext));
  if(!nuevas.has(clave) && await fotoReal(join(dirDestino,item.name),ext)){
    nuevas.set(clave,item.name);
  }
}
if(!nuevas.size)throw new Error('No hay fotos locales válidas.');
const registros=[...nuevas.entries()].sort(([a],[b])=>a.localeCompare(b))
  .map(([clave,archivo])=>'  '+JSON.stringify(clave)+': require('+JSON.stringify('../../assets/lugares/'+archivo)+'),');
const texto=[
"import type { Lugar } from '@/src/tipos';",
'// GENERADO por fotos:instalar. Archivos incluidos en el APK.',
'const FOTOS: Record<string, number> = {',
...registros,
'};',
'function slug(nombre: string): string {',
"  return nombre.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')",
"    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');",
'}',
'export function fotoLocalParaLugar(lugar: Lugar): number | undefined {',
'  return FOTOS[lugar.id] ?? FOTOS[slug(lugar.nombre)];',
'}',
].join('\n')+'\n';
await writeFile(manifiesto,texto,'utf8');
console.log('Fotos locales incluidas: '+nuevas.size+'. Archivos inválidos: '+invalidas+'.');
console.log('Reiniciá Expo y guardá las fotos en Git para incluirlas en el APK.');
console.log('Usar únicamente fotografías propias o autorizadas.');
