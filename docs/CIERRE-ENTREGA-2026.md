# Mi Ciudad Colón — Cierre de entrega (SDK 58)

Esta guía distingue **lo validado en código** de **las pruebas físicas pendientes**.
No declarar el Trabajo Integrador aprobado o la APK lista antes de probarla.

## Requisitos mínimos de Trabajo Integrador Final (2026)

| Punto | Implementación del proyecto | Verificación obligatoria |
|---|---|---|
| 1. Pantallas y navegación | Expo Router: Lugares, mapa, agenda, visitas, cuenta y detalle | Recorrer pantallas y enlaces sin cierres |
| 2. Autenticación | Cuenta API + SecureStore + reingreso biométrico | Registro/login, cerrar/reabrir y huella/clave |
| 3. Consumo API docente | Capa `src/servicios`, normalización, caché y estados | Comprobar datos de `/lugares` con URL del profesor |
| 4. Cámara, QR y archivos | Expo Camera, ImagePicker, File/Directory/Paths | Fotografiar visita, leer QR y reabrir registro offline |
| 5. GPS y mapa | expo-location + react-native-maps (o mapa compatible de reserva) | Con y sin permiso, marcadores y navegación |
| 6. Avisos locales | Guardar evento programa recordatorio; proximidad 1/lugar/día | Conceder permiso, guardar evento futuro, recibir aviso |
| 7. Offline / red | Expo SQLite, kv-store y expo-network | Abrir catálogo ya consultado sin Wi-Fi |
| 8. Sensores o háptica | Expo Sensors / Haptics | Flecha y vibración en acción real |
| 9. Multimedia | Expo Audio con controles; pantalla bloqueada requiere build propia | Reproducir, pausar, adelantar; probar background en APK |
| 10. Identidad | icono, splash y nombre Mi Ciudad Colón | Comprobar icono e inicio en build instalada |

**Avisos locales y push remoto NO son lo mismo.** La API docente deja
`/dispositivos` como `NO_IMPLEMENTADO`; eso no bloquea el requisito 6,
que exige notificaciones locales. Expo Go SDK 58 soporta avisos locales,
pero no push remoto de servidor en Android.

## Imágenes y material de Commons

- La fuente de verdad para el catálogo sigue siendo la API del profesor.
- Hay **siete fotografías empaquetadas** en `assets/lugares/`.
- Se priorizan fotos reales y acreditadas de Termas de Colón y la
  Parroquia Santos Justo y Pastor, descargadas de Commons. No están
  empaquetadas: necesitan red una vez y luego quedan en caché.
- Las demás fichas pueden mostrar PNG demostrativos de la API, fotos
  almacenadas previamente o un respaldo. No reemplazar esas fichas con
  fotos de comercios o monumentos diferentes.
- `lug-003` se deja sin foto en la API del profesor para conservar su
  caso negativo de prueba.
- Los créditos completos se pueden consultar desde **Mi cuenta →
  Créditos fotográficos**, incluso sin iniciar sesión.
- Para incorporar fotos propias y autorizadas sin modificar el backend:
  `npm run fotos:instalar -- "C:\MisFotosDeColon"`.
  Comprobar origen, licencia y correspondencia con cada lugar.

## Prueba en Android Expo Go

Abrir desde PowerShell:

```powershell
git status --short
git pull --ff-only origin main
npm ci
npm run typecheck
npm run entrega:check
```

En otra terminal iniciar la API:

```powershell
npm run api:iniciar:win
```

Y para un teléfono en la misma red:

```powershell
npm run api:conectar:win
```

Usar **el QR nuevo**, no el historial. Mantener Metro en puerto 8081.
Una pantalla de Expo Go `Failed to download remote update` se investiga
en Metro/red, no modificando imágenes.

**Prueba de notificaciones:** activar permiso desde Mi cuenta, ir a
Agenda y guardar un evento futuro. Si faltan menos de 60 minutos para
el evento, el recordatorio se programa unos segundos después de guardarlo.
Tocar el aviso puede abrir Expo Go/app: es una acción del sistema operativo,
no un reinicio espontáneo. Comprobar que lleva al evento. Para avisos
por proximidad se necesita ubicación, permiso de notificaciones y estar
realmente dentro del radio configurado; no son notificaciones remotas.

## Entrega APK sin Metro ni computadora

La consigna exige un **APK EAS con perfil preview** además del código
fuente, a menos que la cátedra comunique formalmente otra modalidad.

```powershell
npm run entrega:check -- --apk
npx eas-cli@latest whoami
npx eas-cli@latest env:list --environment preview
```

**Bloqueo importante:** la APK debe tener `EXPO_PUBLIC_API_URL` en el
entorno EAS `preview` apuntando a una API **HTTPS estable**, persistente,
con los datos y archivos necesarios. No usar `localhost`, una IP LAN
ni un Quick Tunnel `trycloudflare.com` temporal como URL de entrega.

Cuando la URL estable esté activa, crear/actualizar el valor en EAS
(sin credenciales dentro de Git):

```powershell
npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://TU-API-ESTABLE.example --environment preview --visibility plaintext
npx eas-cli@latest build --platform android --profile preview
```

Reemplazar el ejemplo por la URL pública real. Estas operaciones
requieren acceso a la cuenta Expo/EAS. No se ejecutan automáticamente
con el merge de GitHub.

**Prueba de aceptación de la APK:** instalar el archivo generado,
cerrar Metro y apagar la PC de desarrollo; abrir Mi Ciudad, recorrer
pantallas y usar caché/offline. Luego encender datos móviles y confirmar
que las solicitudes de API funcionan de forma remota. La APK no publica
por sí sola el servidor NestJS ni sus fotos. No exponer credenciales
reales o datos sensibles en un túnel público temporal.

## Antes de entregar

1. Confirmar que el flujo de notificaciones locales funciona en Android
   (permiso, entrega, toque, navegación y cancelación de recordatorio).
2. Completar atribuciones y revisar fotos de sitio exacto.
3. Probar 26 fichas activas de la API, fallbacks y caso sin foto.
4. Probar cámara, QR, registro de visita, biometría, mapa, audio y offline.
5. Ejecutar `npm run entrega:check -- --apk` y resolver bloqueos.
6. Crear y **probar realmente** APK EAS preview sin Metro ni PC.
7. Probar Expo Go SDK 58 en iPhone de Giovanni, o build iOS si su Expo Go
   no soporta los módulos requeridos.

La aprobación académica depende también de la defensa oral de todo el
grupo; no puede declararse automáticamente por las pruebas de CI.
