/**
 * Reprograma SOLO los 8 eventos de ejemplo de api-mi-ciudad en SQLite.
 * Por defecto: SIMULACIÓN (solo lectura). Para escribir: --aplicar.
 * Requiere la API detenida (Ctrl+C en la terminal de NestJS).
 * Backup de SQLite ANTES de la transacción y sin db:reiniciar.
 *
 *   node scripts/reprogramar-eventos-demo.mjs
 *   node scripts/reprogramar-eventos-demo.mjs --aplicar
 *   node scripts/reprogramar-eventos-demo.mjs --db "C:\ruta\base.sqlite"
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync, mkdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { resolve, join, isAbsolute, extname } from 'node:path';
import { homedir } from 'node:os';

const aplicar = process.argv.includes('--aplicar');
const valorFlag = nombre => {
  const index = process.argv.indexOf(nombre);
  return index < 0 ? '' : (process.argv[index + 1] ?? '');
};
const api = resolve(valorFlag('--api') ||
  join(process.env.LOCALAPPDATA || join(homedir(),'AppData','Local'),
  'MiCiudadColon','backend','api-proyectos-mobile-main','api-mi-ciudad'));
const dbExplicita = valorFlag('--db');
const IDS = Array.from({length:8},(_,i)=>'evt-'+String(17+i).padStart(3,'0'));

const fallar = mensaje => {throw new Error(mensaje)};
const comillasSql = nombre => '"' + nombre.replaceAll('"','""') + '"';
function variablesEnv(ruta) {
  if(!existsSync(ruta))return {};
  const out={};
  for(const linea of readFileSync(ruta,'utf8').split(/\r?\n/)){
    const par=linea.match(/^\s*([A-Za-z_]\w*)\s*=\s*(.*?)\s*$/);
    if(!par)continue;
    let valor=par[2].trim();
    if((valor.startsWith('"')&&valor.endsWith('"')) ||
       (valor.startsWith("'")&&valor.endsWith("'"))) valor=valor.slice(1,-1);
    out[par[1]]=valor;
  }
  return out;
}
function esSqlite(ruta){
  let fd;
  try {
    fd=openSync(ruta,'r');
    const encabezado=Buffer.alloc(16);
    return readSync(fd,encabezado,0,16,0)===16 &&
      encabezado.toString('ascii',0,15)==='SQLite format 3' &&
      encabezado[15]===0;
  } catch { return false; }
  finally { if(fd!==undefined)closeSync(fd); }
}
function buscarBases(carpeta,profundidad=0) {
  if(profundidad>3 || !existsSync(carpeta))return [];
  const resultado=[];
  for(const item of readdirSync(carpeta,{withFileTypes:true})){
    if(item.name.startsWith('node_modules')||item.name==='dist'||item.name==='.git'||
       item.name==='respaldos')continue;
    const ruta=join(carpeta,item.name);
    if(item.isDirectory())resultado.push(...buscarBases(ruta,profundidad+1));
    else if(item.isFile()&&['.sqlite','.db','.sqlite3'].includes(extname(item.name).toLowerCase())
      &&esSqlite(ruta)) resultado.push(ruta);
  }
  return resultado;
}
function obtenerBase(){
  const env=variablesEnv(join(api,'.env'));
  const motor=(env.DB_MOTOR||env.DB_PROVEEDOR||'sqlite').toLowerCase();
  if(!['sqlite','better-sqlite3'].includes(motor))
    fallar('La API no usa SQLite local. No se modificarán bases remotas ('+motor+').');
  if(dbExplicita){
    const ruta=resolve(dbExplicita);
    if(!esSqlite(ruta))fallar('La ruta --db no contiene una base SQLite válida.');
    return ruta;
  }
  if(env.DB_ARCHIVO){
    const ruta=isAbsolute(env.DB_ARCHIVO)?env.DB_ARCHIVO:resolve(api,env.DB_ARCHIVO);
    if(esSqlite(ruta))return ruta;
    fallar('DB_ARCHIVO señala una ruta no disponible. Usá --db con la ruta correcta.');
  }
  const opciones=buscarBases(api);
  if(opciones.length!==1)fallar('No se identificó una base SQLite única ('+opciones.length+
    ' candidatas). Indicá la ruta con --db sin modificar el archivo .env.');
  return opciones[0];
}
const zona='America/Argentina/Buenos_Aires';
function fechaLocal(ms){
  const partes=new Intl.DateTimeFormat('en-US',{timeZone:zona,year:'numeric',month:'2-digit',day:'2-digit'})
    .formatToParts(new Date(ms));
  const valor=t=>partes.find(p=>p.type===t)?.value;
  return [valor('year'),valor('month'),valor('day')].join('-');
}
function fechaUTC(dia){return Date.parse(dia+'T00:00:00.000Z')}
function msDeFecha(valor){
  if(typeof valor==='number'){
    return Math.abs(valor)<10_000_000_000 ? valor*1000 : valor;
  }
  if(typeof valor==='string'){
    return Date.parse(valor.replace(' ','T')+(valor.includes('Z')?'':'Z'));
  }
  return NaN;
}
function mover(valor,dias){
  if(valor===null)return null;
  const msDelta=dias*86_400_000;
  if(typeof valor==='number'){
    const enSegundos=Math.abs(valor)<10_000_000_000;
    return valor+(enSegundos?dias*86_400:dias*86_400_000);
  }
  if(typeof valor!=='string')fallar('Tipo de fecha no compatible: '+typeof valor);
  const dbFecha=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  const utcIso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  if(!dbFecha.test(valor)&&!utcIso.test(valor))
    fallar('Formato de fecha SQLite desconocido. No se modificará la base: '+valor);
  const marca=Date.parse(dbFecha.test(valor)?valor.replace(' ','T')+'Z':valor);
  if(!Number.isFinite(marca))fallar('Fecha SQLite inválida: '+valor);
  const iso=new Date(marca+msDelta).toISOString();
  if(utcIso.test(valor))return valor.includes('.')?iso:iso.replace(/\.\d{3}Z$/,'Z');
  const dbFormato=iso.replace('T',' ').replace('Z','');
  return valor.includes('.')?dbFormato:dbFormato.replace(/\.\d{3}$/,'');
}
function tablaEventos(db) {
  const nombres=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  const tablas=nombres.filter(({name})=>{
    const columnas=db.pragma('table_info('+comillasSql(name)+')').map(c=>c.name);
    return ['id','inicio','fin','finEfectivo','estado'].every(c=>columnas.includes(c));
  }).map(x=>x.name);
  if(tablas.length!==1)fallar('No se identificó una tabla única de eventos: '+tablas.length);
  return tablas[0];
}
function filasEventos(db,tabla){
  return db.prepare('SELECT id,inicio,fin,finEfectivo,estado FROM '+comillasSql(tabla)+' ORDER BY id').all();
}
function validarFilas(filas){
  const ids=filas.map(x=>x.id);
  if(filas.length!==8||!IDS.every(id=>ids.includes(id)))
    fallar('No son exactamente los ocho eventos de demostración. No se tocará la base.');
  if(filas.some(x=>!['programado','suspendido','cancelado'].includes(x.estado)))
    fallar('Hay estados no previstos en los eventos; reparación cancelada.');
  for(const fila of filas){
    // Comprueba todos los formatos antes de modificar una fila.
    mover(fila.inicio,0);
    mover(fila.fin,0);
    mover(fila.finEfectivo,0);
  }
}

async function comprobarApiDetenida(){
  try{
    const res=await fetch('http://localhost:3000/salud',{signal:AbortSignal.timeout(1700)});
    if(res.ok)fallar('La API responde en localhost:3000. Detenela con Ctrl+C antes de aplicar.');
  }catch(e){
    if(e.message?.includes('Detenela'))throw e;
  }
}

async function main(){
  if(!existsSync(join(api,'package.json')))fallar('No encuentro el backend: '+api);
  const requireApi=createRequire(join(api,'package.json'));
  let Driver;
  try{Driver=requireApi('better-sqlite3')}
  catch{fallar('No encontré better-sqlite3 instalado en el backend. Iniciá la API primero para instalarlo.');}
  const ruta=obtenerBase();
  const db=new Driver(ruta,{readonly:true,fileMustExist:true});
  let tabla,antes,plan,delta;
  try{
    if(db.pragma('quick_check',{simple:true})!=='ok')fallar('SQLite reportó problemas; no seguir.');
    tabla=tablaEventos(db);
    antes=filasEventos(db,tabla);
    validarFilas(antes);
    const primera=antes.find(f=>f.id==='evt-017');
    const fechaInicio=msDeFecha(primera.inicio);
    if(!Number.isFinite(fechaInicio))fallar('No pude interpretar la fecha inicial.');
    const origen=fechaLocal(fechaInicio);
    const hoy=fechaLocal(Date.now());
    // Elegimos mañana para asegurar eventos futuros incluso si se ejecuta de noche.
    delta=Math.round((fechaUTC(hoy)+86_400_000-fechaUTC(origen))/86_400_000);
    if(delta<=0)fallar('Los eventos demo no necesitan reprogramación hacia el futuro.');
    if(antes.some(x=> x.id!=='evt-024' && msDeFecha(x.inicio)>Date.now()))
      fallar('Ya hay eventos futuros en la tabla; la reparación no es necesaria.');
    plan=antes.map(x=>({
      ...x,
      nuevoInicio:mover(x.inicio,delta),
      nuevoFin:mover(x.fin,delta),
      nuevoFinEfectivo:mover(x.finEfectivo,delta),
    }));
    console.log('\nMI CIUDAD — REPROGRAMACIÓN DE EVENTOS DEMO ('+
      (aplicar?'APLICAR':'SIMULACIÓN')+')');
    console.log('Base SQLite:',ruta);
    console.log('Tabla:',tabla);
    console.log('Eventos:',antes.length,'| Desplazamiento:',delta,'días');
    for(const x of plan)console.log(x.id,'|',x.estado,'|',x.inicio,'=>',x.nuevoInicio);
    if(!aplicar){
      console.log('\nSolo lectura: NO se modificaron eventos.');
      console.log('Para aplicar con respaldo, detené la API y ejecutá:');
      console.log('node scripts/reprogramar-eventos-demo.mjs --aplicar');
      return;
    }
  }finally{db.close();}
  await comprobarApiDetenida();
  const writer=new Driver(ruta,{fileMustExist:true});
  try{
    if(writer.pragma('quick_check',{simple:true})!=='ok')fallar('SQLite inconsistente.');
    if(tablaEventos(writer)!==tabla)fallar('La tabla cambió desde la simulación.');
    if(JSON.stringify(filasEventos(writer,tabla))!==JSON.stringify(antes))
      fallar('Los eventos cambiaron desde la simulación; operación cancelada.');
    const respDir=join(process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'),
      'MiCiudadColon','respaldos');
    mkdirSync(respDir,{recursive:true});
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    const respaldo=join(respDir,'eventos-demo-antes-'+stamp+'.sqlite');
    await writer.backup(respaldo);
    if(statSync(respaldo).size<1024)fallar('No se generó un respaldo SQLite válido.');
    console.log('\n[OK] Respaldo completo y verificado:',respaldo);
    const sql='UPDATE '+comillasSql(tabla)+
      ' SET inicio=?, fin=?, finEfectivo=? WHERE id=? AND inicio=?';
    const actualizar=writer.prepare(sql);
    writer.transaction(()=>{
      for(const x of plan){
        const resultado=actualizar.run(x.nuevoInicio,x.nuevoFin,x.nuevoFinEfectivo,x.id,x.inicio);
        if(resultado.changes!==1)fallar('No se pudo actualizar de forma única '+x.id);
      }
    })();
    if(writer.pragma('quick_check',{simple:true})!=='ok')
      fallar('Error al verificar SQLite después de aplicar; restaurar el respaldo antes de usar.');
    console.log('[OK] Se movieron únicamente las fechas de ocho eventos de demostración.');
    console.log('[OK] IDs, estados, usuarios, favoritos y visitas no se modificaron.');
    console.log('Ahora iniciá la API y ejecutá npm run api:diagnosticar:win.');
  }finally{writer.close();}
}

main().catch(e=>{console.error('\n[ERROR]',e.message);process.exitCode=1;});
