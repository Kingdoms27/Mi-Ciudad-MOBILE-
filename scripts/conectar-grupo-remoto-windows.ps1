# Inicia Expo para compañeros en otras redes apuntando a la API HTTPS pública.
# No publica la API ni modifica la DB, el backend o las fotos.
# Ejemplo: npm run grupo:conectar -- https://ejemplo.trycloudflare.com
param(
  [Parameter(Mandatory=$true,Position=0)]
  [string] $ApiUrl,
  [switch] $SoloConfigurar
)

$ErrorActionPreference='Stop'
$raiz=(Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$ApiUrl=$ApiUrl.Trim().TrimEnd('/')

try {
  $url=[Uri]$ApiUrl
} catch {
  throw 'Indica una URL HTTPS válida; ejemplo: https://ejemplo.trycloudflare.com'
}
if ($url.Scheme -ne 'https' -or !$url.IsAbsoluteUri -or
    $url.AbsolutePath -ne '/' -or $url.Query -or $url.Fragment -or
    $url.Host -match '^(localhost|127\.0\.0\.1|0\.0\.0\.0)$') {
  throw 'Necesito la URL BASE HTTPS pública de la API (sin /salud ni /archivos ni ?consultas).'
}

Write-Host '[GRUPO] Verificando API pública de la cátedra...' -ForegroundColor Cyan
try {
  $salud=Invoke-RestMethod -Uri "$ApiUrl/salud" -TimeoutSec 15 -Method Get
  if ($salud.datos.estado -ne 'ok') { throw 'La respuesta no indica datos.estado=ok.' }
} catch {
  throw "La API no responde desde Internet en $ApiUrl/salud. Mantené encendida la API y el túnel. Detalle: $($_.Exception.Message)"
}

try {
  $catalogo=Invoke-RestMethod -Uri "$ApiUrl/lugares?porPagina=500" -TimeoutSec 20 -Method Get
  if ($null -eq $catalogo.datos -or $null -eq $catalogo.meta) {
    throw 'La respuesta no contiene datos y meta.'
  }
  $lugares=@($catalogo.datos)
  Write-Host ("[OK] API accesible: {0} lugares en la respuesta." -f $lugares.Count) -ForegroundColor Green
} catch {
  throw "La API está activa pero falló GET /lugares desde Internet: $($_.Exception.Message)"
}

# Verificar una imagen auténticamente servida por la API, sin cambiar datos.
$primerArchivo=@($lugares | ForEach-Object { $_.imagenes } |
  Where-Object { $_ -is [string] -and $_.Trim().Length -gt 0 } |
  Select-Object -First 1)
if ($primerArchivo.Count -gt 0) {
  $original=[string]$primerArchivo[0]
  $urlFoto=$original
  if ($original -match '^/archivos/') {
    $urlFoto=$ApiUrl+$original
  } elseif ($original -match '^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)(:\d+)?(/archivos/.*)$') {
    $urlFoto=$ApiUrl+$Matches[3]
  }
  try {
    $foto=Invoke-WebRequest -Uri $urlFoto -TimeoutSec 20 -UseBasicParsing -Method Get
    $tipo=[string]$foto.Headers['Content-Type']
    if ($tipo -notmatch '^image/(jpeg|png|webp|gif|avif)') {
      Write-Warning "La imagen devuelta por la API no es de tipo image/: $tipo"
    } else {
      Write-Host '[OK] Se pudo descargar una imagen desde la API pública.' -ForegroundColor Green
    }
  } catch {
    Write-Warning "La API devolvió una URL de imagen que no carga: $($_.Exception.Message)"
    Write-Warning 'Expo puede abrir, pero este archivo debe corregirse en la API de la cátedra.'
  }
} else {
  Write-Warning 'La API no devolvió ninguna URL de imagen en esta muestra.'
}

# Usar siempre .env.local, de mayor prioridad, sin alterar otras variables.
$archivo=Join-Path $raiz '.env.local'
$linea='EXPO_PUBLIC_API_URL='+$ApiUrl
$otras=@()
if (Test-Path -LiteralPath $archivo) {
  $actual=Get-Content -LiteralPath $archivo -Raw
  $otras=@($actual -split '\r?\n' | Where-Object {
    $_ -notmatch '^\s*EXPO_PUBLIC_API_URL\s*=' -and $_ -ne ''
  })
}
$nuevo=(@($otras)+$linea) -join [Environment]::NewLine
$nuevo+=[Environment]::NewLine
[System.IO.File]::WriteAllText($archivo,$nuevo,[System.Text.UTF8Encoding]::new($false))
$env:EXPO_PUBLIC_API_URL=$ApiUrl

Write-Host ("[OK] .env.local configurado: EXPO_PUBLIC_API_URL=$ApiUrl") -ForegroundColor Green
Write-Host '[INFO] No usés npm run api:conectar:win para esta sesión remota: reemplazaría la URL por una IP privada.' -ForegroundColor Yellow
Write-Host '[SEGURIDAD] La API publicada para pruebas es accesible mediante su URL. Usar sólo datos ficticios.' -ForegroundColor Yellow
if ($SoloConfigurar) { return }

# No matar procesos; evitar dos servidores Metro sobre el mismo puerto.
$ocupantes=@(Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue)
if ($ocupantes.Count -gt 0) {
  throw 'Ya hay Expo abierto en el puerto 8081. Cerrá SOLO el Expo anterior con Ctrl+C y repetí este comando; no cierres la API ni cloudflared.'
}

Push-Location -LiteralPath $raiz
try {
  Write-Host '[GRUPO] Expo por túnel: escaneen el QR desde Android o iPhone compatible.' -ForegroundColor Cyan
  Write-Host '[IMPORTANTE] Mantené abiertas las terminales de la API, cloudflared y Expo.' -ForegroundColor Cyan
  & npx expo start --clear --tunnel --go --port 8081
  if ($LASTEXITCODE -ne 0) {
    throw "Expo terminó con código $LASTEXITCODE."
  }
} finally {
  Pop-Location
}
