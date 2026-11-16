# Mi Ciudad Colón — Grupo 93

**Trabajo Integrador Final · Desarrollo para Móviles · UNER · 2026 (2.º cuatrimestre)**

Aplicación móvil desarrollada con React Native, Expo y TypeScript para explorar los atractivos turísticos de Colón, Entre Ríos. Consume la API de la cátedra, incorpora capacidades del dispositivo y dispone de almacenamiento local para determinadas funciones sin conexión.

## Integrantes

- Kevin Javier Berthet
- David De Bueno
- Flavia Gabriela Morilla
- Giovanni Percara
- Gabriel Hernán Toledo

## Video de presentación del Grupo 93

- **Video grupal:** [GRUPO 93.mp4 — presentación de Mi Ciudad Colón (Google Drive)](https://drive.google.com/file/d/1nw2q3lBlXO0xPQ6FiQjtQqRWSSoSWqOq/view?usp=sharing).
- El video complementa la entrega del repositorio y la defensa grupal coordinada con la cátedra.
- **Para evaluar:** abrir el enlace de Drive con permiso de visualización. Si se solicita acceso, el equipo debe habilitarlo; no se publican credenciales.

## Descargar e instalar la aplicación (Android APK)

**[Descargar Mi Ciudad Colón para Android — APK](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-/releases/latest/download/mi-ciudad-colon.apk)**

[Ver versiones publicadas en GitHub Releases](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-/releases)

> **Estado del enlace:** preparado para la publicación. La descarga directa empezará a funcionar **únicamente después** de publicar una *Release* estable en este repositorio con el archivo adjunto llamado exactamente `mi-ciudad-colon.apk`. Antes de eso, GitHub puede mostrar un error 404. No se afirma que la APK ya esté alojada.

**Para los profesores (Android):** abrir el enlace de descarga en el celular, descargar el archivo `.apk`, abrirlo e instalarlo. Android puede pedir autorización para instalar aplicaciones descargadas desde el navegador; habilitarla solo si se confía en este proyecto. La APK permite abrir la aplicación sin instalar Expo Go, clonar el repositorio ni mantener Metro encendido. Se necesita conexión a Internet para las funcionalidades que consultan la API y conceder los permisos del dispositivo que correspondan. **Una APK no se puede instalar en iPhone/iOS.**

### Cómo publicar o actualizar la APK (equipo del Grupo 93)

1. Generar el instalable Android con el perfil `preview` de EAS Build (ver [Build instalable Android](#build-instalable-android-información-adicional)). Confirmar antes que la compilación use la URL HTTPS pública de la API.
2. Descargar y probar la APK en un teléfono Android real. Renombrar el archivo a **`mi-ciudad-colon.apk`** (sin comprimirlo en ZIP).
3. Entrar en [Releases del repositorio](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-/releases), elegir **Draft a new release**, crear la etiqueta `v1.0.0`, adjuntar `mi-ciudad-colon.apk` y seleccionar **Publish release**. Publicarla como versión normal, **no como borrador ni prerelease**.
4. Verificar el [enlace directo](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-/releases/latest/download/mi-ciudad-colon.apk) desde una ventana de incógnito, sin iniciar sesión en GitHub, y volver a comprobar la instalación en Android.
5. Para futuras actualizaciones, crear otra Release estable (por ejemplo, `v1.0.1`) con el archivo **exactamente del mismo nombre**. El enlace `releases/latest/download/mi-ciudad-colon.apk` apuntará a la APK de la última Release estable publicada, sin necesidad de editar nuevamente el README.

**Importante:** publicar una Release no compila ni modifica la app automáticamente; aloja el archivo APK que el equipo sube. La aplicación instalada sigue dependiendo de que su API remota esté disponible para las funciones online.

## Entrega académica

**Modalidad informada por el grupo para esta entrega (15/11/2026):**

- **Código fuente:** entregar el enlace a este repositorio Git (preferido) o un ZIP; deben incluirse `app.json` y `eas.json`. No entregar `node_modules`.
- **Campus Virtual UNER:** cargar los materiales en la sección correspondiente.
- **Fecha límite:** la indicada en el Campus; **para quienes entreguen video, hasta el 15 de noviembre de 2026**, según la indicación recibida por el grupo.
- **Defensa obligatoria:** instancia grupal de 15 a 20 minutos. Se demuestra la app funcionando en un teléfono, con Expo Go o una APK instalada. Cada integrante explica su parte y responde preguntas sobre su implementación. No se permite utilizar asistentes de IA durante la defensa.
- **Video:** el grupo preparó una presentación grabada; agregar su enlace en la entrega del Campus cuando corresponda. No se publica aquí ningún enlace que no haya sido proporcionado.
- **APK:** existe configuración EAS `preview` para generar un instalable Android. La versión de la consigna transcrita para esta entrega no enumera el enlace de APK como parte obligatoria de la carga de código fuente. Se incluye arriba un enlace de descarga directa preparado para la publicación de una Release estable; la APK no sustituye la defensa.

> Esta sección utiliza la **consigna actualizada comunicada por el grupo**. Algunos documentos históricos de `docs/` describen la modalidad anterior (repositorio más enlace APK) y deben leerse como antecedentes, no como un cambio de la instrucción actual del Campus.

## Funcionalidades incluidas

- Catálogo de lugares turísticos: tarjetas, búsqueda, categorías, detalles, horarios y fotografías.
- Mapa y geolocalización, con permisos opcionales y enlaces a indicaciones.
- Agenda de eventos, favoritos y recordatorios locales cuando hay eventos aplicables.
- Registro, ingreso, sesión persistente y reingreso biométrico donde el dispositivo lo admite.
- Registro de visitas con código QR, validación de cercanía, fotos y notas.
- Recorridos y visitas pendientes con persistencia local y sincronización.
- Audioguías con controles de reproducción y opciones de descarga.
- Estados de carga, vacío y error; aviso de conectividad, caché y temas claro/oscuro.

La disponibilidad real de cámara, sensores, mapas y notificaciones depende de permisos y del cliente o build usado. El código incluido y las pruebas automáticas **no garantizan** por sí solos que cada función esté validada en todos los dispositivos.

## Tecnologías y arquitectura

| Capa | Tecnología |
| --- | --- |
| Aplicación móvil | React Native, Expo **SDK 58**, TypeScript |
| Rutas y pantallas | Expo Router (`app/`) |
| Comunicación | API REST de la cátedra, consultada desde `src/servicios/` |
| Backend | NestJS del repositorio docente `api-proyectos-mobile` |
| API publicada | Render (URL HTTPS indicada abajo) |
| Datos/archivos remotos | PostgreSQL y almacenamiento configurado en el backend |
| Persistencia local | `expo-sqlite`, `expo-sqlite/kv-store`, caché y `expo-secure-store` |
| Hardware y multimedia | `expo-location`, `expo-camera`, `expo-image-picker`, `expo-sensors`, `expo-haptics`, `expo-audio` |
| Compilación Android | EAS Build, perfil `preview` en `eas.json` |

El backend **no está copiado en este repositorio móvil**. Su código original está en [api-proyectos-mobile](https://github.com/franco-ruisdias-uner/api-proyectos-mobile), carpeta `api-mi-ciudad`. La aplicación puede utilizar el despliegue HTTPS ya publicado sin iniciar NestJS en la computadora de quien la evalúa.

## Para los profesores: ejecutar desde GitHub

### 1. Requisitos

- Git y **Node.js 22 o superior** con npm (la verificación automática del repositorio usa Node 22.13.0).
- Un teléfono Android o iPhone con **Expo Go compatible con SDK 58**, si se usa esa modalidad, y conexión a Internet.
- Para probar por red local, celular y computadora deben poder comunicarse en la misma red Wi-Fi.

### 2. Clonar, instalar y configurar la API

Abrir PowerShell en Windows:

```powershell
git clone https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-.git
cd Mi-Ciudad-MOBILE-
npm ci
Copy-Item .env.example .env.local
```

`package-lock.json` fija la instalación reproducible. `.env.example` ya incluye la URL pública de la API, que se copia a `.env.local` y **no se sube al repositorio**. No introducir contraseñas, tokens ni otros secretos en variables `EXPO_PUBLIC_*`.

### 3. Comprobar que la API responde

```powershell
$api = "https://mi-ciudad-colon-api-grupo93-5szt.onrender.com"
Invoke-RestMethod "$api/salud" -TimeoutSec 90
$r = Invoke-RestMethod "$api/lugares?porPagina=500" -TimeoutSec 90
"Lugares recibidos: $(@($r.datos).Count)"
```

- **API:** https://mi-ciudad-colon-api-grupo93-5szt.onrender.com
- **Salud:** https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/salud
- **Lugares:** https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/lugares?porPagina=500

En la última verificación del equipo se recibieron **26 lugares activos**. Render Free puede tardar en reactivarse tras un período de inactividad. Si falla `/salud`, primero revisar el backend y la conexión: abrir Expo no pone en marcha la API.

### 4. Iniciar Expo y abrir la aplicación

Para un teléfono en la misma red:

```powershell
npx expo start --clear --lan --go
```

Escanear el QR de la terminal con Expo Go compatible con SDK 58. Mantener Metro abierto durante la prueba. Cuando el teléfono se encuentre en **otra red**, puede utilizarse:

```powershell
npx expo start --clear --tunnel --go
```

El túnel puede requerir autenticación Expo y depender de la disponibilidad de red. En iPhone, la cuenta de Expo CLI y la de Expo Go pueden tener que coincidir. Si la versión instalada de Expo Go no es compatible con SDK 58, se necesitará una compilación iOS adecuada: **una APK Android no funciona en iPhone**.

### 5. Comprobaciones reproducibles

Desde la raíz del repositorio, en otra terminal:

```powershell
npm run typecheck
npm run entrega:check
npm run doctor
node --test scripts/test-imagenes-api.mjs scripts/test-cierre-mobile.mjs
```

También hay verificaciones automatizadas en `.github/workflows/verify.yml`. Estas pruebas comprueban configuración, integridad de archivos, tipos y ciertos comportamientos; **no sustituyen** una prueba física de permisos, cámara, GPS, notificaciones, audio y modo avión.

## Pruebas de demostración sugeridas

1. Abrir Inicio y comprobar que se muestran lugares provenientes de la API, no solo datos de ejemplo.
2. Buscar un atractivo y abrir su detalle; comprobar texto, imágenes y estados de carga/error.
3. Abrir Mapa y comparar el comportamiento con el permiso de ubicación concedido y denegado.
4. Iniciar sesión con **cuentas de demostración autorizadas**, guardar un favorito y consultar Mi recorrido.
5. Probar un QR válido: `COLON:lug-004` (Molino Forclaz), además de un código inexistente como `COLON:lug-999`.
6. Guardar una visita y verificar su persistencia y sincronización cuando vuelve la conexión.
7. Probar reproducción/pausa de audioguía, orientación o háptica, y notificaciones locales si existe un evento futuro apropiado.

No se publican contraseñas de demostración en este README. El equipo o la cátedra debe aportar las credenciales de prueba por un canal apropiado cuando sean necesarias.

## Estructura del repositorio

```text
app/                  Pantallas, tabs y rutas de Expo Router
src/componentes/      Componentes de interfaz
src/contexto/         Sesión y tema
src/servicios/        API, catálogo, visitas, caché, medios y persistencia
src/mocks/            Datos de ejemplo (solo si no se configuró la API)
assets/               Marca, portada y 26 imágenes locales de lugares
plugins/              Configuraciones nativas del proyecto
scripts/              Diagnóstico, validaciones y utilidades
docs/                 Mapeos, pruebas, decisiones y créditos
.github/workflows/     Verificaciones automáticas
app.json              Identidad y configuración Expo
eas.json              Perfiles de compilación EAS
app.config.js         Configuración dinámica de mapa Android y API EAS
.env.example          Ejemplo de configuración pública de la API
package-lock.json     Dependencias fijadas para npm ci
```

`node_modules/`, `.env`, `.env.local`, credenciales y archivos de firma no se versionan. Tampoco se incluyen el código del backend original ni un archivo de video si no se han subido expresamente.

## Build instalable Android (información adicional)

El perfil `preview` en `eas.json` genera una APK. Para una compilación independiente de Metro es necesario que el entorno EAS `preview` tenga `EXPO_PUBLIC_API_URL` apuntando a una API **HTTPS pública** antes de generar el build. La configuración local `.env.local` no garantiza que EAS reciba esa variable.

```powershell
npx eas-cli@latest env:list --environment preview
npm run entrega:check -- --apk
npx eas-cli@latest build --platform android --profile preview
```

Una APK existente **no se modifica** al editar este README. Para compartir una APK comprobada, publicarla en GitHub Releases siguiendo las instrucciones anteriores o proporcionar el enlace real del build de EAS; no compartir enlaces a archivos que todavía no se han publicado.

## Limitaciones y aclaraciones para la evaluación

- El catálogo incluye 26 lugares activos según la última prueba; esto no demuestra que existan 26 fotos **únicas y verificadas**. Ver créditos y licencias.
- La API puede devolver cero eventos próximos; eso no significa necesariamente que la pantalla Agenda tenga un error de código. Las notificaciones locales relacionadas con eventos requieren datos adecuados y permisos.
- Algunas audioguías emplean audio de demostración, no grabaciones turísticas oficiales.
- En Android, el mapa puede usar una alternativa WebView con OpenStreetMap/CARTO cuando no está habilitado el mapa nativo. Validar con la cátedra si se exige estrictamente `react-native-maps`.
- El comportamiento de Expo Go no es necesariamente igual al de una compilación instalada para notificaciones, biometría, background audio y módulos nativos.
- Para pruebas offline, primero abrir la app con conexión y guardar datos en caché. Un teléfono recién instalado y sin conexión no puede consultar por primera vez el servidor.

## Documentación adicional

- [Mapeo de requisitos del integrador](docs/MAPEO-REQUISITOS-INTEGRADOR.md).
- [Plan de pruebas móviles](docs/PRUEBAS-MOBILE.md).
- [Pruebas remotas y de compañeros](docs/PRUEBAS-COMPANEROS.md) (incluye instrucciones históricas de API local).
- [Despliegue de la API sin computadora](docs/DESPLIEGUE-API-SIN-PC.md).
- [Guía de defensa](docs/GUIA-DEFENSA.md).
- [Inventario de fotografías y licencias](docs/LICENCIAS-FOTOS-20261112.json).
- [Mapeo del PRD](docs/MAPEO-PRD.md).

**Grupo 93 · UNER · Desarrollo para Móviles · Noviembre de 2026**
