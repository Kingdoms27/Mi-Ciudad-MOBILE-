# Prueba iOS para Giovanni Percara — Mi Ciudad Colón

**Objetivo:** probar en un iPhone físico la misma aplicación Expo SDK 57
que ya se utiliza en Android, sin actualizar SDK, modificar el mapa ni
reemplazar las imágenes oficiales de la API de la cátedra.

**Estado:** preparado para configurar y generar una versión de prueba;
**todavía no se ha construido ni instalado un .ipa en el iPhone**.

## Configuración existente (no cambiar)

- SDK Expo: `~57.0.32` (ver `package.json`).
- Proyecto EAS existente: `a925bc97-d857-4dba-86fc-9d327f0cc190`.
- Bundle identifier iOS: `ar.edu.uner.miciudadcolon`.
- Perfil EAS `preview`: `distribution: internal` y `environment: preview`.
  En iOS crea una compilación *ad hoc* para dispositivos autorizados.
- El mapa de iOS ya utiliza `react-native-maps` nativo.
- Las imágenes de lugares tienen como **primera fuente la API del docente**
  cuando se configura `EXPO_PUBLIC_API_URL` (PR #21).

## Requisito indispensable para iPhone físico

Se necesita una **membresía Apple Developer Program activa y de pago**
del propietario/equipo que firma la aplicación, además del acceso al
proyecto EAS para iniciar la compilación. La cuenta Expo de Giovanni
(`giovannipercara`) **no equivale** a Apple Developer, ni le permite
instalar por sí sola un .ipa. No pedir ni compartir contraseñas de Apple.

No se puede instalar el APK de Android en iPhone.

Con SDK 57 no basta con que Giovanni descargue Expo Go de App Store. A
partir de SDK 54, Expo documenta que la distribución compatible de Expo
Go en iOS físico se realiza mediante **EAS Go/TestFlight**, que también
requiere Apple Developer. Para esta prueba concreta se recomienda una
compilación propia, sin depender de Expo Go.

Revisar compatibilidad: Expo SDK 57 requiere **iOS 16.4 o posterior**.

## 1. Elegir cómo llegará la API al iPhone

**Giovanni y la PC están en la misma Wi-Fi:** la API puede ejecutarse en
la PC y servir datos a través de `http://IP-DE-TU-PC:3000`. Verificar
desde Safari del iPhone que la URL `/salud` responde. La IP concreta
se configura en el entorno EAS de la compilación. Si cambia la IP,
será necesario generar una nueva compilación de prueba con la URL nueva.

**Giovanni está en otra red o en su casa:** `localhost` y la IP privada
de tu PC **no funcionan**. Para mostrar las fotos del docente, se
necesita una URL pública **HTTPS** con la API real, sus imágenes y
almacenamiento persistente. El túnel de Metro/Expo **no publica la API**.
No compilar un enlace `localhost:3000` ni una IP privada para una
prueba remota.

El entorno EAS `preview` debe contener `EXPO_PUBLIC_API_URL` con la
URL realmente accesible desde el iPhone **antes de compilar**. Esta
variable es pública por diseño; no colocar contraseñas ni tokens aquí.

## 2. Configurar la herramienta EAS en Windows

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

## 3. Registrar el dispositivo de Giovanni

Con la cuenta Apple Developer del equipo disponible, ejecutar:

```powershell
npx eas-cli@latest device:create
```

EAS puede generar un enlace de registro del dispositivo. Compartir ese
enlace **únicamente con Giovanni** para que registre su iPhone y el
identificador UDID necesario para la firma *ad hoc*. El registro deberá
quedar confirmado en el perfil de aprovisionamiento Apple durante el
build. Giovanni no necesita compartir su Apple ID ni su contraseña.

## 4. Generar la aplicación iOS con SDK 57

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

- [ ] Instalar y abrir la app nativa *Mi Ciudad Colón* en iPhone.
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

- [Expo: versión incompatible de Expo Go](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)
- [Expo: distribución interna iOS ad hoc](https://docs.expo.dev/build/internal-distribution/)
- [Expo: build de iOS para dispositivos reales](https://docs.expo.dev/tutorial/eas/ios-development-build-for-devices/)
- [Expo: Developer Mode en iOS](https://docs.expo.dev/guides/ios-developer-mode/)
- [Expo: TestFlight](https://docs.expo.dev/submit/testflight/)
