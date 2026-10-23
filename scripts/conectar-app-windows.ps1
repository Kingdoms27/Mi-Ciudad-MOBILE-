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
$archivoEnv = Join-Path $proyecto '.env'

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
