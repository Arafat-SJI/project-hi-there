# Deploy every edge function folder under supabase/functions (except _shared)
param(
  [switch]$DryRun,
  [switch]$SkipDeployed
)

Set-Location (Join-Path $PSScriptRoot "..")

$functions = Get-ChildItem "supabase\functions" -Directory |
  Where-Object { $_.Name -notlike "_*" } |
  ForEach-Object { $_.Name } |
  Sort-Object

$deployed = @{}
if ($SkipDeployed) {
  $list = npx supabase functions list -o json 2>$null | ConvertFrom-Json
  foreach ($row in $list) { $deployed[$row.slug] = $true }
}

Write-Host "Deploying $($functions.Count) edge functions to linked project"
if ($DryRun) {
  $functions | ForEach-Object { Write-Host "  $_" }
  exit 0
}

$failed = @()
$ok = 0
$skipped = 0
$i = 0

foreach ($fn in $functions) {
  $i++
  if ($SkipDeployed -and $deployed.ContainsKey($fn)) {
    Write-Host "[$i/$($functions.Count)] SKIP $fn - already deployed"
    $skipped++
    continue
  }

  Write-Host "[$i/$($functions.Count)] Deploying $fn..."
  cmd /c "npx supabase functions deploy $fn --use-api 2>&1"
  if ($LASTEXITCODE -ne 0) {
    $failed += $fn
  } else {
    $ok++
  }
}

Write-Host ""
Write-Host "Done: $ok deployed, $skipped skipped, $($failed.Count) failed"
if ($failed.Count -gt 0) {
  Write-Host "Failed:"
  foreach ($item in $failed) { Write-Host "  $item" }
  exit 1
}
