/**
 * Diagnostico preentrega de Mi Ciudad Colon (solo lectura).
 * npm run giovanni:check -- --api https://api-publica.example
 * Comprueba activos, fotos incluidas, mapa y URL remota.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz=fileURLToPath(new URL('../',import.meta.url));
const path=p=>join(raiz,p);
const leer=p=>readFileSync(path(p),'utf8');
const slug=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const noCheck=['lug-003','lug-010','lug-024','lug-027'];
const conocidos={
  'lug-002':'Playa Norte',
  'lug-003':'Balneario Piedras Coloradas',
  'lug-010':'Paseo de Artesanos',
  'lug-013':'Museo Historico Regional de San Jose',
  'lug-018':'Termas de Villa Elisa',
  'lug-024':'Camping Municipal Norte',
  'lug-027':'Feria de la Plaza San Martin',
  'lug-005':'Museo Historico Regional de Colon',
  'lug-011':'Centro de Artesanos La Casona',
  'lug-017':'Playa Paso Vera',
  'lug-019':'Hosteria Restaurant Del Puerto',
  'lug-023':'Hosteria Restaurant Del Puerto',
  'lug-025':'Centro de Interpretacion de Pueblo Liebig'
};
const bloqueos=[],avisos=[],ok=[];
const aprobar=x=>ok.push(x),avisar=x=>avisos.push(x),bloquear=x=>bloqueos.push(x);
function valorEnv(contenido,nombre) {
  const linea=contenido.split(/\r?\n/).find(s=>new RegExp('^\\s*'+nombre+'\\s*=').test(s));
  if(!linea)return '';
  return linea.slice(linea.indexOf('=')+1).replace(/\s+#.*$/,'').trim().replace(/^['"]|['"]$/g,'');
}
function baseApi(){
  const idx=process.argv.indexOf('--api');
  if(idx>=0)return process.argv[idx+1]||'';
  if(process.env.EXPO_PUBLIC_API_URL)return process.env.EXPO_PUBLIC_API_URL;
  for(const p of ['.env.local','.env']){
    if(existsSync(path(p))){
      const val=valorEnv(leer(p),'EXPO_PUBLIC_API_URL');
      if(val)return val;
    }
  }
  return '';
}
function comprobarFoto(p) {
  const b=readFileSync(path(p));
  const ext=extname(p).toLowerCase();
  if(ext==='.jpg'||ext==='.jpeg')return b.length>=1024&&b[0]===255&&b[1]===216&&b[2]===255;
  if(ext==='.png')return b.length>=1024&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(ext==='.webp')return b.length>=1024&&b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
  return false;
}
async function getJson(base,ruta){
  const res=await fetch(base+ruta,{signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error('HTTP '+res.status+' en '+ruta);
  return res.json();
}
async function catalogo(base){
  const a=[];
  for(let pagina=1;pagina<=20;pagina++){
    const j=await getJson(base,'/lugares?pagina='+pagina+'&porPagina=500');
    if(!Array.isArray(j?.datos)||!Number.isInteger(j?.meta?.total))throw Error('Contrato de /lugares incorrecto');
    a.push(...j.datos);
    if(a.length>=j.meta.total||j.datos.length===0)return a;
  }
  throw Error('Paginacion excedida');
}
console.log('\nMI CIUDAD COLON — PREENTREGA PARA GIOVANNI (SOLO LECTURA)\n');
const manifest='src/servicios/fotosLocales.ts';
let m='';
if(existsSync(path(manifest))){m=leer(manifest);aprobar('Manifiesto de fotos presente');}
else bloquear('Falta '+manifest);
const refs=new Map([...m.matchAll(/["']([^"']+)["']\s*:\s*require\(["']\.\.\/\.\.\/assets\/lugares\/([^"']+)["']\)/g)].map(x=>[x[1],x[2]]));
let validas=0;
for(const [id,file] of refs){
  const ruta='assets/lugares/'+file;
  if(!existsSync(path(ruta)))bloquear('Archivo referenciado ausente: '+ruta);
  else if(!comprobarFoto(ruta))bloquear('Imagen invalida o ilegible: '+ruta);
  else validas++;
}
aprobar('Fotos referenciadas con archivo valido: '+validas);
const fotosDir='assets/lugares';
const fotos=existsSync(path(fotosDir))?readdirSync(path(fotosDir)).filter(x=>/\.(jpg|jpeg|png|webp)$/i.test(x)):[];
const sinManifest=fotos.filter(x=>{
  const k=slug(basename(x,extname(x)));
  return !refs.has(k);
});
if(sinManifest.length)avisar('Fotos presentes pero NO empaquetadas en JS: '+sinManifest.join(', '));
const revisar=fotos.filter(x=>/revisar/i.test(x));
if(revisar.length)avisar('Fotos REVISAR sin asignacion segura: '+revisar.join(', '));
if(fotos.length===0)avisar('Sin fotos locales en assets/lugares');
for(const id of noCheck)if(refs.has(id))avisar(id+' requiere validacion visual del lugar; el nombre solo no acredita la identidad');
const eas=existsSync(path('eas.json'))?JSON.parse(leer('eas.json')):null;
if(eas?.build?.preview?.android?.buildType==='apk')aprobar('EAS preview genera APK Android');
else bloquear('EAS no configura preview.android.buildType=apk');
const app=existsSync(path('app.json'))?JSON.parse(leer('app.json')):null;
if(app?.expo?.ios?.bundleIdentifier)aprobar('iOS bundleIdentifier presente');
else bloquear('Falta identificador iOS');
const mapa=existsSync(path('app/(tabs)/mapa.tsx'))?leer('app/(tabs)/mapa.tsx'):'';
if(mapa.includes('MapaLeaflet')&&mapa.includes("Platform.OS==='ios'"))aprobar('Mapa iOS y respaldo Android presentes');
else avisar('Verificar cambios multiplataforma del mapa');
let base=baseApi().trim().replace(/\/+$/,'');
const privada=/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/i;
if(!base)bloquear('EXPO_PUBLIC_API_URL ausente: una APK usaria mocks');
else if(!/^https?:\/\/[^/]+$/i.test(base))bloquear('EXPO_PUBLIC_API_URL tiene formato incorrecto');
else if(privada.test(base))bloquear('API solo local: Giovanni no accedera desde otra red ('+base+')');
else if(!base.startsWith('https://'))bloquear('La API publica debe utilizar HTTPS');
else {
  if(/trycloudflare\.com|ngrok-free\.app|loca\.lt/i.test(base))avisar('URL HTTPS de tunel temporal: no sirve como backend permanente para entrega');
  try {
    const salud=await getJson(base,'/salud');
    if(salud?.datos?.estado==='ok')aprobar('API publica responde /salud');
    else avisar('/salud no devolvio datos.estado=ok');
    const lugares=await catalogo(base);
    const activos=lugares.filter(l=>l.activo!==false);
    aprobar('Catalogo remoto disponible: '+activos.length+' lugares activos');
    if(activos.length!==26)avisar('La API devolvio '+activos.length+' activos; la referencia del grupo era 26');
    let locales=0, malNombre=0, sinImagen=0;
    for(const l of activos){
      const id=String(l.id||'');
      const local=refs.has(id)||refs.has(slug(l.nombre));
      const canon=conocidos[id];
      if(local){
        locales++;
        if(canon&&slug(canon)!==slug(l.nombre)){
          malNombre++;
          avisar('NO validar foto '+id+': API dice "'+l.nombre+'" y la foto candidata dice "'+canon+'"');
        }
      }
      if(!local&&(!Array.isArray(l.imagenes)||!l.imagenes.some(x=>typeof x==='string'&&x.trim())))sinImagen++;
    }
    aprobar('Lugares activos con foto local vinculada: '+locales);
    if(malNombre)bloquear('Hay '+malNombre+' fotos locales cuya identidad no coincide con los nombres API');
    if(sinImagen)avisar('Lugares sin foto local ni URL remota: '+sinImagen);
  }catch(e){bloquear('API publica no responde correctamente: '+String(e?.message||e));}
}
console.log('OK ('+ok.length+')');
for(const s of ok)console.log('  [OK] '+s);
console.log('\nAVISOS ('+avisos.length+')');
for(const s of avisos)console.log('  [REVISION] '+s);
console.log('\nBLOQUEOS ('+bloqueos.length+')');
for(const s of bloqueos)console.log('  [BLOQUEO] '+s);
console.log('\nAntes de compartir: npm run typecheck | npm run mapas:check | npm run entrega:check -- --apk');
console.log('Confirmar en Expo EAS preview la misma EXPO_PUBLIC_API_URL HTTPS.');
process.exitCode=bloqueos.length?1:0;
