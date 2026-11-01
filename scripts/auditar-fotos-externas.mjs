// Audita las fotografías externas que la app prioriza antes de usar los PNG
// de demostración de la API. No modifica contenido ni descarga archivos al disco.
// Ejecutar: npm run fotos:externas
import { readFile } from 'node:fs/promises';

const leer = async (ruta) => await readFile(new URL('../' + ruta, import.meta.url), 'utf8');
const [oficiales, mocks] = await Promise.all([
  leer('src/servicios/fotosTuristicas.ts'),
  leer('src/mocks/lugares.ts'),
]);
const urlsPorLugar = new Map();

function agregar(nombre, texto, fuente) {
  const fotos = [...texto.matchAll(/'(https?:\/\/[^']+\.(?:jpe?g|png|webp)(?:\?[^']*)?)'/gi)]
    .map(m => m[1]);
  for (const url of fotos) {
    const registros = urlsPorLugar.get(url) || [];
    registros.push({ nombre, fuente });
    urlsPorLugar.set(url, registros);
  }
}

// Listado oficial: claves normalizadas -> URL(s).
for (const match of oficiales.matchAll(/^\s*'([^']+)':\s*\[([\s\S]*?)\]/gm)) {
  agregar(match[1], match[2], 'foto oficial configurada');
}
// Catálogo visual: nombre de lugar -> URL(s).
for (const match of mocks.matchAll(/id:'[^']+',nombre:'([^']+)'[\s\S]*?imagenes:\s*\[([^\]]*)\]/g)) {
  agregar(match[1], match[2], 'catálogo visual');
}
const entradas = [...urlsPorLugar.entries()];
if (!entradas.length) throw new Error('No se encontraron imágenes externas en el catálogo.');

async function comprobar(url) {
  const pedir = async method => {
    const res = await fetch(url, {
      method,
      headers: method === 'GET' ? {Range:'bytes=0-1023'} : {},
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });
    const tipo = res.headers.get('content-type') ?? '';
    const ok = res.ok && /^image\//i.test(tipo);
    await res.body?.cancel().catch(() => {});
    return {ok, estado:res.status, tipo};
  };
  try {
    let r = await pedir('HEAD');
    if (!r.ok) r = await pedir('GET');
    return r;
  } catch (e) {
    return {ok:false,estado:'ERROR',tipo:e instanceof Error ? e.message : String(e)};
  }
}
const resultados = Array(entradas.length);
let cursor=0;
async function trabajar() {
  while (cursor<entradas.length) {
    const i=cursor++;
    resultados[i]=await comprobar(entradas[i][0]);
  }
}
console.log('Verificando fotos que realmente usa la app (no sólo la API)...');
await Promise.all(Array.from({length:Math.min(6,entradas.length)},trabajar));
let correctas=0;
for (let i=0;i<entradas.length;i++) {
  const [url, usados] = entradas[i];
  const r=resultados[i];
  if(r.ok)correctas++;
  else {
    console.log('\nFALLA: ' + r.estado + ' · ' + r.tipo);
    console.log('  URL: '+url);
    console.log('  Lugares: '+[...new Set(usados.map(x=>x.nombre))].join(' | '));
  }
}
console.log('\nFotografías externas accesibles: '+correctas+'/'+entradas.length);
console.log('La API puede aportar una imagen alternativa cuando una externa falla.');
console.log('Un HTTP 200 no acredita que una foto sea correcta ni su licencia.');
if(correctas<entradas.length)process.exitCode=1;
