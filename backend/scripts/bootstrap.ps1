param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$venv = Join-Path $root ".venv"

if (-not (Test-Path $venv)) {
  python -m venv $venv
}

$python = Join-Path $venv "Scripts\\python.exe"
if (-not (Test-Path $python)) {
  python -m venv $venv
}

& $python -m ensurepip --upgrade
& $python -m pip install -e "$root[dev]"
