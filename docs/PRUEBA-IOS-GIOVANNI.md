# Giovanni Percara — probar Mi Ciudad Colón desde iPhone (SDK 58)

Este proyecto usa Expo **SDK 58** y necesita un cliente de prueba que
admita exactamente ese SDK. En iPhone, confirmá qué SDK soporta
tu versión instalada de **Expo Go** (no es una versión de iOS).

## Si Expo Go del iPhone ya admite SDK 58

1. Giovanni abre Expo Go y verifica que inició sesión en la misma
   cuenta Expo que se usa en la PC.
2. En la PC, verificar la cuenta con `npx expo whoami`.
3. La PC inicia el backend NestJS del docente, y un túnel HTTPS
   separado para la API con `cloudflared`, **solo con datos ficticios**.
4. La terminal de Expo se inicia con
   `npm run grupo:conectar -- https://DIRECCION-REAL.trycloudflare.com`.
5. Giovanni escanea el QR de Expo desde iPhone. No necesita compartir
   la misma Wi-Fi que la PC; sí necesita Internet.
6. Revisar el mapa, fotos en tarjetas y detalle, GPS, permisos y rutas.

Ver [PRUEBAS-COMPANEROS.md](PRUEBAS-COMPANEROS.md) para los tres
comandos exactos, cómo comprobar la API y el informe de fotografías.

**Recordatorio importante:** el QR de Expo y el túnel HTTPS de la API
son conexiones distintas. Sin la API accesible, la app puede abrir y,
sin embargo, no cargar fotos, visitas o login.

## Si Expo Go no admite SDK 58 en ese dispositivo

En un iPhone físico no se instalan libremente versiones anteriores
de Expo Go como se hace con APK en Android. En ese caso se necesita
una **compilación iOS de desarrollo** firmada, distribuida mediante
EAS/TestFlight o instalación local con Mac/Xcode.

El proyecto tiene perfil EAS `preview`. Para distribución remota
desde Windows, se necesita un equipo Apple Developer activo:
```powershell
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Registrar el dispositivo, preparar firma y configurar en el entorno
EAS `preview` una **URL HTTPS estable** para la API antes de compilar.
No usar la IP privada ni un Quick Tunnel que probablemente caduque
antes de instalar el build.

Para una prueba presencial con Mac y Xcode existe una vía de firma
local, pero no produce un enlace de distribución remota desde Windows.

## Confirmar imágenes del docente

```powershell
npm run api:fotos:grupo -- http://localhost:3000
npm run api:fotos:grupo -- https://DIRECCION-REAL.trycloudflare.com
```

Una imagen ausente en la API no aparece mágicamente por utilizar
otro SDK. Si algún lugar devuelve HTTP 403/404, URL vacía o el
mismo PNG de otro lugar, hay que corregir archivos o registros del
backend de la cátedra. No reemplazar las fotos oficiales por imágenes
ajenas a la consigna.

Fuentes:
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- https://expo.dev/changelog/sdk-58
- https://expo.dev/changelog/expo-go-57-login
- https://docs.expo.dev/build/internal-distribution/
