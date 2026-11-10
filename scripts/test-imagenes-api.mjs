// Pruebas sin servidor ni modificaciones de SQLite.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function cargarTs(ruta, dependencias, env = {}) {
  const { outputText } = ts.transpileModule(readFileSync(ruta, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });
  const modulo = { exports: {} };
  const entorno = {
    module: modulo,
    exports: modulo.exports,
    URL,
    console,
    process: {env},
    require: nombre => {
      if (Object.hasOwn(dependencias, nombre)) return dependencias[nombre];
      throw new Error('Dependencia no preparada en test: ' + nombre);
    },
  };
  vm.runInNewContext(outputText, entorno, { filename: ruta });
  return modulo.exports;
}

const base = 'http://192.168.1.25:3000';
const apiReal = cargarTs('src/servicios/api.ts', {
  'expo-secure-store': {},
}, { EXPO_PUBLIC_API_URL: base });

test('los medios de NestJS usan la misma API de Expo, incluso si cambia la IP', () => {
  const url = apiReal.urlArchivoParaDispositivo;
  assert.equal(url('/archivos/a.png'), base + '/archivos/a.png');
  assert.equal(url('http://localhost:3000/archivos/a.png'), base + '/archivos/a.png');
  assert.equal(url('http://127.0.0.1:3000/archivos/a.png?x=1'), base + '/archivos/a.png?x=1');
  assert.equal(url('http://192.168.1.50:3000/archivos/a.jpg'), base + '/archivos/a.jpg');
  assert.equal(url('https://commons.wikimedia.org/file.jpg'), 'https://commons.wikimedia.org/file.jpg');
  assert.equal(url(null), null);
});

test('la URL HTTP generada por NestJS detrás de Cloudflare se convierte a HTTPS sin tocar otros dominios', () => {
  const apiHttps = 'https://mi-ciudad-ejemplo.trycloudflare.com';
  const api = cargarTs('src/servicios/api.ts', {
    'expo-secure-store': {},
  }, { EXPO_PUBLIC_API_URL: apiHttps });
  const fotoHttp = 'http://mi-ciudad-ejemplo.trycloudflare.com/archivos/imagenes/2026/11/semilla-museums-1.png';
  assert.equal(api.urlArchivoParaDispositivo(fotoHttp), apiHttps + '/archivos/imagenes/2026/11/semilla-museums-1.png');
  assert.equal(api.urlArchivoParaDispositivo('http://mi-ciudad-ejemplo.trycloudflare.com/archivos/a.png?q=1'),
    apiHttps + '/archivos/a.png?q=1');
  assert.equal(api.urlArchivoParaDispositivo('http://otras-fotos.ejemplo.com/archivos/a.png'),
    'http://otras-fotos.ejemplo.com/archivos/a.png');
  assert.equal(api.urlArchivoParaDispositivo('http://mi-ciudad-ejemplo.trycloudflare.com/otra-ruta/file.jpg'),
    'http://mi-ciudad-ejemplo.trycloudflare.com/otra-ruta/file.jpg');
});

test('el catálogo respeta solo las fotos de la cátedra, incluso con caché antigua y mocks', async () => {
  const fotoApi = 'http://localhost:3000/archivos/imagen-docente.png';
  const lugar = { id: 'lug-004', nombre: 'Molino Forclaz', activo: true,
    actualizadoEn: '2026-10-15T10:00:00-03:00', imagenes: [fotoApi] };
  const mocks = [{ ...lugar, imagenes: ['https://web-externa.com/otra.jpg'] }];
  const normalizador = cargarTs('src/servicios/normalizacion.ts', {
    '@/src/servicios/api': apiReal,
  });
  let rutaPedida = '';
  const repositorio = cargarTs('src/servicios/lugares.ts', {
    '@/src/mocks/categorias': { categoriasMock: [] },
    '@/src/mocks/lugares': { lugaresMock: mocks },
    '@/src/servicios/cache': {
      leerCache: async () => mocks,
      guardarCache: async () => {},
    },
    '@/src/servicios/api': {
      apiConfigurada: () => true,
      obtenerBaseApi: () => base,
      apiGet: async () => ({error:{codigo:'SIN',mensaje:'sin dato'}}),
      apiListarTodos: async ruta => {
        rutaPedida = ruta;
        return { datos: [lugar, {...lugar,id:'lug-sin',nombre:'Sin fotos',imagenes:[]}],
          meta: {total:2,pagina:1,porPagina:500} };
      },
    },
    '@/src/servicios/normalizacion': normalizador,
  });
  const res = await repositorio.obtenerLugares();
  assert.equal(rutaPedida, '/lugares');
  assert.ok('datos' in res);
  assert.equal(res.datos.length, 2);
  const molino = res.datos.find(x=>x.id==='lug-004');
  assert.deepEqual(Array.from(molino.imagenes), [base+'/archivos/imagen-docente.png']);
  assert.deepEqual(Array.from(res.datos.find(x=>x.id==='lug-sin').imagenes), []);
});

test('una ilustración secundaria en caché no parpadea antes de la foto principal verificada', async () => {
  const antigua='https://api.ejemplo.com/archivos/museums-1.png';
  const nueva='https://upload.wikimedia.org/wikipedia/commons/5/54/Iglesia_Santos_Justo_y_Pastor_Colon_Entre_Rios.JPG';
  const cache=JSON.stringify({url:antigua,uri:'file://foto-vieja.png'});
  const fotos=cargarTs('src/servicios/imagenes.ts',{
    'react-native':{Platform:{OS:'android'}},
    'expo-file-system':{
      File:class { constructor(uri){this.uri=uri;this.exists=true;this.size=100;} },
      Directory:class {},
      Paths:{document:'file://test'},
    },
    'expo-sqlite/kv-store':{getItem:async()=>cache},
  });
  assert.equal(await fotos.obtenerImagenLugarGuardada('lug-008',[nueva,antigua]),null);
  assert.equal(await fotos.obtenerImagenLugarGuardada('lug-008',[antigua]),'file://foto-vieja.png');
});
