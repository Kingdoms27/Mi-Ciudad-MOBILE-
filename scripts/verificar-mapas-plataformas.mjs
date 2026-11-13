/**
 * Verificación estática (no reemplaza pruebas en dispositivo) para
 * la pantalla de mapas de Mi Ciudad: Android + iOS.
 * Uso: npm run mapas:check
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const leer = async nombre => readFile(new URL('../' + nombre, import.meta.url), 'utf8');
const resultados = [];
let errores = 0;

function verificar(nombre, condicion, detalle = '') {
  const ok = Boolean(condicion);
  resultados.push((ok ? '[OK] ' : '[ERROR] ') + nombre + (detalle ? ': ' + detalle : ''));
  if (!ok) errores++;
}

try {
  const pantalla = await leer('app/(tabs)/mapa.tsx');
  const leaflet = await leer('src/componentes/MapaLeaflet.tsx');
  const app = JSON.parse(await leer('app.json'));
  const pkg = JSON.parse(await leer('package.json'));
  const cfg = await leer('app.config.js');

  verificar('SDK de mapas nativo instalado', Boolean(pkg.dependencies?.['react-native-maps']));
  verificar('Vista de mapa iOS habilitada', /Platform\.OS\s*===\s*'ios'/.test(pantalla));
  verificar('iOS usa Apple Maps, no Google como proveedor', /provider=\{Platform\.OS\s*===\s*'android'\s*\?\s*PROVIDER_GOOGLE\s*:\s*undefined\}/.test(pantalla));
  verificar('Android dispone de alternativa OpenStreetMap', pantalla.includes('MapaLeaflet') && pantalla.includes('androidNativeMapsEnabled'));
  verificar('Clave Google limitada al SDK Android', cfg.includes('GOOGLE_MAPS_ANDROID_API_KEY') && cfg.includes('androidGoogleMapsApiKey') && !cfg.includes('iosGoogleMapsApiKey'));
  verificar('iOS declara permiso de ubicación', Boolean(app.expo?.ios?.infoPlist?.NSLocationWhenInUseUsageDescription));
  verificar('Android declara permisos de ubicación', (app.expo?.android?.permissions ?? []).includes('android.permission.ACCESS_FINE_LOCATION'));
  verificar('GPS opcional y mapa visible sin permiso', pantalla.includes("setPermiso('negado')") && pantalla.includes('Ubicación desactivada'));
  verificar('Marcadores filtrados por coordenadas válidas', pantalla.includes('coordenadasValidas(l)'));
  verificar('Selección de marcador abre la ficha correcta', pantalla.includes("pathname:'/lugar/[id]'") && pantalla.includes('params:{id:seleccion.id}'));
  verificar('Mapa WebView sincroniza GPS sin recrear sus tiles', leaflet.includes('__miCiudadSetUser') && leaflet.includes('},[lugares,oscuro]);'));
  verificar('Mapa WebView mantiene atribución OpenStreetMap', leaflet.includes('© OpenStreetMap contributors'));

  console.log('\nMI CIUDAD COLÓN — MAPAS ANDROID + IOS (CHEQUEOS ESTÁTICOS)');
  for (const linea of resultados) console.log(linea);
  console.log('\nResultado: ' + errores + ' error(es).');
  console.log('Pendiente siempre: probar mapa, GPS, marcadores, filtros y redes en Android y en iPhone.');
  if (errores) process.exitCode = 1;
} catch (e) {
  console.error('No se pudo revisar el proyecto:', e instanceof Error ? e.message : String(e));
  process.exitCode = 1;
}
