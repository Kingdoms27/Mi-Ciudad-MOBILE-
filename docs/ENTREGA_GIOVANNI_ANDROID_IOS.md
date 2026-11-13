# Mi Ciudad Colon — entrega verificada a Giovanni (VS Code)

> Estado: procedimiento de cierre. **No se puede marcar aprobado hasta probar la API publica y ambas plataformas.**
> Esta guia trabaja sobre **Mi-Ciudad-MOBILE-**, no sobre QA-Android-iOS ni sobre OneDrive.

## A. Abrir la copia principal en VS Code y conservar las fotos

En VS Code: **Archivo > Abrir carpeta** y seleccionar:
\`C:\Users\PROGRAMADOR\Desktop\Mi-Ciudad-MOBILE-\`

En su terminal integrada:

\`\`\`powershell
pwd
git status --short
node --version
\`\`\`

**Nunca ejecutar** \`git reset --hard\`, \`git clean -fd\` o \`npm run fotos:instalar\` sobre imágenes con nombres \`REVISAR\` sin verificarlas.
No mover ni borrar el contenido de \`assets/lugares\`.

La rama \`feature/mi-ciudad-map-gps-stability-20261113\` contiene las mejoras de mapa y la auditoría final; ver [PR 38](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-/pull/38). Revisar cambios locales en las pantallas de mapas antes de traerlos. Hacer respaldo de los dos archivos de mapa antes de incorporarlos.

## B. Integrar las fotos exactas, sin asignarlas a lugares incorrectos

Descomprimir \`MI_CIUDAD_COLON_CIERRE_FOTOS_CONTROLADO.zip\`, que contiene 7 JPG originales o mejorados, 6 fotos HD marcadas \`REVISAR\`, scripts y comparativa. No es necesario volver a descargar las mismas fotos.

El script \`CERRAR_FOTOS_MI_CIUDAD.mjs\` acepta \`--auditar\` y \`--aplicar\`; solo aplica entradas con coincidencia exacta de ID/nombre según la API y marca 4 imágenes especialmente ambiguas para revisión manual. Para auditar desde VS Code, con la API local encendida:

\`\`\`powershell
node "$HOME\Downloads\MI_CIUDAD_COLON_CIERRE_FOTOS_CONTROLADO\CERRAR_FOTOS_MI_CIUDAD.mjs" --auditar "--proyecto=$PWD" --api=http://localhost:3000
\`\`\`

Si la carpeta extraída es distinta, seleccionar el archivo .mjs desde Explorer y arrastrarlo a la terminal luego de escribir \`node \`. No suponer nombres de carpetas.

Después de inspeccionar \`REPORTES/AUDITORIA_FOTOS.csv\` y verificar los lugares correctos:

\`\`\`powershell
node "$HOME\Downloads\MI_CIUDAD_COLON_CIERRE_FOTOS_CONTROLADO\CERRAR_FOTOS_MI_CIUDAD.mjs" --aplicar "--proyecto=$PWD" --api=http://localhost:3000
\`\`\`

No reemplazar la foto de \`lug-005\` si no corresponde exactamente al museo de la API. \`lug-011\` es de muy baja resolución en origen. No usar una foto de Playa Paso Vera para un lugar llamado \`Paso Vela\`. No usar Hostería del Puerto para un comercio diferente.

Verificar \`src/servicios/fotosLocales.ts\`: cada \`require('../../assets/lugares/archivo.jpg')\` debe existir. Confirmar todas las fichas en teléfono.

## C. Comprobaciones antes de compilar

\`\`\`powershell
npm run mapas:check
npm run typecheck
npm run giovanni:check
npm run entrega:check -- --apk
\`\`\`

En \`giovanni:check\` puede pasarse una URL pública explícita:

\`\`\`powershell
npm run giovanni:check -- --api https://DIRECCION_PUBLICA_REAL
\`\`\`

**No escribir \`https://DIRECCION_PUBLICA_REAL\` literalmente; es un ejemplo.** El backend del docente debe estar desplegado con HTTPS, funcionando incluso cuando la PC está apagada. El proyecto y el ZIP original de la cátedra son cosas distintas: subir la aplicación a EAS no publica NestJS/SQLite automáticamente.

Para el backend publicado, verificar desde el navegador del teléfono, usando datos móviles (Wi-Fi desactivada):

\`\`\`text
https://TU_HOST_REAL/salud
https://TU_HOST_REAL/lugares?porPagina=500
\`\`\`

Si no funciona, no compilar la versión para Giovanni aún. Si se usa un \`trycloudflare.com\` temporal, será una **demo con PC encendida**, no una entrega autosuficiente.

## D. Resolver bloqueo de Metro en Windows

El proyecto QA anterior reutilizaba un enlace a \`node_modules\` en la carpeta principal; ello provocó resolución cruzada y múltiples errores de memoria. **No usar QA para la entrega**.

Para validar la copia principal, abrir una terminal de VS Code ubicada en su raíz, comprobar \`node_modules\expo\package.json\`, y usar **un trabajador**:

\`\`\`powershell
$env:NODE_OPTIONS="--max-old-space-size=2048"
npx expo start --tunnel --clear --max-workers 1
\`\`\`

Esto puede fallar si la PC no dispone de RAM/archivo de paginación suficientes. No aumentar indiscriminadamente los límites ni eliminar carpetas originales.

## E. APK Android por EAS (no necesita Metro después de instalada)

La URL de API usada en \`.env\` **no alcanza**: se debe configurar también en Expo EAS \`preview\`:

\`\`\`powershell
npx eas-cli@latest login
npx eas-cli@latest env:list --environment preview
\`\`\`

Si no aparece \`EXPO_PUBLIC_API_URL\` con el HTTPS estable, registrarla (reemplazar el host de ejemplo):

\`\`\`powershell
npx eas-cli@latest env:set --environment preview --name EXPO_PUBLIC_API_URL --value https://TU_HOST_REAL --visibility plaintext
\`\`\`

Si existe pero apunta a otra URL, actualizarla desde Expo/EAS. **No copiar claves privadas ni contraseñas a EXPO_PUBLIC_**.

Luego, con cambios y fotos incluidos en el snapshot de la build:

\`\`\`powershell
npm run entrega:check -- --apk
npx eas-cli@latest build --platform android --profile preview
\`\`\`

El perfil \`preview\` ya configura \`android.buildType=apk\`. EAS entregará un enlace para descargar la APK. Instalarla en Android sin Metro y probar Wi-Fi y datos móviles.

## F. iPhone de Giovanni (SDK 58)

Expo Go normal de App Store **no soporta SDK 58**. Un QR de Metro no equivale a una app iOS distribuible a Giovanni.

Con Apple Developer Program y firma válida, usar una de estas rutas:

1. **iOS ad hoc interno:** registrar el iPhone de Giovanni con \`npx eas-cli@latest device:create\`, crear \`npx eas-cli@latest build --platform ios --profile preview\`; la instalación necesita el dispositivo aprovisionado. En iOS 16+, activar Modo Desarrollador si se solicita.
2. **TestFlight:** compilar para distribución Store y subir a App Store Connect / TestFlight; invitar el correo Apple ID de Giovanni según el tipo de tester.

**No enviar un APK a un iPhone**: Android e iOS son binarios distintos. La compilación iOS requiere credenciales Apple y puede necesitar permisos o revisión.

## G. Lista de pruebas obligatorias, ambos teléfonos

- Abrir sin Metro ni computadora, con red propia.
- Catálogo activo de 26 lugares según API (no mocks).
- Fotografías correctas por ID y sin repetición indebida.
- Mapa visible, permisos GPS concedidos y denegados.
- Filtros, marcadores, toque y ficha correcta, mapa movible y zoom.
- Inicio de sesión, favoritos, visitas, QR/cámara, archivos, audio y notificación **real**.
- Aplicación funcionando en red Wi-Fi y 4G/5G; volver a abrir tras cerrarla.

Si cualquiera de estas pruebas falla, conservar el binario como **versión de prueba** y no presentarlo como entrega final.
