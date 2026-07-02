# Migrate Control Tower to a new Supabase project (schema + secrets + edge functions)
#
# Prerequisites:
#   1. npm install
#   2. npx supabase login          (opens browser — use account that OWNS the new project)
#   3. .env active block must have:
#        VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
#        SUPABASE_PASSWORD (database password for link)
#        GOOGLE_AI_API_KEY (and any other secrets you use)
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts/migrate-to-new-supabase.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/migrate-to-new-supabase.ps1 -SkipFunctions
#   powershell -ExecutionPolicy Bypass -File scripts/migrate-to-new-supabase.ps1 -FunctionsOnly

param(
  [switch]$SkipFunctions,
  [switch]$FunctionsOnly,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Read-DotEnvValue([string]$Key) {
  if (-not (Test-Path ".env")) { return $null }
  foreach ($line in Get-Content ".env") {
    if ($line -match "^\s*#") { continue }
    if ($line -match "^\s*$Key\s*=\s*(.+)\s*$") {
      return $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
  return $null
}

$projectRef = Read-DotEnvValue "VITE_SUPABASE_PROJECT_ID"
$dbPassword = Read-DotEnvValue "SUPABASE_PASSWORD"
$googleKey = Read-DotEnvValue "GOOGLE_AI_API_KEY"

if (-not $projectRef) {
  Write-Error "VITE_SUPABASE_PROJECT_ID not found in .env"
}

Write-Host "=== Supabase migration → $projectRef ===" -ForegroundColor Cyan

if (-not $FunctionsOnly) {
  Write-Host "`n[1/4] Linking project..." -ForegroundColor Yellow
  if ($DryRun) {
    Write-Host "  npx supabase link --project-ref $projectRef"
  } else {
    if (-not $dbPassword) { Write-Error "SUPABASE_PASSWORD required in .env for supabase link" }
    npx supabase link --project-ref $projectRef -p $dbPassword
    if ($LASTEXITCODE -ne 0) {
      Write-Host "`nLink failed. Run: npx supabase login" -ForegroundColor Red
      Write-Host "Use the Supabase account that owns project $projectRef" -ForegroundColor Red
      exit 1
    }
  }

  Write-Host "`n[2/4] Pushing $($((Get-ChildItem supabase\migrations\*.sql).Count)) migrations..." -ForegroundColor Yellow
  if ($DryRun) {
    Write-Host "  npx supabase db push --yes"
  } else {
    npx supabase db push --yes
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }

  Write-Host "`n[3/4] Setting edge function secrets..." -ForegroundColor Yellow
  $secretArgs = @()
  if ($googleKey) { $secretArgs += "GOOGLE_AI_API_KEY=$googleKey" }
  $openai = Read-DotEnvValue "OPENAI_API_KEY"
  if ($openai) { $secretArgs += "OPENAI_API_KEY=$openai" }
  $sendgrid = Read-DotEnvValue "SENDGRID_API_KEY"
  if ($sendgrid) { $secretArgs += "SENDGRID_API_KEY=$sendgrid" }
  $enc = Read-DotEnvValue "ENCRYPTION_KEY"
  if ($enc) { $secretArgs += "ENCRYPTION_KEY=$enc" }

  if ($secretArgs.Count -eq 0) {
    Write-Host "  No secrets found in .env — set GOOGLE_AI_API_KEY at minimum" -ForegroundColor Yellow
  } elseif ($DryRun) {
    Write-Host "  npx supabase secrets set $($secretArgs -join ' ')"
  } else {
    npx supabase secrets set @secretArgs
    if ($LASTEXITCODE -ne 0) { Write-Warning "Some secrets may have failed — set manually in Dashboard" }
  }
}

if (-not $SkipFunctions) {
  Write-Host "`n[4/4] Deploying edge functions..." -ForegroundColor Yellow
  $deployScript = Join-Path $PSScriptRoot "deploy-all-edge-functions.ps1"
  if ($DryRun) {
    & $deployScript -DryRun
  } else {
    & $deployScript
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}

Write-Host "`n=== Migration complete ===" -ForegroundColor Green
Write-Host "Verify:"
Write-Host "  curl https://$projectRef.supabase.co/functions/v1/launch-lab-agent -H `"Authorization: Bearer YOUR_ANON_KEY`""
Write-Host "  npm run dev  →  http://localhost:8080/launch-lab"
