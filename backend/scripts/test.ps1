param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv\\Scripts\\python.exe"

if (-not (Test-Path $python)) {
  throw "backend/.venv is missing. Run backend/scripts/bootstrap.ps1 first."
}

Push-Location $root
try {
  & $python -m pytest
} finally {
  Pop-Location
}
