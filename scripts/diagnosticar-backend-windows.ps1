# Diagnóstico de la API docente sin borrar datos, reinstalar ni iniciar servicios.
# Uso: npm run api:diagnosticar:win
# Opcional: powershell -ExecutionPolicy Bypass -File .\scripts\diagnosticar-backend-windows.ps1 -ApiPath "C:\ruta\api-mi-ciudad"
param(
  [string] $ApiPath = '',
  [string] $BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

function Encontrar-Api([string] $directorio) {
  if (!$directorio -or !(Test-Path -LiteralPath $directorio -PathType Container)) {
    return $null
  }
  $opciones = @(
    $directorio,
    (Join-Path $directorio 'api-mi-ciudad'),
    (Join-Path $directorio 'api-proyectos-mobile-main\api-mi-ciudad')
  )
  foreach ($opcion in $opciones) {
    $packagePath = Join-Path $opcion 'package.json'
    if (!(Test-Path -LiteralPath $packagePath -PathType Leaf)) { continue }
    try {
      $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
      if ($package.name -eq 'api-mi-ciudad') {
        return (Resolve-Path -LiteralPath $opcion).Path
      }
    } catch { }
  }
  return $null
}

Write-Host 'MI CIUDAD - DIAGNOSTICO DEL BACKEND (SOLO LECTURA)' -ForegroundColor Cyan
Write-Host 'No se modifican bases, archivos, cuentas ni configuracion.' -ForegroundColor DarkGray

$candidatos = @()
if ($ApiPath) { $candidatos += $ApiPath }
if ($env:LOCALAPPDATA) {
  $candidatos += (Join-Path $env:LOCALAPPDATA 'MiCiudadColon\backend')
}
$candidatos += (Join-Path $env:USERPROFILE 'Downloads\api-proyectos-mobile-main')
$candidatos += (Join-Path $env:USERPROFILE 'Desktop\api-proyectos-mobile-main')
$candidatos += (Join-Path (Get-Location).Path 'api-proyectos-mobile-main')

$rutaApi = $null
foreach ($candidato in $candidatos) {
  $rutaApi = Encontrar-Api $candidato
  if ($rutaApi) { break }
}

if ($rutaApi) {
  Write-Host ('[OK] Backend encontrado: ' + $rutaApi) -ForegroundColor Green
  $package = Get-Content -LiteralPath (Join-Path $rutaApi 'package.json') -Raw | ConvertFrom-Json
  $scripts = @($package.scripts.PSObject.Properties.Name)
  Write-Host ('Scripts disponibles: ' + ($scripts -join ', '))
  $dependencias = @()
  if ($package.dependencies) {
    $dependencias += @($package.dependencies.PSObject.Properties.Name)
  }
  if ($package.devDependencies) {
    $dependencias += @($package.devDependencies.PSObject.Properties.Name)
  }
  $db = @($dependencias | Where-Object { $_ -match 'sqlite|postgres|prisma|typeorm|drizzle|knex|better-sqlite3' })
  Write-Host ('Librerias de datos detectadas: ' + $(if ($db.Count) { $db -join ', ' } else { 'sin coincidencias evidentes' }))

  $fuentes = Join-Path $rutaApi 'src'
  if (Test-Path -LiteralPath $fuentes -PathType Container) {
    $archivos = @(Get-ChildItem -LiteralPath $fuentes -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match 'event|evento|seed|sembr' } |
      Sort-Object FullName |
      Select-Object -First 35)
    if ($archivos.Count) {
      Write-Host 'Archivos de eventos/semillas (solo rutas):'
      foreach ($archivo in $archivos) {
        Write-Host ('  ' + $archivo.FullName.Substring($rutaApi.Length).TrimStart('\'))
      }
    } else {
      Write-Host '[AVISO] No se encontraron archivos con event, evento, seed o sembr en su nombre.'
    }
  }

  $render = @(
    (Join-Path $rutaApi 'render.yaml'),
    (Join-Path (Split-Path -Parent $rutaApi) 'render.yaml')
  ) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
  if ($render) {
    Write-Host ('[OK] Existe configuracion de Render: ' + $render) -ForegroundColor Green
  } else {
    Write-Host '[AVISO] No se encontro render.yaml en la carpeta API ni en su carpeta principal.'
  }

  $envEjemplo = Join-Path $rutaApi '.env.example'
  if (Test-Path -LiteralPath $envEjemplo -PathType Leaf) {
    $variables = @(Get-Content -LiteralPath $envEjemplo |
      ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') { $Matches[1] }
      } | Sort-Object -Unique)
    Write-Host ('Variables documentadas (SOLO NOMBRES): ' + ($variables -join ', '))
  } else {
    Write-Host '[AVISO] No existe .env.example junto al backend.'
  }
} else {
  Write-Host '[AVISO] No encontre la carpeta del backend en las ubicaciones conocidas.'
  Write-Host 'Si sabes su ruta: powershell -ExecutionPolicy Bypass -File .\scripts\diagnosticar-backend-windows.ps1 -ApiPath "C:\ruta\api-mi-ciudad"'
}

foreach ($recurso in @('salud', 'lugares?porPagina=500', 'eventos?porPagina=100')) {
  try {
    $uri = $BaseUrl + '/' + $recurso
    $respuesta = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 12
    $numero = if ($null -ne $respuesta.datos -and $respuesta.datos -is [array]) {
      @($respuesta.datos).Count
    } elseif ($null -ne $respuesta.meta -and $null -ne $respuesta.meta.total) {
      $respuesta.meta.total
    } else {
      'sin lista'
    }
    $total = if ($null -ne $respuesta.meta -and $null -ne $respuesta.meta.total) {
      $respuesta.meta.total
    } else { 'sin meta.total' }
    Write-Host ('[OK] GET /' + $recurso + ': elementos=' + $numero + ', total=' + $total) -ForegroundColor Green
    if ($recurso -like 'eventos*' -and $numero -eq 0) {
      Write-Host '[AVISO] La Agenda remota esta vacia. Hay que revisar semillas/filtros en el backend, no en Expo.'
    }
  } catch {
    Write-Host ('[AVISO] GET /' + $recurso + ' no se pudo consultar: ' + $_.Exception.Message)
  }
}

Write-Host ''
Write-Host 'Diagnostico terminado. No se mostraron contrasenas ni archivos .env.'
Write-Host 'Pega esta salida para decidir como corregir eventos y publicar la API con HTTPS.'
