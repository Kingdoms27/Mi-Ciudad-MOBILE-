# Decisiones y dudas explícitas del PRD

El PRD indica que no hay que resolver silenciosamente los huecos. Estas son las decisiones tomadas para poder construir el prototipo completo:

1. **Formato QR:** `COLON:<lugarId>`, siguiendo el ejemplo `COLON:lug-004` del documento.
2. **Cercanía GPS para registrar visita:** 200 metros. El PRD no fija radio de validación.
3. **Recordatorio de evento:** 60 minutos antes. El PRD sólo dice “antes de que empiece”.
4. **Aviso de proximidad:** se respeta la preferencia de 100/250/500 m y se limita a un aviso por lugar/día.
5. **API docente:** no se proporcionó URL ni contrato de endpoints en los archivos. La app usa mocks y tiene integración configurable por `EXPO_PUBLIC_API_URL`.
6. **Favoritos/recorrido entre dispositivos:** el cliente requiere sincronización de servidor. La app deja la persistencia local y capa de servicios preparadas; la sincronización real entre teléfonos depende de los endpoints de la API docente.
7. **Modo “Cómo llegar”:** se abre una app/web de mapas externa. Si se pide distinción explícita caminar/auto, la pantalla puede ofrecer ambas opciones sin cambiar el modelo.

Estas decisiones deben confirmarse con la cátedra/cliente antes de congelar la entrega.
