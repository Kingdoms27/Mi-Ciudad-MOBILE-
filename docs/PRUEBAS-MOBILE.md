# Plan de pruebas en teléfono

## Base
- [ ] Abrir con Expo Go y verificar las cinco tabs.
- [ ] Cerrar/reabrir app y comprobar sesión.
- [ ] Aumentar tamaño de fuente del sistema y revisar que no se corte contenido crítico.
- [ ] Probar tema claro, oscuro y sistema.
- [ ] Abrir Inicio sin conexión y confirmar que la imagen de portada local aparece correctamente.
- [ ] Abrir tres pantallas rápidamente al iniciar y confirmar que SQLite no lanza errores de tabla inexistente.

## Red/offline/API
- [ ] Abrir lugares con Internet para poblar caché.
- [ ] Activar modo avión y reabrir: el catálogo debe mostrar la última caché remota válida si existe; si la API no está configurada, deben aparecer los mocks.
- [ ] Simular error de API con URL configurada: no debe reemplazarse una caché remota válida por mocks.
- [ ] Registrar visita offline: debe mostrar “Guardada en el teléfono”.
- [ ] Con API no configurada, sincronizar pendientes: deben seguir pendientes y la interfaz debe explicarlo.
- [ ] Con API configurada, enviar una visita y verificar que sólo cambia a sincronizada tras una respuesta satisfactoria.
- [ ] Recuperar Internet y pulsar sincronizar.

## Ubicación/mapa
- [ ] Probar Android: confirmar que aparecen mosaicos/calles CARTO/OSM, no sólo fondo liso.
- [ ] Arrastrar el mapa durante varios segundos: no debe parpadear ni volver a descargar todos los mosaicos continuamente.
- [ ] Probar zoom con botones y con dos dedos.
- [ ] Tocar un marcador y verificar la selección y la ruta a detalle.
- [ ] Conceder ubicación y comprobar punto/distancias.
- [ ] Denegar ubicación y confirmar que listado y mapa siguen utilizables.
- [ ] Probar “Cómo llegar”.
- [ ] Probar flecha/magnetómetro y calibrar teléfono con movimiento en 8.
- [ ] Probar iOS y comprobar el mapa nativo `react-native-maps`.
- [ ] Confirmar con la cátedra que la variante de mapa usada en Android es aceptable.

## Cámara/QR/fotos
- [ ] Escanear `COLON:lug-004` desde un QR generado con ese texto.
- [ ] Escanear QR ajeno: mostrar error y permitir reintento.
- [ ] Registrar visita con cámara.
- [ ] Registrar visita eligiendo foto de galería.
- [ ] Cerrar y abrir app: la foto de la visita debe seguir visible.

## Notificaciones
- [ ] Guardar un evento futuro y aceptar permisos; confirmar que se programó el recordatorio.
- [ ] Denegar permisos; el evento debe quedar guardado y la interfaz debe advertir que no se programó el aviso.
- [ ] Intentar recordar un evento pasado; no debe crearse una notificación vencida.
- [ ] Cancelar/suspender un evento y confirmar que el recordatorio anterior se cancela.
- [ ] Probar aviso de proximidad cerca de un lugar y confirmar máximo un aviso por lugar y fecha local.

## Auth/seguridad
- [ ] Login demo correcto: `lucia@mail.com / 123456`.
- [ ] Login demo incorrecto: una contraseña diferente debe rechazarse.
- [ ] Ingresar un correo de otra cuenta con contraseña incorrecta; no debe iniciar sesión ni reutilizar el perfil anterior.
- [ ] Registrar usuario, cerrar sesión e ingresar otra vez con el mismo correo/contraseña.
- [ ] Verificar que el token se guarde en SecureStore y no en kv-store.
- [ ] Validar huella/rostro si el dispositivo tiene biometría.

## Audio
- [ ] Reproducir, pausar, avanzar y retroceder.
- [ ] Confirmar que las pistas SoundHelix aparecen como audio de demostración.
- [ ] Bloquear pantalla y confirmar continuidad en build compatible.
- [ ] Descargar una pista, activar modo avión y reproducirla.

## Build
- [ ] Ejecutar `npx expo install --check`.
- [ ] Ejecutar `npm run typecheck`.
- [ ] Ejecutar `npx expo-doctor@latest`.
- [ ] Versionar `package-lock.json` para reproducir dependencias.
- [ ] `eas build --platform android --profile preview`.
- [ ] Instalar APK en un teléfono sin Metro.
