/**
 * Diagnóstico local no destructivo para Expo Go y APK EAS.
 *   npm run entrega:check
 *   npm run entrega:check -- --apk
 *
 * No usa credenciales, no modifica .env, no reinicia la API y no publica datos.
 */
import { readFile, stat, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const modoApk = process.argv.includes('--apk');
const fallas = [];
const avisos = [];
const ok = [];

const ruta = archivo => resolve(raiz, archivo);
const existe = async archivo => {
  try { await access(ruta(archivo)); return true; } catch { return false; }
};
const leer = archivo => readFile(ruta(archivo), 'utf8');
const fallo = mensaje => fallas.push(mensaje);
const aviso = mensaje => avisos.push(mensaje);
const aprobado = mensaje => ok.push(mensaje);

function extraerBase(texto) {
  for (const linea of texto.split(/\r?\n/)) {
    const match = linea.match(/^\s*EXPO_PUBLIC_API_URL\s*=\s*(.*?)\s*$/);
    if (match) return match[1].replace(/^['"]|['"]$/g, '').trim();
  }
  return '';
}

async function baseConfigurada() {
  // Expo puede cargar .env.local por encima de .env. No imprimimos otros valores.
  if (process.env.EXPO_PUBLIC_API_URL?.trim()) {
    return { valor: process.env.EXPO_PUBLIC_API_URL.trim(), fuente: 'entorno actual' };
  }
  for (const archivo of ['.env.local', '.env']) {
    if (await existe(archivo)) {
      const valor = extraerBase(await leer(archivo));
      if (valor) return { valor, fuente: archivo };
    }
  }
  return { valor: '', fuente: 'ninguna' };
}

function clasificarUrl(url) {
  if (!url) return 'ausente';
  let u;
  try { u = new URL(url); } catch { return 'invalida'; }
  if (!['http:', 'https:'].includes(u.protocol)) return 'invalida';
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(host)) return 'localhost';
  if (/^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return 'red-local';
  return u.protocol === 'https:' ? 'https' : 'http-publico';
}

try {
  const hero = 'assets/hero-colon.jpg';
  if (!(await existe(hero))) {
    fallo('Falta la portada local assets/hero-colon.jpg.');
  } else {
    const bytes = await readFile(ruta(hero));
    if (bytes.length < 1024 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      fallo('La portada local no parece ser un JPEG válido.');
    } else {
      aprobado('Portada local JPEG presente (' + Math.round(bytes.length / 1024) + ' KB).');
    }
  }

  const manifiesto = 'src/servicios/fotosLocales.ts';
  if (!(await existe(manifiesto))) {
    fallo('Falta src/servicios/fotosLocales.ts.');
  } else {
    const texto = await leer(manifiesto);
    const archivos = [...texto.matchAll(/require\(["']\.\.\/\.\.\/assets\/lugares\/([^"']+)["']\)/g)]
      .map(x => x[1]);
    let ausentes = 0;
    for (const archivo of archivos) {
      if (!(await existe('assets/lugares/' + archivo))) {
        fallo('El catálogo referencia una foto inexistente: ' + archivo);
        ausentes++;
      }
    }
    if (!archivos.length) aviso('No hay fotografías locales por lugar incluidas en el APK.');
    else if (!ausentes) aprobado('Fotografías locales referenciadas y presentes: ' + archivos.length + '.');
  }

  if (await existe('package-lock.json')) aprobado('package-lock.json presente para una instalación reproducible.');
  else aviso('Falta package-lock.json en la carpeta del proyecto: conviene versionarlo antes de EAS.');

  if (!(await existe('eas.json'))) {
    fallo('Falta eas.json.');
  } else {
    try {
      const eas = JSON.parse(await leer('eas.json'));
      if (eas.build?.preview?.android?.buildType === 'apk') {
        aprobado('EAS tiene un perfil preview que genera APK Android.');
      } else {
        aviso('El perfil EAS preview no declara android.buildType=apk.');
      }
    } catch {
      fallo('No se pudo interpretar eas.json como JSON.');
    }
  }

  const api = await baseConfigurada();
  const tipo = clasificarUrl(api.valor);
  switch (tipo) {
    case 'https':
      aprobado('URL de API HTTPS configurada (' + api.fuente + ').');
      break;
    case 'ausente':
      (modoApk ? fallo : aviso)('No se encontró EXPO_PUBLIC_API_URL; se usarán datos mock, no la API del profesor.');
      break;
    case 'localhost':
      (modoApk ? fallo : aviso)('La URL apunta a localhost. Un teléfono físico necesita otra dirección.');
      break;
    case 'red-local':
      (modoApk ? fallo : aviso)('La API usa una IP privada; solo funcionará desde la red local, no en un APK para otras redes.');
      break;
    case 'http-publico':
      (modoApk ? fallo : aviso)('La API pública está configurada con HTTP. Para entrega conviene usar HTTPS.');
      break;
    default:
      fallo('La URL de la API no tiene un formato HTTP(S) válido.');
  }

  if (await existe('reportes/fotos-prioritarias.csv')) {
    const csv = await leer('reportes/fotos-prioritarias.csv');
    const filas = csv.trim().split(/\r?\n/).length - 1;
    if (filas > 0) aviso('El último reporte de imágenes contiene ' + filas + ' fichas prioritarias; comprobá si sigue actualizado.');
    else aprobado('El último reporte de imágenes no contiene prioridades.');
  }

  console.log('\nMI CIUDAD MOBILE — PREENTREGA (' + (modoApk ? 'APK' : 'DESARROLLO') + ')');
  for (const item of ok) console.log('[OK] ' + item);
  for (const item of avisos) console.log('[AVISO] ' + item);
  for (const item of fallas) console.error('[BLOQUEO] ' + item);
  console.log('\nResultado: ' + fallas.length + ' bloqueo(s), ' + avisos.length + ' aviso(s).');
  console.log('Pendiente: verificar API, agenda, funciones del teléfono y APK instalado sin Metro.');
  if (fallas.length) process.exitCode = 1;
} catch (error) {
  console.error('No se completó la preentrega:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
