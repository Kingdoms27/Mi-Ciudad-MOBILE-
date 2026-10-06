# Mapeo PRD — Mi Ciudad Colón

## 1. Lugares
- Listado completo: `app/(tabs)/index.tsx`.
- Filtro por categoría: chips en inicio.
- Búsqueda por nombre/contenido: inicio.
- Detalle: `app/lugar/[id].tsx`.
- Fotos, descripción, horario, teléfono, sitio, precio y accesibilidad: entidad `Lugar` + pantalla detalle.
- Orden por distancia: inicio cuando existe permiso GPS.

## 2. Mapa y cercanía
- Todos los lugares en mapa: `app/(tabs)/mapa.tsx`.
- Punto del usuario: `showsUserLocation` sólo con permiso.
- Marcador con nombre/distancia: callout del mapa.
- Filtro por categoría: chips sobre mapa.
- Lista cercana: tarjeta inferior.
- Abrir navegación externa: detalle de lugar.
- Flecha de dirección: `app/orientar/[id].tsx` con magnetómetro.

## 3. Agenda
- Eventos ordenados por fecha: `app/(tabs)/agenda.tsx`.
- Detalle: `app/evento/[id].tsx`.
- Lugar asociado o dirección libre: entidad `Evento`.
- Guardar y recordar: SQLite + `expo-notifications`.
- Cambio suspendido/cancelado: `sincronizarEstadoEventos` compara estado guardado y dispara aviso.

## 4. Mi recorrido
- QR: `app/escanear.tsx`.
- GPS: `registrar-visita?origen=gps`, validación de cercanía.
- Manual: `registrar-visita?origen=manual`.
- Foto: cámara o galería y copia a Documents.
- Nota: campo opcional.
- Historial: tab Recorrido con foto, fecha, origen y estado de sync.
- QR roto/ajeno: se muestra error, no se bloquea la cámara ni se cae la app.

## 5. Favoritos y cuenta
- Favorito con un toque: detalle de lugar.
- Lista: `app/favoritos.tsx`.
- Registro/ingreso: tab Cuenta.
- Reingreso biométrico: `expo-local-authentication`.
- Navegación pública sin cuenta: Inicio y Mapa no requieren sesión.

## 6. Audioguías
- Reproducción: `AudioGuiaPlayer.tsx`.
- Play/pausa, avanzar/retroceder y tiempo visible.
- Background playback habilitado en `app.json`.
- Lock-screen metadata para sostener reproducción en Android.
- Descarga local con la API nueva de `expo-file-system`.

## Offline
- Catálogo/eventos cacheados en `expo-sqlite/kv-store`.
- Visitas/favoritos/eventos guardados en SQLite.
- Fotos y audioguías en Documents.
- Banner de red visible cuando no hay conexión.
- Visitas nuevas quedan `sincronizada: false` y se sincronizan cuando vuelve la red.
