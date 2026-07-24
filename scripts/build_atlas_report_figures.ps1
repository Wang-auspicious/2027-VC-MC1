param(
    [string]$Destination = "submission_final\figures"
)

$ErrorActionPreference = "Stop"
$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root $Destination
[System.IO.Directory]::CreateDirectory($out) | Out-Null

$paper = "0xf4f1e9"
$ink = "0x202321"
$red = "0x8f3d31"
$serifFont = "C\:/Windows/Fonts/georgia.ttf"
$monoFont = "C\:/Windows/Fonts/consola.ttf"

$figures = @(
    @{
        Source = "artifacts\evidence-atlas\1440x900-atlas-universe.png"
        Name = "atlas-message-field.png"
        Kicker = "MESSAGE UNIVERSE"
        Title = "ALL 912 MESSAGES - ONE SHARED FIELD"
        Bottom = "Every point returns to an English source message."
        Dark = $false
    },
    @{
        Source = "artifacts\evidence-atlas\1440x900-atlas-q3.png"
        Name = "atlas-q3.png"
        Kicker = "Q3 - EARLY WARNING"
        Title = "77 PUBLIC EVENTS - FEATURE ALMANAC"
        Bottom = "May 29 is the strongest prior analogue; response coverage leaves durable gaps."
        Dark = $false
    },
    @{
        Source = "visual_workspace_cn\atlas-q2-3d-1440x900.png"
        Name = "atlas-q2-3d.png"
        Kicker = "Q2 - DUTY MIGRATION"
        Title = "ROLE - CHANNEL - IDENTITY DEPTH"
        Bottom = "The same selected messages remain linked across 2D duty strips and the preserved 3D view."
        Dark = $false
    },
    @{
        Source = "artifacts\evidence-atlas\1440x900-atlas-q1.png"
        Name = "atlas-q1.png"
        Kicker = "Q1 - REACHABLE PATH"
        Title = "SIX TEMPORAL TRACKS - EVIDENCE BOUNDARY"
        Bottom = "Observed action, dialogue assertions, and unobserved expected evidence remain separate."
        Dark = $true
    },
    @{
        Source = "artifacts\evidence-atlas\1440x900-atlas-prevention.png"
        Name = "atlas-prevention.png"
        Kicker = "COUNTERFACTUAL PREVENTION"
        Title = "CONTROLS CHANGE REACHABILITY"
        Bottom = "Hazardous routes close while the legitimate June 4 official path remains open."
        Dark = $false
    },
    @{
        Source = "artifacts\evidence-atlas\1440x900-atlas-igc.png"
        Name = "atlas-igc.png"
        Kicker = "INTER-AGENT GOVERNANCE CARRYOVER"
        Title = "EVIDENCE RANGES - NO FABRICATED SCORE"
        Bottom = "Five observational dimensions summarize the three challenge answers with explicit uncertainty."
        Dark = $false
    }
)

foreach ($figure in $figures) {
    $source = Join-Path $root $figure.Source
    $target = Join-Path $out $figure.Name
    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing figure source: $source"
    }
    $background = if ($figure.Dark) { "0x171a19" } else { $paper }
    $foreground = if ($figure.Dark) { "0xf4f1e9" } else { $ink }
    $filters = @(
        "drawbox=x=0:y=0:w=610:h=72:color=${background}:t=fill",
        "drawtext=fontfile='${monoFont}':text='$($figure.Kicker)':x=74:y=22:fontsize=11:fontcolor=${red}",
        "drawtext=fontfile='${serifFont}':text='$($figure.Title)':x=74:y=39:fontsize=18:fontcolor=${foreground}",
        "drawbox=x=0:y=724:w=790:h=116:color=${background}:t=fill",
        "drawtext=fontfile='${serifFont}':text='$($figure.Bottom)':x=74:y=765:fontsize=15:fontcolor=${foreground}"
    )
    if ($figure.Name -eq "atlas-message-field.png") {
        $filters += "drawbox=x=1047:y=72:w=393:h=768:color=${paper}:t=fill"
        $filters += "drawtext=fontfile='${monoFont}':text='MESSAGE EVIDENCE':x=1080:y=245:fontsize=10:fontcolor=${red}"
        $filters += "drawtext=fontfile='${serifFont}':text='Select any point to inspect the':x=1080:y=284:fontsize=15:fontcolor=${ink}"
        $filters += "drawtext=fontfile='${serifFont}':text='complete English source message.':x=1080:y=307:fontsize=15:fontcolor=${ink}"
        $filters += "drawtext=fontfile='${serifFont}':text='Key nodes expose three candidate':x=1080:y=350:fontsize=15:fontcolor=${ink}"
        $filters += "drawtext=fontfile='${serifFont}':text='evidence chains for verification.':x=1080:y=373:fontsize=15:fontcolor=${ink}"
    }
    $filter = $filters -join ","
    & $ffmpeg -y -loglevel error -i $source -vf $filter -frames:v 1 $target
    if ($LASTEXITCODE -ne 0) {
        throw "Figure build failed: $($figure.Name)"
    }
    Write-Output $target
}
