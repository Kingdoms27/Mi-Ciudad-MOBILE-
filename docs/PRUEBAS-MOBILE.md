# Plan de pruebas en teléfono

## Base
- [ ] Abrir con Expo Go y verificar las cinco tabs.
- [ ] Cerrar/reabrir app y comprobar sesión.
- [ ] Aumentar tamaño de fuente del sistema y revisar que no se corte contenido crítico.
- [ ] Probar tema claro, oscuro y sistema.

## Red/offline
- [ ] Abrir lugares con Internet para poblar caché.
- [ ] Activar modo avión y reabrir: catálogo/agenda deben seguir mostrando datos.
- [ ] Registrar visita offline: debe mostrar “Guardada en el teléfono”.
- [ ] Recuperar Internet y pulsar sincronizar: debe pasar a “Sincronizada”.

## Ubicación/mapa
- [ ] Conceder ubicación y comprobar punto/distancias.
- [ ] Denegar ubicación y confirmar que listado/mapa siguen usables.
- [ ] Probar “Cómo llegar”.
- [ ] Probar flecha/magnetómetro y calibrar teléfono con movimiento en 8.

## Cámara/QR/fotos
- [ ] Escanear `COLON:lug-004` desde un QR generado con ese texto.
- [ ] Escanear QR ajeno: mostrar error y permitir reintento.
- [ ] Registrar visita con cámara.
- [ ] Registrar visita eligiendo foto de galería.
- [ ] Cerrar y abrir app: foto de la visita debe seguir visible.

## Notificaciones
- [ ] Guardar un evento y aceptar permisos.
- [ ] Confirmar recordatorio programado.
- [ ] Probar aviso de proximidad cerca de un lugar.
- [ ] Confirmar que no se repita el mismo aviso el mismo día.

## Auth/seguridad
- [ ] Registro de usuario.
- [ ] Login con mock `lucia@mail.com / 123456`.
- [ ] Cerrar app sin cerrar sesión y reabrir.
- [ ] Validar huella/rostro si el dispositivo tiene biometría.
- [ ] Probar alternativa con contraseña.
- [ ] Verificar que el token nunca se guarde en kv-store.

## Audio
- [ ] Reproducir audioguía.
- [ ] Pausar, avanzar y retroceder.
- [ ] Bloquear pantalla y confirmar continuidad.
- [ ] Descargar audioguía, activar modo avión y reproducirla.

## Build
- [ ] Ejecutar `npx expo-doctor@latest`.
- [ ] Ejecutar `npm run typecheck`.
- [ ] `eas build --platform android --profile preview`.
- [ ] Instalar APK en un teléfono sin Metro.
