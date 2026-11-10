# Mi Ciudad Colón — Trabajo Final Integrador Mobile

Aplicación móvil de guía turística para **Colón, Entre Ríos**, desarrollada para **Desarrollo para Móviles 2026** con React Native, Expo, TypeScript y Expo Router.

La implementación sigue el PRD *Mi Ciudad — Guía turística de Colón*. El ZIP de la cátedra ya incluye el contrato oficial y el backend; cuando no hay URL de servidor configurada, se utilizan mocks tipados. Cuando se configura `EXPO_PUBLIC_API_URL`, los servicios consultan la API y usan la última caché válida como respaldo; un error remoto no debe reemplazar datos remotos guardados por mocks.

## Funcionalidades

- Catálogo de lugares con búsqueda, categorías, horarios, precio y accesibilidad.
- Orden por distancia cuando el usuario concede ubicación.
- Mapa con marcadores, ubicación actual, filtros y lista de lugares cercanos.
- Detalle de lugar con dirección, teléfono, sitio web, favoritos y apertura de rutas externas.
- Agenda de eventos con detalle, guardado y recordatorios locales sujetos a permisos y fechas válidas.
- Registro e ingreso local de demostración con sesión persistente.
- Token de sesión en `expo-secure-store`; las credenciales de cuentas registradas en modo demo también se guardan allí.
- Reingreso biométrico con `expo-local-authentication` y alternativa para salir y volver al formulario de ingreso.
- Favoritos y visitas persistidos localmente.
- Recorrido por QR, GPS o registro manual, con cámara/galería, fotos y notas.
- Persistencia de fotos con la API actual de `expo-file-system` (`File`, `Directory`, `Paths`).
- Audio con controles visibles y soporte de reproducción en segundo plano. Las pistas SoundHelix actuales están identificadas en pantalla como **audio de demostración**, no como grabaciones oficiales de Turismo Colón.
- Descarga local de audio para uso sin conexión.
- Brújula/flecha de orientación con magnetómetro y háptica.
- SQLite para visitas, favoritos y eventos guardados.
- `expo-sqlite/kv-store` para preferencias y caché, y `expo-network` para detectar cambios de conectividad.
- Catálogo y agenda disponibles con mocks o con la última respuesta remota cacheada, según configuración y conexión.
- Cola de visitas pendientes: sólo se marcan como sincronizadas después de una respuesta satisfactoria de la API. Sin URL de API, la app informa que siguen guardadas en el teléfono.
- Tema claro, oscuro o sistema, estados de carga/vacío/error, ícono y splash propios.

## Estructura

```text
app/                         Pantallas y navegación con Expo Router
src/componentes/             Componentes reutilizables
src/contexto/                Sesión y tema
src/hooks/                   Hooks del dispositivo/red
src/mocks/                   Datos simulados tipados
src/servicios/               API, caché, auth, DB, archivos, notificaciones y sync
src/tema/                    Paletas claro/oscuro
src/tipos/                   Contratos TypeScript del PRD
src/utilidades/              Distancia, rumbo y formatos
docs/                        Mapeo, decisiones, pruebas y defensa
```

## Requisitos de entorno

- Node.js 22.13 o superior.
- Expo SDK 57 (React Native 0.86.3).
- Teléfono Android/iPhone para probar cámara, GPS, biometría, notificaciones y sensores.
- Cuenta de Expo para vincular el proyecto y generar builds con EAS.

## Probar iPhone — Giovanni Percara (Expo SDK 57)

La prueba en el iPhone de Giovanni se documenta en
[docs/PRUEBA-IOS-GIOVANNI.md](docs/PRUEBA-IOS-GIOVANNI.md).

**Importante:** Expo Go para iPhone físico no se instala igual que en
Android cuando el proyecto está en SDK 57. Una prueba nativa sin cambiar
el SDK requiere Apple Developer activo y distribución EAS iOS (por
ejemplo, `preview` *ad hoc* con el iPhone de Giovanni registrado).
No crear un build con `EXPO_PUBLIC_API_URL=localhost`: el iPhone debe
acceder al backend docente y a `/archivos/`. Si el tester está fuera de
tu Wi-Fi, usar una API HTTPS accesible públicamente.

El proyecto, el mapa y las imágenes de la API no necesitan migrarse a
SDK 58 para hacer esa prueba.

## Pruebas compartidas con compañeros

Ver [la guía de Android/iPhone y diagnóstico de imágenes de la API](docs/PRUEBAS-COMPANEROS.md).

Cuando el servidor del profesor esté encendido, verificá **cada** imagen
antes de compartir Expo Go:

```powershell
npm run api:fotos:grupo -- http://localhost:3000
```

Genera un reporte de solo lectura, detecta HTTP 403/404, medios ausentes y
fotos repetidas. Si los compañeros están en otra red, primero es necesario
un backend HTTPS accesible: el QR/túnel de Expo comparte Metro, no la API.

## Ejecutar

```bash
npm install
npx expo install --check
npm run typecheck
npx expo start --tunnel
```

Escanear el QR con Expo Go. La app objetivo es móvil; la versión Web no forma parte de la entrega y el módulo nativo `react-native-maps` no se ejecuta en navegador.

## Cuenta de demostración

Mientras se usa el servicio mock:

```text
Email: lucia@mail.com
Contraseña: lucia1234
```

Esta cuenta está reservada para la demo. El formulario de registro contra la API exige contraseñas de al menos ocho caracteres. En el modo mock, el registro crea cuentas locales para probar el flujo; no equivale a una autenticación contra un servidor. Cada cuenta registrada debe volver a ingresar con la misma contraseña. La autenticación real y la sincronización entre dispositivos dependen de la API de la cátedra.

## API oficial disponible en el ZIP de la cátedra

El paquete `api-proyectos-mobile-main.zip` incluye `api-mi-ciudad/`, una API NestJS con el contrato oficial de Mi Ciudad. Ya se integraron sus recursos en `src/servicios/`:

- `POST /auth/registro`, `POST /auth/ingreso`, `GET /yo`, `PATCH /yo`.
- `GET /categorias`, `GET /lugares?porPagina=500&actualizadoDesde=...`, `GET /lugares/:id`, `GET /lugares/qr/:codigo`.
- `GET /eventos?porPagina=100`, `GET /eventos/:id`.
- `GET/PUT/DELETE /yo/favoritos`, `GET/PUT/DELETE /yo/eventos-guardados`.
- `GET/POST/PATCH /yo/visitas`; si una visita tiene foto local, primero `POST /archivos` con `multipart/form-data`.
- `POST/DELETE /dispositivos` y `POST /dispositivos/prueba` (el backend entregado tiene esta sección marcada como `NO_IMPLEMENTADO`).
- `PATCH /eventos/:id/estado` (reservado a cuentas administradoras, para pruebas del flujo de cambios).
- Listas paginadas, actualización incremental del catálogo con `actualizadoDesde`, y traducción de URL de archivos local al origen accesible desde el teléfono.

**No confundir el código fuente con una API disponible en Internet.** Hasta ejecutar `api-mi-ciudad` o desplegarla, no hay servidor al que conectarse. La aplicación utiliza mocks locales únicamente cuando `EXPO_PUBLIC_API_URL` no está configurada.

### Ejecutar el backend en Windows sin Docker

**Es la opción recomendada en Windows.** El backend oficial requiere Node.js 24 o superior y el ZIP `api-proyectos-mobile-main.zip` de la cátedra. No necesitás Docker, WSL ni instalar PostgreSQL.

Abrí PowerShell dentro de `Mi-Ciudad-MOBILE-` y ejecutá:

```powershell
node --version
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1
```

El script busca automáticamente el ZIP en Descargas, Escritorio o la carpeta de la app, y extrae el backend a `%LOCALAPPDATA%\MiCiudadColon\backend`. Instala las dependencias con pnpm, inicia SQLite con los datos de prueba si está vacía y levanta la API en el puerto 3000. **No borra una base existente.** Dejá abierta esa terminal.

Si el ZIP está en otra carpeta, podés indicar su ubicación:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1 -ZipPath "C:\ruta\api-proyectos-mobile-main.zip"
```

Si ya lo descomprimiste, también acepta la ruta de la API:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1 -ApiPath "C:\ruta\api-mi-ciudad"
```

Si `node --version` indica v22 o anterior, instalá Node.js 24 y volvé a abrir VS Code. El teléfono necesita la IP LAN real de la PC para conectarse con la API local.

### Prueba completa en iPhone o Android (sin Docker)

Con Node.js 24 y el ZIP `api-proyectos-mobile-main.zip` descargado:

**Requisito previo:** instalá Node.js 24 (la API lo exige), y conservá el ZIP original del profesor en `Descargas`. No necesitás Docker. La conexión verifica que la API devuelva el catálogo y al menos una foto accesible desde la IP LAN antes de cambiar `.env` o `.env.local`.

**Terminal 1**, desde la carpeta `Mi-Ciudad-MOBILE-`:

```powershell
npm run api:iniciar:win
```

Dejá esta terminal abierta cuando aparezca **API escuchando**.

**Terminal 2**, desde la misma carpeta:

```powershell
npm run api:check -- http://localhost:3000
npm run api:conectar:win
```

El último comando verifica la API en `localhost` y en la IP LAN de Windows, comprueba el catálogo y una fotografía real de respuesta, configura `EXPO_PUBLIC_API_URL` en `.env` o `.env.local` (si existe, por su prioridad) y abre Expo Go en modo LAN. Escaneá el QR con el teléfono conectado a la **misma red** que la computadora.

Si hay varias IPs, el script pedirá que especifiques una. Obtenela con `ipconfig` y repetí con `-PcIp`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\conectar-app-windows.ps1 -PcIp 192.168.1.10
```

Reemplazá la IP de ejemplo por la real. Si falla el chequeo LAN, verificá que Windows permita Node.js en el firewall para **redes privadas**; no abras ese puerto a Internet.

**Los medios de demostración que trae el backend son generados:** las imágenes sirven para verificar descargas y las audioguías MP3 de semilla pueden ser silenciosas. No deben presentarse como fotografías o narraciones oficiales de la ciudad. La portada de Inicio es un asset de la aplicación independiente de la API.

**Importante:** usar Metro por `--tunnel` no hace pública la API. Para compañeros en otras redes y un APK final conectado necesitarás un backend desplegado con HTTPS.

Alternativamente, para levantar la API en la PC con Docker Desktop abierto:

```powershell
# Desde la carpeta descomprimida del ZIP
cd .\api-proyectos-mobile-main\api-mi-ciudad
docker compose up
```

Verificar `http://localhost:3000/salud` desde la PC.

Con la API funcionando en la PC, ejecutá este chequeo no destructivo del contrato:

```powershell
npm run api:check -- http://localhost:3000
```

Valida salud, catálogo, agenda, QR, ingreso, perfil, favoritos, eventos guardados y visitas sin crear ni borrar datos. Para Expo Go en un teléfono de la **misma Wi-Fi**, usar la IP LAN de la PC, no `localhost`:

```env
EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
```

La IP es un ejemplo: obtener la dirección real con `ipconfig` y comprobar `http://IP:3000/salud` desde el navegador del teléfono. Crear el archivo `.env` en la **carpeta de la app**, no dentro del backend, y reiniciar Metro con `npx expo start --clear --lan`.

Para compartir la app con compañeros fuera de la red o instalar un APK usable en otros lugares, hay que desplegar el backend y establecer una URL pública HTTPS antes del build EAS. El repositorio de la API incluye `render.yaml` e instrucciones Render + Supabase para esa opción. `--tunnel` resuelve la conexión a Metro, pero **no** expone la API local automáticamente.

Usuarios que siembra la API de la cátedra:

| Email | Contraseña | Uso |
|---|---|---|
| `lucia@mail.com` | `lucia1234` | Favoritos, visitas y evento guardado de muestra |
| `nuevo@demo.ar` | `nuevo1234` | Cuenta vacía para probar estados |
| `turismo@colon.demo.ar` | `turismo1234` | Rol administrador para cambiar estados de eventos |

Cuando la API está configurada, la app envía `contrasena` al registro/ingreso, mantiene el token Bearer en SecureStore y obtiene el usuario desde `GET /yo`. El login demo local sólo se utiliza sin URL API.

## API de la cátedra

Copiar `.env.example` como `.env` cuando se entregue la URL:

```env
EXPO_PUBLIC_API_URL=https://...
```

Las pantallas no importan mocks directamente. Los servicios asíncronos de `src/servicios/` implementan el contrato recibido, incluidas rutas de autenticación, perfil, favoritos, agenda, QR, imágenes y visitas. La URL se configura en tiempo de compilación con `EXPO_PUBLIC_API_URL`. Sólo se marca una visita como sincronizada después de la confirmación del servidor.

Horarios, tarifas, agenda de ejemplo y pistas de audio de demostración deben tratarse como contenido de prueba hasta que se reemplacen por información oficial.

## Imágenes de la API oficial de la cátedra — Expo Go

Cuando `EXPO_PUBLIC_API_URL` está configurada, las fichas usan **las
imágenes originales de `GET /lugares`**, con el mismo orden de la API.
Las fotos de Wikimedia/locales NO se anteponen. Sólo aparecen como respaldo
si el archivo de la API no está disponible, o cuando el lugar no tiene URL.

La aplicación también transforma las URL de `/archivos/...` que el
backend genera con `localhost` o una IP LAN antigua para que apunten al
origen actual de Expo Go (mismo servidor que `EXPO_PUBLIC_API_URL`).
El catálogo se consulta completo y usa una versión de caché nueva, para
no conservar imágenes que antes se mezclaban con mocks externos.

Para probar imágenes **servidas por la API**, iniciá NestJS
(`npm run api:iniciar:win`) y, desde otra terminal:

```powershell
npm run api:imagenes -- http://localhost:3000
```

El informe muestra cuántos lugares devuelve la cátedra, cuáles tienen
una URL válida, qué archivos se reutilizan y cuáles no existen. Una imagen
compartida entre varios lugares puede ser correcta técnicamente, pero
**no es una foto distinta por lugar**. Si la API devuelve la misma imagen
para 18 fichas o falta la foto de un lugar, hay que corregir el catálogo
o los medios **en el backend docente**; no se arregla cambiando el mapa.

Para abrir Expo Go como antes, dejá la API encendida y en otra terminal
ejecutá `npm run api:conectar:win` (teléfono y PC en la misma Wi-Fi).
Reiniciá Expo/Metro si estaba abierto; no hace falta modificar SQLite,
eventos, Google Maps ni EAS para probar fotografías.

## Fotografías y nueva portada

- **Portada:** usar la fotografía original de Colón, optimizada en alta definición como `assets/hero-colon.jpg`. La portada es un archivo local y se muestra sin conexión. No convertir a capturas pequeñas ni aumentar artificialmente la resolución. Reemplazar el archivo existente con el JPEG optimizado proporcionado junto con esta actualización.
- **Fotos de lugares:** el catálogo, los nombres, los IDs y sus datos provienen de la API oficial cuando `EXPO_PUBLIC_API_URL` está definida; para los lugares que tienen una foto turística documentada se prioriza esa foto y se conserva el archivo del docente como respaldo. No confundir ilustraciones de semillas con fotografías reales.
- **Fotos de eventos:** se leen de `imagenUrl` en la API y se guardan localmente después de una descarga correcta; los eventos sin medios muestran un respaldo identificado, sin inventar una fotografía.
- **Caché:** una foto dañada deja de ser reutilizada en siguientes sesiones. Sin conexión se usa la última copia válida que exista.
- **Auditoría:** con la API iniciada ejecutar:

```powershell
npm run api:check -- http://localhost:3000
npm run api:imagenes -- http://localhost:3000
```

La segunda prueba recorre todas las páginas de lugares y eventos y revisa las URLs declaradas, los códigos HTTP y el tipo MIME. **No garantiza** que la foto represente el lugar ni que tenga licencia de uso: eso debe comprobarse con cada fuente. Si faltan fotos auténticas, deben aportarse medios autorizados o usarse los respaldos debidamente identificados. La auditoría no modifica ni borra los datos del servidor.

## Diagnóstico automático del backend docente (Windows)

Si la API responde correctamente pero `GET /eventos` devuelve cero fichas,
podés inspeccionar la copia **ya extraída** del ZIP del profesor sin volver
a descargarlo ni reiniciar la base:

```powershell
npm run api:diagnosticar:win
```

El comando busca `api-mi-ciudad` dentro de
`%LOCALAPPDATA%\MiCiudadColon\backend` y en ubicaciones conocidas,
muestra rutas de archivos de semillas/eventos, nombres de variables de
`.env.example`, existencia de `render.yaml`, y resultados de
`GET /salud`, `GET /lugares` y `GET /eventos`. No muestra
valores de `.env`, no copia secretos y **no modifica datos**.

Si la API está en otra carpeta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\diagnosticar-backend-windows.ps1 -ApiPath "C:\ruta\api-mi-ciudad"
```

Con la salida podremos investigar filtros/semillas y después preparar el
despliegue HTTPS del backend, sin asumir que el ZIP esté publicado en GitHub.

## Recuperar la agenda de demostración sin borrar SQLite

Cuando los ocho eventos iniciales están en el pasado, `GET /eventos`
devuelve cero porque por contrato solo lista eventos desde hoy. Se creó
una herramienta de **dos fases** para recuperar los ocho registros demo,
preservando IDs, estados, relaciones, favoritos, usuarios y visitas:

**Fase 1 (solo lectura):**

```powershell
npm run eventos:reprogramar:demo
```

Muestra la base de datos detectada, los ocho eventos de semilla
`evt-017` a `evt-024`, el desplazamiento de días y las fechas
resultantes. Por seguridad, solo actúa sobre **una base SQLite local** que
contiene exactamente los ocho IDs esperados y ninguno adicional.
Si no encuentra una ruta SQLite única, permite especificarla con
`node scripts/reprogramar-eventos-demo.mjs --db "C:\ruta\api.sqlite"`.
Nunca opera sobre un proveedor remoto.

**Fase 2 (escritura, solo si la simulación es correcta):**

1. Detener primero el backend con `Ctrl+C` en la terminal donde se ejecuta NestJS.
2. Ejecutar `npm run eventos:reprogramar:demo -- --aplicar`.
3. El script comprueba que el servidor no responda en `localhost:3000`,
   genera un respaldo SQLite completo en
   `%LOCALAPPDATA%\MiCiudadColon\respaldos` y luego mueve de forma
   transaccional `inicio`, `fin` y `finEfectivo` de los ocho eventos
   a fechas futuras, conservando sus horas, IDs y estados.
4. Volver a iniciar la API y ejecutar `npm run api:diagnosticar:win`.

Se elige mañana como fecha de base para que los eventos del ejemplo
queden disponibles incluso si la reparación se ejecuta por la noche.
La muestra `evt-024` permanece histórica, para probar `finalizado`.
**No ejecuta `db:reiniciar`**. Si aparece cualquier estructura distinta,
dato modificado o falta el respaldo, cancela la escritura.

Es una corrección puntual para las semillas docentes, no una función
de programación de eventos reales. Los datos de demostración se volverán
a vencer con el tiempo; no reprogramar eventos reales.

## Fotografías reales verificadas (sin descargarlas a mano)

Para incorporar un lote inicial de **siete lugares reconocibles** de
Wikimedia Commons y empaquetarlas dentro de Expo, con fuentes y licencias
documentadas en `docs/CREDITOS-FOTOS-COMMONS.md`:

```powershell
npm run fotos:commons
```

El script consulta la API de Wikimedia Commons, descarga sólo archivos
JPEG válidos en `assets/lugares/` y reconstruye automáticamente
`src/servicios/fotosLocales.ts`. Si ya hay una fotografía propia con
ese nombre, **no la reemplaza**. Si Wikimedia devuelve 403/429 o falla la
red, identifica los lugares pendientes sin poner datos inválidos en Metro.
Es un lote inicial, **no afirma resolver los 26 lugares**; especialmente
no inventa imágenes para comercios sin una fotografía documentada.

Después de incorporarlas, reiniciá Expo Go:

```powershell
npx expo start --clear
```

No modifica la portada HD, la base de datos ni las demás pantallas.
Conservar `assets/lugares` y los créditos al publicar la aplicación.

## Por qué pueden desaparecer los eventos de demostración

En `api-mi-ciudad`, `GET /eventos` consulta **desde el día actual**
salvo que se indique `fecha` o `desde`. El archivo
`src/seeds/data/events.ts` contiene ocho eventos relativos al día de la
siembra inicial, y `src/seeds/seed.ts` solo detecta una base totalmente
vacía según el conteo de usuarios. Por eso los datos pueden seguir en SQLite
aunque la Agenda muestre cero eventos después de unos días.

**Diagnóstico sin escribir en la base:**

```powershell
npm run api:diagnosticar:win
```

El comando ahora compara los próximos eventos con
`GET /eventos?desde=2020-01-01&porPagina=100` y enumera algunas fechas de
los registros históricos. Si aparecen eventos antiguos, no es un error de
Expo ni implica que se hayan borrado: hace falta decidir cómo actualizar
**solo datos de demostración**, con respaldo previo, respetando el contrato
"desde hoy". No usar `db:reiniciar` para reparar esta situación.

## Agenda vacía con API configurada

Si `npm run api:imagenes -- http://localhost:3000` muestra **0 eventos**,
significa que la respuesta actual de `GET /eventos` no contiene fichas de
agenda. La app **no reemplaza silenciosamente datos del profesor por eventos
mock**: informa que la agenda remota está vacía y permite reintentar.

Comprobación no destructiva:

```powershell
npm run api:check -- http://localhost:3000
Invoke-RestMethod "http://localhost:3000/eventos?porPagina=100" | ConvertTo-Json -Depth 5
```

El chequeo ahora avisa claramente si `/eventos` respondió 200 sin resultados.
La causa exacta (semillas, ausencia de eventos o filtro por fechas) debe
confirmarse en el backend docente. No ejecutar reinicios destructivos de la
base solo para rellenar la agenda.

## Comprobar requisitos de preentrega

La verificación local **no modifica archivos ni datos** y revisa la portada
JPEG, el manifiesto de fotografías locales, el lockfile, el perfil APK de
EAS y la URL configurada para la API.

```powershell
npm run entrega:check
```

Antes de generar un APK que se vaya a utilizar **fuera de tu Wi-Fi**:

```powershell
npm run entrega:check -- --apk
npm run typecheck
npm run api:check -- http://localhost:3000
```

El modo `--apk` considera bloqueante usar `localhost`, una IP de red privada
o HTTP público para `EXPO_PUBLIC_API_URL`, porque la app debe poder
conectarse a un backend público HTTPS. Esto **no** prueba que el backend sea
accesible ni que el usuario tenga permiso para publicarlo: esas verificaciones
se hacen por separado. Que falten fotos locales se informa como aviso y la app
mantiene sus respaldos. El script no modifica la configuración ni inicia EAS.

### Configuración de la API para el APK remoto (EAS preview)

El perfil `preview` de `eas.json` utiliza explícitamente el entorno
`preview` de EAS Build. La variable `EXPO_PUBLIC_API_URL` que se configura
en un `.env` local **no prueba** que esté disponible para la compilación
remota: los `.env` ignorados por Git no se suben automáticamente.

**Una vez que tengas una API pública HTTPS propia y autorizada para la demo**,
vinculá primero este proyecto con tu cuenta Expo mediante `eas build:configure`
(si todavía no lo está) y configurá el valor real en el entorno preview:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value "https://TU-API-REAL" --visibility plaintext
npx eas-cli@latest env:list --environment preview
```

Reemplazá `https://TU-API-REAL` por una URL real que responda al contrato
del profesor. No uses `localhost`, `192.168.x.x` ni inventes una URL. Esta
variable es pública y se incorpora al código del cliente: **nunca** pongas
contraseñas, tokens privados o secretos en `EXPO_PUBLIC_*`.

Antes del build, verificá el origen HTTPS desde una red externa
(`/salud`, `/lugares`, `/eventos` y archivos). El APK requiere
reconstrucción si cambiás la dirección de la API integrada.

## Mapa Android nativo y respaldo OpenStreetMap

El proyecto incluye `react-native-maps` para iOS. Desde esta revisión
también puede utilizarlo en Android con una clave **real y restringida** del
SDK de Google Maps. Sin clave mantiene la cartografía OSM/WebView y no
rompe la versión actual.

Antes de activar mapas nativos en Android hay que:

1. Obtener autorización para habilitar Google Maps Platform en Google Cloud
   (puede requerir configurar facturación).
2. Activar **Maps SDK for Android** y restringir la clave de API al paquete
   `ar.edu.uner.miciudadcolon` y huella SHA-1 del certificado de la
   compilación Android correspondiente.
3. Guardar `GOOGLE_MAPS_ANDROID_API_KEY` en el entorno EAS que se usará
   para compilar (`preview` o `production`). Elegir visibilidad
   `sensitive` desde Expo Dashboard. No pegar claves en GitHub.
4. Ejecutar una **nueva compilación**; `app.config.js` activa el plugin
   `react-native-maps` y la pantalla selecciona el mapa nativo cuando
   detecta la configuración. Cambiar la clave requiere reconstruir el APK.
5. Comprobar en un Android real calles/mosaicos, marcadores, filtros, GPS,
   detalle y gestos. La alternativa WebView queda disponible si no se
   configuró la clave. La aceptación del docente sigue siendo necesaria
   si se entrega con WebView.

La clave, aunque se gestione desde EAS, termina incorporada al APK para
el SDK nativo. Su protección real depende de restringir paquete y SHA-1
en Google Cloud, no de ocultarla en el repositorio. La compilación iOS
no necesita esa clave y conserva Apple Maps.

## Control de consignas antes de entregar

Verificá `docs/CONTROL-CONSIGNAS-100.md`: relaciona los seis módulos
funcionales y las capacidades técnicas exigidas por el PDF de la cátedra
con código comprobable, pruebas obligatorias y pendientes (eventos, mapa
Android, multimedia, fotografías, API HTTPS, build de producción y dispositivos).

**Implementado no equivale a probado**. No declarar cumplimiento completo
hasta cerrar las casillas y registrar evidencia del funcionamiento real.

## APK de entrega

Primero asociar el proyecto con la cuenta Expo del grupo:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Luego generar el APK preview pedido por la cátedra:

```bash
eas build --platform android --profile preview
```

`eas.json` configura `preview` como APK instalable. Hay que instalarlo y verificarlo con Metro apagado antes de entregarlo.

## Verificación

- `docs/MAPEO-PRD.md`
- `docs/MAPEO-REQUISITOS-INTEGRADOR.md`
- `docs/PRUEBAS-MOBILE.md`
- `docs/DECISIONES-Y-DUDAS.md`
- `docs/GUIA-DEFENSA.md`
- `docs/ESTADO-ENTREGA.md`

## Imágenes

La portada usa un archivo incluido en `assets/hero-colon.jpg` para no depender de la conexión. Las fotos de los lugares se cargan desde las URLs definidas en los mocks y se guardan localmente después de la primera carga correcta. Las fuentes y licencias conocidas están en [docs/CREDITOS-IMAGENES.md](docs/CREDITOS-IMAGENES.md).


### Fotografías que se ven como ilustraciones en Android

La API de la cátedra puede entregar ilustraciones PNG de demostración (HTTP 200), aunque las fichas no tengan fotografías turísticas reales. También se verificó en Expo un error **HTTP 403** para varias miniaturas de Wikimedia Commons.

- La app prioriza fotografías reales de fuentes oficiales cuando existe una URL identificada para ese lugar en `src/servicios/fotosTuristicas.ts`, luego intenta las alternativas del catálogo y por último mantiene el archivo de la API como respaldo.
- En Android, cuando falla una foto se intenta la siguiente sin disparar una ventana amarilla por cada URL. Los fallos quedan registrados en la terminal de desarrollo.
- La caché de fotos mantiene la copia anterior para uso offline, pero descarga una nueva si cambia la fotografía prioritaria.
- La portada `assets/hero-colon.jpg` es independiente de estas fotos.
- Para que **todos** los lugares tengan fotografías propias es necesario incorporar material auténtico con autorización de uso o licencia compatible. Los enlaces a sitios oficiales **no implican licencia de redistribución**. No publicar ni distribuir copias sin verificar sus términos.

Prueba recomendada con el backend encendido, el teléfono en la misma red y Expo reiniciado:
```powershell
npm run api:conectar:win
```

## Fotografías definitivas en Android y APK

La app ya no presenta URLs HTTP de medios directamente al componente Image nativo:
primero descarga el archivo con Expo FileSystem y muestra su copia local. Si
una descarga falla (HTTP 403/404, sin señal o archivo dañado), usa **la portada
de Colón incluida en la aplicación**, identificada como vista general, en vez de
una tarjeta vacía. Las ilustraciones que devuelve la API docente pueden seguir
apareciendo como respaldo cuando no hay fotografía real del lugar.

**Para que cada lugar tenga su propia foto real sin depender de sitios externos**,
se agregó un sistema de fotos empaquetadas en el APK:

1. Reuní en una carpeta de Windows fotos de los lugares que tengas permiso de usar,
   con nombres como `Molino Forclaz.jpg`, `Playa Norte.jpg` o el nombre exacto
   de la ficha de la API. **Preferí nombres en lugar de IDs**: el catálogo demo
   y la API docente usan algunos IDs iguales para sitios diferentes. También
   se aceptan IDs de la API como `lug-004.jpg` cuando está configurada la API.
2. Desde el proyecto ejecutá:
   ```powershell
   npm run fotos:instalar -- "C:\Mis fotos Colón"
   ```
3. El comando verifica la firma JPG/PNG/WEBP, copia los archivos a
   `assets/lugares/` y genera automáticamente `src/servicios/fotosLocales.ts`
   con referencias estáticas `require()`. No modifica la API de la cátedra.
   Se puede repetir para sumar más fotografías sin perder las anteriores.
4. Reiniciá Expo. Antes de construir el APK, **incluí las fotos y el catálogo
   en el repositorio** (además de `assets/hero-colon.jpg`), por ejemplo
   `git add assets/lugares src/servicios/fotosLocales.ts assets/hero-colon.jpg`
   y luego commit/push; de lo contrario una compilación remota de EAS no
   tendrá esas fotos.

La app prioriza la foto propia del lugar incluida en el APK; si no existe,
intenta el material remoto descargado a caché, después las ilustraciones de
respaldo del backend y finalmente la vista general de Colón. **La vista general
es un respaldo identificado, no una foto falsa del lugar.** No hay forma
técnica de crear fotografías auténticas de 26 lugares sin contar con esas
imágenes y sus correspondientes derechos de uso.

### Diagnóstico por lugar y fotos definitivas (Windows)

Con la API docente encendida, este comando genera un CSV con **todos los
lugares activos que devuelve tu servidor**, su ID, cantidad de URLs en la API,
si ya tienen una foto empaquetada y el nombre sugerido del archivo:

```powershell
npm run fotos:reporte -- http://localhost:3000
```

El comando también crea `reportes/fotos-prioritarias.csv` con los lugares sin URL de imagen y los que comparten su imagen principal con otros lugares, siempre que todavía no tengan una foto local. Las filas muestran qué otros lugares comparten la imagen y el nombre recomendado para guardarla. **Que una imagen sea compartida no implica que haya que reemplazarla en todos los lugares**: revisá cuál ficha corresponde realmente a esa foto.

Abrí `reportes/fotos-para-revisar.csv` con Excel. Es un **inventario**:
que una ficha tenga URL no garantiza que pueda descargarse ni que sea una
fotografía auténtica. Para comprobar el estado HTTP de las imágenes remotas:

```powershell
npm run api:imagenes -- http://localhost:3000
npm run fotos:externas
```

Si necesitás fotografías estables en un APK, reuní fotos propias o licenciadas
en una carpeta (una por lugar, con nombre de ficha o ID según el CSV) y ejecutá:

```powershell
npm run fotos:instalar -- "C:\Mis fotos Colon"
npx expo start --clear --lan
```

La app prioriza las fotos empaquetadas y conserva la API para los datos del
catálogo, favoritos, eventos y visitas. No hace falta copiar manualmente cada
imagen dentro del código, ni modificar el backend del profesor. Antes del build
final, incluí `assets/lugares/` y `src/servicios/fotosLocales.ts` en Git.
El CSV es local y no se versiona. Evitá usar sin permiso fotos tomadas de
portales municipales, redes sociales o servicios comerciales.
