// Diagnóstico de sólo lectura de todas las imágenes servidas por la API docente.
// Uso: npm run api:fotos:grupo -- http://localhost:3000
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base=(process.argv[2]||process.env.API_URL||'').trim().replace(/\/+$/,'');
if(!/^https?:\/\/[^/]+$/i.test(base)){
  console.error('Uso: npm run api:fotos:grupo -- http://localhost:3000');
  process.exit(2);
}
const root=fileURLToPath(new URL('../',import.meta.url));
function urlImagen(url){
  if(typeof url!=='string'||!url.trim())return null;
  if(url.startsWith('/archivos/'))return base+url;
  try {
    const u=new URL(url);
    if(!['http:','https:'].includes(u.protocol))return null;
    const host=u.hostname.toLowerCase();
    const local=['localhost','127.0.0.1','0.0.0.0','[::1]'].includes(host);
    const lan=/^(?:192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(host);
    if(u.pathname.startsWith('/archivos/')&&(local||lan)){
      return base+u.pathname+u.search+u.hash;
    }
    return u.href;
  }catch{return null;}
}
async function json(path){
  const res=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw Error(path+': HTTP '+res.status);
  return res.json();
}
async function catalogo(){
  const all=[];
  for(let pagina=1;pagina<=20;pagina++){
    const r=await json('/lugares?pagina='+pagina+'&porPagina=500');
    if(!Array.isArray(r?.datos)||typeof r?.meta?.total!=='number')
      throw Error('Respuesta incorrecta de /lugares: falta datos[]/meta.total');
    all.push(...r.datos);
    if(all.length>=r.meta.total||r.datos.length===0)return all;
  }
  throw Error('Exceso de páginas de /lugares');
}
function formato(b){
  if(b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255)return 'JPEG';
  if(b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'PNG';
  if(b.length>=12&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return 'WEBP';
  if(b.length>=6&&/^GIF8[79]a$/.test(b.toString('ascii',0,6)))return 'GIF';
  if(b.length>=12&&b.toString('ascii',4,8)==='ftyp'&&/avif|avis/i.test(b.toString('ascii',8,12)))return 'AVIF';
  return null;
}
async function probar(url){
  const destino=urlImagen(url);
  if(!destino)return {ok:false,causa:'URL inválida',destino:null};
  try{
    const r=await fetch(destino,{
      method:'GET',headers:{Range:'bytes=0-65535'},
      signal:AbortSignal.timeout(12000),
    });
    const tipo=r.headers.get('content-type')||'';
    if(!r.ok||!/^image\/(png|jpeg|webp|gif|avif)\b/i.test(tipo)){
      await r.body?.cancel().catch(()=>{});
      return {ok:false,causa:'HTTP '+r.status+', Content-Type='+tipo,destino};
    }
    if(!r.body)return {ok:false,causa:'Respuesta vacía',destino};
    const reader=r.body.getReader(), partes=[];
    let len=0;
    try {
      while(len<65536){
        const item=await reader.read();
        if(item.done)break;
        if(item.value?.length){
          const trozo=item.value.subarray(0,65536-len);
          partes.push(trozo);len+=trozo.length;
        }
      }
    }finally{await reader.cancel().catch(()=>{});}
    const datos=Buffer.concat(partes),f=formato(datos);
    if(!f)return {ok:false,causa:'Content-Type de imagen pero bytes incorrectos',destino};
    return {ok:true,causa:'OK',destino,formato:f,
      huella:datos.length>=4096?createHash('sha256').update(datos).digest('hex'):null};
  }catch(e){return {ok:false,causa:String(e?.message||e),destino};}
}
try{
  const salud=await json('/salud');
  if(salud?.datos?.estado!=='ok')throw Error('/salud no responde estado ok');
  const lugares=await catalogo();
  const urls=[...new Set(lugares.flatMap(x=>Array.isArray(x.imagenes)?x.imagenes:[]).filter(Boolean))];
  const resultados=new Map();
  let i=0;
  async function trabajador(){
    while(i<urls.length){const url=urls[i++];resultados.set(url,await probar(url));}
  }
  await Promise.all(Array.from({length:Math.min(4,urls.length)},()=>trabajador()));
  const filas=lugares.map(l=>{
    const originales=Array.isArray(l.imagenes)?l.imagenes.filter(Boolean):[];
    const candidatas=originales.map(url=>({url,...resultados.get(url)}));
    const valida=candidatas.find(v=>v.ok);
    return {id:l.id,nombre:l.nombre,activo:l.activo!==false,
      estado:originales.length?(valida?'OK':'ARCHIVO_FALLA'):'SIN_URL',
      imagenSeleccionada:valida?.destino??null,candidatas};
  });
  const activos=filas.filter(v=>v.activo);
  const conFoto=activos.filter(v=>v.estado==='OK');
  const fallidas=activos.filter(v=>v.estado==='ARCHIVO_FALLA');
  const sinUrl=activos.filter(v=>v.estado==='SIN_URL');
  const grupos=new Map();
  for(const v of conFoto){
    const foto=v.candidatas.find(x=>x.ok);
    const clave=foto.huella||foto.destino;
    if(!grupos.has(clave))grupos.set(clave,[]);
    grupos.get(clave).push(v);
  }
  const repetidas=[...grupos.values()].filter(x=>x.length>1).map(x=>x.map(v=>({id:v.id,nombre:v.nombre})));
  const informe={base,fecha:new Date().toISOString(),total:filas.length,
    activos:activos.length,validas:conFoto.length,fallidas:fallidas.length,
    sinUrl:sinUrl.length,repetidas,filas};
  const dir=join(root,'reportes');
  await mkdir(dir,{recursive:true});
  await writeFile(join(dir,'diagnostico-imagenes-api.json'),JSON.stringify(informe,null,2)+'\n');
  console.log('API de la cátedra: '+base);
  console.log('Lugares totales: '+filas.length+'; activos: '+activos.length);
  console.log('Imágenes correctas: '+conFoto.length+'/'+activos.length);
  console.log('Sin URL: '+sinUrl.length+'; archivos fallidos: '+fallidas.length);
  console.log('Grupos de fotos repetidas: '+repetidas.length);
  for(const x of activos){
    const causa=x.estado==='ARCHIVO_FALLA'
      ?' | '+x.candidatas.map(v=>v.causa).join('; '):'';
    console.log('['+x.estado+'] '+x.id+' | '+x.nombre+causa);
  }
  for(const grupo of repetidas){
    console.log('[REPETIDA] '+grupo.map(x=>x.nombre).join(' | '));
  }
  console.log('Detalle: reportes/diagnostico-imagenes-api.json');
  console.log('Las fotos duplicadas o inexistentes se corrigen en la API/semillas del profesor.');
  if(!activos.length||sinUrl.length||fallidas.length)process.exitCode=1;
}catch(e){
  console.error('[ERROR] '+String(e?.message||e));
  process.exitCode=1;
}
