$root = "C:\Users\murga\haz"

"=== TOTAL PROJECT SIZE ==="
$total = (Get-ChildItem $root -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
"{0:N2} GB" -f ($total/1GB)

"=== .BUN IN NODE_MODULES ==="
$bun = (Get-ChildItem "$root\node_modules\.bun" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
"{0:N2} GB" -f ($bun/1GB)

"=== AUTO_SKILL FILES ==="
$files = Get-ChildItem "$root\auto_skill_*.py"
$count = $files.Count
$s = ($files | Measure-Object Length -Sum).Sum
"{0} files, {1:N2} MB total" -f $count, ($s/1MB)

"=== README TRANSLATIONS ==="
$readmes = Get-ChildItem "$root\README.*.md"
$rc = $readmes.Count
$rs = ($readmes | Measure-Object Length -Sum).Sum
"{0} files, {1:N2} MB" -f $rc, ($rs/1MB)

"=== PERF DIR ==="
if (Test-Path "$root\perf") {
    $psize = (Get-ChildItem "$root\perf" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    "{0:N1} MB" -f ($psize/1MB)
}

"=== SPECS DIR ==="
if (Test-Path "$root\specs") {
    $ssize = (Get-ChildItem "$root\specs" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    "{0:N1} MB" -f ($ssize/1MB)
}

"=== NODE_MODULES SUBDIRS TOP 15 ==="
Get-ChildItem "$root\node_modules" -Directory | ForEach-Object {
    $s = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    if ($s -gt 50MB) {
        "{0:N1}`t{1}" -f ($s/1MB), $_.Name
    }
} | Sort-Object -Descending | Select-Object -First 15
