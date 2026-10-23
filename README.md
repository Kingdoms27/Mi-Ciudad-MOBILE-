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
