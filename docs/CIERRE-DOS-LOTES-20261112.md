# Mi Ciudad Colón · cierre en dos lotes (12–13 de noviembre de 2026)

**Repositorio:** [Kingdoms27/Mi-Ciudad-MOBILE-](https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-)  
**Grupo:** 93 · desarrollo móvil  
**Objetivo del 12/11:** dejar cambios revisables, auditoría y preentrega reproducible.  
**Reunión del 13/11:** mostrar pruebas en equipos reales y decidir modalidad final de entrega.

> Este documento NO acredita una APK lista, fotografías faltantes resueltas ni
> un backend público. Sólo marcar `OK` con la evidencia correspondiente.

## Lote 1 — Fotografías y catálogo

**Ejecutar en Windows, con el backend docente activo en otra terminal:**

```powershell
git switch feature/mi-ciudad-cierre-2-lotes-20261112
npm ci
npm run api:iniciar:win
# En otra terminal, desde el mismo proyecto:
npm run cierre:lote1
```

- Conserva los datos del docente y **no toca su SQLite**.
- Añade al descargador de Wikimedia Commons dos archivos acreditados para
  las fichas de Termas de Colón (`lug-001`) y la Iglesia Santos Justo y
  Pastor (`lug-008`). Se descargan en la PC al ejecutar el lote; **todavía
  no están incorporados como binarios en Git**. Se generan las referencias
  estáticas de Metro con `fotos:instalar`. Revisar `git status` después.
- Los siete archivos originales empaquetados se mantienen sin sobrescribir.
- Valida ID y nombre de la ficha para evitar que un mock reutilizado muestre
  la fotografía de un establecimiento distinto.
- Produce `reportes/fotos-para-revisar.csv`,
  `reportes/fotos-prioritarias.csv` y
  `reportes/diagnostico-imagenes-api.json`.
- Diferencia imagen de semilla, fotografía turística acreditada, respaldo e
  imagen ausente. El caso `lug-003` de la API oficial queda sin URL; es una
  prueba negativa válida, no un dato para inventar.

**Foto auténtica y licencia:** sólo importar fotos reales del lugar exacto,
con permiso de uso, autor, fuente y condiciones de atribución. La consigna no
exige un archivo distinto en la API para cada ficha. Si el resultado del
reporte sigue indicando 17 fotos pendientes de fuente propia, se deben buscar
y verificar manualmente; no llenar con imágenes aleatorias.

**Prueba de aceptación:** abrir listado y detalle de los 26 lugares activos;
verificar nombre/foto correspondiente, semillas identificadas y respaldo ante
el caso sin URL. Probar también con modo avión después de cargar recursos.

## Lote 2 — Funcionalidad, regresión y entrega

```powershell
# Con la API original encendida:
npm run cierre:lote2
```

Este comando **actualiza parches compatibles de Expo y puede modificar
`package.json` y `package-lock.json`**. Antes de ejecutar, guardar
cualquier cambio local propio. Comparar diffs y versionar ambos archivos
si las pruebas pasan; no sobrescribir cambios del equipo.

Cambios de funcionalidad incluidos en la rama:

- Navegación: Android abre el manejador del esquema `geo:`, sin imponer Google
  Maps; iOS utiliza Mapas del sistema.
- Recordatorios locales: se programan 30 minutos antes de un evento futuro.
  Si falta menos, se agenda un aviso próximo. Esto sigue la respuesta del
  profesor del 25/09 (15 o 30 minutos propuestos).
- Pruebas automáticas para recordatorio, coordenadas inválidas y fotos
  curadas que no corresponden al lugar.

**Pruebas físicas pendientes (documentar con equipo, SO y resultado):**

| Caso | Criterio de aceptación | Estado |
| --- | --- | --- |
| Registro/inicio, biometría | sesión persiste y admite alternativa | PENDIENTE |
| API docente y catálogo | 26 activos, filtros, detalle, loading/error | PENDIENTE |
| Mapa y orientación | funciona con permiso denegado; flecha dinámica si hay sensor | PENDIENTE |
| Navegación | abre aplicación de mapas del dispositivo | PENDIENTE |
| Cámara/QR/visita | foto opcional, QR inválido controlado, nota y visita guardada | PENDIENTE |
| Favoritos/recorrido | sincronizan con cuenta y reaparecen en otro dispositivo | PENDIENTE |
| Notificaciones | evento futuro, proximidad, cancelación y toque | PENDIENTE |
| Audioguías | pausa/reanuda, descarga selectiva, sin señal | PENDIENTE |
| Modo avión | catálogo previo, fotos empaquetadas y visitas disponibles | PENDIENTE |
| APK EAS preview | instalable y operativa sin Metro ni PC | PENDIENTE |

**Bloqueo de dependencias detectado el 12/11:** GitHub Actions advierte
que las versiones patch de Expo SDK 58 fijadas en el repositorio ya no
coinciden con las esperadas. El lote 2 ejecuta `npx expo install --fix`
seguido de `npx expo install --check`, tests y TypeScript. No indicar
"CI aprobada" hasta que el entorno y lockfile estén sincronizados.

**Bloqueo de APK independiente:** se necesita la API NestJS oficial publicada
con HTTPS estable y persistencia para SQLite + archivos; configurar
`EXPO_PUBLIC_API_URL` en el entorno `preview` de EAS **antes** de
`npx eas-cli@latest build --platform android --profile preview`.
No usar `localhost`, IP LAN ni túnel temporal como URL final.
El documento de la cátedra pide repositorio **y** APK salvo confirmación
formal de cambio de modalidad.

## Reunión del viernes 13/11

Llevar: enlace de la rama/PR, CSV por lugar, registros de pruebas Android e
iPhone, evidencia de 10 requisitos, URL/API utilizada, explicación del
funcionamiento offline y, si corresponde, APK ya instalada sin Metro.

La respuesta docente aclara: fotos de visitas son opcionales, favoritos y
recorrido deben recuperarse al cambiar de teléfono; audioguías se descargan
a elección; sensores ausentes no deben bloquear la app.

**Cierre real:** recién puede marcarse terminado tras validar en teléfonos,
resolver dependencias, guardar el resultado en Git y probar build/entrega
según la modalidad confirmada. Ningún reporte automático reemplaza eso.
