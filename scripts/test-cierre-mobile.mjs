import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function cargarTs(path, deps) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const mod = { exports: {} };
  const contexto = {
    module: mod, exports: mod.exports, Date, console,
    setTimeout, clearTimeout, process: { env: {} },
    require: nombre => {
      if (Object.hasOwn(deps, nombre)) return deps[nombre];
      throw Error('Dependencia inesperada: ' + nombre);
    },
  };
  vm.runInNewContext(outputText, contexto, { filename: path });
  return mod.exports;
}

function crearNotificaciones({conPermiso = true} = {}) {
  const recordatorios = [];
  const canales = [];
  const solicitudes = [];
  let handler;
  const Notifications = {
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationHandler: h => { handler = h; },
    setNotificationChannelAsync: async (id,conf) => { canales.push({id,conf}); },
    getPermissionsAsync: async () => ({ granted: conPermiso }),
    requestPermissionsAsync: async () => { solicitudes.push('pedir'); return { granted: conPermiso }; },
    scheduleNotificationAsync: async config => { recordatorios.push(config); return 'notif-123'; },
    cancelScheduledNotificationAsync: async () => {},
  };
  return { Notifications, recordatorios, canales, solicitudes, handler: () => handler };
}

test('guardar un evento futuro programa una notificación LOCAL con destino al evento', async () => {
  const fake = crearNotificaciones();
  const servicio = cargarTs('src/servicios/notificaciones.ts', {
    'react-native': { Platform: { OS:'android' } },
    'expo-sqlite/kv-store': { default: { getItem: async () => null, setItem: async () => {} } },
    'expo-notifications': fake.Notifications,
  });
  const inicio = new Date(Date.now()+3*60*60*1000).toISOString();
  const id = await servicio.programarRecordatorioEvento({id:'evt-123',titulo:'Visita guiada',inicio,estado:'programado'});
  assert.equal(id,'notif-123');
  assert.equal(fake.recordatorios.length,1);
  assert.equal(fake.recordatorios[0].content.data.eventoId,'evt-123');
  assert.equal(fake.recordatorios[0].trigger.type,'date');
  assert.equal(fake.recordatorios[0].trigger.channelId,'mi-ciudad-recordatorios');
  assert.equal(fake.canales[0].id,'mi-ciudad-recordatorios');
  assert.equal(fake.solicitudes.length,0);
  assert.equal((await fake.handler().handleNotification({})).shouldShowBanner,true);
});

test('sin permiso, proximidad no abre permisos ni programa avisos', async () => {
  const fake = crearNotificaciones({conPermiso:false});
  const servicio = cargarTs('src/servicios/notificaciones.ts', {
    'react-native': { Platform: { OS:'android' } },
    'expo-sqlite/kv-store': { default: { getItem: async () => null, setItem: async () => {} } },
    'expo-notifications': fake.Notifications,
  });
  assert.equal(await servicio.notificarProximidad({id:'lug-008',nombre:'Iglesia',descripcionCorta:'Sitio histórico'}),false);
  assert.equal(fake.recordatorios.length,0);
  assert.equal(fake.solicitudes.length,0);
});

test('un lugar cercano genera como máximo un aviso por día', async () => {
  const fake = crearNotificaciones();
  const datos = new Map();
  const servicio = cargarTs('src/servicios/notificaciones.ts', {
    'react-native': { Platform: { OS:'android' } },
    'expo-sqlite/kv-store': { default: { getItem: async k => datos.get(k), setItem: async (k,v) => datos.set(k,v) } },
    'expo-notifications': fake.Notifications,
  });
  const lugar={id:'lug-004',nombre:'Molino Forclaz',descripcionCorta:'Monumento histórico'};
  assert.equal(await servicio.notificarProximidad(lugar),true);
  assert.equal(await servicio.notificarProximidad(lugar),false);
  assert.equal(fake.recordatorios.length,1);
  assert.equal(fake.recordatorios[0].content.data.lugarId,'lug-004');
});

test('imágenes curadas tienen prioridad; lugares no identificados conservan su API', () => {
  const servicio = cargarTs('src/servicios/fotosExternas.ts',{});
  const ejemplo = { id:'lug-008',imagenes:['https://api.ejemplo.com/archivos/museums.png'] };
  const fotos = servicio.imagenesParaLugar(ejemplo);
  assert.ok(fotos[0].includes('Iglesia_Santos_Justo_y_Pastor'));
  assert.equal(fotos[1],ejemplo.imagenes[0]);
  assert.deepEqual(Array.from(servicio.imagenesParaLugar({id:'lug-019',imagenes:[ejemplo.imagenes[0]]})), ejemplo.imagenes);
});
