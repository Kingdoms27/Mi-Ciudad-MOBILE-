/**
 * Reporte por lugar de la API de la cátedra, sin modificar sus datos.
 * Uso: npm run fotos:reporte -- http://localhost:3000
 * Genera reportes/fotos-para-revisar.csv para planificar fotos autorizadas.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const base = (process.argv[2] || process.env.API_URL || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\//i.test(base)) {
  console.error('Uso: npm run fotos:reporte -- http://localhost:3000');
  process.exit(2);
}
const slug = (nombre) => String(nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const csv = (valor) => '"' + String(valor ?? '').replace(/"/g, '""') + '"';

// Agrupa archivos propios de la API aunque localhost y 127.0.0.1 sean distintos.
function claveDeImagen(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, base);
    if (/^\/archivos\//i.test(parsed.pathname)) return parsed.pathname + parsed.search;
    return parsed.href;
  } catch {
    return String(url);
  }
}

async function obtenerLugares() {
  const todos = [];
  for (let pagina = 1; pagina <= 30; pagina++) {
    const url = base + '/lugares?pagina=' + pagina + '&porPagina=500';
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!respuesta.ok) throw new Error('La API devolvió HTTP ' + respuesta.status + ' en ' + url);
    const cuerpo = await respuesta.json();
    if (!Array.isArray(cuerpo?.datos) || !cuerpo.meta || typeof cuerpo.meta.total !== 'number') {
      throw new Error('La respuesta de /lugares no coincide con el contrato oficial (datos y meta).');
    }
    todos.push(...cuerpo.datos);
    if (todos.length >= cuerpo.meta.total || cuerpo.datos.length === 0) return todos;
  }
  throw new Error('La API superó el límite de paginación de la auditoría.');
}

async function obtenerLocales() {
  try {
    const dir = join(raiz, 'assets', 'lugares');
    const archivos = await readdir(dir, { withFileTypes: true });
    const extensiones = new Set(['.jpg', '.jpeg', '.png', '.webp']);
    return new Map(archivos.filter(item => item.isFile() && extensiones.has(extname(item.name).toLowerCase()))
      .map(item => [slug(basename(item.name, extname(item.name))), item.name]));
  } catch (e) {
    if (e?.code === 'ENOENT') return new Map();
    throw e;
  }
}

try {
  const [lugares, fotos] = await Promise.all([obtenerLugares(), obtenerLocales()]);
  const activos = lugares.filter(lugar => lugar.activo !== false);
  const filas = [];
  const prioritarias = [];
  const grupos = new Map();
  for (const lugar of activos) {
    const url = Array.isArray(lugar.imagenes) ? lugar.imagenes.find(Boolean) : '';
    const principal = claveDeImagen(url);
    if (!principal) continue;
    const grupo = grupos.get(principal) ?? [];
    grupo.push(lugar);
    grupos.set(principal, grupo);
  }
  let empaquetadas = 0;
  let sinUrl = 0;
  let compartidas = 0;
  for (const lugar of activos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))) {
    const encontrado = fotos.get(slug(lugar.id)) || fotos.get(slug(lugar.nombre)) || '';
    const urls = Array.isArray(lugar.imagenes) ? lugar.imagenes.filter(Boolean) : [];
    if (encontrado) empaquetadas++;
    if (!urls.length) sinUrl++;
    const archivoRecomendado = slug(lugar.nombre) + '.jpg';
    const estado = encontrado ? 'Foto local incluida' : urls.length
      ? 'Sin foto local (API con medio)' : 'Sin foto local (API sin medio)';
    const grupo = urls.length ? (grupos.get(claveDeImagen(urls[0])) ?? []) : [];
    const compartida = grupo.length > 1;
    if (compartida) compartidas++;
    const prioridad = encontrado ? 'Resuelto localmente' : !urls.length
      ? 'Alta - API sin foto' : compartida
        ? 'Alta - principal compartida' : 'Revisar foto del lugar';
    const diagnostico = !urls.length ? 'Sin imagen principal' : compartida
      ? 'La imagen principal se utiliza en ' + grupo.length + ' lugares' : 'Principal no repetida';
    const otros = compartida
      ? grupo.filter(x => x.id !== lugar.id).map(x => x.nombre).join(' | ')
      : '';
    const fila = [lugar.id, lugar.nombre, estado, encontrado, urls.length, archivoRecomendado,
      prioridad, diagnostico, otros];
    filas.push(fila);
    if (prioridad.startsWith('Alta')) prioritarias.push(fila);
  }
  const carpeta = join(raiz, 'reportes');
  await mkdir(carpeta, { recursive: true });
  const ruta = join(carpeta, 'fotos-para-revisar.csv');
  const rutaPrioritarias = join(carpeta, 'fotos-prioritarias.csv');
  const encabezados = [
    'ID', 'Lugar', 'Estado', 'Foto en assets/lugares', 'Cantidad de URLs en API',
    'Nombre sugerido', 'Prioridad', 'Diagnóstico de imagen principal', 'Otros lugares con misma imagen',
  ];
  const convertir = (filasCsv) =>
    '\uFEFF' + [encabezados, ...filasCsv].map(fila => fila.map(csv).join(';')).join('\r\n') + '\r\n';
  await Promise.all([
    writeFile(ruta, convertir(filas), 'utf8'),
    writeFile(rutaPrioritarias, convertir(prioritarias), 'utf8'),
  ]);
  const gruposCompartidos = [...grupos.values()].filter(x => x.length > 1);
  const repeticionesExtra = gruposCompartidos.reduce((n, x) => n + x.length - 1, 0);
  console.log('Lugares activos en API: ' + activos.length);
  console.log('Fotos ya incluidas en assets/lugares: ' + empaquetadas);
  console.log('Sin URL en la API: ' + sinUrl);
  console.log('Pendientes de foto empaquetada: ' + (activos.length - empaquetadas));
  console.log('Grupos con imagen principal compartida: ' + gruposCompartidos.length);
  console.log('Fichas en esos grupos: ' + compartidas);
  console.log('Repeticiones adicionales de imagen principal: ' + repeticionesExtra);
  console.log('Fichas prioritarias sin foto local: ' + prioritarias.length);
  console.log('Reporte general: ' + ruta);
  console.log('Reporte de prioridades: ' + rutaPrioritarias);
  console.log('Estos reportes no garantizan autenticidad, licencia ni disponibilidad de imágenes.');
  console.log('Para auditar la API: npm run api:imagenes -- ' + base);
  console.log('Para incorporar fotos autorizadas: npm run fotos:instalar -- "C:\\Mis fotos Colon"');
} catch (error) {
  console.error('No se pudo generar el reporte:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
