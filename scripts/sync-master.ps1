param(
  [string]$Message = "",
  [switch]$SkipCommit,
  [switch]$SkipDeploy
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
    [scriptblock]$Action,
    [switch]$AllowFailure
  )

  Write-Host ""
  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action

  if ($LASTEXITCODE -ne 0) {
    if ($AllowFailure) {
      return $false
    }

    throw "Falha em: $Label"
  }

  return $true
}

$branch = (git branch --show-current).Trim()
if ($branch -ne "master") {
  throw "Esse fluxo precisa rodar na branch master. Branch atual: $branch"
}

$hasChanges = [bool](git status --porcelain)

if (-not $SkipCommit) {
  if ($hasChanges -and [string]::IsNullOrWhiteSpace($Message)) {
    throw "Informe uma descricao da alteracao. Exemplo: npm run sync:master -- ""ajusta tela de login"""
  }

  if ($hasChanges) {
    Invoke-Step -Label "Adicionando arquivos" -Action { git add -A }
    try {
      $env:PULSE_SKIP_POST_COMMIT_PUBLISH = "1"
      Invoke-Step -Label "Criando commit" -Action { git commit -m $Message }
    }
    finally {
      Remove-Item Env:PULSE_SKIP_POST_COMMIT_PUBLISH -ErrorAction SilentlyContinue
    }
  } else {
    Write-Host "Nenhuma alteracao local para commitar." -ForegroundColor Yellow
  }
}

Invoke-Step -Label "Sincronizando master com origin/master" -Action { git pull --rebase origin master }
Invoke-Step -Label "Enviando master para o GitHub" -Action { git push origin master }

if (-not $SkipDeploy) {
  Invoke-Step -Label "Publicando na Vercel" -Action { vercel.cmd deploy --prod --yes }
}
