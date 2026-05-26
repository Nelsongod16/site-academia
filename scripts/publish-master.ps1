param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Label,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action

  if ($LASTEXITCODE -ne 0) {
    throw "Falha em: $Label"
  }
}

$branch = (git branch --show-current).Trim()
if ($branch -ne "master") {
  throw "Esse comando precisa rodar na branch master. Branch atual: $branch"
}

$hasChanges = [bool](git status --porcelain)
if ($hasChanges -and [string]::IsNullOrWhiteSpace($Message)) {
  $Message = "Atualiza site em $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

if ($hasChanges) {
  Invoke-Step -Label "Adicionando arquivos" -Action { git add -A }
  Invoke-Step -Label "Criando commit" -Action { git commit -m $Message }
} else {
  Write-Host "Nenhuma alteracao local para commitar." -ForegroundColor Yellow
}

Invoke-Step -Label "Atualizando master local" -Action { git pull --rebase origin master }
Invoke-Step -Label "Enviando master para o GitHub" -Action { git push origin master }

if (-not (Get-Command vercel.cmd -ErrorAction SilentlyContinue)) {
  throw "Nao encontrei o comando vercel. Instale a CLI antes de publicar."
}

Invoke-Step -Label "Publicando na Vercel" -Action { vercel.cmd deploy --prod --yes }
