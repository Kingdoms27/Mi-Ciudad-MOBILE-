// Auditoría no destructiva de medios servidos por la API oficial.
// Uso: npm run api:imagenes -- http://localhost:3000
// Revisa catálogo y agenda, contenido de imagen, URLs locales y cobertura.
const BASE = (process.argv[2] || process.env.API_URL || '').trim().replace(/\/+$/, '');
if (!/^https?:\/\//i.test(BASE)) {
  console.error('Uso: npm run api:imagenes -- http://localhost:3000');
  process.exit(2);
}

function urlParaDispositivo(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  // El backend puede devolver localhost, que no sirve desde el celular.
  const local = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?(\/archivos\/.*)$/i);
  if (local) return BASE + local[1];
  if (url.startsWith('/archivos/')) return BASE + url;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

async function obtener(ruta) {
  const respuesta = await fetch(BASE + ruta, {signal: AbortSignal.timeout(15000)});
  if (!respuesta.ok) throw new Error(`GET ${ruta}: HTTP ${respuesta.status}`);
  const data = await respuesta.json();
  if (!data || !Array.isArray(data.datos)) {
    throw new Error(`GET ${ruta}: se esperaba datos[] según el contrato docente`);
  }
  return data;
}

async function listar(ruta, porPagina) {
  const items = [];
  for (let pagina = 1; pagina <= 30; pagina++) {
    const sep = ruta.includes('?') ? '&' : '?';
    const resultado = await obtener(`${ruta}${sep}pagina=${pagina}&porPagina=${porPagina}`);
    items.push(...resultado.datos);
    if (items.length >= resultado.meta?.total || resultado.datos.length === 0) return items;
  }
  throw new Error(`Demasiadas páginas de ${ruta}`);
}

async function comprobarImagen(url) {
  const destino = urlParaDispositivo(url);
  if (!destino) return {ok:false, motivo:'URL vacía o inválida', destino};
  const realizar = async (method) => {
    const res = await fetch(destino, {
      method,
      headers: method === 'GET' ? {Range:'bytes=0-1023'} : {},
      signal: AbortSignal.timeout(12000),
    });
    const tipo = res.headers.get('content-type') || '';
    const estado = res.status;
    await res.body?.cancel().catch(() => {});
    return {ok:res.ok && /^image\/(?:jpeg|png|webp|gif|avif)$/i.test(tipo.split(';')[0].trim()),
      motivo:`HTTP ${estado} · ${tipo || 'sin Content-Type'}`, destino};
  };
  try {
    let r = await realizar('HEAD');
    // Algunos servidores oficiales no implementan HEAD o no declaran tipo.
    if (!r.ok) r = await realizar('GET');
    return r;
  } catch (error) {
    return {ok:false,motivo:error instanceof Error ? error.message : String(error),destino};
  }
}

try {
  const [lugares,eventos] = await Promise.all([
    listar('/lugares', 500),
    listar('/eventos', 100),
  ]);
  const registros = [
    ...lugares.map(lugar => ({tipo:'Lugar',nombre:lugar.nombre,urls:Array.isArray(lugar.imagenes)?lugar.imagenes:[]})),
    ...eventos.map(evento => ({tipo:'Evento',nombre:evento.titulo,urls:evento.imagenUrl?[evento.imagenUrl]:[]})),
  ];
  // Solo se descarga la cabecera / primer tramo. Evita descargar 100 fotos enteras.
  const unicas = [...new Set(registros.flatMap(item => item.urls).filter(Boolean))];
  const resultados = new Map();
  let proximo = 0;
  async function trabajador() {
    while (proximo < unicas.length) {
      const url = unicas[proximo++];
      resultados.set(url,await comprobarImagen(url));
    }
  }
  await Promise.all(Array.from({length:Math.min(5,unicas.length)},()=>trabajador()));

  const sinFoto = registros.filter(x=>x.urls.length===0);
  const fallas = registros.filter(x=>x.urls.length>0&&!x.urls.some(url=>resultados.get(url)?.ok));
  const conFoto = registros.length-sinFoto.length-fallas.length;
  console.log(`API: ${BASE}`);
  console.log(`Contenido: ${lugares.length} lugares y ${eventos.length} eventos`);
  console.log(`Medios: ${unicas.length} URLs únicas comprobadas`);
  console.log(`Imágenes válidas: ${conFoto}/${registros.length} fichas`);
  console.log(`Sin URL: ${sinFoto.length} fichas; URLs inválidas: ${fallas.length} fichas`);

  for (const item of [...sinFoto,...fallas].slice(0,45)) {
    const ultimo = item.urls[0] && resultados.get(item.urls[0]);
    console.log(`- [${item.tipo}] ${item.nombre}: ${ultimo?.motivo || 'sin imagen'}`);
    if (ultimo?.destino) console.log(`  ${ultimo.destino}`);
  }
  const locales = unicas.filter(url=>/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::|\/)/i.test(url));
  if (locales.length) console.log(`ATENCIÓN: ${locales.length} URL(s) usan localhost; comprobar que EXPO_PUBLIC_API_URL apunte a la IP LAN o HTTPS pública.`);
  console.log('Nota: una imagen válida puede ser una ilustración de semilla; esta auditoría no certifica autenticidad ni licencia de fotografías.');
  if (fallas.length || sinFoto.length) process.exitCode=1;
} catch(error) {
  console.error('Auditoría no completada:',error instanceof Error?error.message:String(error));
  process.exitCode=1;
}
