# Mi Ciudad Colón — API HTTPS sin depender de la computadora (Grupo 93)

**Estado actualizado (14/11/2026):** La API original de la catedra esta **publicada y verificada** en Render (plan Free), conectada a Supabase PostgreSQL y Storage. La nueva APK **aun no fue compilada** contra esta direccion: la APK anterior sigue vinculada al tunel temporal.

- API HTTPS: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com
- Salud: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/salud
- Catalogo: https://mi-ciudad-colon-api-grupo93-5szt.onrender.com/lugares?pagina=1&porPagina=500
- Validacion: `/salud` devolvio `datos.estado=ok`, `motor=postgres`, `almacen=supabase`; API enumero 26 lugares activos; el manifiesto movil contiene archivos locales para las 26 fichas; la BD contiene 27 lugares, uno inactivo. Las 26 fotos deben revisarse visualmente en la APK para comprobar su correspondencia real.
- Render: servicio `srv-dbs74rrrjlhs73dc7nu0`; origen oficial `franco-ruisdias-uner/api-proyectos-mobile`.
- Almacenamiento privado: bucket `archivos` en Supabase.
- Seguridad: no incluir `DB_URL`, claves S3 ni `JWT_SECRETO` en GitHub o mensajes. Siete tablas en esquema privado `api` tienen RLS deshabilitado; los roles `anon` y `authenticated` carecen de privilegio USAGE sobre el esquema. Revisar políticas antes de exponer el esquema a Data API.
- Render Free puede dormir por inactividad. Antes de una defensa abrir `/salud` y confirmar que responde.

### Compilar APK Android para el Grupo 93 (desde PowerShell)

```powershell
cd "$HOME\\Desktop\\Mi-Ciudad-MOBILE-"
git switch main
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File ".\\scripts\\cerrar-apk-26-windows.ps1" -ApiUrl "https://mi-ciudad-colon-api-grupo93-5szt.onrender.com"
eas build --platform android --profile preview --clear-cache
```

El script primero **valida** el catalogo y luego establece `EXPO_PUBLIC_API_URL` en EAS `preview`; ejecutar el build solo cuando termine con [OK]. No compartir una APK anterior. iOS requiere un build firmado separado.

## Arquitectura verificada

- API **original de la cátedra**: `franco-ruisdias-uner/api-proyectos-mobile`, subdirectorio `api-mi-ciudad` (NestJS 12, Node 24, Docker).
- Catálogo de semillas: 27 registros, **26 activos**. La aplicación incluye 26 imágenes locales para sus fichas; se vuelven a contrastar contra la API.
- Base persistente: **Supabase PostgreSQL** (Session pooler, puerto 5432).
- Archivos y audios del backend: **Supabase Storage con protocolo S3**.
- Servidor HTTPS: **Render Web Service**. Blueprint preparado en `render-mi-ciudad-api.yaml`.
- App Android/iOS: `EXPO_PUBLIC_API_URL=https://URL-REAL-DEL-SERVICIO.onrender.com` en el entorno **preview** de EAS.

No se ha copiado ni republicado el código fuente de la cátedra en el repositorio móvil. No subir credenciales, base de datos local ni archivos `.env` a GitHub.

## 1. Crear Supabase

1. Ingresar a <https://supabase.com/dashboard> y crear un **proyecto nuevo, dedicado** a Mi Ciudad Colón.
2. En el proyecto, **Connect > Session pooler**: copiar la cadena PostgreSQL con puerto **5432** y usuario `postgres.<referencia>`. Será `DB_URL`. No usar el pooler de transacciones 6543 ni la conexión directa IPv6.
3. En **Storage > New bucket**, crear bucket **privado** `archivos`. El backend subirá aquí archivos del catálogo, audioguías y futuras visitas.
4. En **Storage > Settings / S3 Configuration**, habilitar la conexión S3, generar las credenciales **para servidor** y guardar de forma segura los campos `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`. Las claves S3 evitan RLS y jamás van dentro de la APK ni del chat.
5. Copiar el **Project Reference** (código del proyecto) para `SUPABASE_PROYECTO`.

Nunca incluir esos valores en GitHub, capturas, mensajes o el cliente móvil.

## 2. Crear servicio Render desde el Blueprint

1. Ir a <https://dashboard.render.com/> e iniciar sesión, conectar GitHub si hace falta.
2. Elegir **New > Blueprint**, repositorio `Kingdoms27/Mi-Ciudad-MOBILE-`, rama `main`.
3. En **Blueprint Path**, indicar `render-mi-ciudad-api.yaml` (Render admite un Blueprint en una ruta personalizada).
4. Revisar el servicio `mi-ciudad-colon-api-grupo93` y sus parámetros: backend de la cátedra en `api-mi-ciudad`, Docker Node 24, health check `/salud`. El Blueprint apunta al repositorio público del docente, sin copiarlo.
5. Completar los campos secretos que Render solicita:
   - `DB_URL`: cadena **Session pooler** de Supabase.
   - `SUPABASE_PROYECTO`: referencia del proyecto.
   - `S3_REGION`: la región indicada por Supabase S3.
   - `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`: credenciales **S3 del backend**.
   - El bucket `S3_BUCKET=archivos` y el `JWT_SECRETO` aleatorio ya están declarados en el Blueprint.
6. Revisar el plan elegido antes de confirmar. Con Free, se apaga por inactividad y la primera petición tarda; con uno pago, puede funcionar sin pausas de inactividad. **No aceptar cobros sin decidirlos antes.**
7. Crear el servicio y obtener la **URL real** que asigna Render. No deducirla solo por el nombre del servicio.

### Alternativa si el Blueprint no puede vincular el repo externo del docente

Render > **New > Web Service > Public Git Repository**:
- Repositorio: `https://github.com/franco-ruisdias-uner/api-proyectos-mobile`
- Branch: `main`.
- Root Directory: `api-mi-ciudad`.
- Runtime: **Docker**; Dockerfile dentro de `api-mi-ciudad` (ajustar Dockerfile Path / Docker Context según lo que muestre la interfaz).
- Health Check Path: `/salud`.
- Agregar manualmente las variables del archivo `render-mi-ciudad-api.yaml`, incluyendo `ENTORNO=publicado`, `CONFIAR_PROXY=true`, `DB_PROVEEDOR=supabase`, `ARCHIVOS_PROVEEDOR=supabase`, `SEMBRAR_SI_VACIA=true`, `DB_SINCRONIZAR=true`, `SIMULACION_HABILITADA=false`, y `JWT_SECRETO` aleatorio de al menos 32 caracteres. No usar SQLite ni almacenamiento local en producción.
- Para un repositorio público que no administrás, Render podría no habilitar despliegue automático. Hacer el despliegue desde el panel.

## 3. Verificar API pública y sus 26 fotografías

Abrir PowerShell en `Mi-Ciudad-MOBILE-`:

```powershell
cd "$HOME\Desktop\Mi-Ciudad-MOBILE-"
$api = "https://PEGAR-URL-REAL-DE-RENDER.onrender.com"
Invoke-RestMethod "$api/salud"
npm run apk:catalogo -- $api
```

El resultado correcto es **26 lugares activos y 0 sin foto**. El script verifica la respuesta paginada de la API y la existencia del respaldo local para cada ficha, o una URL de imagen remota accesible.

Si la API no responde al primer intento, consultar los logs de Render: podría estar arrancando tras una pausa, o bien falló la conexión a Supabase. No compilar hasta confirmar `/salud`.

**Ojo:** el catálogo nuevo es una base remota distinta de la SQLite local. Se cargan las semillas de la cátedra al inicio; las cuentas y visitas creadas solo en la base local **no se migran automáticamente**. No ejecutar operaciones de reseteo sobre bases con datos valiosos.

## 4. Asociar EAS preview y compilar la APK

Tras validar la URL real:

```powershell
cd "$HOME\Desktop\Mi-Ciudad-MOBILE-"
git status --short
git switch main
git pull --ff-only origin main
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\cerrar-apk-26-windows.ps1" -ApiUrl "$api"
eas build --platform android --profile preview --clear-cache
```

**Importante:** si Git detecta cambios locales antes de cambiar rama, detenerse y revisar; nunca hacer `reset --hard` ni `git clean`. El comando de cierre cambia el valor de la API en el entorno EAS `preview`; la APK **ya instalada no cambia**: hay que instalar la nueva.

Para iPhone, generar la compilación iOS del mismo perfil **solo si se dispone de firma Apple Developer y de un dispositivo registrado**, con `eas build --platform ios --profile preview`. La API es la misma.

## 5. Prueba de entrega

- En Android instalado, abrir sin Expo Go/Metro y observar las 26 fichas con imágenes.
- Desconectar temporalmente Wi-Fi/datos: las fotos locales y el catálogo previamente almacenado siguen disponibles; las funciones remotas indican falta de conexión.
- Volver a conectarse; registrar/iniciar sesión nuevamente si venís de la API temporal (los tokens anteriores pertenecen a otra base/servidor).
- Comprobar categorías, mapa, agenda, favoritos, visitas y una foto subida. En servicios gratuitos, el primer acceso después de inactividad puede fallar por el *cold start*; abrir `/salud` y volver a intentar.
- Cerrar VS Code, Metro, NestJS local y cloudflared. Confirmar que **la URL pública de Render** sigue respondiendo tras la reactivación y que el catálogo completo permanece en Supabase.

## Limitaciones que no debemos ocultar en la defensa

1. **Render Free no es un servicio siempre encendido:** suspende el proceso tras aproximadamente 15 minutos sin solicitudes. Su dirección HTTPS permanece, pero puede tardar cerca de un minuto en reactivarse, más de los 10 segundos de timeout de las primeras consultas móviles.
2. **Supabase Free puede pausar el proyecto** por inactividad después de alrededor de una semana. Conservar acceso al panel y revisar el estado antes de la exposición.
3. **La API original usa datos y credenciales de demostración**. No cargar personas reales ni información sensible en el servicio públicamente accesible.
4. **Atribución de fotos:** la verificación técnica no comprueba licencias ni que una imagen muestre el lugar correcto. Revisar los créditos pendientes antes de la publicación pública.

## Referencias

- API docente: https://github.com/franco-ruisdias-uner/api-proyectos-mobile/tree/main/api-mi-ciudad
- Render Blueprints: https://render.com/docs/blueprint-spec
- Render Free: https://render.com/docs/free
- Supabase Storage S3: https://supabase.com/docs/guides/storage/s3/compatibility
- Supabase Free: https://supabase.com/kb/faqs/platform/free-project-pausing
