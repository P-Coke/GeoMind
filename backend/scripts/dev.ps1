param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root ".venv\\Scripts\\python.exe"

if (-not (Test-Path $python)) {
  throw "backend/.venv is missing. Run backend/scripts/bootstrap.ps1 first."
}

& $python -m uvicorn backend.app.main:app --reload --port 8000

