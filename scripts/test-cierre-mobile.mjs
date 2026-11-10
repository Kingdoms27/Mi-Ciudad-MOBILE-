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

function entorno({conPermiso=true}={}) {
  const notificaciones = [];
  const canales = [];
  let handler;
  const Notifications = {
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL:'timeInterval' },
    setNotificationHandler: h => { handler=h; },
    setNotificationChannelAsync: async (id,settings) => { canales.push({id,settings}); },
    getPermissionsAsync: async () => ({granted:conPermiso}),
    requestPermissionsAsync: async () => ({granted:conPermiso}),
    scheduleNotificationAsync: async x => { notificaciones.push(x); return 'aviso-1'; },
    cancelScheduledNotificationAsync: async () => {},
  };
  const datos = new Map();
  const api = moduloTs('src/servicios/notificaciones.ts', {
    'react-native': { Platform: { OS:'android' } },
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
  assert.equal(e.notificaciones[0].trigger.channelId,'mi-ciudad-recordatorios-v2');
  assert.equal(e.canales[0].settings.importance,4);
  assert.equal((await e.handler().handleNotification({})).shouldShowBanner,true);
  assert.equal((await e.handler().handleNotification({})).shouldPlaySound,true);
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
  const iglesia=f.imagenesParaLugar({id:'lug-008',imagenes:[api]});
  assert.ok(iglesia[0].includes('Iglesia_Santos_Justo_y_Pastor'));
  assert.equal(iglesia[1],api);
  assert.deepEqual(Array.from(f.imagenesParaLugar({id:'lug-019',imagenes:[api]})),[api]);
});
