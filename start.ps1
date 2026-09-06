# ==============================================================================
# FLOWSTOCK - DUAL SERVER LAUNCHER (Windows PowerShell)
# Launches both FastAPI Backend and Next.js Frontend concurrently
# ==============================================================================

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
if (-not $PSScriptRoot) { $PSScriptRoot = Get-Location }

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  FLOWSTOCK - Launching Local Services" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan

# Check if setup has been executed
$VENV_PYTHON = Join-Path $PSScriptRoot "backend\venv\Scripts\python.exe"
$VENV_UVICORN = Join-Path $PSScriptRoot "backend\venv\Scripts\uvicorn.exe"
$NODE_MODULES = Join-Path $PSScriptRoot "frontend\node_modules"

if ((-not (Test-Path $VENV_PYTHON)) -or (-not (Test-Path $NODE_MODULES))) {
    Write-Host "[!] Missing dependencies. Please run the setup script first:" -ForegroundColor Yellow
    Write-Host "    .\setup.ps1" -ForegroundColor Cyan
    Write-Host ""
    $resp = Read-Host "Would you like to run setup.ps1 now? (Y/N)"
    if ($resp -eq 'Y' -or $resp -eq 'y') {
        & (Join-Path $PSScriptRoot "setup.ps1")
    } else {
        exit 1
    }
}

# Ensure .env and .env.local exist
$ROOT_ENV = Join-Path $PSScriptRoot ".env"
$ROOT_EXAMPLE = Join-Path $PSScriptRoot ".env.example"
if ((-not (Test-Path $ROOT_ENV)) -and (Test-Path $ROOT_EXAMPLE)) {
    Copy-Item $ROOT_EXAMPLE $ROOT_ENV
    Write-Host "[+] Created root .env from .env.example" -ForegroundColor Green
}

$FE_ENV = Join-Path $PSScriptRoot "frontend\.env.local"
$FE_EXAMPLE = Join-Path $PSScriptRoot "frontend\.env.example"
if ((-not (Test-Path $FE_ENV)) -and (Test-Path $FE_EXAMPLE)) {
    Copy-Item $FE_EXAMPLE $FE_ENV
    Write-Host "[+] Created frontend/.env.local from frontend/.env.example" -ForegroundColor Green
}

# Launch Backend in new window
Write-Host "[+] Launching FlowStock Backend (FastAPI on port 8000)..." -ForegroundColor Green
$backendCmd = "Set-Location '$PSScriptRoot'; Write-Host 'FlowStock Backend running on http://127.0.0.1:8000' -ForegroundColor Cyan; .\backend\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Launch Frontend in new window
Write-Host "[+] Launching FlowStock Frontend (React + Vite on port 3000)..." -ForegroundColor Green
$frontendCmd = "Set-Location '$PSScriptRoot\frontend'; Write-Host 'FlowStock Frontend running on http://localhost:3000' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Both services launched in separate windows!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "   Frontend Cockpit:      http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API & Health:  http://127.0.0.1:8000/api/v1/health" -ForegroundColor White
Write-Host "   Swagger API Docs:      http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Demo Credentials (Pre-seeded across all 4 RBAC roles):" -ForegroundColor Yellow
Write-Host "   Tenant: Acme Logistics Ltd" -ForegroundColor Cyan
Write-Host "     - Admin:             alice@acme.com" -ForegroundColor White
Write-Host "     - Warehouse Manager: ramesh@acme.com" -ForegroundColor White
Write-Host "     - Sales Rep:         vikram@acme.com" -ForegroundColor White
Write-Host "     - Auditor/Viewer:    pooja@acme.com" -ForegroundColor White
Write-Host ""
Write-Host "   Tenant: Apex Global Industries" -ForegroundColor Cyan
Write-Host "     - Admin:             sunil@apex.com" -ForegroundColor White
Write-Host "     - Warehouse Manager: bob@apex.com" -ForegroundColor White
Write-Host "     - Sales Rep:         kavita@apex.com" -ForegroundColor White
Write-Host "     - Auditor/Viewer:    deepak@apex.com" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
