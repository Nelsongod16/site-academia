param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

if ($env:PULSE_SKIP_POST_COMMIT_PUBLISH -eq "1") {
  Write-Host "Auto publish ignorado por sinalizacao temporaria." -ForegroundColor Yellow
  exit 0
}

if ($env:PULSE_AUTO_PUBLISH_RUNNING -eq "1") {
  Write-Host "Auto publish ja esta em execucao." -ForegroundColor Yellow
  exit 0
}

$branch = (git branch --show-current).Trim()
if ($branch -ne "master") {
  Write-Host "Auto publish ignorado fora da master. Branch atual: $branch" -ForegroundColor Yellow
  exit 0
}

if (-not (Get-Command vercel.cmd -ErrorAction SilentlyContinue)) {
  throw "Nao encontrei o comando vercel. Instale a CLI antes de publicar."
}

try {
  $env:PULSE_AUTO_PUBLISH_RUNNING = "1"
  if ($DryRun) {
    Write-Host "Dry run: sincronizacao automatica nao executada." -ForegroundColor DarkGray
    exit 0
  }
  & (Join-Path $PSScriptRoot "sync-master.ps1") -SkipCommit
}
finally {
  Remove-Item Env:PULSE_AUTO_PUBLISH_RUNNING -ErrorAction SilentlyContinue
}
