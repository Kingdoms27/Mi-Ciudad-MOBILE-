# Prueba iOS para Giovanni Percara — Mi Ciudad Colón

**Objetivo:** probar en un iPhone físico la misma aplicación Expo SDK 57
que ya se utiliza en Android, sin actualizar SDK, modificar el mapa ni
reemplazar las imágenes oficiales de la API de la cátedra.

**Método recomendado para una prueba remota rápida:** Expo Go
de App Store compatible con SDK 57 y un túnel HTTPS para la API
de la cátedra. Ya no es obligatorio generar IPA/TestFlight
para que Giovanni abra por primera vez el QR.


## Configuración existente (no cambiar)

- SDK Expo: `~57.0.32` (ver `package.json`).
- Proyecto EAS existente: `a925bc97-d857-4dba-86fc-9d327f0cc190`.
- Bundle identifier iOS: `ar.edu.uner.miciudadcolon`.
- Perfil EAS `preview`: `distribution: internal` y `environment: preview`.
  En iOS crea una compilación *ad hoc* para dispositivos autorizados.
- El mapa de iOS ya utiliza `react-native-maps` nativo.
- Las imágenes de lugares tienen como **primera fuente la API del docente**
  cuando se configura `EXPO_PUBLIC_API_URL` (PR #21).

## Método principal: Expo Go SDK 57 en iPhone

Expo confirmó el **3 de septiembre de 2026** que la app Expo Go
en App Store fue actualizada y admite SDK 57.
Fuente: https://expo.dev/changelog/expo-go-57-login

Hay un requisito nuevo: **Expo CLI y Expo Go del iPhone deben estar
autenticados en la misma cuenta de Expo**.

1. En Windows, dentro del proyecto, ejecutá `npx expo whoami`.
2. Si la sesión no es `giovannipercara`, iniciar sesión con la
   cuenta que acuerden usar, sin compartir contraseñas.
3. Giovanni abre Expo Go en el iPhone actualizado desde App Store e
   inicia sesión con esa misma cuenta.
4. Con la API pública HTTPS disponible, ejecutar
   `npm run grupo:conectar -- https://TU-API-HTTPS`.
5. Giovanni escanea el QR remoto de Expo desde su iPhone.

**No** hay que compilar un IPA para este método. Si Giovanni
obtiene un error de sesión, consultar
https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/.

Si la app instalada no admite SDK 57, es necesario actualizarla desde
App Store o usar una compilación de desarrollo compatible.

## Alternativa para distribución iOS independiente

Para generar una **compilación instalable en la nube con EAS** y
compartirla con compañeros sin necesitar iniciar sesión en Expo Go,
se requiere una cuenta Apple Developer Program activa y acceso a la
firma de la aplicación. La cuenta Expo de Giovanni
(`giovannipercara`) no equivale a Apple Developer. No pedir
contraseñas de Apple a los compañeros.

También es posible instalar una development build desde una Mac con
Xcode y un iPhone conectado, pero eso no produce automáticamente un
enlace de instalación remoto desde Windows.


## 1. Elegir cómo llegará la API al iPhone

**Giovanni y la PC están en la misma Wi-Fi:** la API puede ejecutarse en
la PC. Primero comprobar desde Safari en el iPhone
`http://IP-DE-TU-PC:3000/salud`. Pero **Safari funcionando no garantiza
que React Native cargue HTTP**: iOS impone *App Transport Security* (ATS)
y, sin una excepción de red local en Info.plist, el build propio puede
bloquear las imágenes y peticiones `http://`. **La opción recomendada es
una API HTTPS accesible desde el iPhone**. Si se necesita específicamente
HTTP en la misma Wi-Fi, habilitar en una compilación de prueba una
excepción ATS limitada a red local, verificar su alcance y reconstruir
el .ipa. No desactivar ATS globalmente para publicar.

La URL concreta se configura en el entorno EAS de la compilación.
Si cambia, será necesario generar una nueva compilación de prueba.

**Giovanni está en otra red o en su casa:** `localhost` y las
IP privadas no funcionan. Para mostrar las imágenes de la cátedra, el
backend debe tener una URL pública HTTPS. Para una sesión temporal
usamos `cloudflared tunnel --url http://localhost:3000` y luego
`npm run grupo:conectar -- https://TU-SUBDOMINIO.trycloudflare.com`.
Esto comparte **API y Metro con túneles independientes**.
El servidor y ambos túneles deben seguir funcionando.

Para una distribución mediante EAS (no Expo Go), `EXPO_PUBLIC_API_URL`
debe configurarse también en el entorno EAS `preview` antes de
compilar. Una URL efímera de Cloudflare no es adecuada para
distribuir builds que se probarán más adelante; preferir HTTPS estable.


## 2. [Opcional] Configurar EAS en Windows si no se utiliza Expo Go

En una terminal PowerShell dentro de `Mi-Ciudad-MOBILE-`:

```powershell
git pull --ff-only origin main
npm ci
npm run typecheck
npx eas-cli@latest whoami
npx eas-cli@latest env:list --environment preview
```

El usuario Expo que inicia el build debe ser propietario del proyecto
EAS actual o colaborador con permisos; no es obligatorio usar la cuenta
personal de Giovanni para construir un .ipa.

Abrir [Expo Dashboard](https://expo.dev/) y definir
`EXPO_PUBLIC_API_URL` en **Environment: preview**. Verificar luego
que la API responda desde la red donde estará el iPhone.

## 3. [Opcional] Registrar el dispositivo de Giovanni para EAS

Con la cuenta Apple Developer del equipo disponible, ejecutar:

```powershell
npx eas-cli@latest device:create
```

EAS puede generar un enlace de registro del dispositivo. Compartir ese
enlace **únicamente con Giovanni** para que registre su iPhone y el
identificador UDID necesario para la firma *ad hoc*. El registro deberá
quedar confirmado en el perfil de aprovisionamiento Apple durante el
build. Giovanni no necesita compartir su Apple ID ni su contraseña.

## 4. [Opcional] Generar la aplicación iOS con SDK 57

Desde la carpeta del proyecto:

```powershell
npx eas-cli@latest build --platform ios --profile preview
```

Seguir las indicaciones de credenciales de Apple en el flujo oficial de
EAS. Seleccionar el dispositivo de Giovanni en la lista de dispositivos
registrados. Este paso **puede requerir interacciones del propietario
Apple Developer**, aunque la compilación se ejecuta en la nube.

Una vez que EAS confirme la compilación, abrir la URL oficial del build
y compartir con Giovanni el enlace **Install** del artefacto iOS.

Para el modo *ad hoc* de iOS 16+, Giovanni puede tener que activar
**Developer Mode** en Configuración > Privacidad y seguridad > Modo
desarrollador, tras instalar la compilación y reiniciar el dispositivo.

> Si se incorpora otro iPhone o se agrega un dispositivo después de
> crear el perfil, hay que revisar el perfil de firma y normalmente
> generar otro build que incluya ese dispositivo.

## 5. Plan de prueba de Giovanni

- [ ] Abrir Mi Ciudad Colón con Expo Go SDK 57, o instalar su build iOS opcional.
- [ ] Navegar por Inicio, Lugares, Mapa, Agenda, Recorrido y Cuenta.
- [ ] Comprobar que `/salud` y `/lugares` de la API de la cátedra son
      accesibles **desde el iPhone**; ver imágenes de los lugares
      directamente provenientes de `/archivos/`.
- [ ] Revisar fotografías de tarjetas y detalles y anotar qué ID de
      lugar muestra un archivo faltante, repetido o incorrecto.
- [ ] Probar el mapa iOS existente, marcadores, GPS concedido/denegado
      y botón de detalle sin cambiar la cartografía.
- [ ] Probar QR, cámara, galería, favoritos, visitas y acceso
      según la consigna; dejar constancia de errores reales.
- [ ] Registrar capturas y versión instalada para evidencia del trabajo.

El diagnóstico de fotos de la API desde la computadora puede ejecutarse,
**sin alterar bases ni archivos**, con:

```powershell
npm run api:imagenes -- http://localhost:3000
```

La auditoría del servidor no reemplaza la prueba de imágenes desde el
iPhone. La API debe estar encendida y accesible desde ese dispositivo.

## Alternativa: TestFlight

Con Apple Developer activo, también se puede preparar un build
`production` de EAS para App Store Connect y distribuirlo con
**TestFlight**, sin registrar previamente el UDID del iPhone. Para un
invitado externo al equipo de App Store Connect, la primera
compilación requiere **Beta App Review** de Apple. Esta alternativa es
útil para varios testers; para un solo iPhone registrado, el
`preview` interno suele ser un camino más directo.

## Fuentes oficiales

- [Expo: soporte SDK 57 en Expo Go iOS y login compartido](https://expo.dev/changelog/expo-go-57-login)
- [Expo: sesión de iPhone y CLI debe coincidir](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/)
- [Cloudflare: Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
- [Expo: versión incompatible de Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
- [Expo: distribución interna iOS ad hoc](https://docs.expo.dev/build/internal-distribution/)
- [Expo: build de iOS para dispositivos reales](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/)
- [Expo: Developer Mode en iOS](https://docs.expo.dev/guides/ios-developer-mode/)
- [Expo: TestFlight](https://docs.expo.dev/submit/testflight/)
- [Expo: build local en iOS sin Apple Developer pago](https://docs.expo.dev/develop/development-builds/introduction/)
- [Apple: App Transport Security (ATS)](https://developer.apple.com/documentation/security/preventing-insecure-network-connections)
