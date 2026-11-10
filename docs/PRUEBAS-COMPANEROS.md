# Mi Ciudad Colón — prueba compartida con compañeros (Android + iPhone)

Actualizado: 9 de noviembre de 2026. Proyecto: Expo SDK 57.
**No** migrar SDK ni modificar el mapa solamente para resolver fotografías.
Código principal: https://github.com/Kingdoms27/Mi-Ciudad-MOBILE-

## Regla de la entrega

Las imágenes de cada lugar deben venir del **backend de la cátedra**
(GET /lugares -> imagenes[] -> GET /archivos/...).
Las 7 fotografías empaquetadas sirven exclusivamente como respaldo visual,
**no demuestran** que la API haya servido una imagen. Algunas semillas del
profesor pueden reutilizar imágenes o no tener URL: se deben identificar y
corregir en el backend, sin atribuir fotografías falsas a establecimientos.

## Etapa 1 — Comprobar API e imágenes desde la computadora

**Terminal A**, en Mi-Ciudad-MOBILE-:
\`\`\`powershell
git pull --ff-only origin main
npm run api:iniciar:win
\`\`\`

Dejar la API encendida.

**Terminal B**, en la misma carpeta:
\`\`\`powershell
npm run api:diagnosticar:win
npm run api:fotos:grupo -- http://localhost:3000
\`\`\`

Este diagnóstico lee /salud, /lugares y todos los medios de imagen, verifica
cabecera y primeros bytes de la imagen, muestra HTTP 403/404, señala fotos
repetidas y crea reportes/diagnostico-imagenes-api.json.
No modifica SQLite ni datos de la API.

- URL válida + imagen correcta: puede mostrarse en Android/iPhone si tienen
  acceso a **ese mismo servidor**.
- 403, 404 o URL inválida: el problema está en servir el archivo, permisos
  o rutas de la API; no en el mapa.
- Misma imagen para fichas distintas: se debe corregir la semilla/asignación
  de imágenes. HTTP 200 no significa foto auténtica.
- Sin URL: no existe un archivo de la API que el móvil pueda mostrar.

**No dar por aprobado el requisito de 27 fotografías sin revisar el
resultado:** el último diagnóstico conocía 27 registros, 26 activos.
El informe distingue ambos números.

## Etapa 2A — Todos en la misma Wi-Fi, Android

Con la API abierta en Terminal A:
\`\`\`powershell
npm run api:conectar:win
\`\`\`

El comando configura EXPO_PUBLIC_API_URL con la IP LAN y abre Expo Go.
Cada compañero con Android instala **Expo Go compatible con SDK 57**
desde https://expo.dev/go y escanea el QR.

Todos deben estar en la misma red Wi-Fi que la PC que ejecuta NestJS. Un
túnel de Expo **no** convierte la dirección privada del backend en pública.

## Etapa 2B — Compañeros desde otra casa o red (Android e iPhone)

Para **pruebas temporales de aula**, podés dar acceso HTTPS a la API que
ya corre en tu PC con Cloudflare Quick Tunnel. No requiere dominio ni
cuenta Cloudflare, pero la dirección es **pública y temporal**.

**Seguridad:** usá exclusivamente una base con **datos ficticios de
prueba**. Cualquier persona con la URL puede intentar acceder a los
endpoints expuestos, y los permisos propios de la API siguen siendo
necesarios. **No uses el Quick Tunnel con datos personales reales,
contraseñas, archivos privados o una API de producción.** Cerrá el
túnel después de la prueba.

### Tres terminales en Windows

**Terminal 1 — API:**

```powershell
git pull --ff-only origin main
npm run api:iniciar:win
```

**Terminal 2 — Exponer temporalmente la API de prueba:**

Primero instalá cloudflared desde el administrador de paquetes de
Windows (una sola vez):

```powershell
winget install -e --id Cloudflare.cloudflared
```

Cerrá y reabrí la terminal si Windows no reconoce `cloudflared`.
Luego:

```powershell
cloudflared tunnel --url http://localhost:3000
```

Copiá la URL HTTPS de tipo
`https://nombre-aleatorio.trycloudflare.com` que aparezca en la salida.
No agregues `/salud`, ni `/lugares`. **La URL cambia al reiniciar
Quick Tunnel**. Dejá cloudflared abierto.

**Terminal 3 — Configurar Expo Go para las otras redes:**

```powershell
npm run grupo:conectar -- https://nombre-aleatorio.trycloudflare.com
```

Este comando comprueba `GET /salud`, el catálogo, intenta recuperar
una imagen de la API, escribe `EXPO_PUBLIC_API_URL` en `.env.local`
conservando las otras variables, y ejecuta
`npx expo start --clear --tunnel --go`.

**No ejecutes `npm run api:conectar:win` después:** ese comando vuelve
a configurar la IP privada para el modo misma Wi-Fi.

El QR de Expo permitirá descargar el JS desde otra red, mientras que la
app pedirá los lugares, imágenes y otros datos mediante el HTTPS del
túnel Cloudflare. Los compañeros deben tener Internet. Tu PC debe
permanecer prendida y las **tres terminales** abiertas.

Antes de compartir el QR, verificá el servidor público desde otra red,
por ejemplo Safari/Chrome del teléfono:

- `https://nombre-aleatorio.trycloudflare.com/salud`
- `https://nombre-aleatorio.trycloudflare.com/lugares?porPagina=500`
- Alguna URL `/archivos/...` devuelta por el catálogo.

Para detectar imágenes faltantes o repetidas también desde HTTPS:

```powershell
npm run api:fotos:grupo -- https://nombre-aleatorio.trycloudflare.com
```

La app sólo puede mostrar la foto oficial que efectivamente entregue
la API. Si el backend comparte un mismo PNG entre varios lugares, el
cliente no puede transformarlo automáticamente en fotografías diferentes.

### Alternativa estable para varios días

Publicar una **instancia de prueba del backend docente** en un servidor
HTTPS con base de datos y medios persistentes, autenticación apropiada
y restricciones de acceso. La configuración del ZIP se debe revisar y
adaptar antes de desplegar; no publicar secretos ni el código del
profesor sin autorización. Una dirección estable es preferible a un
Quick Tunnel si los compañeros van a probar varios días.

## Etapa 2C — Giovanni Percara y demás compañeros con iPhone

Expo anunció el **3 de septiembre de 2026** que Expo Go de la
App Store ya admite SDK 57:
https://expo.dev/changelog/expo-go-57-login

**Para Giovanni no hace falta TestFlight solo para usar este método.**
Su iPhone debe tener Expo Go actualizado y mostrar SDK 57 compatible.
Además, la sesión Expo CLI del Windows y la sesión Expo Go del iPhone
deben usar **la misma cuenta Expo**, por ejemplo `giovannipercara`
si ese usuario es el que realmente tiene iniciada la sesión en la
terminal. Comprobar con:

```powershell
npx expo whoami
```

Giovanni inicia sesión desde Expo Go en su teléfono y escanea el
QR de la Terminal 3; el backend llega por el Quick Tunnel HTTPS.
**No solicitar ni compartir contraseñas de cuentas personales.**

Para varios iPhone con cuentas Expo diferentes, la exigencia de la
misma sesión no permite usar libremente un único servidor Expo Go.
En ese escenario conviene preparar versiones propias de prueba
mediante EAS y distribución autorizada, que no exigen compartir
credenciales entre compañeros. Más opciones:
[PRUEBA-IOS-GIOVANNI.md](PRUEBA-IOS-GIOVANNI.md).


## Checklist de cada compañero

- [ ] Confirmar dispositivo, Android/iPhone, versión y red (misma Wi-Fi/remota).
- [ ] Abrir Inicio, Lugares, Mapa, Agenda, Recorrido y Cuenta.
- [ ] Comprobar que tarjetas y detalle muestran **imágenes de la API**.
- [ ] Anotar ID/nombre del lugar y captura si imagen falta, se repite o es incorrecta.
- [ ] Confirmar que mapa, marcadores y GPS siguen funcionando como antes.
- [ ] Probar permisos rechazados, orientación, QR y registro de visitas.
- [ ] Informar si el error ocurre solo en Wi-Fi, solo en datos móviles o en ambos.

## Datos mínimos para reportar un error

Dispositivo y versión OS; red Wi-Fi/datos; módulo y nombre/ID de lugar;
captura de error o código HTTP, fecha aproximada.
**No** compartir claves, JWT, contraseñas ni archivos .env.

Documentación:
- https://expo.dev/changelog/expo-go-57-login
- https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/
- https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/
- https://docs.expo.dev/more/expo-cli/
- https://docs.expo.dev/build/internal-distribution/
