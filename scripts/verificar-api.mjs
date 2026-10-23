// Comprobación no destructiva de los endpoints del contrato de api-mi-ciudad.
const base = (process.argv[2] || process.env.API_URL || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Uso: npm run api:check -- http://localhost:3000');
  process.exit(2);
}

const pasos = [];
async function peticion(nombre, ruta, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + ruta, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(12000),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || !('datos' in json)) {
    throw new Error(`${nombre}: HTTP ${res.status}, ${json?.error?.codigo ?? 'respuesta inválida'}`);
  }
  pasos.push(`OK ${nombre} (HTTP ${res.status})`);
  return json.datos;
}

try {
  await peticion('salud', '/salud');
  const categorias = await peticion('categorías', '/categorias');
  const lugares = await peticion('catálogo offline', '/lugares?porPagina=500&actualizadoDesde=2000-01-01T00%3A00%3A00-03%3A00');
  const eventos = await peticion('agenda', '/eventos?porPagina=100');
  await peticion('QR', '/lugares/qr/' + encodeURIComponent('COLON:lug-004'));
  const sesion = await peticion('ingreso', '/auth/ingreso', {
    method: 'POST',
    body: { email: 'lucia@mail.com', contrasena: 'lucia1234' },
  });
  await peticion('perfil', '/yo', { token: sesion.token });
  await peticion('favoritos', '/yo/favoritos?porPagina=100', { token: sesion.token });
  await peticion('eventos guardados', '/yo/eventos-guardados?porPagina=100', { token: sesion.token });
  await peticion('visitas', '/yo/visitas?porPagina=500', { token: sesion.token });
  console.log(pasos.join('\n'));
  console.log(`Contrato verificado: ${categorias.length} categorías, ${lugares.length} lugares, ${eventos.length} eventos.`);
} catch (error) {
  console.error(pasos.join('\n'));
  console.error('API no verificada:', error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
