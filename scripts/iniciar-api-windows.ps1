# Mi Ciudad Colón: inicia el backend oficial sin Docker.
# Ejecutar desde la raíz de Mi-Ciudad-MOBILE-:
#   powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1
# O especificar la carpeta ya descomprimida:
#   powershell -ExecutionPolicy Bypass -File .\scripts\iniciar-api-windows.ps1 -ApiPath "C:\ruta\api-mi-ciudad"
param(
  [string] $ApiPath,
  [string] $ZipPath
)

$ErrorActionPreference = 'Stop'
$carpetaProyecto = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destinoExtraccion = Join-Path $env:LOCALAPPDATA 'MiCiudadColon\backend'

function RutaApi([string] $directorio) {
  if (!$directorio -or !(Test-Path -LiteralPath $directorio -PathType Container)) { return $null }
  $rutas = @(
    $directorio,
    (Join-Path $directorio 'api-mi-ciudad'),
    (Join-Path $directorio 'api-proyectos-mobile-main\api-mi-ciudad')
  )
  foreach ($ruta in $rutas) {
    $archivo = Join-Path $ruta 'package.json'
    if (Test-Path -LiteralPath $archivo -PathType Leaf) {
      try {
        $json = Get-Content -LiteralPath $archivo -Raw | ConvertFrom-Json
        if ($json.name -eq 'api-mi-ciudad') { return (Resolve-Path -LiteralPath $ruta).Path }
      } catch {}
    }
  }
  return $null
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (!$node) { throw 'Node.js no está instalado. Instalá Node.js 24 desde https://nodejs.org y volvé a abrir VS Code.' }
$version = & node -p 'process.versions.node'
if ($LASTEXITCODE -ne 0) { throw 'No se pudo consultar la versión de Node.js.' }
if ([int]($version.Split('.')[0]) -lt 24) {
  throw "La API requiere Node.js 24 o superior; detecté v$version. Instalá Node 24 y reabrí la terminal."
}

$carpetaApi = RutaApi $ApiPath
if (!$carpetaApi) { $carpetaApi = RutaApi $destinoExtraccion }

if (!$carpetaApi) {
  $candidatosZip = @()
  if ($ZipPath) {
    if (!(Test-Path -LiteralPath $ZipPath -PathType Leaf)) { throw "No encontré el ZIP: $ZipPath" }
    $candidatosZip += $ZipPath
  } else {
    $ubicaciones = @(
      (Join-Path $env:USERPROFILE 'Downloads'),
      (Join-Path $env:USERPROFILE 'Desktop'),
      (Join-Path $env:USERPROFILE 'Descargas'),
      $carpetaProyecto
    )
    foreach ($ubicacion in $ubicaciones) {
      if (Test-Path -LiteralPath $ubicacion -PathType Container) {
        $candidatosZip += @(Get-ChildItem -LiteralPath $ubicacion -File -Filter 'api-proyectos-mobile-main*.zip' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
      }
    }
  }

  if ($candidatosZip.Count -eq 0) {
    throw 'No encontré api-proyectos-mobile-main.zip. Copialo a Descargas o usá -ZipPath "C:\ruta\archivo.zip".'
  }

  Write-Host "Extrayendo API desde: $($candidatosZip[0])" -ForegroundColor Cyan
  New-Item -ItemType Directory -Path $destinoExtraccion -Force | Out-Null
  Expand-Archive -LiteralPath $candidatosZip[0] -DestinationPath $destinoExtraccion -Force
  $carpetaApi = RutaApi $destinoExtraccion
}
if (!$carpetaApi) { throw 'No encontré la carpeta api-mi-ciudad con package.json dentro del ZIP.' }

Write-Host "API encontrada: $carpetaApi" -ForegroundColor Cyan
Push-Location -LiteralPath $carpetaApi
try {
  if (!(Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host 'Creado .env local de desarrollo con SQLite.' -ForegroundColor Cyan
  }

  # Si la base está vacía, el backend carga sus cuentas/lugares de prueba.
  # No borramos datos existentes: no se ejecuta db:reiniciar.
  $env:SEMBRAR_SI_VACIA = 'true'
  $env:ENTORNO = 'desarrollo'

  Write-Host 'Instalando dependencias con pnpm 10 (puede tardar la primera vez)...' -ForegroundColor Cyan
  & npx --yes pnpm@10.33.0 install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) { throw 'Falló pnpm install. Revisá el error anterior.' }

  Write-Host 'Iniciando API. Comprobá http://localhost:3000/salud desde la PC.' -ForegroundColor Green
  Write-Host 'Dejá esta terminal abierta. Para detener, Ctrl+C.' -ForegroundColor Green
  & npx --yes pnpm@10.33.0 dev
  if ($LASTEXITCODE -ne 0) { throw 'La API se cerró con errores. Revisá el mensaje anterior.' }
} finally {
  Pop-Location
}
