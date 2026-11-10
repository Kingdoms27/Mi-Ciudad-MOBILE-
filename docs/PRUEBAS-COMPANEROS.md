# Mi Ciudad Colón — prueba compartida con compañeros (Android + iPhone)

Actualizado: 9 de noviembre de 2026. Proyecto: Expo SDK 57.
**No** migrar SDK ni modificar el mapa solamente para resolver fotografías.
Código principal: https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-

## Regla de la entrega

Las imágenes de cada lugar deben venir del **backend de la cátedra**
(GET /lugares -> imagenes[] -> GET /archivos/...).
Las 7 fotografías empaquetadas sirven exclusivamente como respaldo visual,
**no demuestran** que la API haya servido una imagen. Algunas semillas del
profesor pueden reutilizar imágenes o no tener URL: se deben identificar y
corregir en el backend, sin atribuir fotografías falsas a establecimientos.

## Etapa 1 — Comprobar API e imágenes desde la computadora

**Terminal A**, en Mi-Ciudad-MOBILE-:
\`\`\`powershell
git pull --ff-only origin main
npm run api:iniciar:win
\`\`\`

Dejar la API encendida.

**Terminal B**, en la misma carpeta:
\`\`\`powershell
npm run api:diagnosticar:win
npm run api:fotos:grupo -- http://localhost:3000
\`\`\`

Este diagnóstico lee /salud, /lugares y todos los medios de imagen, verifica
cabecera y primeros bytes de la imagen, muestra HTTP 403/404, señala fotos
repetidas y crea reportes/diagnostico-imagenes-api.json.
No modifica SQLite ni datos de la API.

- URL válida + imagen correcta: puede mostrarse en Android/iPhone si tienen
  acceso a **ese mismo servidor**.
- 403, 404 o URL inválida: el problema está en servir el archivo, permisos
  o rutas de la API; no en el mapa.
- Misma imagen para fichas distintas: se debe corregir la semilla/asignación
  de imágenes. HTTP 200 no significa foto auténtica.
- Sin URL: no existe un archivo de la API que el móvil pueda mostrar.

**No dar por aprobado el requisito de 27 fotografías sin revisar el
resultado:** el último diagnóstico conocía 27 registros, 26 activos.
El informe distingue ambos números.

## Etapa 2A — Todos en la misma Wi-Fi, Android

Con la API abierta en Terminal A:
\`\`\`powershell
npm run api:conectar:win
\`\`\`

El comando configura EXPO_PUBLIC_API_URL con la IP LAN y abre Expo Go.
Cada compañero con Android instala **Expo Go compatible con SDK 57**
desde https://expo.dev/go y escanea el QR.

Todos deben estar en la misma red Wi-Fi que la PC que ejecuta NestJS. Un
túnel de Expo **no** convierte la dirección privada del backend en pública.

## Etapa 2B — Compañeros Android desde casas/redes diferentes

Necesitás desplegar **el backend de la cátedra** en una URL HTTPS accesible
por todos, conservando su base de datos y almacenamiento de archivos. La
versión del ZIP tiene un render.yaml que utiliza Render + Supabase y necesita
configurar credenciales seguras en el hosting. No publicar secretos, la DB
local ni el código del profesor en un repositorio público sin autorización.

Antes de compartir Expo, abrir desde el teléfono real:
- https://TU-API/salud
- https://TU-API/lugares?porPagina=500
- alguna URL de /archivos devuelta por el catálogo.

Repetir el diagnóstico sobre esa URL:
\`\`\`powershell
npm run api:fotos:grupo -- https://TU-API
\`\`\`

Configurar EXPO_PUBLIC_API_URL=https://TU-API en el archivo .env.local
sin borrar otras variables y **reiniciar Metro**. Después:
\`\`\`powershell
npx expo start --clear --tunnel --go
\`\`\`

El QR permite acceder a Metro a distancia, pero no reemplaza la API HTTPS.
Compartir solo el QR y la URL pública cuando el diagnóstico sea correcto.

## Etapa 2C — Giovanni Percara y demás compañeros con iPhone físico

**No prometer acceso directo con Expo Go de App Store**: Expo confirma que
la versión de App Store se queda en SDK 54, mientras este proyecto es SDK 57.

Ruta principal: generar una **build iOS de prueba** firmada mediante
Apple Developer y EAS preview (ad hoc, dispositivo registrado) o TestFlight.
Instrucciones y pasos de firma:
[PRUEBA-IOS-GIOVANNI.md](PRUEBA-IOS-GIOVANNI.md).

Con Apple Developer y la API de prueba HTTPS configurados:
\`\`\`powershell
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
\`\`\`

El enlace de instalación se obtiene **solo tras completar el build**.
Una alternativa con Mac y Xcode permite una instalación local de desarrollo,
pero no crea por sí sola un enlace de distribución desde Windows.

## Checklist de cada compañero

- [ ] Confirmar dispositivo, Android/iPhone, versión y red (misma Wi-Fi/remota).
- [ ] Abrir Inicio, Lugares, Mapa, Agenda, Recorrido y Cuenta.
- [ ] Comprobar que tarjetas y detalle muestran **imágenes de la API**.
- [ ] Anotar ID/nombre del lugar y captura si imagen falta, se repite o es incorrecta.
- [ ] Confirmar que mapa, marcadores y GPS siguen funcionando como antes.
- [ ] Probar permisos rechazados, orientación, QR y registro de visitas.
- [ ] Informar si el error ocurre solo en Wi-Fi, solo en datos móviles o en ambos.

## Datos mínimos para reportar un error

Dispositivo y versión OS; red Wi-Fi/datos; módulo y nombre/ID de lugar;
captura de error o código HTTP, fecha aproximada.
**No** compartir claves, JWT, contraseñas ni archivos .env.

Documentación:
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- https://docs.expo.dev/more/expo-cli/
- https://docs.expo.dev/build/internal-distribution/
