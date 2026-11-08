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
  let empaquetadas = 0;
  let sinUrl = 0;
  for (const lugar of activos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))) {
    const encontrado = fotos.get(slug(lugar.id)) || fotos.get(slug(lugar.nombre)) || '';
    const urls = Array.isArray(lugar.imagenes) ? lugar.imagenes.filter(Boolean) : [];
    if (encontrado) empaquetadas++;
    if (!urls.length) sinUrl++;
    const archivoRecomendado = slug(lugar.nombre) + '.jpg';
    const estado = encontrado ? 'Foto local incluida' : urls.length
      ? 'Pendiente de foto propia (API con medio)' : 'Pendiente de foto propia (API sin medio)';
    filas.push([lugar.id, lugar.nombre, estado, encontrado, urls.length, archivoRecomendado]);
  }
  const carpeta = join(raiz, 'reportes');
  await mkdir(carpeta, { recursive: true });
  const ruta = join(carpeta, 'fotos-para-revisar.csv');
  const encabezados = ['ID', 'Lugar', 'Estado', 'Foto en assets/lugares', 'Cantidad de URLs en API', 'Nombre sugerido'];
  await writeFile(ruta, '\uFEFF' + [encabezados, ...filas].map(fila => fila.map(csv).join(';')).join('\r\n') + '\r\n', 'utf8');
  console.log('Lugares activos en API: ' + activos.length);
  console.log('Fotos ya incluidas en assets/lugares: ' + empaquetadas);
  console.log('Sin URL en la API: ' + sinUrl);
  console.log('Pendientes de foto empaquetada: ' + (activos.length - empaquetadas));
  console.log('Reporte CSV: ' + ruta);
  console.log('El reporte comprueba referencias, NO la disponibilidad/calidad de URL externas.');
  console.log('Para auditar la API: npm run api:imagenes -- ' + base);
  console.log('Para incorporar fotos autorizadas: npm run fotos:instalar -- "C:\\Mis fotos Colon"');
} catch (error) {
  console.error('No se pudo generar el reporte:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
