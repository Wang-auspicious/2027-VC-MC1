param(
    [string]$WorkingDirectory = "artifacts\atlas-video",
    [string]$FigureDirectory = "submission_final\figures",
    [string]$Destination = "submission_final\video\walkthrough.mp4"
)

$ErrorActionPreference = "Stop"
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$ffprobe = (Get-Command ffprobe -ErrorAction Stop).Source
$root = Split-Path -Parent $PSScriptRoot
$work = [System.IO.Path]::GetFullPath((Join-Path $root $WorkingDirectory))
$figures = [System.IO.Path]::GetFullPath((Join-Path $root $FigureDirectory))
$destinationPath = [System.IO.Path]::GetFullPath((Join-Path $root $Destination))
[System.IO.Directory]::CreateDirectory($work) | Out-Null
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destinationPath)) | Out-Null

$images = @(
    "atlas-message-field.png",
    "atlas-q3.png",
    "atlas-q2-3d.png",
    "atlas-q1.png",
    "atlas-igc.png",
    "atlas-prevention.png"
)

$parts = @()
for ($index = 0; $index -lt $images.Count; $index++) {
    $number = $index + 1
    $image = Join-Path $figures $images[$index]
    $audio = Join-Path $work ("narration-{0:D2}.wav" -f $number)
    $part = Join-Path $work ("part-{0:D2}.mp4" -f $number)
    if (-not (Test-Path -LiteralPath $image)) { throw "Missing image: $image" }
    if (-not (Test-Path -LiteralPath $audio)) { throw "Missing audio: $audio" }
    $duration = [double](& $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $audio)
    $fadeOut = [math]::Max(0, $duration - 0.45)
    $direction = if (($number % 2) -eq 0) { "iw/2-(iw/zoom/2)+35" } else { "iw/2-(iw/zoom/2)-35" }
    $filter = "scale=1584:990,zoompan=z='min(zoom+0.00028,1.10)':x='$direction':y='ih/2-(ih/zoom/2)':d=1:s=1440x900:fps=24,fade=t=in:st=0:d=0.35,fade=t=out:st=$($fadeOut.ToString('0.000',[System.Globalization.CultureInfo]::InvariantCulture)):d=0.45,format=yuv420p"
    & $ffmpeg -y -loglevel error -loop 1 -framerate 24 -i $image -i $audio -map 0:v:0 -map 1:a:0 -vf $filter -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -shortest -movflags +faststart $part
    if ($LASTEXITCODE -ne 0) { throw "Segment build failed: $number" }
    $parts += $part
}

$concat = Join-Path $work "concat.txt"
$lines = $parts | ForEach-Object { "file '$($_.Replace("'", "''"))'" }
[System.IO.File]::WriteAllLines($concat, $lines, [System.Text.UTF8Encoding]::new($false))
& $ffmpeg -y -loglevel error -f concat -safe 0 -i $concat -c:v copy -c:a copy -movflags +faststart $destinationPath
if ($LASTEXITCODE -ne 0) { throw "Final video assembly failed" }

$duration = [double](& $ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $destinationPath)
Write-Output ("video={0}" -f $destinationPath)
Write-Output ("duration_seconds={0:N2}" -f $duration)
if ($duration -ge 240) {
    throw "Video exceeds four minutes: $duration seconds"
}
