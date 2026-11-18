param(
  [int]$MaxEdge = 1200,
  [int]$Quality = 82,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repositoryRoot 'assets\img\series'
$targetRoot = Join-Path $repositoryRoot 'assets\img\thumbs'

Add-Type -AssemblyName System.Drawing

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object MimeType -eq 'image/jpeg' |
  Select-Object -First 1
$encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  [long]$Quality
)

$created = 0
$skipped = 0

Get-ChildItem -LiteralPath $sourceRoot -Directory | ForEach-Object {
  $series = $_
  $seriesTarget = Join-Path $targetRoot $series.Name
  New-Item -ItemType Directory -Force -Path $seriesTarget | Out-Null

  Get-ChildItem -LiteralPath $series.FullName -File |
    Where-Object Extension -Match '^\.(jpe?g|png)$' |
    ForEach-Object {
      $source = $_
      $destination = Join-Path $seriesTarget ($source.BaseName + '.jpg')
      if ((Test-Path -LiteralPath $destination) -and -not $Force) {
        $script:skipped++
        return
      }

      $image = [System.Drawing.Image]::FromFile($source.FullName)
      try {
        $scale = [Math]::Min(1.0, [double]$MaxEdge / [double][Math]::Max($image.Width, $image.Height))
        $width = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
        $height = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))
        $bitmap = New-Object System.Drawing.Bitmap $width, $height
        try {
          $bitmap.SetResolution(72, 72)
          $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
          try {
            $graphics.Clear([System.Drawing.Color]::Black)
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.DrawImage($image, 0, 0, $width, $height)
          } finally {
            $graphics.Dispose()
          }
          $bitmap.Save($destination, $jpegCodec, $encoderParameters)
          $script:created++
        } finally {
          $bitmap.Dispose()
        }
      } finally {
        $image.Dispose()
      }
    }
}

$encoderParameters.Dispose()
Write-Output "Generated $created thumbnails; skipped $skipped existing files."
