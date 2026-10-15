# Créditos de imágenes turísticas

Las imágenes de los lugares usadas por los mocks se seleccionaron para representar sitios reales de Colón y la microrregión. Se priorizaron portales oficiales, fichas verificadas de Turismo Colón y material con licencia abierta.

## Fuentes

| Lugar | Fuente principal | Uso en el proyecto |
|---|---|---|
| Portada de inicio | Fotografía suministrada para el proyecto | Asset local `assets/hero-colon.jpg`; no depende de una descarga al iniciar. |
| Molino Forclaz | Wikimedia Commons — fotografía de Dario Alpern | Imagen real del monumento. Revisar la ficha original y su atribución CC BY-SA 4.0 antes de redistribuir. |
| Termas de Colón | Termas de Colón | Fotografía publicada por el establecimiento; confirmar condiciones de reutilización antes de una publicación comercial. |
| Playa Norte / Playas de Colón | Municipalidad de Colón | Imagen publicada en el portal municipal para representar las playas. |
| Parque Nacional El Palmar | Administración de Parques Nacionales / Argentina.gob.ar | Fotografía oficial del paisaje del parque. |
| Museo Histórico Regional de Colón | Colón Turismo | Fotografía publicada en la ficha del atractivo. |
| Puerto Viejo | Wikimedia Commons — fotografía de Pablo D. Flores | Fotografía real del antiguo edificio del puerto. Revisar la ficha original y su atribución CC BY-SA 2.5 antes de redistribuir. |
| Feria Costanera | Colón Turismo | Imagen publicada en la ficha del atractivo. |
| Bodega Vulliez-Sermet | Colón Turismo | Imagen publicada en la ficha del establecimiento. |
| Paseo Costanera | Wikimedia Commons — fotografía de Paula Kindsvater | Fotografía real de la costanera. Revisar la ficha original y su atribución CC BY-SA 4.0 antes de redistribuir. |
| Hotel Plaza | Colón Turismo | Fotografía publicada en la ficha del alojamiento. |

## Enlaces de atribución para Wikimedia Commons

- Molino Forclaz: https://commons.wikimedia.org/wiki/File:Molino_Forclaz_en_Col%C3%B3n.JPG
- Puerto Viejo: https://commons.wikimedia.org/wiki/File:Puerto_viejo,_Col%C3%B3n_-_1.jpg
- Costanera de Colón: https://commons.wikimedia.org/wiki/File:Costanera_de_Col%C3%B3n,_Entre_R%C3%ADos.jpg

## Decisión técnica

La portada principal está incluida en el bundle. Las imágenes de los lugares siguen definidas en los modelos/mocks como URLs; la app las guarda localmente después de una primera descarga correcta con la API actual de `expo-file-system`. Si una URL falla, el hook intenta las alternativas del lugar y conserva un fallback remoto.

Horarios, tarifas, disponibilidad, agenda de ejemplo y pistas SoundHelix no son datos oficiales. Las pistas SoundHelix se usan sólo para probar los controles multimedia y aparecen rotuladas como audio de demostración. Deben sustituirse por grabaciones turísticas autorizadas antes de tratarse como audioguías reales.
