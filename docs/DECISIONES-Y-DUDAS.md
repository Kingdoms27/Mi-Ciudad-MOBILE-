# Decisiones y dudas explícitas del PRD

El PRD indica que no hay que resolver silenciosamente los huecos. Estas decisiones permiten probar el prototipo; las que se marcan para confirmar deben revisarse con la cátedra/cliente antes de congelar la entrega.

1. **Formato QR:** `COLON:<lugarId>`, siguiendo el ejemplo `COLON:lug-004` del documento.
2. **Cercanía GPS para registrar visita:** 200 metros. El PRD no fija radio de validación.
3. **Recordatorio de evento:** 60 minutos antes. Si el evento empieza en menos de una hora, se programa un aviso inmediato; si ya empezó, no se crea un recordatorio vencido.
4. **Aviso de proximidad:** se respeta la preferencia de 100/250/500 m y se limita a un aviso por lugar y fecha local.
5. **API docente:** el backend oficial `api-mi-ciudad` está incluido en el ZIP y sus rutas ya fueron incorporadas a la app. Falta una URL de ejecución/publicación. Sin `EXPO_PUBLIC_API_URL`, la app usa mocks; con URL, utiliza el servidor y la última caché válida como respaldo.
6. **Favoritos/recorrido entre dispositivos:** ya están integradas las rutas oficiales de favoritos y visitas. La persistencia offline sigue en SQLite; las visitas y fotos pendientes se suben a `/yo/visitas` y `/archivos` al recuperar la conexión. La sincronización sólo se confirma al responder el servidor.
7. **Modo “Cómo llegar”:** se abre una app/web de mapas externa con opciones a pie o en auto.
8. **Mapa Android:** la implementación usa cartografía OpenStreetMap/CARTO en WebView para no depender de una clave de Google Maps. iOS usa `react-native-maps`. Esta diferencia frente al paquete indicado en el PRD debe probarse en Android y confirmarse con la cátedra.
9. **Audioguías:** las pistas SoundHelix son de demostración técnica, no grabaciones de Turismo Colón. Deben reemplazarse por archivos autorizados antes de una presentación que las trate como contenido turístico real.
10. **Horarios, tarifas y eventos:** son datos simulados hasta obtener información oficial. La interfaz y documentación deben seguir identificándolos como datos de prueba.

Estas decisiones deben confirmarse con la cátedra/cliente antes de congelar la entrega.
