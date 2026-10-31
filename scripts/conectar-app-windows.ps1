# Mi Ciudad Colón: conecta Expo Go con la API oficial en la misma red Wi-Fi.
# Desde la raíz de la app:
# powershell -ExecutionPolicy Bypass -File .\scripts\conectar-app-windows.ps1
# Si hay varias IPs, agregá: -PcIp 192.168.1.10
param(
  [string] $PcIp,
  [switch] $SoloConfigurar,
  [switch] $Tunnel
)

$ErrorActionPreference = 'Stop'
$proyecto = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
# Expo carga .env.local con prioridad sobre .env; escribir la URL en el archivo efectivo.
$envLocal = Join-Path $proyecto '.env.local'
$envBase = Join-Path $proyecto '.env'
$archivoEnv = if (Test-Path -LiteralPath $envLocal) { $envLocal } else { $envBase }

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'No encuentro Node.js en Windows. Instalalo antes de ejecutar Expo.'
}

try {
  $saludLocal = Invoke-RestMethod -Uri 'http://localhost:3000/salud' -TimeoutSec 8
  if ($saludLocal.datos.estado -ne 'ok') {
    throw 'La API respondió, pero no devolvió el estado esperado.'
  }
} catch {
  throw 'La API no responde en http://localhost:3000/salud. Iniciá primero el backend con .\scripts\iniciar-api-windows.ps1 desde otra terminal.'
}

if (!$PcIp) {
  $candidatas = @(
    Get-NetIPConfiguration -ErrorAction Stop |
      Where-Object { $_.NetAdapter.Status -eq 'Up' -and $_.IPv4DefaultGateway } |
      ForEach-Object { $_.IPv4Address.IPAddress } |
      Where-Object { $_ -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' } |
      Select-Object -Unique
  )

  if ($candidatas.Count -eq 0) {
    throw 'No detecté una IPv4 de red local. Ejecutá ipconfig y pasá la dirección con -PcIp 192.168.X.X.'
  }
  if ($candidatas.Count -gt 1) {
    Write-Host 'Detecté varias IPs posibles de la computadora:' -ForegroundColor Yellow
    $candidatas | ForEach-Object { Write-Host "  $_" }
    throw 'Repetí el comando agregando -PcIp con la dirección de Wi-Fi o Ethernet que comparte red con el teléfono.'
  }
  $PcIp = $candidatas[0]
}

if ($PcIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
  throw 'La IP ingresada no tiene formato IPv4. Ejemplo: -PcIp 192.168.1.10'
}
$apiUrl = 'http://' + $PcIp + ':3000'

try {
  $saludLan = Invoke-RestMethod -Uri "$apiUrl/salud" -TimeoutSec 8
  if ($saludLan.datos.estado -ne 'ok') {
    throw 'La dirección respondió, pero no es la API esperada.'
  }
} catch {
  throw "La API funciona en localhost, pero no responde en $apiUrl. Revisá que Windows permita Node.js en el firewall para redes privadas y que el backend escuche en 0.0.0.0."
}

# Confirmar que las fotos de la API funcionan desde la misma IP que usara el telefono.
try {
  $catalogo = Invoke-RestMethod -Uri "$apiUrl/lugares?porPagina=500" -TimeoutSec 20
  if ($null -eq $catalogo.datos -or $null -eq $catalogo.meta) {
    throw 'El catalogo no devolvio el contrato de la API de la catedra.'
  }
  $total = @($catalogo.datos).Count
  Write-Host "Catalogo de la catedra accesible: $total lugares activos." -ForegroundColor Green
  if ($total -lt 20) {
    Write-Warning 'El catalogo tiene menos lugares de los esperados. Puede faltar la semilla del profesor.'
  }
  $unaFoto = @($catalogo.datos | ForEach-Object { $_.imagenes } | Where-Object { $_ -match '^https?://' } | Select-Object -First 1)
  if ($unaFoto.Count -gt 0) {
    # Windows PowerShell 5.1 rechaza el encabezado Range en -Headers.
    # Una descarga GET normal evita el error y confirma que el archivo es una imagen.
    $urlFoto = [string]$unaFoto[0]
    if ($urlFoto -match '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/archivos/') {
      $urlFoto = $urlFoto -replace '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?', $apiUrl
    }
    $foto = Invoke-WebRequest -Uri $urlFoto -TimeoutSec 15 -UseBasicParsing
    $tipo = [string]$foto.Headers['Content-Type']
    if ($foto.StatusCode -notin @(200,206) -or $tipo -notmatch '^image/') {
      throw "El archivo de imagen no responde como imagen (HTTP $($foto.StatusCode), $tipo)."
    }
    Write-Host 'Archivo de imagen servido correctamente por la API.' -ForegroundColor Green
  } else {
    Write-Warning 'La API no incluyo imagenes. Revisar los medios de las semillas.'
  }
} catch {
  throw "El servidor responde /salud pero no se pudo verificar el catalogo y sus fotos: $($_.Exception.Message)"
}

if (Test-Path -LiteralPath $envLocal) {
  Write-Host 'Configurando .env.local (prioridad sobre .env en Expo).' -ForegroundColor Cyan
}
$linea = "EXPO_PUBLIC_API_URL=$apiUrl"
if (Test-Path -LiteralPath $archivoEnv) {
  $original = Get-Content -LiteralPath $archivoEnv -Raw
  $otras = @($original -split '\r?\n' | Where-Object { $_ -notmatch '^\s*EXPO_PUBLIC_API_URL\s*=' -and $_ -ne '' })
  $nuevo = (@($otras) + $linea) -join [Environment]::NewLine
  $nuevo += [Environment]::NewLine
} else {
  $nuevo = $linea + [Environment]::NewLine
}

[System.IO.File]::WriteAllText(
  $archivoEnv,
  $nuevo,
  [System.Text.UTF8Encoding]::new($false)
)
Write-Host 'API accesible desde la red local y .env configurado.' -ForegroundColor Green
Write-Host "  $linea" -ForegroundColor Green
Write-Host "  Verificación para el teléfono: $apiUrl/salud" -ForegroundColor Cyan
Write-Host 'Importante: el teléfono debe estar en la MISMA Wi-Fi/red que la computadora.' -ForegroundColor Yellow

if ($SoloConfigurar) { return }

Push-Location -LiteralPath $proyecto
try {
  if ($Tunnel) {
    Write-Host 'Iniciando Metro por tunnel. OJO: el tunnel no publica la API; el teléfono sigue necesitando la misma red.' -ForegroundColor Yellow
    & npx expo start --clear --tunnel
  } else {
    Write-Host 'Iniciando Expo Go por LAN. Escaneá el QR con el teléfono.' -ForegroundColor Cyan
    & npx expo start --clear --lan
  }
} finally {
  Pop-Location
}
