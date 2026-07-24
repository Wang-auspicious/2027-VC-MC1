param(
    [string]$ScriptPath = "submission_final\video-script.md",
    [string]$OutputDirectory = "artifacts\atlas-video"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$scriptFile = (Resolve-Path -LiteralPath $ScriptPath).Path
$output = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($output) | Out-Null

$content = [System.IO.File]::ReadAllText($scriptFile, [System.Text.Encoding]::UTF8)
$matches = [regex]::Matches($content, '(?m)^Voiceover: (.+)$')
if ($matches.Count -ne 6) {
    throw "Expected six Voiceover sections, found $($matches.Count)."
}

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft Zira Desktop")
$synth.Rate = 0
$synth.Volume = 100
try {
    for ($index = 0; $index -lt $matches.Count; $index++) {
        $number = $index + 1
        $path = Join-Path $output ("narration-{0:D2}.wav" -f $number)
        $synth.SetOutputToWaveFile($path)
        $synth.Speak($matches[$index].Groups[1].Value)
        $synth.SetOutputToNull()
        Write-Output $path
    }
}
finally {
    $synth.Dispose()
}
