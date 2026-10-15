# Mi Ciudad Colón — Trabajo Final Integrador Mobile

Aplicación móvil de guía turística para **Colón, Entre Ríos**, desarrollada para **Desarrollo para Móviles 2026** con React Native, Expo, TypeScript y Expo Router.

La implementación sigue el PRD *Mi Ciudad — Guía turística de Colón*. Mientras la cátedra no publique el contrato y la URL de la API, se utilizan mocks tipados. Cuando se configura `EXPO_PUBLIC_API_URL`, los servicios consultan la API y usan la última caché válida como respaldo; un error remoto no debe reemplazar datos remotos guardados por mocks.

## Funcionalidades

- Catálogo de lugares con búsqueda, categorías, horarios, precio y accesibilidad.
- Orden por distancia cuando el usuario concede ubicación.
- Mapa con marcadores, ubicación actual, filtros y lista de lugares cercanos.
- Detalle de lugar con dirección, teléfono, sitio web, favoritos y apertura de rutas externas.
- Agenda de eventos con detalle, guardado y recordatorios locales sujetos a permisos y fechas válidas.
- Registro e ingreso local de demostración con sesión persistente.
- Token de sesión en `expo-secure-store`; las credenciales de cuentas registradas en modo demo también se guardan allí.
- Reingreso biométrico con `expo-local-authentication` y alternativa para salir y volver al formulario de ingreso.
- Favoritos y visitas persistidos localmente.
- Recorrido por QR, GPS o registro manual, con cámara/galería, fotos y notas.
- Persistencia de fotos con la API actual de `expo-file-system` (`File`, `Directory`, `Paths`).
- Audio con controles visibles y soporte de reproducción en segundo plano. Las pistas SoundHelix actuales están identificadas en pantalla como **audio de demostración**, no como grabaciones oficiales de Turismo Colón.
- Descarga local de audio para uso sin conexión.
- Brújula/flecha de orientación con magnetómetro y háptica.
- SQLite para visitas, favoritos y eventos guardados.
- `expo-sqlite/kv-store` para preferencias y caché, y `expo-network` para detectar cambios de conectividad.
- Catálogo y agenda disponibles con mocks o con la última respuesta remota cacheada, según configuración y conexión.
- Cola de visitas pendientes: sólo se marcan como sincronizadas después de una respuesta satisfactoria de la API. Sin URL de API, la app informa que siguen guardadas en el teléfono.
- Tema claro, oscuro o sistema, estados de carga/vacío/error, ícono y splash propios.

## Estructura

```text
app/                         Pantallas y navegación con Expo Router
src/componentes/             Componentes reutilizables
src/contexto/                Sesión y tema
src/hooks/                   Hooks del dispositivo/red
src/mocks/                   Datos simulados tipados
src/servicios/               API, caché, auth, DB, archivos, notificaciones y sync
src/tema/                    Paletas claro/oscuro
src/tipos/                   Contratos TypeScript del PRD
src/utilidades/              Distancia, rumbo y formatos
docs/                        Mapeo, decisiones, pruebas y defensa
```

## Requisitos de entorno

- Node.js 22.13 o superior.
- Expo SDK 57 (React Native 0.86.3).
- Teléfono Android/iPhone para probar cámara, GPS, biometría, notificaciones y sensores.
- Cuenta de Expo para vincular el proyecto y generar builds con EAS.

## Ejecutar

```bash
npm install
npx expo install --check
npm run typecheck
npx expo start --tunnel
```

Escanear el QR con Expo Go. La app objetivo es móvil; la versión Web no forma parte de la entrega y el módulo nativo `react-native-maps` no se ejecuta en navegador.

## Cuenta de demostración

Mientras se usa el servicio mock:

```text
Email: lucia@mail.com
Contraseña: 123456
```

Esta cuenta está reservada para la demo. En el modo mock, el registro crea cuentas locales para probar el flujo; no equivale a una autenticación contra un servidor. Cada cuenta registrada debe volver a ingresar con la misma contraseña. La autenticación real y la sincronización entre dispositivos dependen de la API de la cátedra.

## API de la cátedra

Copiar `.env.example` como `.env` cuando se entregue la URL:

```env
EXPO_PUBLIC_API_URL=https://...
```

Las pantallas no importan mocks directamente. Los servicios asíncronos de `src/servicios/` centralizan la transición hacia la API. Están preparados los recursos `/lugares`, `/categorias`, `/eventos` y el envío de visitas `/visitas`; estos endpoints deben confirmarse con el contrato oficial de la cátedra. No se debe inventar un contrato de autenticación ni dar por sincronizada una visita si el servidor no confirmó la operación.

Horarios, tarifas, agenda de ejemplo y pistas de audio de demostración deben tratarse como contenido de prueba hasta que se reemplacen por información oficial.

## APK de entrega

Primero asociar el proyecto con la cuenta Expo del grupo:

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
```

Luego generar el APK preview pedido por la cátedra:

```bash
eas build --platform android --profile preview
```

`eas.json` configura `preview` como APK instalable. Hay que instalarlo y verificarlo con Metro apagado antes de entregarlo.

## Verificación

- `docs/MAPEO-PRD.md`
- `docs/MAPEO-REQUISITOS-INTEGRADOR.md`
- `docs/PRUEBAS-MOBILE.md`
- `docs/DECISIONES-Y-DUDAS.md`
- `docs/GUIA-DEFENSA.md`
- `docs/ESTADO-ENTREGA.md`

## Imágenes

La portada usa un archivo incluido en `assets/hero-colon.jpg` para no depender de la conexión. Las fotos de los lugares se cargan desde las URLs definidas en los mocks y se guardan localmente después de la primera carga correcta. Las fuentes y licencias conocidas están en [docs/CREDITOS-IMAGENES.md](docs/CREDITOS-IMAGENES.md).
