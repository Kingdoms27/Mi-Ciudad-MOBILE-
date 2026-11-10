# Mi Ciudad Colón — Instalación desde Git para la cátedra (Expo Go SDK 58)

Esta guía aplica **si la cátedra confirma expresamente que admite solo
repositorio Git y ejecución local en vez de APK**. El documento original
"Trabajo Integrador — Entrega Final" exige **repositorio y APK preview**;
pedir y conservar la confirmación del cambio de modalidad.

## ¿Qué se entrega?

- Código móvil: https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-
- Instrucciones de instalación y pruebas (este archivo).
- **La API oficial original del docente** `api-proyectos-mobile-main.zip`,
  obtenida por el mismo mecanismo que facilitó la cátedra. **NO está
  incluida en el repositorio móvil.** No subir SQLite personal, usuarios
  reales, `.env`, tokens ni credenciales.
- Exponer las versiones: **Node.js 24+**, Expo SDK 58 y Expo Go compatible.

Con modalidad Git **no** es necesario un hosting público: cada persona
ejecuta **su propia API local** y su propio Metro. La API usa el puerto
3000 y Metro usa el 8081. La computadora queda encendida durante las pruebas.

## 1. Clonar e instalar en Windows

Instalar Git, Node.js **24 o superior** (lo exige el script del backend)
y Expo Go compatible con SDK 58 en el teléfono.

En PowerShell:

```powershell
git clone https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-.git
cd Mi-Ciudad-MOBILE-
npm ci
npx expo install --check
npm run typecheck
```

Colocar el ZIP **original del profesor** `api-proyectos-mobile-main.zip`
en Descargas. El proyecto NO lo necesita dentro de GitHub. El script
lo extrae en `%LOCALAPPDATA%\MiCiudadColon\backend`, prepara SQLite
de demostración únicamente si está vacía y no borra una base previa.

## 2. Iniciar la API del profesor

**Terminal 1** (dejar abierta):

```powershell
npm run api:iniciar:win
```

Comprobar en **otra terminal**:

```powershell
Invoke-RestMethod http://localhost:3000/salud
npm run api:check -- http://localhost:3000
```

Si el ZIP está en otra carpeta, usar:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1 -ZipPath "C:\ruta\api-proyectos-mobile-main.zip"
```

## 3. Conectar el teléfono real por Wi-Fi

**Terminal 2**, con la API ya encendida:

```powershell
npm run api:conectar:win
```

El script verifica `/salud`, `/lugares` y una imagen desde la IP LAN
de **esa computadora**, configura localmente `EXPO_PUBLIC_API_URL`
en `.env` o `.env.local` y ejecuta Expo Go con Metro. Esos archivos
están excluidos de Git y **no se deben subir**.

Conectar teléfono y PC a la misma red Wi-Fi/LAN **con acceso mutuo**,
abrir Expo Go SDK 58 y escanear el QR recién generado (no uno antiguo).

Si la app no descarga, comprobar la red desde Chrome del celular:

```text
http://IP_REAL_PC:8081/status
http://IP_REAL_PC:3000/salud
```

Sustituir la IP por la que indica Metro o por `ipconfig`.
La primera ruta debe responder `packager-status:running`.
La API **no** debe apuntar a `localhost` desde un teléfono físico.
La IP cambia según la casa o la red de la persona que prueba.

Si la red aísla dispositivos, usar otra Wi-Fi privada compartida o
permitir Node.js/puertos de desarrollo **solo en el firewall privado**;
no publicar puertos a Internet.

## 4. Verificar trabajo académico, sin APK

Desde otra terminal, ejecutar:

```powershell
npm run entrega:check
npm run api:fotos:grupo -- http://localhost:3000
```

**NO usar** `npm run entrega:check -- --apk` para validar exclusivamente
la modalidad Git: ese modo requiere deliberadamente una API HTTPS estable,
porque simula una APK instalable sin computadora. Una IP LAN es
perfectamente válida para pruebas con **Git + Expo Go + backend local**.

Evaluar personalmente los diez requisitos: navegación, autenticación,
consumo API (sin confundirlo con mocks), cámara/QR y archivos, GPS y mapa,
recordatorios **locales** por una acción real, SQLite/offline, sensores
o háptica, audioguías e identidad propia.

### Fotografías

El ZIP original de la cátedra contiene imágenes PNG genéricas/repetidas.
La app usa primero fotos autorizadas que ya están empaquetadas para
lugares identificados y puede descargar otras verificadas de Commons;
las fotos ausentes/duplicadas en la API **no significan** que Expo o la red
estén fallando. `lug-003` es un caso intencional sin URL.

Consultar los créditos desde **Mi cuenta → Créditos fotográficos**.
No asignar una foto de un comercio distinto a un lugar sin verificarla.

### Notificaciones

El módulo push remoto del backend docente (`/dispositivos`) devuelve
`NO_IMPLEMENTADO` y **no es el requisito de notificaciones locales**.
Las notificaciones locales tienen su flujo de prueba en la app y no
necesitan un servidor de push. El comportamiento de permisos/canales
de Expo Go puede diferir de una build nativa; una advertencia como
`setNotificationChannelAsync` rechazada implica que **ese teléfono
todavía no pasó la prueba real de notificaciones**. No declarar ese
requisito validado sin recibir un aviso auténtico.

## Modalidad APK (solo si sigue siendo obligatoria)

El PDF del Trabajo Integrador original exige un APK preview que arranque
**sin Metro ni computadora**. Clonar Git y ejecutar localmente **no**
sustituye esa modalidad. Para construir una APK independiente también se
necesita una API HTTPS estable y accesible, configurada en EAS preview,
o una aceptación explícita del profesor para evaluar con datos locales.

Referencia adicional: `docs/CIERRE-ENTREGA-2026.md`.
