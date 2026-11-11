$ErrorActionPreference = 'Stop'

try {
    [Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
    $eventJson = [Console]::In.ReadToEnd()
    $nodeCommands = @(Get-Command node.exe -All -ErrorAction SilentlyContinue)
    $nodeCandidates = @($nodeCommands | ForEach-Object { $_.Source })
    # NVM for Windows may expose an inactive shim despite installed runtimes.
    foreach ($nodeCommand in $nodeCommands) {
        $installRoot = Join-Path (Split-Path (Split-Path $nodeCommand.Source -Parent) -Parent) 'installs'
        if (Test-Path -LiteralPath $installRoot) {
            $nodeCandidates += Get-ChildItem -LiteralPath $installRoot -Directory |
                Where-Object { $_.Name -match '^v\d+\.\d+\.\d+$' } |
                Sort-Object { [version]$_.Name.Substring(1) } -Descending |
                ForEach-Object { Join-Path $_.FullName 'node.exe' }
        }
    }
    $runtime = $null
    foreach ($candidate in ($nodeCandidates | Select-Object -Unique)) {
        if (!(Test-Path -LiteralPath $candidate -PathType Leaf)) { continue }
        try {
            $versionOutput = & $candidate --version 2>$null
        } catch {
            continue
        }
        if ($LASTEXITCODE -eq 0 -and "$versionOutput" -match '^v(\d+)\.(\d+)\.') {
            if ([int]$Matches[1] -gt 22 -or ([int]$Matches[1] -eq 22 -and [int]$Matches[2] -ge 12)) {
                $runtime = $candidate
                break
            }
        }
    }
    if (!$runtime) { throw 'A working Node 22.12+ runtime is required for Prettier.' }
    $OutputEncoding = New-Object System.Text.UTF8Encoding $false
    $eventJson | & $runtime (Join-Path $PSScriptRoot 'format.cjs')
} catch {
    [Console]::Error.WriteLine("Prettier hook: $($_.Exception.Message)")
}
exit 0
