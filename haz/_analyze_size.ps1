$root = "C:\Users\murga\haz"

"=== TOP-LEVEL DIRECTORIES BY SIZE (MB) ==="
Get-ChildItem $root -Directory | Where-Object Name -ne '.git' | ForEach-Object {
    $f = $_.FullName
    $s = (Get-ChildItem $f -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($s -gt 1MB) {
        "{0:N1}`t{1}" -f ($s/1MB), $_.Name
    }
} | Sort-Object -Descending

"`n=== NODE_MODULES SIZE ==="
$nm = (Get-ChildItem "$root\node_modules" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
"{0:N2} GB" -f ($nm/1GB)

"`n=== FILES LARGER THAN 10MB ==="
Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 10MB } | Sort-Object Length -Descending | Select-Object -First 30 @{N='SizeMB';E={[math]::Round($_.Length/1MB,1)}}, FullName | Format-Table -AutoSize

"`n=== .GIT SIZE ==="
$gs = (Get-ChildItem "$root\.git" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
"{0:N2} MB" -f ($gs/1MB)

"`n=== .OPENCODE SIZE ==="
$os = (Get-ChildItem "$root\.opencode" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
"{0:N2} MB" -f ($os/1MB)

"`n=== PACKAGES DIR SIZES ==="
if (Test-Path "$root\packages") {
    Get-ChildItem "$root\packages" -Directory | ForEach-Object {
        $s = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        if ($s -gt 1MB) {
            "{0:N1}`t{1}" -f ($s/1MB), $_.Name
        }
    } | Sort-Object -Descending
}

"`n=== BIN DIR ==="
if (Test-Path "$root\bin") {
    $bs = (Get-ChildItem "$root\bin" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    "{0:N1} MB" -f ($bs/1MB)
}
