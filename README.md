# Mi Ciudad Colón

Aplicación móvil realizada por el **Grupo 93** para el trabajo integrador de **Desarrollo para Móviles (UNER, 2026)**.

El objetivo es que una persona que visite Colón, Entre Ríos, pueda encontrar lugares turísticos, ver dónde quedan y guardar su recorrido. La información se consulta a través de la API que proporciona la cátedra.

## Funcionalidades

- Catálogo de lugares con búsqueda, filtros, fotos, horarios, descripción y datos de contacto.
- Mapa, ubicación del usuario, distancias y acceso a indicaciones para llegar.
- Agenda de eventos y recordatorios locales.
- Registro e inicio de sesión, favoritos y perfil.
- Registro de visitas por QR, cercanía GPS o carga manual, con fotos y notas.
- Recorrido guardado en el teléfono y sincronización de visitas pendientes.
- Reproductor de audioguías, descarga para uso sin conexión y orientación por sensores.
- Temas claro y oscuro.

Los permisos de cámara, ubicación y notificaciones se solicitan cuando hace falta. La navegación básica no requiere iniciar sesión; guardar datos personales sí.

## Herramientas utilizadas

| Parte | Tecnología |
| --- | --- |
| App móvil | React Native, Expo SDK 58, TypeScript y Expo Router |
| Datos locales | SQLite, SecureStore y caché |
| Cámara, GPS y audio | Módulos de Expo |
| Backend | API NestJS original de la cátedra |
| Base y archivos | PostgreSQL y Supabase Storage |
| Alojamiento de la API | Render (plan gratuito) |
| APK Android | EAS Build, perfil `preview` |

El código del backend pertenece al repositorio [api-proyectos-mobile](https://github.com/franco-ruisdias-uner/api-proyectos-mobile), carpeta `api-mi-ciudad`. No está duplicado dentro de este repositorio.

## Ejecutar el proyecto

Se necesita Node.js 22 o superior, Git y Expo Go compatible con SDK 58 para probar desde un teléfono.

```powershell
git clone https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-.git
cd Mi-Ciudad-MOBILE-
npm ci
Copy-Item .env.example .env.local
npx expo start --clear
```

Escaneá con Expo Go el QR que aparece en la terminal. Para que Metro funcione desde el celular, ambos dispositivos deben poder comunicarse por la red. Algunas funciones nativas requieren un build específico.

El archivo `.env.example` contiene la URL del servidor público. Para usar la API local podés reemplazarla en `.env.local` con la IP de la computadora. **No uses `localhost` en un teléfono físico**. Sin una URL configurada, la app utiliza un catálogo reducido de datos de prueba; eso no equivale a trabajar con la API docente.

### API publicada

- Servidor: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com
- Estado: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/salud
- Lugares: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/lugares?pagina=1&porPagina=500

El 14 de noviembre de 2026 se comprobó que la API respondió correctamente y devolvió **26 lugares activos** de un total de **27 registros**. Render Free puede suspender el servidor por inactividad; por eso el primer acceso a veces demora más.

## Probar los códigos QR

Iniciá sesión y entrá a **Mi recorrido → Escanear QR**. El lector compara el contenido del QR con los códigos que tienen asignados los lugares en la API.

| Contenido del QR | Qué debería pasar |
| --- | --- |
| `COLON:lug-004` | Reconoce el Molino Forclaz y registra una visita |
| `COLON:lug-999` | Rechaza el código: el lugar no existe |
| `CODIGO-AJENO-2026` | Muestra un error y permite volver a intentar |

Después del QR válido hay que comprobar que la visita aparezca en **Mi recorrido**. También corresponde probar qué ocurre si el teléfono está sin Internet y después recupera la conexión.

## APK para Android

El perfil `preview` está definido en `eas.json`. La dirección de la API debe configurarse en EAS **antes de compilar**.

Con EAS CLI instalado y la sesión de Expo iniciada:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\cerrar-apk-26-windows.ps1" -ApiUrl "https://mi-ciudad-colon-api-grupo93-5szt.onrender.com"
eas build --platform android --profile preview --clear-cache
```

El primer comando revisa que el servidor y el catálogo respondan y configura `EXPO_PUBLIC_API_URL` en el entorno `preview` de EAS. Si informa un error, no conviene continuar con la compilación.

Una APK anterior no se actualiza sola por cambiar GitHub. Para incluir los cambios hay que instalar una nueva compilación. En iPhone se necesita una compilación iOS distinta.

## Organización

```text
app/                    Pantallas y navegación
src/componentes/        Componentes reutilizables
src/contexto/           Sesión y tema
src/servicios/          API, visitas, favoritos, archivos, caché
src/mocks/              Datos de prueba
assets/                 Íconos, portada y fotos locales
scripts/                Herramientas de diagnóstico y compilación
docs/                   Requisitos, pruebas y material de apoyo
render-mi-ciudad-api.yaml   Configuración del servidor
```

Los scripts para levantar la API local o abrir un túnel temporal siguen disponibles para desarrollo. No son necesarios para usar el servidor que ya está publicado.

## Comprobaciones antes de entregar

```powershell
npm run typecheck
npm run entrega:check
npx expo-doctor@latest
```

GitHub Actions también ejecuta verificaciones del proyecto. Eso **no reemplaza las pruebas reales** en Android o iPhone, especialmente de cámara, GPS, notificaciones, reproducción de audio y funcionamiento sin conexión.

## Material de prueba y cuestiones pendientes

La API usa datos de demostración, incluidos eventos; no es una agenda oficial en tiempo real. Las audioguías que utilizan pistas SoundHelix son audios de prueba y no grabaciones turísticas oficiales.

El proyecto incorpora archivos de imagen locales para las 26 fichas activas, pero **tener una imagen asociada no garantiza que corresponda exactamente al lugar o que se pueda redistribuir**. La información de origen y las fotos pendientes están en [el inventario de licencias](docs/LICENCIAS-FOTOS-20261112.json). Antes de publicar una versión fuera del ámbito académico hay que resolver las atribuciones que siguen pendientes.

En Android el mapa puede usar OpenStreetMap/CARTO en una vista WebView como alternativa al mapa nativo. La aceptación de esa variante y las pruebas con sensores, notificaciones y sin conexión deben documentarse con resultados del dispositivo.

## Documentación

- [Mapeo de los requisitos funcionales](docs/MAPEO-PRD.md)
- [Plan de pruebas](docs/PRUEBAS-MOBILE.md)
- [Guía para presentar la app](docs/GUIA-DEFENSA.md)
- [Despliegue de la API](docs/DESPLIEGUE-API-SIN-PC.md)
- [Inventario y licencias de fotografías](docs/LICENCIAS-FOTOS-20261112.json)
