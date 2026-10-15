# Mapeo — 10 requisitos mínimos del Integrador

| # | Requisito | Implementación / verificación pendiente |
|---|---|---|
| 1 | Pantallas y navegación | Expo Router en `app/`, tabs y rutas de detalle, QR, visita y orientación. |
| 2 | Autenticación | `src/servicios/auth.ts` y `SesionContext.tsx`. Cuenta demo restringida a sus credenciales, registros locales, token en SecureStore y reingreso biométrico. No sustituye autenticación de la API real. |
| 3 | API y estados | `src/servicios/api.ts`, `lugares.ts`, `eventos.ts`. Mocks mientras no se publique el contrato. Se conserva la última caché válida ante errores remotos y las pantallas muestran estados de carga/vacío/error. |
| 4 | Cámara y archivos | QR con `expo-camera`; foto con `expo-image-picker`; persistencia con `File`, `Directory` y `Paths`. |
| 5 | Ubicación y mapas | `expo-location` en las pantallas de mapa/orientación/visitas. iOS usa `react-native-maps`; Android usa mosaicos OpenStreetMap/CARTO dentro de WebView porque el mapa nativo anterior no mostraba cartografía. La variante Android requiere validación en dispositivo y confirmación de la cátedra. Si se niega ubicación, los lugares siguen disponibles. |
| 6 | Notificaciones locales | Guardar un evento devuelve si el recordatorio quedó efectivamente programado. Cambios de estado cancelan o actualizan recordatorios cuando corresponde. Requiere permiso y build/dispositivo compatibles. |
| 7 | Persistencia y conectividad | `expo-sqlite`, `expo-sqlite/kv-store`, `expo-network`. Las operaciones esperan inicialización de SQLite. Las visitas permanecen pendientes si la API no está configurada o no responde correctamente. |
| 8 | Sensor/háptica | Magnetómetro en `orientar/[id].tsx`; háptica en validaciones QR, visita y acciones. |
| 9 | Multimedia | `expo-audio` con reproducción/pausa, seek, progreso y reproducción en segundo plano. Las pistas SoundHelix se rotulan como demostración y deben reemplazarse por grabaciones aprobadas. |
| 10 | Identidad | Nombre Mi Ciudad Colón, ícono PNG, splash e identificadores propios en `app.json`. |

## Entrega

`eas.json` incluye `preview` con `buildType: apk`. El proyecto debe vincularse a la cuenta Expo con `eas build:configure`. Todavía falta generar e instalar el APK de preview para una prueba sin Metro.
