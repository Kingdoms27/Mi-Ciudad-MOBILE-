import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function moduloTs(path, dependencias) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const modulo = { exports: {} };
  const contexto = {
    module: modulo, exports: modulo.exports, Date, console, __DEV__: false,
    setTimeout, clearTimeout,
    require: nombre => {
      if (Object.hasOwn(dependencias,nombre)) return dependencias[nombre];
      throw Error('Dependencia no prevista: ' + nombre);
    },
  };
  vm.runInNewContext(outputText,contexto,{filename:path});
  return modulo.exports;
}

function entorno({conPermiso=true,expoGo=false,fallaCanal=false}={}) {
  const notificaciones = [];
  const canales = [];
  let handler;
  const Notifications = {
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL:'timeInterval' },
    setNotificationHandler: h => { handler=h; },
    setNotificationChannelAsync: async (id,settings) => { 
      if (fallaCanal) throw new Error('NullPointerException simulado en Expo Go');
      canales.push({id,settings}); 
    },
    getPermissionsAsync: async () => ({granted:conPermiso}),
    requestPermissionsAsync: async () => ({granted:conPermiso}),
    scheduleNotificationAsync: async x => { notificaciones.push(x); return 'aviso-1'; },
    cancelScheduledNotificationAsync: async () => {},
  };
  const datos = new Map();
  const api = moduloTs('src/servicios/notificaciones.ts', {
    'react-native': { Platform: { OS:'android' } },
    'expo-constants': { appOwnership: expoGo ? 'expo' : null },
    'expo-sqlite/kv-store': {
      getItem: async k => datos.get(k),
      setItem: async (k,v) => datos.set(k,v),
    },
    'expo-notifications': Notifications,
  });
  return {api,notificaciones,canales,handler:()=>handler};
}

test('recordatorio LOCAL de evento futuro, canal Android y pantalla de alerta',async()=>{
  const e=entorno();
  const inicio = new Date(Date.now()+3*60*60*1000).toISOString();
  const id=await e.api.programarRecordatorioEvento({id:'evt-007',titulo:'Visita cultural',inicio,estado:'programado'});
  assert.equal(id,'aviso-1');
  assert.equal(e.notificaciones.length,1);
  assert.equal(e.notificaciones[0].content.data.eventoId,'evt-007');
  assert.equal(new Date(e.notificaciones[0].trigger.date).getTime(),new Date(inicio).getTime()-30*60*1000);
  assert.equal(e.notificaciones[0].trigger.channelId,'mi-ciudad-recordatorios-v2');
  assert.equal(e.canales[0].settings.importance,4);
  assert.equal((await e.handler().handleNotification({})).shouldShowBanner,true);
  assert.equal((await e.handler().handleNotification({})).shouldPlaySound,true);
});

test('Expo Go Android: omite canal nativo que falla y deja activos los avisos locales',async()=>{
  const e=entorno({expoGo:true,fallaCanal:true});
  assert.equal(await e.api.prepararNotificacionesLocales(),true);
  assert.equal(e.canales.length,0,'Expo Go no debe configurar canal nativo');
  assert.equal(await e.api.programarAvisoLocalDePrueba(),true);
  assert.equal(e.notificaciones.length,1);
  assert.equal('channelId' in e.notificaciones[0].trigger,false);
  const inicio=new Date(Date.now()+60*60*1000).toISOString();
  await e.api.programarRecordatorioEvento({id:'evt-test',titulo:'Recorrido',inicio,estado:'programado'});
  assert.equal('channelId' in e.notificaciones[1].trigger,false);
});

test('APK con canal Android rechazado conserva el fallback y no bloquea eventos',async()=>{
  const e=entorno({fallaCanal:true});
  assert.equal(await e.api.prepararNotificacionesLocales(),true);
  const inicio=new Date(Date.now()+3*60*60*1000).toISOString();
  assert.equal(await e.api.programarRecordatorioEvento({id:'evt-fallback',titulo:'Recorrido',inicio,estado:'programado'}),'aviso-1');
  assert.equal(e.notificaciones.length,1);
  assert.equal('channelId' in e.notificaciones[0].trigger,false);
});

test('evento próximo: recordatorio inmediato y nunca con fecha pasada',async()=>{
  const e=entorno();
  const inicio=new Date(Date.now()+10*60*1000).toISOString();
  await e.api.programarRecordatorioEvento({id:'evt-cerca',titulo:'Evento cercano',inicio,estado:'programado'});
  const fecha=new Date(e.notificaciones[0].trigger.date).getTime();
  assert.ok(fecha>=Date.now(),'el aviso no se agenda en el pasado');
  assert.ok(fecha<=Date.now()+10000,'el aviso se genera unos segundos después');
});

test('abrir navegación respeta las preferencias del sistema y valida coordenadas',()=>{
  const nav=moduloTs('src/servicios/navegacion.ts',{
    'react-native': {Linking:{openURL:async()=>{}},Platform:{OS:'android'}},
  });
  const punto={latitud:-32.2231,longitud:-58.144};
  assert.ok(nav.urlNavegacion(punto,'walking','android').startsWith('geo:'));
  assert.ok(nav.urlNavegacion(punto,'driving','ios').includes('maps.apple.com'));
  assert.ok(nav.urlNavegacion(punto,'walking','ios').includes('dirflg=w'));
  assert.throws(()=>nav.urlNavegacion({latitud:300,longitud:0},'walking','android'));
});

test('proximidad sin permiso no solicita ni genera notificaciones',async()=>{
  const e=entorno({conPermiso:false});
  const r=await e.api.notificarProximidad({id:'lug-004',nombre:'Molino',descripcionCorta:'Patrimonio'});
  assert.equal(r,false);
  assert.equal(e.notificaciones.length,0);
});

test('proximidad con permiso: no duplicar avisos en un mismo día',async()=>{
  const e=entorno();
  const lugar={id:'lug-004',nombre:'Molino Forclaz',descripcionCorta:'Patrimonio'};
  assert.equal(await e.api.notificarProximidad(lugar),true);
  assert.equal(await e.api.notificarProximidad(lugar),false);
  assert.equal(e.notificaciones.length,1);
  assert.equal(e.notificaciones[0].content.data.lugarId,'lug-004');
});

test('fotos verificadas antes que demo API, sin inventar fotos de comercios',()=>{
  const f=moduloTs('src/servicios/fotosExternas.ts',{});
  const api='https://api.ejemplo.com/archivos/museums.png';
  const iglesia=f.imagenesParaLugar({id:'lug-008',nombre:'Iglesia Santos Justo y Pastor',imagenes:[api]});
  assert.ok(iglesia[0].includes('Iglesia_Santos_Justo_y_Pastor'));
  assert.equal(iglesia[1],api);
  const comercio=f.imagenesParaLugar({id:'lug-008',nombre:'Bodega Vulliez Sermet',imagenes:[api]});
  assert.deepEqual(Array.from(comercio),[api], 'no mostrar iglesia en una bodega');
  assert.equal(f.tieneFotoExternaCurada({id:'lug-008',nombre:'Bodega Vulliez Sermet',imagenes:[api]}),false);
  assert.deepEqual(Array.from(f.imagenesParaLugar({id:'lug-019',imagenes:[api]})),[api]);
});
