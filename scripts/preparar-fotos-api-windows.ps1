# Importacion opcional de fotos para una COPIA LOCAL de la API de la catedra.
# Ejecucion predeterminada: copiar importador, preparar 5 fotos verificadas y SIMULAR.
# Aplicar cambios requiere ejecutar explicitamente con -Aplicar; crea respaldo.
param(
  [string]$Fotos = '',
  [switch]$Aplicar,
  [string]$ApiPath = ''
)

$ErrorActionPreference = 'Stop'
$proyecto = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$plantilla = Join-Path $proyecto 'tools\api-mi-ciudad\importar-fotos-lugares.ts'
if (!(Test-Path -LiteralPath $plantilla)) {
  throw 'Falta el importador. Actualiza main del repositorio Mi-Ciudad-MOBILE-.'
}

$destinoBackend = Join-Path $env:LOCALAPPDATA 'MiCiudadColon\backend'
$opciones = @()
if ($ApiPath) { $opciones += $ApiPath }
$opciones += @(
  (Join-Path $destinoBackend 'api-proyectos-mobile-main\api-mi-ciudad'),
  (Join-Path $destinoBackend 'api-mi-ciudad')
)
$api = $null
foreach ($p in $opciones) {
  if (Test-Path (Join-Path $p 'package.json')) {
    try {
      $pkg = Get-Content (Join-Path $p 'package.json') -Raw | ConvertFrom-Json
      if ($pkg.name -eq 'api-mi-ciudad') {
        $api = (Resolve-Path $p).Path
        break
      }
    } catch {}
  }
}
if (!$api) {
  throw 'No encontre la API local. Primero ejecuta npm run api:iniciar:win, o indica -ApiPath RUTA_REAL.'
}
Write-Host "[API] $api" -ForegroundColor Cyan

if (!$Fotos) {
  $Fotos = Join-Path $env:LOCALAPPDATA 'MiCiudadColon\fotos-para-api'
  New-Item -ItemType Directory -Force -Path $Fotos | Out-Null

  # 5 fotos ya incluidas en el repositorio, de Wikimedia Commons.
  # Las otras 2 de assets/lugares no tienen localizacion exacta certificada
  # (puerto/puente), por eso NO se importan automaticamente.
  $mapa = @(
    @('molino-forclaz.jpg','lug-004.jpg'),
    @('parque-nacional-el-palmar.jpg','lug-006.jpg'),
    @('palacio-san-jose.jpg','lug-012.jpg'),
    @('costanera-gobernador-quiros.jpg','lug-014.jpg'),
    @('parque-dr-herminio-j-quiros.jpg','lug-015.jpg')
  )
  foreach ($par in $mapa) {
    $origen = Join-Path $proyecto ('assets\lugares\' + $par[0])
    $destino = Join-Path $Fotos $par[1]
    if (!(Test-Path $origen)) {
      Write-Host "[AVISO] Falta foto local: $origen" -ForegroundColor Yellow
    } elseif (!(Test-Path $destino)) {
      Copy-Item -LiteralPath $origen -Destination $destino
      Write-Host "[PREPARADA] $($par[1])" -ForegroundColor Cyan
    } else {
      Write-Host "[CONSERVADA] $($par[1])" -ForegroundColor Cyan
    }
  }
}
if (!(Test-Path -LiteralPath $Fotos -PathType Container)) { throw "No existe la carpeta de fotos: $Fotos" }
$Fotos = (Resolve-Path $Fotos).Path

$carpetaTools = Join-Path $api 'src\tools'
New-Item -ItemType Directory -Force -Path $carpetaTools | Out-Null
$archivoTool = Join-Path $carpetaTools 'importar-fotos-lugares.ts'
if (Test-Path $archivoTool) {
  $hashLocal = (Get-FileHash -LiteralPath $archivoTool -Algorithm SHA256).Hash
  $hashRepo = (Get-FileHash -LiteralPath $plantilla -Algorithm SHA256).Hash
  if ($hashLocal -ne $hashRepo) {
    throw "Ya hay otro importador en $archivoTool. No lo sobrescribo: revisa cual utilizar."
  }
} else {
  Copy-Item -LiteralPath $plantilla -Destination $archivoTool
}
Write-Host "[OK] Importador disponible en API local" -ForegroundColor Green

if ($Aplicar) {
  # No hacer copia en caliente de SQLite ni sobrescribir la configuracion del profesor.
  if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
    throw 'La API parece estar encendida en el puerto 3000. Detenela con Ctrl+C antes de -Aplicar.'
  }
  $envFile = Join-Path $api '.env'
  if (!(Test-Path $envFile)) { throw 'Falta el .env local de la API. No se aplica sin configuracion.' }
  $lineas = @(Get-Content -LiteralPath $envFile)
  function LeerValor([string]$nombre,[string]$valorDefecto) {
    $coincidencias = @($lineas | Where-Object { $_ -match ('^\s*' + [regex]::Escape($nombre) + '\s*=') })
    if (!$coincidencias.Count) { return $valorDefecto }
    return (($coincidencias[-1] -split '=',2)[1]).Trim()
  }
  if ((LeerValor 'ENTORNO' 'desarrollo') -ne 'desarrollo' -or
      (LeerValor 'DB_MOTOR' 'better-sqlite3') -ne 'better-sqlite3' -or
      (LeerValor 'DB_ARCHIVO' 'datos/api.sqlite') -ne 'datos/api.sqlite' -or
      (LeerValor 'ARCHIVOS_PROVEEDOR' 'local') -ne 'local' -or
      (LeerValor 'DIRECTORIO_ARCHIVOS' 'archivos') -ne 'archivos') {
    throw 'El respaldo automatico solo permite configuracion LOCAL por defecto (SQLite datos/api.sqlite y archivos/).'
  }
  $db = Join-Path $api 'datos\api.sqlite'
  $medios = Join-Path $api 'archivos'
  if (!(Test-Path $db -PathType Leaf) -or !(Test-Path $medios -PathType Container)) {
    throw 'No encontre datos/api.sqlite o archivos/. Verifica el backend antes de aplicar.'
  }
  $respaldo = Join-Path $env:LOCALAPPDATA ('MiCiudadColon\respaldos-fotos\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Force -Path $respaldo | Out-Null
  Copy-Item -LiteralPath $db -Destination (Join-Path $respaldo 'api.sqlite') -ErrorAction Stop
  Copy-Item -LiteralPath $medios -Destination (Join-Path $respaldo 'archivos') -Recurse -ErrorAction Stop
  Write-Host "[RESPALDO] $respaldo" -ForegroundColor Green
}

Push-Location $api
try {
  Write-Host "[BUILD] Compilando copia local de la API..." -ForegroundColor Cyan
  & npx --yes pnpm@10.33.0 build
  if ($LASTEXITCODE -ne 0) { throw 'La compilacion de la API fallo. No se aplico nada.' }
  $compilado = Join-Path $api 'dist\src\tools\importar-fotos-lugares.js'
  if (!(Test-Path $compilado)) { throw "No encontre el importador compilado: $compilado" }

  Write-Host "[FOTOS] $Fotos" -ForegroundColor Cyan
  if ($Aplicar) {
    & node $compilado $Fotos '--aplicar'
  } else {
    & node $compilado $Fotos
  }
  if ($LASTEXITCODE -ne 0) { throw 'La importacion/simulacion informo un error. Revisa la salida anterior.' }
  if ($Aplicar) {
    Write-Host '[OK] Actualizacion local terminada. Reinicia la API y audita las fotos desde el proyecto movil.' -ForegroundColor Green
  } else {
    Write-Host '[SIMULACION APROBADA] Sin cambios en SQLite. Para aplicar, detener la API y ejecutar el mismo script con -Aplicar.' -ForegroundColor Green
    Write-Host 'Creditos de las fotografias: docs/CREDITOS-FOTOS-COMMONS.md'
  }
} finally {
  Pop-Location
}
