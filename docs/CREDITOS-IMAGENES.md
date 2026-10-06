# Créditos de imágenes turísticas

Las imágenes de los lugares usadas por los mocks fueron seleccionadas para representar sitios reales de Colón y la microrregión. Se priorizaron portales oficiales, fichas verificadas de Turismo Colón y material con licencia abierta.

## Fuentes

| Lugar | Fuente principal | Uso en el proyecto |
|---|---|---|
| Molino Forclaz | Wikimedia Commons — fotografía de Dario Alpern | Imagen real del monumento. Licencia CC BY-SA 4.0 entre las licencias ofrecidas por el archivo. |
| Termas de Colón | Termas de Colón | Fotografía del complejo termal publicada por el sitio turístico del establecimiento. |
| Playa Norte / Playas de Colón | Municipalidad de Colón | Postal de playas de la temporada 2026. |
| Parque Nacional El Palmar | Administración de Parques Nacionales / Argentina.gob.ar | Fotografía oficial del paisaje del parque. |
| Museo Histórico Regional de Colón | Colón Turismo | Fotografía de la ficha verificada del museo. |
| Puerto Viejo | Wikimedia Commons — fotografía de Pablo D. Flores | Fotografía real del antiguo edificio del puerto. Licencia CC BY-SA 2.5. |
| Feria Costanera | Colón Turismo | Imagen publicada en la ficha del atractivo. |
| Bodega Vulliez-Sermet | Colón Turismo | Imagen publicada en la ficha verificada del establecimiento. |
| Paseo Costanera | Wikimedia Commons — fotografía de Paula Kindsvater | Fotografía real de la costanera. Licencia CC BY-SA 4.0. |
| Hotel Plaza | Colón Turismo | Fotografía publicada en la ficha verificada del hotel. |

## Enlaces de atribución para Wikimedia Commons

- Molino Forclaz: https://commons.wikimedia.org/wiki/File:Molino_Forclaz_en_Col%C3%B3n.JPG
- Puerto Viejo: https://commons.wikimedia.org/wiki/File:Puerto_viejo,_Col%C3%B3n_-_1.jpg
- Costanera de Colón: https://commons.wikimedia.org/wiki/File:Costanera_de_Col%C3%B3n,_Entre_R%C3%ADos.jpg

## Decisión técnica

Las URLs remotas siguen formando parte del modelo `Lugar`, tal como ocurriría cuando la API docente entregue el catálogo real. La app agrega una caché propia en `src/servicios/imagenes.ts`: cuando una imagen se carga correctamente se guarda en Documents y se reutiliza sin conexión en siguientes aperturas.

De esta forma se evita depender de fotografías genéricas de stock y se conserva el comportamiento offline solicitado por el PRD después de una primera carga con conexión.

> Nota académica: los datos operativos de horarios, tarifas y disponibilidad son mocks hasta que la cátedra entregue la API oficial. Las imágenes y referencias visuales no deben interpretarse como una API oficial de Turismo Colón.
