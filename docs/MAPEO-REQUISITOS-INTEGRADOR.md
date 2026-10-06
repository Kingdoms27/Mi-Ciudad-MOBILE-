# Mapeo — 10 requisitos mínimos del Integrador

| # | Requisito | Implementación |
|---|---|---|
| 1 | Pantallas y navegación | Expo Router en `app/`, tabs + rutas de detalle/QR/visita/orientación. |
| 2 | Autenticación | `src/servicios/auth.ts` + `SesionContext.tsx`. Registro, ingreso, sesión persistente, SecureStore y biometría. |
| 3 | API y estados | `src/servicios/api.ts`, `lugares.ts`, `eventos.ts`; UI con carga/vacío/error. Mocks mientras no exista endpoint docente. |
| 4 | Cámara y archivos | QR con `expo-camera`; foto con `expo-image-picker`; persistencia con `File`, `Directory`, `Paths`. |
| 5 | Ubicación y mapas | `expo-location` + `react-native-maps`; la app sigue usable si se deniega el permiso. |
| 6 | Notificaciones locales | Evento guardado programa recordatorio; proximidad dispara aviso real; cambios de evento notificables. |
| 7 | Persistencia y conectividad | `expo-sqlite`, `expo-sqlite/kv-store`, `expo-network`; caché y cola de visitas. |
| 8 | Sensor/háptica | Magnetómetro en `orientar/[id].tsx`; haptics al validar QR/visita. |
| 9 | Multimedia | `expo-audio` con play/pausa, ±15 s, progreso, background playback y lock-screen metadata. |
| 10 | Identidad | Nombre Mi Ciudad Colón, icon PNG 1024×1024, splash y app identifiers propios. |

## Entrega

`eas.json` incluye perfil `preview` con `buildType: apk`. El `projectId` se completa automáticamente al ejecutar `eas build:configure` con la cuenta Expo del grupo.
