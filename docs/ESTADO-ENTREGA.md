# Estado de entrega

## Cobertura funcional en el código

El proyecto contiene pantallas y servicios para los seis bloques del PRD:

1. Lugares.
2. Mapa y cercanía.
3. Agenda de eventos.
4. Mi recorrido.
5. Favoritos y cuenta.
6. Audioguías.

También están implementados los diez bloques técnicos del integrador: Expo Router, autenticación local de demostración, servicios asíncronos, cámara/QR, archivos, ubicación/mapas, notificaciones, SQLite/kv-store/red, háptica/sensor, multimedia e identidad visual.

Esta lista describe lo implementado en el código; no reemplaza la validación en teléfonos reales ni garantiza que cada flujo haya pasado una prueba manual.

## Qué se puede probar con mocks

- Navegación y catálogo.
- Filtros, búsqueda y detalles.
- Mapa y permiso de ubicación.
- Favoritos y agenda.
- Cuenta demo y registro local.
- Biometría cuando el dispositivo la soporta.
- QR, visita manual y validación GPS.
- Foto y nota de visita.
- Persistencia local y estado offline.
- Cola de sincronización: permanece pendiente si la API no está configurada o falla.
- Reproductor de audio de demostración.
- Brújula.
- Tema claro/oscuro.
- Estados de carga, vacío y error.

## Dependencias externas

- **API de la cátedra:** el ZIP recibido incluye el backend NestJS `api-mi-ciudad` con contratos y endpoints oficiales. La app ya implementa la integración mediante `EXPO_PUBLIC_API_URL`, pero todavía falta arrancar el servidor en red o publicarlo. Sin URL configurada sólo hay mocks locales; con URL, se usa autenticación Bearer, recursos del servidor y sincronización de visitas/fotos.
- **Audioguías:** las URLs SoundHelix son pistas de prueba; deben sustituirse por contenido turístico autorizado.
- **Mapa Android:** usa mosaicos OSM/CARTO dentro de WebView y requiere conectividad para cargar cartografía no almacenada. Validar en un teléfono y confirmar con la cátedra que la variante sea aceptable.
- **Imágenes remotas:** las fotos de lugares quedan en caché sólo después de descargarse con éxito. La portada sí es un asset local.

## Antes de entregar

- [ ] Restaurar y comprobar la calidad de la foto original en el asset local.
- [ ] Ejecutar instalación, chequeo Expo y TypeScript.
- [ ] Probar en teléfonos reales Android y iPhone.
- [ ] Probar la base de datos abriendo rápidamente varias pantallas y después de cerrar/reabrir.
- [ ] Verificar visita local, sincronización con API y estados de error.
- [ ] Confirmar que los recordatorios se programan sólo con permiso y fecha válida.
- [ ] Completar nombres de integrantes.
- [ ] Versionar `package-lock.json`.
- [ ] Levantar la API oficial, comprobar `/salud` desde un teléfono y probar login real.
- [ ] Desplegarla con HTTPS para que la app sirva fuera de la red local.
- [ ] Vincular EAS y generar `eas build --platform android --profile preview`.
- [ ] Instalar y validar el APK sin Metro ni computadora.
