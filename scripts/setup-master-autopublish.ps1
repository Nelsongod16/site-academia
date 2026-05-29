$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

git config core.hooksPath .githooks

if ($LASTEXITCODE -ne 0) {
  throw "Nao foi possivel configurar core.hooksPath."
}

Write-Host "core.hooksPath configurado para .githooks" -ForegroundColor Green
