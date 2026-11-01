# Instala una portada de alta definición en la app Mi Ciudad.
# Ejemplos desde la raíz del proyecto:
#   powershell -ExecutionPolicy Bypass -File .\scripts\instalar-portada-windows.ps1 -Archivo "$env:USERPROFILE\Downloads\hero-colon.jpg"
#   powershell -ExecutionPolicy Bypass -File .\scripts\instalar-portada-windows.ps1 -Archivo "C:\ruta\foto.png"
param([string]$Archivo)

$ErrorActionPreference='Stop'
$proyecto=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$destino=Join-Path $proyecto 'assets\hero-colon.jpg'

if(-not $Archivo){
  $ubicaciones=@(
    (Join-Path $proyecto 'hero-colon.jpg'),
    (Join-Path $env:USERPROFILE 'Downloads\hero-colon.jpg'),
    (Join-Path $env:USERPROFILE 'Descargas\hero-colon.jpg'),
    (Join-Path $env:USERPROFILE 'Downloads\Atardecer sobre el río con logo Colón(1).png'),
    (Join-Path $env:USERPROFILE 'Descargas\Atardecer sobre el río con logo Colón(1).png')
  )
  $Archivo=$ubicaciones | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}
if(-not $Archivo -or -not (Test-Path -LiteralPath $Archivo -PathType Leaf)){
  throw 'No encuentro la foto HD. Descargá hero-colon.jpg del chat y dejalo en Descargas, o usá -Archivo con la ruta completa.'
}
$origen=(Resolve-Path -LiteralPath $Archivo).Path
if($origen -eq $destino){
  throw 'El origen ya es assets\hero-colon.jpg. Elegí el archivo HD descargado para evitar sobrescribirlo consigo mismo.'
}
Add-Type -AssemblyName System.Drawing
$foto=[System.Drawing.Image]::FromFile($origen)
try{
  if($foto.Width -lt 1100 -or $foto.Height -lt 600){
    throw "La fotografía tiene baja resolución: $($foto.Width)x$($foto.Height). Usá la original de 1672x941 o superior."
  }
  $ancho=$foto.Width
  $alto=$foto.Height
}finally{$foto.Dispose()}

$copias=Join-Path $env:LOCALAPPDATA 'MiCiudadColon\backups'
New-Item -ItemType Directory -Force -Path $copias | Out-Null
if(Test-Path -LiteralPath $destino){
  $respaldo=Join-Path $copias ("hero-colon-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.jpg')
  Copy-Item -LiteralPath $destino -Destination $respaldo -Force
  Write-Host "Copia de la portada anterior: $respaldo" -ForegroundColor DarkGray
}
$extension=[System.IO.Path]::GetExtension($origen).ToLowerInvariant()
if($extension -eq '.jpg' -or $extension -eq '.jpeg'){
  Copy-Item -LiteralPath $origen -Destination $destino -Force
}elseif($extension -eq '.png'){
  $original=[System.Drawing.Image]::FromFile($origen)
  try{
    $bitmap=New-Object System.Drawing.Bitmap($original)
    try{
      $codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
        Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
      $parametros=New-Object System.Drawing.Imaging.EncoderParameters(1)
      $parametros.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,[long]94)
      $bitmap.Save($destino,$codec,$parametros)
    }finally{$bitmap.Dispose()}
  }finally{$original.Dispose()}
}else{
  throw "Archivo no admitido ($extension). Usá un PNG o JPEG."
}
$nuevo=Get-Item -LiteralPath $destino
if($nuevo.Length -lt 100000){ throw 'El archivo resultante parece demasiado pequeño. Verificá la imagen original.' }
Write-Host "PORTADA ACTUALIZADA: assets\hero-colon.jpg ($ancho x $alto, $([math]::Round($nuevo.Length/1kb)) KB)" -ForegroundColor Green
Write-Host 'Cerrá la terminal anterior de Expo con Ctrl+C y ejecutá: npx expo start --clear --lan' -ForegroundColor Yellow
Write-Host 'Los APK existentes NO cambian: será necesario recompilar el APK luego de verificar la app.' -ForegroundColor Yellow
