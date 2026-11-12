# Mi Ciudad Colón — fuentes fotográficas pendientes (12/11/2026)

**Estado real de la API docente:** 26 fichas activas; 9 fotos locales por
lugar y 17 sin fotografía específica autorizada. La API sirve archivos para
25 fichas, pero buena parte son ilustraciones `semilla-*.png` compartidas;
la ficha `lug-003` no tiene URL.

**Regla:** nunca asociar una foto de otra ciudad, museo o comercio a una ficha.
Las fotos de fuentes oficiales también pueden estar protegidas por derechos de
autor. Consultar condiciones/permiso antes de copiarlas en la app. Una imagen
de un lugar inundado en 2014 no demuestra cómo se encuentra hoy.

## Los 17 casos por resolver

| ID | Ficha de la API | Fuente para identificar el lugar | Siguiente acción |
| --- | --- | --- | --- |
| lug-002 | Playa Norte | https://www.argentina.gob.ar/node/469432 | Solicitar permiso o conseguir foto propia del sector Norte, no de cualquier playa de Colón |
| lug-003 | Balneario Piedras Coloradas | https://colon.gov.ar/colon-inauguro-la-temporada-de-verano-25-26-con-transmision-especial-de-tn-y-bendicion-de-aguas/ | Buscar foto actual y autorizada. En Commons hay foto **inundada en 2014**, no ideal como portada |
| lug-005 | Museo Casa de la Cultura | https://colon.gov.ar/ | Confirmar nombre y ubicación de la ficha; solicitar foto específica |
| lug-009 | Anfiteatro Municipal | https://colon.gov.ar/ | Comprobar ubicación exacta; descartar anfiteatros de Fray Bentos u otras ciudades |
| lug-010 | Paseo de Artesanos | https://colon.gov.ar/ | Buscar imagen identificable del paseo concreto |
| lug-011 | Casa de Artesanías Regionales | https://colon.gov.ar/ | Distinguir el edificio de una feria artesanal genérica |
| lug-013 | Museo Histórico Regional de San José | https://sanjose.tur.ar/que-hacer/ | Fuente oficial identificada. Obtener licencia/autorización antes de incluir fotos |
| lug-017 | Playa Paso Vela | https://colon.gov.ar/ | Revisar que exista ese nombre exacto en la zona y conseguir foto del sitio |
| lug-018 | Termas de Villa Elisa | https://termasvillaelisa.com/ | Fotos oficiales existentes, permiso de redistribución pendiente |
| lug-019 | Parrilla del Puerto | Sin negocio identificable de manera inequívoca | Puede ser una ficha de demostración. No copiar la foto de otra parrilla |
| lug-020 | Pulpería de la Colonia | Sin negocio identificable de manera inequívoca | Mantener `imagen de demostración` hasta identificar un lugar real |
| lug-021 | Heladería de la Peatonal | Sin negocio identificable de manera inequívoca | Mantener demostración/respaldo; no inventar comercio |
| lug-022 | Cervecería Artesanal del Río | Sin negocio identificable de manera inequívoca | Mantener demostración/respaldo; no inventar marca |
| lug-023 | Hostería del Río | Sin alojamiento identificable de manera inequívoca | Mantener demostración/respaldo; no usar fotos de otra hostería |
| lug-024 | Camping Municipal Norte | https://colon.gov.ar/ | Confirmar sector exacto y foto con permiso |
| lug-025 | Centro de Interpretación del Patrimonio Histórico y Cultural de la Colonia San José y la Costa del Río Uruguay | https://sanjose.tur.ar/ | Confirmar entidad, ubicación y foto auténtica |
| lug-027 | Feria de la Plaza San Martín | https://colon.gov.ar/ | Solicitar fotografía específica de esa feria |

## Qué quedó implementado en la rama

1. **Tarjeta y detalle** muestran inmediatamente la foto de respaldo
   `assets/hero-colon.jpg` mientras se busca la foto remota, en vez de
   dejar un cuadro vacío o una pantalla de carga permanente.
2. Las nueve fotos locales específicas ya tienen prioridad y funcionan
   sin conexión. Los recursos oficiales de la API son la segunda opción.
3. Las semillas se muestran explícitamente como **imagen de demostración**.
   No las hacemos pasar por una foto concreta del comercio.
4. Si una URL falla, el detalle muestra el respaldo identificado y permite
   **Reintentar foto** cuando haya red.
5. Los fallos de `setNotificationChannelAsync` dentro de Expo Go no anulan
   la preparación de avisos locales; se usa el comportamiento de reserva
   de Android. **Debe comprobarse en teléfono**.

## Cómo añadir fotos autorizadas (en la PC)

Guardar fotos reales verificadas con el ID exacto de su lugar:
`lug-002.jpg`, `lug-013.jpg`, etc., en una carpeta del disco. No
añadir una foto de otro comercio como sustitución.

```powershell
npm run fotos:instalar -- "C:\MisFotosDeColon"
npm run fotos:reporte -- http://localhost:3000
npm run entrega:check
```

Las nuevas `require()` estáticas de `src/servicios/fotosLocales.ts`
permiten incorporar las imágenes en APK. Revisar créditos y guardar los
archivos binarios con Git.

## Prueba física de imágenes en Android

- Abrir 26 tarjetas: ninguna debe verse en blanco, congelarse o mostrar
  la foto de un establecimiento diferente.
- Verificar las nueve fotografías locales; probar modo avión.
- En fichas sin foto concreta, confirmar que se vea el respaldo rotulado.
- Con red, verificar cargas desde la API y que el botón **Reintentar foto**
  recupere una URL que había fallado temporalmente.
- Comprobar ambos caminos: listado y detalle. Los resultados no prueban
  por sí mismos autenticidad/licencia; esa revisión es manual.

**No marcar "26 fotos reales" hasta contar con 26 fuentes distintas,
correctamente identificadas y autorizadas.**


## Verificación adicional de fuentes (12 de noviembre de 2026)

Se contrastaron recursos públicos para evitar imágenes de municipios
equivocados. **Una web accesible públicamente no concede automáticamente
permiso para descargar, editar ni redistribuir sus fotografías.**

1. **Playa Norte (`lug-002`)** — Turismo de Colón identifica expresamente
   a Playa Norte y la distingue de Punta Colón, Piedras Coloradas, Inkier,
   Playa Honda y Playa Nueva:
   https://www.colonturismo.tur.ar/playas-islas/
   La página nacional menciona accesibilidad de Playa Norte, pero sus
   fotografías generales de playas no acreditan automáticamente ese sector:
   https://www.argentina.gob.ar/node/469432
   **Acción:** obtener imagen propia, foto donada o autorización escrita de
   la imagen del sector exacto.

2. **Piedras Coloradas (`lug-003`)** — Wikimedia Commons tiene
   `Entrada del Camping Piedras Coloradas.JPG` y
   `Camping Piedras Coloradas inundado.jpg`, de Dario Alpern,
   del episodio de creciente de 2014:
   https://commons.wikimedia.org/wiki/File:Entrada_del_Camping_Piedras_Coloradas.JPG
   https://commons.wikimedia.org/wiki/File:Camping_Piedras_Coloradas_inundado.jpg
   Son reutilizables conforme a la licencia indicada por Commons, pero
   **no sirven como portada turística actual**. Tampoco usar el archivo
   `Piedras Coloradas.jpg`: representa Las Grutas, **Río Negro**, no Colón.

3. **Museo Histórico Regional San José (`lug-013`)** — el portal turístico
   de San José confirma dirección Urquiza 1127 y la identidad del museo:
   https://sanjose.tur.ar/que-hacer/
   **Acción:** pedir una fotografía y licencia/permiso al museo o tomar
   una foto propia. Evitar el Museo Departamental de San José de Uruguay.

4. **Termas de Villa Elisa (`lug-018`)** — hay galería turística
   específica en https://www.termasdevillaelisa.com.ar/fotos.php .
   **Acción:** verificar quién posee los derechos y solicitar autorización
   para integrarla a la APK. Una foto visible online no equivale a CC.

5. **Feria de Plaza San Martín (`lug-027`)** — existen crónicas de ferias
   en la plaza de Colón:
   https://emisoracolon.com.ar/index.php/2026/09/02/colon-se-prepara-para-una-nueva-gran-feria-de-artesanos-y-emprendedores/
   **Acción:** solicitar foto al organizador o al autor. Una imagen general
   de la plaza no debe etiquetarse como foto de la feria.

**Estado de integración:** ninguna de estas nuevas fuentes quedó
autorizada para descarga automática por esta revisión. Los originales de
la cátedra se mantienen intactos y las fichas sin fuente tienen su
respaldo visual identificado.



## Actualización de fotografías reales — pendiente de descarga en PC

Encontré una fotografía reutilizable que representa **una playa de la ciudad de Colón** (autor Ternava, 25/01/2020, licencia [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)). Wikimedia Commons NO especifica que sea el sector **Playa Norte**: [archivo original](https://commons.wikimedia.org/wiki/File:Playa_en_Col%C3%B3n%2C_Entre_R%C3%ADos.jpg). La incluí **solo como vista contextual etiquetada, no como foto exacta de Playa Norte**.

El instalador `npm run fotos:commons` ahora prepara `lug-002.jpg`. Al ejecutarlo en Windows, valida y descarga el JPEG, genera su referencia local y permite que aparezca en la APK. **Todavía no es un binario guardado en GitHub.** Si descarga correctamente, habrá 10 imágenes locales (7 específicas y 3 referenciales) y 16 fichas sin foto local; **Playa Norte aún requiere una fotografía específica** si se quiere cumplir ese criterio de exactitud.

No se han descargado otras fotografías nuevas: las demás requieren confirmar el lugar y los derechos de reutilización. No sobrescribir ni confundir esta vista general con una fotografía identificada del sector Norte.
