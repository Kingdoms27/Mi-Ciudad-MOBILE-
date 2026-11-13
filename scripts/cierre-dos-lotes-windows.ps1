# Cierre reproducible en dos lotes para Mi Ciudad Colón (Windows).
# No publica la API, no reinicia SQLite y no realiza un build EAS.
param(
  [ValidateSet('Fotos', 'Pruebas')]
  [string]$Lote = 'Fotos',
  [string]$Api = 'http://localhost:3000'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
Push-Location $raiz

function Ejecutar([string]$Titulo, [scriptblock]$Comando, [bool]$Aviso = $false) {
  Write-Host ""
  Write-Host ("[LOTE] " + $Titulo) -ForegroundColor Cyan
  & $Comando
  $codigo = $LASTEXITCODE
  if ($codigo -ne 0) {
    if ($Aviso) {
      Write-Warning ("Revisar resultado de " + $Titulo + " (codigo " + $codigo + ").")
    } else {
      throw ("Fallo: " + $Titulo + " (codigo " + $codigo + ").")
    }
  }
}

try {
  if ($Lote -eq 'Fotos') {
    Write-Host '[MI CIUDAD] LOTE 1: FOTOS, LICENCIAS Y REPORTE'
    Write-Host 'La API docente debe estar encendida en la direccion indicada.'
    Ejecutar 'Descargar Commons verificadas e incluir fotos en assets' { npm run fotos:commons }
    $cantidad = @(Get-ChildItem -Path (Join-Path $raiz 'assets/lugares') -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Extension -in @('.jpg','.jpeg','.png','.webp') }).Count
    Write-Host ("[FOTOS] " + $cantidad + " archivos locales presentes.")
    if ($cantidad -lt 9) {
      Write-Warning 'Faltan fotos locales verificadas: comprobar Commons y registrar las pendientes.'
    }
    Ejecutar 'Reporte por lugar y fotos prioritarias' { npm run fotos:reporte -- $Api }
    # La API deja intencionalmente lug-003 sin URL; el auditor puede devolver 1.
    Ejecutar 'Auditoria de URLs reales y duplicados' { npm run api:fotos:grupo -- $Api } $true
    Write-Host ''
    Write-Host '[RESULTADO] Revisar reportes/fotos-para-revisar.csv, fotos-prioritarias.csv y diagnostico-imagenes-api.json.'
    Write-Host '[AVISO] Una semilla valida no equivale a foto especifica; no sustituir por fotos de otro lugar.'
  } else {
    Write-Host '[MI CIUDAD] LOTE 2: DEPENDENCIAS, CODIGO Y PREENTREGA'
    Write-Host 'Expo SDK 58 actualiza versiones patch: esta accion puede cambiar package.json y package-lock.json.'
    Ejecutar 'Ajustar paquetes compatibles con Expo' { npx expo install --fix }
    Ejecutar 'Verificar versiones Expo' { npx expo install --check }
    Ejecutar 'Pruebas de fotos, avisos, navegacion y API' { node --test scripts/test-imagenes-api.mjs scripts/test-cierre-mobile.mjs }
    Ejecutar 'Validar TypeScript' { npm run typecheck }
    Ejecutar 'Preentrega sin publicar' { npm run entrega:check }
    Ejecutar 'Consultar contrato de API docente' { npm run api:check -- $Api } $true
    Write-Host ''
    Write-Host '[RESULTADO] Revisar git diff, guardar los cambios en Git y probar en Android/iPhone reales.'
    Write-Host '[BLOQUEO APK] La app requiere URL HTTPS estable en EAS preview y build probado sin Metro.'
  }
} finally {
  Pop-Location
}
