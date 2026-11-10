# Mi Ciudad Colón — pruebas de grupo, SDK 58 (Android e iPhone)

## Versión única del proyecto

Mi Ciudad se preparó para Expo **SDK 58**, React Native 0.88 y
`react-native-maps` 1.29.11. El proyecto es **uno solo**: no puede abrirse
al mismo tiempo con clientes Expo Go de SDK 53, 54, 57 y 58.

En cada teléfono, revisar qué versión admite su **Expo Go instalado**
y utilizar el cliente correspondiente a SDK 58. Si alguien conserva SDK 53/54,
actualizar su Expo Go, **no bajar el proyecto**. SDK 58 requiere iOS 16.4+
y Android 7+ como mínimo.

**Nota:** la compilación TypeScript, Expo Doctor y tests de código no sustituyen
las pruebas físicas de Android e iPhone. Si Expo Go de iPhone del tester no
admite el mismo SDK, se requiere una compilación iOS de prueba con
distribución Apple Developer/EAS; no instalar archivos APK de Android en iOS.

## Prueba remota: tres terminales en Windows

En la carpeta `C:\Users\PROGRAMADOR\Mi-Ciudad-MOBILE-`, primero actualizar
el código limpio de `main` y recuperar dependencias exactas:

```powershell
git status --short
git pull --ff-only origin main
npm ci
npx expo install --check
npm run typecheck
```

**Si `git status --short` muestra cambios locales importantes, guardar
esos archivos primero, no ejecutar `git reset --hard`.**

### Terminal 1 — API oficial del docente

```powershell
npm run api:iniciar:win
```

Comprobar:
```powershell
Invoke-RestMethod http://localhost:3000/salud
```

### Terminal 2 — HTTPS para el backend (solo demo con datos ficticios)

```powershell
cloudflared tunnel --url http://localhost:3000
```

Si `cloudflared` no está en el PATH, ubicar `cloudflared.exe` con
PowerShell y ejecutar `& "RUTA-REAL\cloudflared.exe" tunnel --url
http://localhost:3000`. El usuario ya logró usar la ruta absoluta
de una instalación de cloudflared.

Cloudflare muestra una **URL temporal HTTPS real**
terminada en `.trycloudflare.com`; copiá exactamente esa dirección.
Cambia si se reinicia el túnel. Esta URL puede ser consultada por cualquiera
que la conozca: usá solo cuentas de prueba, sin archivos privados ni
credenciales reales. Apagá el túnel al terminar. No usar una URL de ejemplo.

### Terminal 3 — Expo QR desde distintas redes

```powershell
npm run grupo:conectar -- https://DIRECCION-REAL.trycloudflare.com
```

Reemplazar por la dirección de Cloudflare que apareció en Terminal 2.
El comando comprueba `/salud`, `/lugares` y una imagen, modifica
únicamente `EXPO_PUBLIC_API_URL` en `.env.local` y abre Expo
con `--tunnel --go`.

**No ejecutar `npm run api:conectar:win` después** durante las pruebas
remotas: volvería a poner la IP privada de la PC y las imágenes dejarían
de funcionar en otras redes.

Dejar las 3 terminales abiertas. El QR de Metro y el túnel HTTPS de
Cloudflare son **dos servicios diferentes**. Tu PC y conexión a
Internet deben continuar encendidas durante la prueba.

## Android — compañeros

Instalar Expo Go compatible con **SDK 58** desde Play Store si ya
está disponible en el dispositivo; consultar
https://expo.dev/go para versiones del cliente Android.

Abrir Expo Go, escanear el QR de Terminal 3, probar todas las pantallas
y confirmar que se ven las imágenes de la API. No es necesaria la misma
Wi-Fi: el transporte es el túnel de Expo, y el backend va por HTTPS.

## iPhone — Giovanni

Usar Expo Go compatible con **SDK 58**. Expo Go en iPhone requiere
iniciar sesión tanto en Expo CLI (PC) como en Expo Go con **la misma
cuenta Expo**:

```powershell
npx expo whoami
```

Giovanni puede comprobar la cuenta en Expo Go. No compartir contraseñas
personales por chat. Al escanear el QR, la versión SDK mostrada en su
Expo Go debe coincidir con la del proyecto.

Si por políticas de App Store, OS o cuenta no dispone del cliente
compatible, Expo Go no ejecutará ese proyecto. La vía independiente de
Expo Go es una compilación iOS propia distribuida mediante
Apple Developer y EAS/TestFlight, no un APK Android.

## Audioguías en Expo Go SDK 58

La reproducción de audio dentro de la pantalla se puede probar en
Expo Go. Los controles de la pantalla bloqueada y la reproducción
sostenida en segundo plano **requieren una build nativa** con
`enableBackgroundPlayback: true` aplicado durante la generación
del binario. Expo Go no contiene obligatoriamente
`AudioControlsService` de Mi Ciudad y puede mostrar
`Failed to activate lock screen controls` si se llama
`setActiveForLockScreen`.

La aplicación evita esas llamadas en Expo Go, conserva la reproducción
en primer plano y las mantiene para una build nativa compatible.
Esta limitación **no afecta las fotografías de la API**.

## Corrección del parpadeo de imágenes

Con API docente configurada, las fichas ya no enseñan durante un segundo
una foto local empaquetada para luego sustituirla por la ilustración
de la API. Mientras se descarga, indican **Cargando imagen de la API**.
Una vez terminada la carga se muestra el medio real que la API entrega;
si falla, aparece el respaldo local. No se manipulan ni falsifican fotos
de la cátedra.

El ZIP original de la API solo incluye imágenes PNG ilustrativas,
compartidas por categoría. Para que se vea una foto diferente por lugar
hay que incorporarla a la **copia de desarrollo** del backend.

### Sin descargar ZIP extra: preparar cinco fotos verificadas

Las cinco fotografías de Commons de molino, palmar, palacio, costanera y
parque Quirós ya están en `assets/lugares/` y cuentan con créditos en
`docs/CREDITOS-FOTOS-COMMONS.md`. El repositorio incorpora también un
importador separado de la API. No incluye por defecto fotos de
Puerto Viejo ni del mirador porque sus localizaciones exactas no están
certificadas por las imágenes disponibles.

Desde la **raíz del proyecto móvil**, ejecutá:

```powershell
git pull --ff-only origin main
npm run fotos:api:preparar:win
```

Este comando detecta la instalación de la API en
`%LOCALAPPDATA%\MiCiudadColon\backend`, copia cinco fotos a
`%LOCALAPPDATA%\MiCiudadColon\fotos-para-api`, instala una herramienta
**solo en la copia local** de `api-mi-ciudad/src/tools/`, la compila y
muestra un **plan de simulación**; **NO modifica la base SQLite**.

Si estás conforme con la simulación, detené la terminal de la API
con `Ctrl+C` y ejecutá:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/preparar-fotos-api-windows.ps1 -Aplicar
```

El script exige configuración de desarrollo, SQLite y archivos locales,
rechaza una API activa en el puerto 3000 y guarda primero una copia del
archivo `datos/api.sqlite` y la carpeta `archivos/` en
`%LOCALAPPDATA%\MiCiudadColon\respaldos-fotos`. Solo reemplaza las
referencias a imágenes de semilla en los cinco registros indicados:
no borra medios originales ni altera lugares sin fotos. No uses
`db:reiniciar`.

Reiniciá la API normalmente y verificá:

```powershell
npm run api:fotos:grupo -- http://localhost:3000
```

Si se necesitan más fotografías, colocá JPEG/PNG/WebP con sus ID oficiales
(ej.: `lug-007.jpg`) en una carpeta separada y pasá `-Fotos "C:\FotosColón"`
al script. Comprobá antes origen, derechos de uso y correspondencia real
de cada fotografía. **Conservá sin imágenes el registro lug-003** en la
base destinada a las pruebas de la cátedra.

**Importante**: el importador es nuevo y no ha sido ejecutado contra la
base del usuario. Su primera ejecución debe ser la simulación; los tests
del cliente Expo no sustituyen esa validación local.

## Verificación obligatoria de imágenes

Con la API local encendida:

```powershell
npm run api:fotos:grupo -- http://localhost:3000
```

Y desde la URL pública real:

```powershell
npm run api:fotos:grupo -- https://DIRECCION-REAL.trycloudflare.com
```

El reporte `reportes/diagnostico-imagenes-api.json` marca:
- `OK`: imagen descargable, cabecera y formato válidos.
- `SIN_URL`: el lugar no tiene URL de archivo en la respuesta de la API.
- `ARCHIVO_FALLA`: HTTP 403/404, ruta inválida, archivo corrupto o fallo de red.
- `REPETIDA`: varios lugares tienen el mismo contenido (no fotos distintas).

El último dato disponible del backend era **27 registros, 26 activos**;
no declarar 27 fotos únicas sin auditoría real. Si algunas fichas están
sin fotos o con el mismo PNG, hay que corregir archivos/semillas de
**la API de la cátedra**, no cambiar SDK ni descargar fotos ajenas.

Si algo falla, identificar: teléfono, SDK Expo Go, error literal, ID
del lugar, red (Wi-Fi o datos), captura de pantalla y resultado de
la auditoría. No enviar secretos o el contenido de `.env.local`.

## Para que siga funcionando sin una PC encendida

El Quick Tunnel no es hosting permanente. Si se desea que varios
compañeros prueben durante días, se necesita desplegar el backend
en una URL HTTPS **estable**, con permisos, base de datos y archivos
persistentes; proteger endpoints de prueba y respetar las licencias del
material del profesor. Una APK Android o un build iOS propio tampoco
publican automáticamente la API.

Documentación oficial:
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- https://expo.dev/changelog/sdk-58
- https://expo.dev/changelog/expo-go-57-login
- https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
