# Guía breve para la defensa

## Recorrido sugerido (15–20 min)

1. **Inicio:** explicar arquitectura: tipos → mocks/API → servicios → pantallas.
2. **Explorar:** búsqueda, categorías, distancia y estados de carga/vacío/error.
3. **Mapa:** permiso GPS y degradación cuando se rechaza.
4. **Detalle:** favorito, navegación, audioguía y descarga offline.
5. **Agenda:** guardar evento y explicar la notificación local.
6. **Cuenta:** SecureStore, sesión persistente y biometría.
7. **Recorrido:** mostrar QR, foto, nota, SQLite y `sincronizada:false`.
8. **Offline:** activar modo avión y mostrar catálogo/recorrido guardados.
9. **Sensor:** flecha de magnetómetro.
10. **Cierre:** explicar que la API real sustituye mocks sólo desde servicios.

## Preguntas que hay que poder responder

- ¿Por qué las pantallas no importan mocks?
- ¿Por qué el token está en SecureStore y no en kv-store?
- ¿Qué se guarda en SQLite?
- ¿Qué pasa si el usuario niega ubicación o cámara?
- ¿Cómo se evita perder una visita sin Internet?
- ¿Cómo se arma el aviso de proximidad sin bombardear al usuario?
- ¿Por qué se usa `expo-audio` y no `expo-av`?
- ¿Qué API nueva de `expo-file-system` se está usando?
- ¿Qué hace el magnetómetro?
- ¿Qué diferencia hay entre Expo Go y el APK preview?
