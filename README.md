# Mi Ciudad Colón — Trabajo Final Integrador Mobile

Aplicación móvil de guía turística para **Colón, Entre Ríos**, desarrollada para **Desarrollo para Móviles 2026** con React Native, Expo, TypeScript y Expo Router.

La implementación sigue el PRD *Mi Ciudad — Guía turística de Colón* y los requisitos técnicos del Trabajo Integrador. La app funciona con **mocks tipados** mientras la cátedra no entregue la API; si se define `EXPO_PUBLIC_API_URL`, la capa de servicios intenta consumir la API y mantiene caché local como respaldo.

## Funcionalidades implementadas

- Catálogo de lugares con búsqueda, categorías, horarios, precio y accesibilidad.
- Orden por distancia cuando el usuario concede ubicación.
- Mapa con marcadores, ubicación actual, filtros y lista de lugares cercanos.
- Detalle de lugar con dirección, teléfono, sitio web, favoritos y cómo llegar.
- Agenda de eventos con detalle, guardado y recordatorios locales.
- Registro e ingreso de usuario con sesión persistente.
- Token guardado exclusivamente en `expo-secure-store`.
- Reingreso biométrico con `expo-local-authentication` y alternativa mediante credenciales.
- Favoritos persistidos localmente.
- Recorrido personal con visitas por QR, GPS o registro manual.
- Cámara y galería para asociar una foto a una visita.
- Fotos persistidas con la API nueva de `expo-file-system` (`File`, `Directory`, `Paths`).
- QR oficial con formato `COLON:<id>` y manejo seguro de códigos inválidos.
- Vibración háptica distinta para validaciones exitosas/erróneas.
- Audioguías con `expo-audio`, controles visibles y reproducción en segundo plano.
- Descarga de audioguías para uso sin señal.
- Brújula/flecha de orientación con magnetómetro.
- SQLite para visitas, favoritos y eventos guardados.
- `expo-sqlite/kv-store` para preferencias y caché.
- `expo-network` para estado de conexión y sincronización al recuperar Internet.
- Caché del catálogo y agenda para uso offline.
- Avisos de proximidad limitados a uno por lugar y por día.
- Tema claro, oscuro o sistema.
- Estados de carga, vacío y error visibles.
- Ícono 1024×1024, splash propio y configuración EAS para APK preview.

## Estructura

```text
app/                         Pantallas y navegación con Expo Router
src/componentes/             Componentes reutilizables
src/contexto/                Sesión y tema
src/hooks/                   Hooks del dispositivo/red
src/mocks/                   Datos simulados tipados
src/servicios/               API, caché, auth, DB, archivos, notificaciones, sync
src/tema/                    Paletas claro/oscuro
src/tipos/                   Contratos TypeScript del PRD
src/utilidades/              Distancia, rumbo y formatos
docs/                        Mapeo, decisiones, pruebas y defensa
```

## Requisitos de entorno

- Node.js 22.13 o superior.
- Expo SDK 57 (React Native 0.86.3).
- Teléfono Android/iPhone para probar cámara, GPS, biometría, notificaciones y sensores.
- Cuenta de Expo únicamente para generar el build EAS.

## Ejecutar

```bash
npm install
npx expo install --fix
npx expo start
```

Escanear el QR con Expo Go. Si la red local bloquea la conexión:

```bash
npx expo start --tunnel
```

## Cuenta de demostración

Mientras se usa el servicio mock:

```text
Email: lucia@mail.com
Contraseña: 123456
```

El registro también está implementado y crea una sesión local de demostración.

## API de la cátedra

Copiar `.env.example` como `.env` cuando se entregue la URL:

```env
EXPO_PUBLIC_API_URL=https://...
```

Las pantallas nunca importan `src/mocks/` directamente. El cambio hacia la API queda contenido en `src/servicios/`.

> Los paths `/lugares`, `/categorias` y `/eventos` son la integración preparada. Si la cátedra define otros endpoints, sólo se ajusta la capa de servicios.

## APK de entrega

Primero asociar el proyecto con la cuenta Expo:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Luego generar el APK preview pedido por la cátedra:

```bash
eas build --platform android --profile preview
```

`eas.json` ya configura `preview` como APK instalable.

## Verificación

Consultar:

- `docs/MAPEO-PRD.md`
- `docs/MAPEO-REQUISITOS-INTEGRADOR.md`
- `docs/PRUEBAS-MOBILE.md`
- `docs/DECISIONES-Y-DUDAS.md`
- `docs/GUIA-DEFENSA.md`
- `docs/ESTADO-ENTREGA.md`


## Imágenes turísticas

Las fotografías reales usadas por los mocks y sus fuentes/licencias están documentadas en [`docs/CREDITOS-IMAGENES.md`](docs/CREDITOS-IMAGENES.md). La app mantiene una caché local de imágenes para reutilizarlas sin conexión después de la primera carga.
