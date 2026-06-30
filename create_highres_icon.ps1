Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 64, 128, 256)
$images = @{}

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.PixelOffsetMode = 'HighQuality'

    $half = $size / 2
    $r = $half - 1
    $cx = $half
    $cy = $half

    # Dark blue outer circle
    $brush1 = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)), (New-Object System.Drawing.Point($size,$size)), [System.Drawing.Color]::FromArgb(10,25,47), [System.Drawing.Color]::FromArgb(26,50,90))
    $g.FillEllipse($brush1, 1, 1, $size-2, $size-2)

    # Thin gold ring border
    $penRing = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,212,150,30), [Math]::Max(1, $size/50))
    $g.DrawEllipse($penRing, 2, 2, $size-4, $size-4)

    # Globe icon on left side
    $gSize = $size * 0.38
    $gx = $size * 0.22
    $gy = $size * 0.18
    $penGlobe = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220,255,255,255), [Math]::Max(1,$size/30))
    $g.DrawEllipse($penGlobe, $gx, $gy, $gSize, $gSize)
    $g.DrawLine($penGlobe, $gx, $gy+$gSize/2, $gx+$gSize, $gy+$gSize/2)
    $g.DrawLine($penGlobe, $gx+$gSize/2, $gy, $gx+$gSize/2, $gy+$gSize)

    # Passport on right side
    $pw = $size * 0.38
    $ph = $size * 0.30
    $px = $size * 0.48
    $py = $size * 0.22
    $penPass = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230,255,255,255), [Math]::Max(1,$size/28))
    $g.DrawRectangle($penPass, $px, $py, $pw, $ph)
    $lineWidth = $pw * 0.65
    $lineY = $py + $ph * 0.25
    for ($i=0; $i -lt 3; $i++) {
        $g.DrawLine($penPass, $px+$pw*0.12, $lineY, $px+$pw*0.12+$lineWidth, $lineY)
        $lineY += $ph * 0.23
    }

    # Checkmark in bottom center
    $ckSize = $size * 0.20
    $ckx1 = $cx - $ckSize*0.9
    $cky1 = $cy + $size*0.12
    $ckx2 = $cx - $ckSize*0.1
    $cky2 = $cy + $size*0.30
    $ckx3 = $cx + $ckSize*0.9
    $cky3 = $cy + $size*0.05
    $penCheck = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,50,205,100), [Math]::Max(2,$size/14))
    $penCheck.StartCap = 'Round'
    $penCheck.EndCap = 'Round'
    $g.DrawLine($penCheck, $ckx1, $cky1, $ckx2, $cky2)
    $g.DrawLine($penCheck, $ckx2, $cky2, $ckx3, $cky3)

    $g.Dispose()
    $images[$size] = $bmp
}

# Create ICO file
$icoPath = 'C:\Users\Administrator\Desktop\all my websites\visa-portal-app\icon.ico'
$stream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$writer = New-Object System.IO.BinaryWriter($stream)

# ICO header
$writer.Write([UInt16]0)  # reserved
$writer.Write([UInt16]1)  # ICO type
$writer.Write([UInt16]$sizes.Count)  # number of images

$offset = 6 + $sizes.Count * 16
$pngData = @{}

foreach ($size in $sizes) {
    $ms = New-Object System.IO.MemoryStream
    $images[$size].Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngData[$size] = $ms.ToArray()
    $ms.Close()
}

$idx = 0
foreach ($size in $sizes) {
    $data = $pngData[$size]
    $w = if ($size -eq 256) { 0 } else { $size }
    $h = if ($size -eq 256) { 0 } else { $size }
    $writer.Write([Byte]$w)   # width
    $writer.Write([Byte]$h)   # height
    $writer.Write([Byte]0)    # colors
    $writer.Write([Byte]0)    # reserved
    $writer.Write([UInt16]1)  # color planes
    $writer.Write([UInt16]32) # bits per pixel
    $writer.Write([UInt32]$data.Length)  # size
    $writer.Write([UInt32]$offset)  # offset
    $offset += $data.Length
    $idx++
}

foreach ($size in $sizes) {
    $writer.Write($pngData[$size])
    $images[$size].Dispose()
}

$writer.Flush()
$writer.Close()
$stream.Close()

Write-Host 'High-quality multi-resolution ICO created!'
