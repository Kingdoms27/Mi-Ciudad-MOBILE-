# Notas de desarrollo

## Decisiones del proyecto

- Stack fijado por la cátedra: React Native + Expo + TypeScript + Expo Router.
- SDK objetivo: Expo SDK 57.
- No se usa `expo-av`.
- Para archivos se usa la API nueva de `expo-file-system`: `File`, `Directory` y `Paths`.
- Los íconos usan `@react-native-vector-icons/ionicons`.
- Las pantallas nunca importan mocks directamente.
- Los servicios son asíncronos desde el primer día.
- El token de sesión se guarda sólo en `expo-secure-store`.
- Preferencias y caché usan `expo-sqlite/kv-store`.
- Visitas, favoritos y eventos guardados usan SQLite.
- Una visita se guarda primero con `sincronizada: false` y se sincroniza cuando vuelve Internet.
- Si se rechaza ubicación, la app continúa siendo usable.
- El QR esperado sigue el formato del PRD: `COLON:<id-lugar>`.
- Los avisos de proximidad se limitan a uno por lugar y por día.
- No se inventan endpoints de la API docente. Cuando la cátedra entregue el contrato, se ajusta únicamente `src/servicios/`.

## Implementado

- Catálogo, búsqueda, categorías y detalle de lugares.
- Mapa, ubicación, distancias, filtros y navegación externa.
- Agenda y detalle de eventos.
- Guardado de eventos y recordatorios locales.
- Registro e ingreso mock con sesión persistente.
- SecureStore y reingreso biométrico.
- Favoritos.
- Recorrido por QR, GPS y registro manual.
- Foto desde cámara o galería.
- Persistencia de fotos en Documents.
- Audioguías con reproducción en segundo plano.
- Descarga de audioguías para uso offline.
- Magnetómetro y flecha de orientación.
- Háptica.
- Caché y modo offline.
- Monitoreo de conectividad y cola de sincronización.
- Avisos de proximidad mientras el usuario se mueve con la app activa.
- Tema claro/oscuro/sistema.
- Estados de carga, error y vacío.
- Configuración EAS preview para APK.
- Documentación de pruebas y defensa.

## Pendientes externos antes de entregar

1. Recibir el contrato definitivo de la API de la cátedra y reemplazar/adaptar endpoints en la capa de servicios.
2. Completar integrantes oficiales del grupo en el README.
3. Vincular el proyecto a la cuenta Expo con `eas build:configure`.
4. Ejecutar pruebas en teléfonos reales Android/iPhone.
5. Generar el primer APK preview y corregir cualquier permiso/configuración nativa detectada por EAS.
