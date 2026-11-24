Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\fitness-planet-logo.png"
$iconsDir = "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\icons"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($w, $h, $destPath) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $w, $h)
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Resize-Image 192 192 "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\icons\icon-192x192.png"
Resize-Image 512 512 "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\icons\icon-512x512.png"
Resize-Image 180 180 "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\apple-touch-icon.png"
Copy-Item "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\icons\icon-512x512.png" "C:\Users\anoct\.gemini\antigravity\scratch\gymos-cloud\public\icons\maskable-icon-512x512.png"

$srcImg.Dispose()
Write-Output "PWA icons successfully created!"
