# Mi Ciudad Colón — Plan de prueba de mapas Android + iOS

**Estado:** lista de pruebas manuales, no certificado de funcionamiento.

## Arquitectura confirmada

- **iOS:** `react-native-maps` usa **Apple Maps (MapKit)** con `provider={undefined}`. No requiere clave de Google Maps.
- **Android con clave de Google:** `react-native-maps`, activado por `GOOGLE_MAPS_ANDROID_API_KEY` en EAS.
- **Android sin clave de Google:** mapa OpenStreetMap en `react-native-webview`. Los mosaicos requieren conexión. Sin conexión, la app debe seguir mostrando pantallas y mensajes sin bloquearse.
- Los dos sistemas usan las coordenadas que entrega la API docente y el mismo mecanismo de selección de lugar.

## Comprobación automática (sin cambiar datos)

```powershell
npm run mapas:check
npm run typecheck
npm run entrega:check
```

Para preparar **APK externa** (fuera de la red de la PC):

```powershell
npm run entrega:check -- --apk
npx eas-cli@latest env:list --environment preview
```

La variable `EXPO_PUBLIC_API_URL` del entorno EAS `preview` debe apuntar a un HTTPS **estable**. Ni `localhost` ni una IP 192.168.x.x funcionarán en otro domicilio. Un túnel temporal que caduca tampoco es adecuado para la entrega permanente.

## QA manual — probar tanto en Android como en iPhone

- [ ] Abrir `Mapa` y esperar la cartografía sin pantalla blanca ni error.
- [ ] Mostrar los 26 lugares activos de la API (si el catálogo realmente entrega 26).
- [ ] Tocar 3 marcadores en distintas zonas: nombre correcto y panel de detalle.
- [ ] Tocar `Ver lugar`: ficha del mismo ID que el marcador, con su foto correspondiente.
- [ ] Cambiar filtros de categorías: marcadores visibles y contador concuerdan.
- [ ] Acercar y alejar; mover el mapa; volver a Colón.
- [ ] Permitir GPS: ver ubicación del teléfono, centrar mapa, y distancias plausibles.
- [ ] Denegar GPS: mapa y marcadores continúan funcionando.
- [ ] Reabrir app y visitar mapa después de cambiar tema claro/oscuro.
- [ ] Probar mala conexión: el mapa no debe bloquear otras funciones de la app.
- [ ] Verificar que no se usan coordenadas inválidas ni hay cierres inesperados.
- [ ] Abrir las fichas desde el mapa y regresar con navegación normal.

## Cómo probar en iPhone

1. Instalar la versión de **Expo Go** compatible con el SDK 58 del proyecto.
2. En la PC, mantener activa la API docente; si el iPhone está en otra red, publicar la API en HTTPS.
3. Desde la carpeta del proyecto: `npx expo start --tunnel --clear`.
4. Escanear el QR con la cámara/Expo Go del iPhone y entrar al mapa.
5. Probar permisos de localización con `Configuración > Privacidad y seguridad > Localización` si fuera necesario.

**Observación:** ver el mapa en Expo Go no valida por sí solo un ejecutable iOS independiente. Para distribuir una IPA firmada fuera de Expo Go se necesitan credenciales y aprovisionamiento Apple apropiados.

## Antes de marcar el mapa como finalizado

Guardar capturas o vídeo de prueba Android e iPhone, y resultados de los comandos anteriores. El código de mapa no debe considerarse validado en ambos SO sin esas pruebas.
