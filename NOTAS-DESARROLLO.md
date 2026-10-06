# Estado de desarrollo

La implementación funcional del cliente está completa contra los mocks exigidos por el PRD.

Dependencias externas que no pueden cerrarse sólo desde el repositorio:

- URL/endpoints definitivos de la API de la cátedra.
- `projectId` de EAS, que se asigna al asociar el proyecto con la cuenta Expo del grupo.
- Pruebas físicas finales en el teléfono del grupo (GPS, biometría, notificaciones, sensor y background audio).

Antes de entregar se debe ejecutar el plan de `docs/PRUEBAS-MOBILE.md` y corregir cualquier diferencia específica del dispositivo.

- La cola de visitas intenta `POST /visitas` cuando `EXPO_PUBLIC_API_URL` está configurada; sin API usa el flujo mock para demostrar la sincronización local.
