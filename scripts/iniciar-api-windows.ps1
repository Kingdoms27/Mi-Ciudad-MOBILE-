# Arranque de api-mi-ciudad en Windows sin Docker.
# Ejemplo: .\scripts\iniciar-api-windows.ps1 -ApiPath "C:\Users\PROGRAMADOR\Downloads\api-proyectos-mobile-main\api-mi-ciudad"
param(
  [Parameter(Mandatory = $true)]
  [string] $ApiPath
)
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath (Join-Path $ApiPath 'package.json'))) {
  throw "No se encontró package.json en la carpeta de la API: $ApiPath"
}
$majorText = & node -p "process.versions.node.split('.')[0]"
if ($LASTEXITCODE -ne 0) { throw 'Instalá Node.js 24 LTS para ejecutar la API oficial.' }
$major = [int]$majorText
if ($major -lt 24) {
  throw "La API de la cátedra necesita Node.js 24 o superior. Tenés Node.js $major. La app Expo puede funcionar con Node 22, pero el backend no."
}

Push-Location -LiteralPath $ApiPath
try {
  if (!(Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Se creó .env con la configuración de desarrollo SQLite.' -ForegroundColor Cyan
  }
  $env:SEMBRAR_SI_VACIA = 'true'
  $env:ENTORNO = 'desarrollo'
  Write-Host 'Instalando dependencias de api-mi-ciudad (pnpm)...' -ForegroundColor Cyan
  & npx --yes pnpm@10.33.0 install
  if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación de dependencias del backend.' }
  Write-Host 'API en http://localhost:3000/salud — mantené esta terminal abierta.' -ForegroundColor Green
  & npx --yes pnpm@10.33.0 dev
  if ($LASTEXITCODE -ne 0) { throw 'La API se detuvo con errores. Revisá las líneas anteriores.' }
} finally {
  Pop-Location
}
