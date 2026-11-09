# Cierre del integrador Mobile — control de consignas

**Fuente principal:** `01 - Mi Ciudad Guia Turistica (1).pdf` (12 páginas).
**Fecha de revisión:** 2026-11-08. **Estado:** implementación avanzada, **entrega final no acreditada**.
Esta matriz distingue código presente de pruebas ejecutadas; la compilación o `tsc` exitosos **no** demuestran que todo funcione en un teléfono.

## Seis áreas funcionales del pedido

| Área | Evidencia de implementación | Verificación obligatoria antes de cerrar |
| --- | --- | --- |
| Lugares | `app/(tabs)/index.tsx`, `app/lugar/[id].tsx`, `src/servicios/lugares.ts` | Filtros/búsqueda/detalles/horarios reales; verificar imágenes reales, licencias, pantalla sin señal |
| Mapa y cercanía | `app/(tabs)/mapa.tsx`, `src/componentes/MapaLeaflet.tsx`, `app/orientar/[id].tsx` | GPS concedido/denegado, ruta a detalles, dirección, mapa Android e iOS; **validar WebView Android contra consigna react-native-maps** |
| Agenda | `app/(tabs)/agenda.tsx`, `app/evento/[id].tsx`, `src/servicios/eventosGuardados.ts` | **Bloqueado en datos:** `/eventos` devuelve 0 próximos; probar guardado, suspensión, cancelación y recordatorios con eventos futuros |
| Recorrido | `app/(tabs)/recorrido.tsx`, `app/registrar-visita.tsx`, `app/escanear.tsx` | QR válido/inválido, manual, GPS, cámara/galería, nota, sincronización offline y recuperación |
| Favoritos y cuenta | `app/favoritos.tsx`, `app/(tabs)/cuenta.tsx`, `src/contexto/SesionContext.tsx` | Credenciales inválidas, token en SecureStore, biometría, favoritos y visitas en otro dispositivo |
| Audioguías | `src/componentes/AudioGuiaPlayer.tsx`, `src/servicios/archivos.ts` | Reproducción/pausa/avance, audio descargado offline y con pantalla apagada; **reemplazar audio demo por fuentes autorizadas** |

## Capacidades técnicas solicitadas

| Componente | Evidencia en el repositorio | Estado y condición de cierre |
| --- | --- | --- |
| React Native / Expo / TypeScript / Expo Router / StyleSheet | `package.json`, `app/` | Presente; CI valida dependencias y TypeScript |
| Cámara (`expo-camera`) y galería (`expo-image-picker`) | `app/escanear.tsx`, `app/registrar-visita.tsx` | Código presente; falta prueba hardware en Android e iOS |
| Geolocalización (`expo-location`) | `app/(tabs)/mapa.tsx`, `src/servicios/proximidad.ts` | Código presente; GPS debe ser opcional y no bloquear marcadores |
| `react-native-maps` | iOS en `app/(tabs)/mapa.tsx` | **Pendiente estricto en Android:** WebView/OSM es alternativa; para mapa nativo en APK Android se requiere Google Maps SDK y clave configurada, o aprobación docente de la alternativa |
| Notificaciones (`expo-notifications`) | `src/servicios/notificaciones.ts` | Código presente; demostrar aviso de proximidad y recordatorio/cambio de estado |
| SQLite, kv-store y red | `src/servicios/db.ts`, `cache.ts`, `red.ts` | Código presente; faltan pruebas de modo avión, reintentos, sincronización |
| `expo-secure-store` y biometría | `src/contexto/SesionContext.tsx`, `src/servicios/auth.ts` | Código presente; pruebas de sesiones y cambio de dispositivo |
| Sensor y háptica | `app/orientar/[id].tsx`, `expo-haptics` | Código presente; probar magnetómetro real y vibración |
| File System | `src/servicios/archivos.ts`, `src/servicios/imagenes.ts` | Código presente; confirmar permanencia tras cerrar, reiniciar y modo avión |
| Multimedia `expo-audio` | `src/componentes/AudioGuiaPlayer.tsx` | Reproductor presente; comprobar bloqueo de pantalla y descargas |
| `expo-video` (mencionado en tabla técnica) | No está en dependencias | **Pendiente de interpretación o implementación:** el PRD no define una historia de reproducción de videos. Confirmar con la cátedra antes de añadir una pantalla artificial |
| Entrega EAS | `app.json`, `eas.json` | Cuenta EAS vinculada; APK `preview` no construido ni probado, build `production` no acreditado |

## Riesgos bloqueantes que no cubre CI

1. **API pública:** `EXPO_PUBLIC_API_URL` apunta a una IP LAN en desarrollo; el entorno `preview` de EAS no tenía variables. El APK fuera del Wi-Fi necesita backend HTTPS con persistencia real y variable configurada **antes del build**.
2. **Agenda:** el backend original filtra eventos anteriores a hoy, y los eventos sembrados tienen fechas relativas a la primera carga. Ejecutar `npm run api:diagnosticar:win` y comparar actuales con históricos antes de intervenir SQLite. **No ejecutar `db:reiniciar`**.
3. **Fotografías:** 19 fichas prioritarias detectadas; cero fotos locales empaquetadas por lugar. Una URL 200 no prueba autenticidad ni derechos de uso.
4. **Mapa Android:** no afirmar cumplimiento estricto de `react-native-maps` hasta conseguir clave nativa y probar en APK o aceptación docente documentada de WebView.
5. **Multimedia:** audios de demo no son audioguías oficiales; `expo-video` aparece en la tabla de tecnología sin funcionalidad de video definida.
6. **Pruebas manuales:** ninguna CI demuestra por sí misma permisos, GPS físico, sensor, suspensión de app, red offline ni notificaciones.

## Secuencia de cierre recomendada

1. Confirmar históricos de eventos; reparar **solo** los datos demo si corresponde con copia de seguridad.
2. Completar fotografías con permiso de uso y/o fuentes verificadas; ejecutar `npm run fotos:reporte`.
3. Resolver o documentar aceptación docente del mapa Android y de `expo-video`.
4. Desplegar API del profesor en HTTPS con base y archivos persistentes; verificar rutas con `npm run api:check` desde otra red.
5. Configurar `EXPO_PUBLIC_API_URL` en el entorno EAS correcto, revisar `npm run entrega:check -- --apk`, generar build, instalarlo **sin Metro** y completar `docs/PRUEBAS-MOBILE.md` en Android e iOS.
6. Entregar archivo de instalación, repositorio, evidencia de pruebas y decisiones/documentación de limitaciones reales.

**Regla de aceptación:** cada requisito se considera cerrado únicamente con evidencia (pantalla en teléfono, prueba reproducible o respuesta API), no porque exista un archivo con su implementación.
