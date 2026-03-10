Set-Location "C:\Users\arul0\Documents\MyProjects\simpletrack-prime-ng"
$utf8 = [System.Text.Encoding]::UTF8
$srcFiles = Get-ChildItem -Recurse -Path "src","public" -Include "*.ts","*.html","*.js","*.xml","*.txt" | Where-Object { $_.Name -notlike "*.min.js" }
$pkgFile = Get-Item "package.json"
$files = @($srcFiles) + @($pkgFile)
$count = 0
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, $utf8)
    $new = $content `
        -replace 'STKAnalytics', 'PulzioAnalytics' `
        -replace 'stk_is_owner', 'plz_is_owner' `
        -replace 'stk-analytics', 'pulzivo-analytics' `
        -replace 'SimpleTrack Analytics SDK', 'Pulzivo Analytics SDK' `
        -replace 'SimpleTrack Analytics', 'Pulzivo Analytics' `
        -replace 'SimpleTrack\.dev', 'Pulzivo' `
        -replace 'SimpleTrack', 'Pulzivo' `
        -replace '(?i)simpletrack\.dev', 'pulzivo.com' `
        -replace '(?i)simpletrack\.io', 'pulzivo.com' `
        -replace '(?<![a-zA-Z])simpletrack(?!\.[a-zA-Z])', 'pulzivo'
    if ($content -ne $new) {
        [System.IO.File]::WriteAllText($file.FullName, $new, $utf8)
        $count++
        Write-Host "Updated: $($file.Name)"
    }
}
Write-Host "Done. $count files updated."
