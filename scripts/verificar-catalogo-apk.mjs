/**
 * Verifica el catalogo REAL de la catedra antes de compilar la APK.
 * No modifica el servidor ni la base de datos.
 *
 * Uso: npm run apk:catalogo -- https://API_PUBLICA_ESTABLE
 *      npm run apk:catalogo -- http://localhost:3000
 */
import { readFile, open, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
function valorEnv(texto) {
  const linea = texto.split(/\r?\n/).find(l => /^\s*EXPO_PUBLIC_API_URL\s*=/.test(l));
  return linea ? linea.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '') : '';
}
async function obtenerBase() {
  if (process.argv[2]) return process.argv[2].trim().replace(/\/+$/, '');
  for (const ruta of ['.env.local', '.env']) {
    try {
      const valor = valorEnv(await readFile(join(raiz, ruta), 'utf8'));
      if (valor) return valor.replace(/\/+$/, '');
    } catch {}
  }
  return (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
}
const slug = nombre => String(nombre ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
async function json(base, ruta) {
  const respuesta = await fetch(base + ruta, { signal: AbortSignal.timeout(12000) });
  if (!respuesta.ok) throw new Error(ruta + ' devolvio HTTP ' + respuesta.status);
  const dato = await respuesta.json();
  if (!dato || !Array.isArray(dato.datos)) throw new Error(ruta + ': falta el arreglo datos[]');
  return dato;
}
async function catalogo(base) {
  const todos = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const respuesta = await json(base, '/lugares?pagina=' + pagina + '&porPagina=500');
    if (typeof respuesta.meta?.total !== 'number')
      throw new Error('Falta meta.total en la paginacion de lugares');
    todos.push(...respuesta.datos);
    if (todos.length >= respuesta.meta.total) return todos;
    if (!respuesta.datos.length) throw new Error('La API dejo de enviar paginas antes de meta.total');
  }
  throw new Error('Mas de 20 paginas: revisar la paginacion de la API');
}
async function validaArchivo(ruta) {
  let archivo;
  try {
    archivo = await open(ruta, 'r');
    const bytes = Buffer.alloc(16);
    const { bytesRead } = await archivo.read(bytes, 0, 16, 0);
    return (bytesRead >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      || (bytesRead >= 8 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
      || (bytesRead >= 12 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP');
  } catch { return false; }
  finally { await archivo?.close(); }
}
function imagenRemota(base, url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  try {
    if (url.startsWith('/archivos/')) return base + url;
    const original = new URL(url);
    if (!['http:', 'https:'].includes(original.protocol)) return '';
    const destino = new URL(base);
    const local = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(original.hostname);
    const mismoHostHttp = destino.protocol === 'https:' && original.protocol === 'http:' && original.hostname === destino.hostname;
    if (original.pathname.startsWith('/archivos/') && (local || mismoHostHttp))
      return base + original.pathname + original.search;
    return original.toString();
  } catch { return ''; }
}
async function validaUrlImagen(url) {
  try {
    const respuesta = await fetch(url, {
      headers: { Range: 'bytes=0-127' },
      signal: AbortSignal.timeout(10000),
    });
    const tipo = respuesta.headers.get('content-type') ?? '';
    await respuesta.body?.cancel().catch(() => {});
    return respuesta.ok && /^image\/(jpeg|png|webp|avif|gif)\b/i.test(tipo);
  } catch { return false; }
}
async function main() {
  const base = await obtenerBase();
  if (!/^https?:\/\//.test(base)) throw new Error('Indica una URL HTTP(S) real de la API; no se usaran mocks');
  console.log('Comprobando API de la catedra: ' + base);
  const todos = await catalogo(base);
  const activos = todos.filter(lugar => lugar.activo === true);
  const ids = new Set(activos.map(lugar => lugar.id));
  if (ids.size !== activos.length) throw new Error('Hay IDs duplicados en los lugares activos');
  console.log('Lugares en la API: ' + todos.length + ' | activos: ' + activos.length);

  const manifiesto = await readFile(join(raiz, 'src/servicios/fotosLocales.ts'), 'utf8');
  const mapa = new Map([...manifiesto.matchAll(/["']([^"']+)["']:\s*require\(["']\.\.\/\.\.\/assets\/lugares\/([^"']+)["']\)/g)]
    .map(x => [x[1], x[2]]));
  let locales = 0, remotas = 0;
  const faltantes = [];
  const detalle = [];
  for (const lugar of activos) {
    const archivo = mapa.get(lugar.id) ?? mapa.get(slug(lugar.nombre));
    let estado = 'SIN_FOTO';
    if (archivo && await validaArchivo(join(raiz, 'assets/lugares', archivo))) {
      locales++;
      estado = 'LOCAL';
    } else {
      const urls = (Array.isArray(lugar.imagenes) ? lugar.imagenes : [])
        .map(url => imagenRemota(base, url)).filter(Boolean);
      for (const url of urls.slice(0, 3)) {
        if (await validaUrlImagen(url)) {
          remotas++;
          estado = 'API';
          break;
        }
      }
    }
    if (estado === 'SIN_FOTO') faltantes.push({ id: lugar.id, nombre: lugar.nombre, archivo: archivo ?? null });
    detalle.push({ id: lugar.id, nombre: lugar.nombre, estado, archivoLocal: archivo ?? null });
    console.log('[' + estado + '] ' + lugar.id + ' | ' + lugar.nombre);
  }
  console.log('Fotos disponibles: locales ' + locales + ', desde la API ' + remotas
    + ', sin respaldo comprobado ' + faltantes.length);
  const reporte = { base, fecha: new Date().toISOString(), total: todos.length,
    activos: activos.length, locales, remotas, sinFoto: faltantes.length, detalle };
  const carpeta = resolve(raiz, 'reportes');
  await mkdir(carpeta, { recursive: true });
  await writeFile(join(carpeta, 'verificacion-apk-catalogo.json'), JSON.stringify(reporte, null, 2) + '\n');
  console.log('Informe: reportes/verificacion-apk-catalogo.json');
  if (activos.length !== 26 || faltantes.length)
    throw new Error('No se puede validar una APK de 26 lugares con foto: ' +
      'activos=' + activos.length + ', sin foto=' + faltantes.length);
  console.log('[OK] Los 26 lugares activos y sus fotos tienen respaldo comprobado.');
  console.log('Siguiente: configurar esta misma URL en EAS preview y recompilar la APK.');
  console.log('Atencion: una URL trycloudflare.com es temporal; fuera de linea fallara la conexion remota.');
}
main().catch(error => { console.error('[ERROR] ' + (error?.message ?? error)); process.exitCode = 1; });
