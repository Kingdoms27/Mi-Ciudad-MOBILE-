# Estado de entrega

## Cobertura funcional

El código cubre los seis bloques funcionales del PRD:

1. Lugares.
2. Mapa y cercanía.
3. Agenda de eventos.
4. Mi recorrido.
5. Favoritos y cuenta.
6. Audioguías.

También cubre los diez requisitos técnicos mínimos del Trabajo Final Integrador mediante Expo Router, autenticación persistente, servicios asíncronos, cámara/QR, archivos, ubicación/mapas, notificaciones, SQLite/kv-store/red, sensores/háptica, multimedia e identidad de aplicación.

## Qué ya puede probarse con mocks

- Navegación completa.
- Catálogo, filtros y búsqueda.
- Mapa y ubicación.
- Favoritos.
- Agenda y recordatorios.
- Registro/login de demostración.
- Biometría.
- QR.
- Visita manual y por GPS.
- Foto de visita.
- Persistencia local.
- Modo offline.
- Cola de sincronización.
- Audioguía y descarga offline.
- Brújula.
- Tema claro/oscuro.
- Estados de error/carga/vacío.

## Dependencias que no deben inventarse

El PRD indica que la API docente se entrega más adelante. Por ese motivo el proyecto no inventa el contrato de autenticación, favoritos o endpoints adicionales que no fueron definidos. La arquitectura ya está aislada en `src/servicios/` para reemplazar mocks sin reescribir las pantallas.

## Antes de entregar

- Probar en un teléfono real con Expo Go.
- Completar los nombres del grupo.
- Conectar la API oficial cuando la cátedra la publique.
- Ejecutar `eas build:configure`.
- Generar y probar `eas build --platform android --profile preview`.
- Validar el APK sin Metro ni computadora.
