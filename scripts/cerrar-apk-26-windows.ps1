# Cierre controlado para APK Android: consulta API real, fotos, y EAS preview.
# No elimina carpetas, no altera la API ni modifica datos de usuario.
# Uso:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\cerrar-apk-26-windows.ps1
# Opcional: -Compilar (lanza EAS luego de pasar verificaciones).
[CmdletBinding()]
param(
    [string]$ApiUrl,
    [switch]$Compilar,
    [switch]$PermitirTunnelTemporal
)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
        foreach ($archivo in @('.env.local', '.env')) {
            if (-not (Test-Path -LiteralPath $archivo)) { continue }
            $linea = Get-Content -LiteralPath $archivo |
                Where-Object { $_ -match '^\s*EXPO_PUBLIC_API_URL\s*=' } |
                Select-Object -Last 1
            if ($null -eq $linea) { continue }
            $ApiUrl = ($linea -replace '^\s*EXPO_PUBLIC_API_URL\s*=\s*', '').Trim().Trim('"').Trim("'")
            if ($ApiUrl) { break }
        }
    }
    if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
        throw 'Falta EXPO_PUBLIC_API_URL en .env.local o .env. Configura la URL HTTPS real de la API docente.'
    }
    $ApiUrl = $ApiUrl.Trim().TrimEnd('/')
    $uri = $null
    if (-not [Uri]::TryCreate($ApiUrl, [UriKind]::Absolute, [ref]$uri) -or
        $uri.Scheme -ne 'https' -or
        $uri.Host -match '^(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)') {
        throw 'Para la APK necesitas una API HTTPS publica y accesible, no localhost ni una IP privada.'
    }
    if ($uri.Host -like '*.trycloudflare.com' -and -not $PermitirTunnelTemporal) {
        throw 'La URL trycloudflare es temporal: la APK dejara de recibir datos cuando se cierre el tunel. Usa hosting estable o repeti con -PermitirTunnelTemporal SOLO para una prueba con el tunel activo.'
    }

    # Distinguir URL de tunel vencida de un catalogo incompleto o sin fotos.
    Write-Host '[CONEXION] Comprobando API publica antes de auditar las 26 fotos...' -ForegroundColor Cyan
    try {
        $salud = Invoke-RestMethod -Uri "$ApiUrl/salud" -Method Get -TimeoutSec 15
        if ($salud.datos.estado -ne 'ok') {
            throw 'La API respondio, pero /salud no indica datos.estado=ok.'
        }
    } catch {
        Write-Host '[API NO DISPONIBLE] El enlace configurado no responde.' -ForegroundColor Red
        Write-Host ('URL actual: ' + $ApiUrl) -ForegroundColor Yellow
        Write-Host 'La app y las 26 imagenes no han sido evaluadas: la conexion fallo primero.' -ForegroundColor Yellow
        Write-Host '1. En otra terminal: npm run api:iniciar:win (dejarla abierta).' -ForegroundColor Yellow
        Write-Host '2. En otra terminal: cloudflared tunnel --url http://localhost:3000 (dejarla abierta).' -ForegroundColor Yellow
        Write-Host '3. Usar la URL HTTPS NUEVA que muestra cloudflared:' -ForegroundColor Yellow
        Write-Host 'powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\cerrar-apk-26-windows.ps1 -ApiUrl "https://NUEVA-URL.trycloudflare.com" -PermitirTunnelTemporal' -ForegroundColor Yellow
        throw ('No se pudo acceder a ' + $ApiUrl + '/salud. Detalle: ' + $_.Exception.Message)
    }
    Write-Host '[OK] API publica responde /salud.' -ForegroundColor Green

    Write-Host '[1/4] Comprobando los 26 lugares de la API y sus imagenes...' -ForegroundColor Cyan
    & node .\scripts\verificar-catalogo-apk.mjs $ApiUrl
    if ($LASTEXITCODE -ne 0) { throw 'El catalogo no tiene 26 lugares activos con foto comprobada. Revisa el informe de reportes antes de compilar.' }

    Write-Host '[2/4] Comprobando cuenta Expo...' -ForegroundColor Cyan
    & eas whoami
    if ($LASTEXITCODE -ne 0) { throw 'Inicia sesion con eas login en la cuenta autorizada para este proyecto.' }

    Write-Host '[3/4] Configurando EXPO_PUBLIC_API_URL en EAS preview...' -ForegroundColor Cyan
    & eas env:set --name EXPO_PUBLIC_API_URL --value $ApiUrl --environment preview --visibility plaintext
    if ($LASTEXITCODE -ne 0) { throw 'EAS no pudo guardar la URL en el entorno preview.' }
    & eas env:list --environment preview
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo verificar el entorno preview de EAS.' }

    if ($Compilar) {
        Write-Host '[4/4] Generando APK Android nueva (sin Metro)...' -ForegroundColor Green
        & eas build --platform android --profile preview --clear-cache
        if ($LASTEXITCODE -ne 0) { throw 'EAS no completo la compilacion. Revisa el enlace o los logs del build.' }
    } else {
        Write-Host '[4/4] Listo para compilar. Ejecuta:' -ForegroundColor Green
        Write-Host 'eas build --platform android --profile preview --clear-cache'
    }
    Write-Host 'NOTA: no se certifica identidad/licencia de fotos por su nombre; revisar atribuciones pendientes.'
}
finally { Pop-Location }
