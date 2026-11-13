# Inventario visual — video de prueba 12/11/2026

Revisión de 77 segundos del recorrido de la app Android **Mi Ciudad Colón**.
Este documento registra lo que se ve en el video, no la existencia de
fotografías en Internet. La API de la cátedra conserva el catálogo original.

## Resultado: 26 fichas activas, 9 fotos y 17 pendientes

| ID | Lugar | Estado observado |
| --- | --- | --- |
| lug-001 | Termas de Colón | Foto específica de toboganes |
| lug-002 | Playa Norte | **Ilustración azul de demostración** |
| lug-003 | Balneario Piedras Coloradas | **Respaldo general de Colón** (API sin URL) |
| lug-004 | Molino Forclaz | Foto específica |
| lug-005 | Museo Casa de la Cultura | **Ilustración marrón de demostración** |
| lug-006 | Parque Nacional El Palmar | Foto específica |
| lug-007 | Puerto Viejo | Foto específica |
| lug-008 | Iglesia de la Plaza San Martín | Foto específica |
| lug-009 | Anfiteatro Municipal | **Ilustración marrón de demostración** |
| lug-010 | Paseo de Artesanos | **Ilustración violeta de demostración** |
| lug-011 | Casa de Artesanías Regionales | **Ilustración violeta de demostración** |
| lug-012 | Palacio San José | Foto específica |
| lug-013 | Museo Histórico Regional de San José | **Ilustración marrón de demostración** |
| lug-014 | Costanera Gobernador Quirós | Foto específica |
| lug-015 | Parque Dr. Herminio J. Quirós | Foto específica |
| lug-016 | Mirador del Puente General Artigas | Foto específica; el sujeto de la foto es el puente, no necesariamente el mirador |
| lug-017 | Playa Paso Vela | **Ilustración azul de demostración** |
| lug-018 | Termas de Villa Elisa | **Ilustración verde de demostración** |
| lug-019 | Parrilla del Puerto | **Ilustración naranja de demostración**; establecimiento no identificado |
| lug-020 | Pulpería de la Colonia | **Ilustración naranja de demostración**; establecimiento no identificado |
| lug-021 | Heladería de la Peatonal | **Ilustración naranja de demostración**; establecimiento no identificado |
| lug-022 | Cervecería Artesanal del Río | **Ilustración naranja de demostración**; establecimiento no identificado |
| lug-023 | Hostería del Río | **Ilustración azul de demostración**; establecimiento no identificado |
| lug-024 | Camping Municipal Norte | **Ilustración azul/gris de demostración** |
| lug-025 | Centro de Interpretación del Patrimonio Histórico y Cultural de la Colonia San José y la Costa del Río Uruguay | **Ilustración marrón de demostración** |
| lug-027 | Feria de la Plaza San Martín | **Ilustración violeta de demostración** |

**No confundir con errores HTTP:** 25/26 URLs de la API responden; solo
`lug-003` carece de URL. Las ilustraciones se descargan pero **no son fotos
de los lugares**. El video también muestra 3 eventos de Agenda, donde los
dibujos o «Sin fotografía» son otra categoría, separada de los 26 lugares.

## Prioridad y derechos

**Grupo A, 12 puntos turísticos**: buscar fotos reales del sitio exacto de
`lug-002,003,005,009,010,011,013,017,018,024,025,027`. Verificar primero
la existencia/nombre exacto del lugar y la licencia de *cada imagen*. Fuentes
potenciales (no son automáticamente licencias para redistribución):
- [Playa Norte — página de turismo nacional](https://www.argentina.gob.ar/node/469432).
- [Museo Histórico Regional de San José — sitio turístico oficial](https://sanjose.tur.ar/event-location/museo-historico-regional-de-la-colonia-san-jose/).
- [Termas de Villa Elisa](https://termasvillaelisa.com/).

**Grupo B, 5 comercios**: `lug-019,020,021,022,023`. No hay
identificación suficiente para garantizar que una foto online pertenezca al
establecimiento representado. Mantener ilustración rotulada o respaldo
hasta contar con foto propia/autorizada.

### Hallazgos Wikimedia que NO se asignan automáticamente

- [Playa en Colón, Entre Ríos — Ternava, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Playa_en_Col%C3%B3n,_Entre_R%C3%ADos.jpg):
  muestra una playa de la ciudad, **no demuestra ser Playa Norte**.
- [Entrada del Camping Piedras Coloradas — Dario Alpern, CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Entrada_del_Camping_Piedras_Coloradas.JPG):
  la descripción indica **inundación de julio de 2014**, no representación
  actual del balneario. Evitar usarla como portada turística actual.
- [Categoría Museo Departamental de San José](https://commons.wikimedia.org/wiki/Category:Museo_Departamental_de_San_Jos%C3%A9):
  corresponde a **San José, Uruguay**, no al Museo Histórico Regional
  de **San José, Entre Ríos, Argentina**. No confundir.

## Próxima verificación del grupo

Después de incorporar fotografías auténticas y autorizadas:
```powershell
npm run fotos:instalar -- "C:\MisFotosColon"
npm run fotos:reporte -- http://localhost:3000
npm run entrega:check
```

Guardar créditos, fuente, autor y licencia; repetir el video en teléfono.
**No declarar «26 fotos reales» hasta documentar las 26.**
