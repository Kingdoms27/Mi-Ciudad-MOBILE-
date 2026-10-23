# Notas de desarrollo

## Decisiones del proyecto

- Stack fijado por la cátedra: React Native + Expo + TypeScript + Expo Router.
- SDK objetivo: Expo SDK 57.
- No se usa `expo-av`.
- Para archivos se usa la API nueva de `expo-file-system`: `File`, `Directory` y `Paths`.
- Los íconos usan `@react-native-vector-icons/ionicons`.
- Las pantallas no importan mocks directamente; la lectura pasa por la capa de servicios.
- El token de sesión se guarda en `expo-secure-store`. Las contraseñas de cuentas locales de demostración también se guardan en almacenamiento seguro, ya que no hay autenticación de servidor hasta recibir la API oficial.
- Preferencias y caché usan `expo-sqlite/kv-store`.
- Visitas, favoritos y eventos guardados usan SQLite. Todas las operaciones esperan la inicialización del esquema antes de acceder a tablas.
- Una visita se guarda primero con `sincronizada: false`. Sólo pasa a sincronizada después de una respuesta HTTP satisfactoria de la API. Sin URL de API, permanece local y la interfaz lo informa.
- Si se rechaza ubicación, la app continúa siendo usable.
- El QR esperado sigue el formato del PRD: `COLON:<id-lugar>`.
- Los avisos de proximidad se limitan a uno por lugar y día local.
- Los recordatorios requieren permiso y una fecha de evento válida; al cambiar el estado de un evento se cancelan o actualizan los avisos asociados.
- El ZIP recibido `api-proyectos-mobile-main.zip` incluye `api-mi-ciudad`: se integraron los endpoints reales de autenticación, `/yo`, catálogo/QR, eventos, favoritos, eventos guardados, visitas y archivos. El cambio entre mocks y API depende de `EXPO_PUBLIC_API_URL`.
- El mapa iOS usa `react-native-maps`; Android usa una capa raster de OpenStreetMap/CARTO en WebView para evitar depender de una clave de Google Maps. Debe validarse en un dispositivo Android y confirmarse con la cátedra por la diferencia de implementación.
- Las pistas SoundHelix son audios de demostración, no audioguías oficiales.

## Implementado

- Catálogo, búsqueda, categorías y detalle de lugares.
- Mapa, ubicación, distancias, filtros y navegación externa.
- Agenda y detalle de eventos.
- Guardado de eventos y recordatorios locales con resultado de permiso explícito en la interfaz.
- Registro/login local de demostración con validación de credenciales.
- SecureStore y reingreso biométrico.
- Favoritos.
- Recorrido por QR, GPS y registro manual.
- Foto desde cámara o galería.
- Persistencia de fotos en Documents.
- Audioplayer con controles y etiqueta para pistas de demostración.
- Descarga de audio para uso offline.
- Magnetómetro y flecha de orientación.
- Háptica.
- Caché y modo offline.
- Monitoreo de conectividad y cola de sincronización real cuando la API esté configurada.
- Avisos de proximidad mientras el usuario se mueve con la app activa.
- Tema claro/oscuro/sistema.
- Estados de carga, error y vacío.
- Configuración EAS preview para APK.
- Documentación de pruebas y defensa.

## Pendientes externos antes de entregar

1. Levantar o publicar el backend oficial `api-mi-ciudad` y configurar `EXPO_PUBLIC_API_URL`. El ZIP es código fuente, no una URL activa.
2. Sustituir las pistas de demostración por audioguías aprobadas.
3. Confirmar con la cátedra la variante de mapa de Android.
4. Completar los nombres del grupo en el README.
5. Vincular el proyecto a la cuenta Expo con `eas build:configure`.
6. Completar las pruebas en teléfonos reales Android/iPhone.
7. Generar el APK preview e instalarlo con Metro apagado.
8. Versionar el `package-lock.json` generado por npm en el equipo de desarrollo, para fijar dependencias y habilitar `npm ci` en CI.
