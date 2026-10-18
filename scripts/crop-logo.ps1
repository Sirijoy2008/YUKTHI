Add-Type -AssemblyName System.Drawing
$imagePath = "c:\Users\DELL\OneDrive\Desktop\HACKHERS\public\yukthi-logo.jpg"
$iconPath = "c:\Users\DELL\OneDrive\Desktop\HACKHERS\public\yukthi-icon.png"

$src = [System.Drawing.Bitmap]::FromFile($imagePath)

$cropWidth = 400
$cropHeight = 400
$cropX = [int](($src.Width - $cropWidth) / 2)
$cropY = 175

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropWidth, $cropHeight)
$cropBmp = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight)
$g = [System.Drawing.Graphics]::FromImage($cropBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)

$cropBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$cropBmp.Dispose()
$src.Dispose()

Write-Output "Successfully saved refined cropped emblem to $iconPath"
