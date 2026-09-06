# ==============================================================================
# FLOWSTOCK - AUTOMATED LOCAL SETUP SCRIPT (Windows PowerShell)
# Governed by FLOWSTOCK_MASTER_SPEC.md: Free-Only, Zero-Docker, Native Local
# ==============================================================================

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$text)
    Write-Host ''
    Write-Host '==============================================================================' -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor White
    Write-Host '==============================================================================' -ForegroundColor Cyan
}

function Write-Step {
    param([string]$text)
    Write-Host "[+] $text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$text)
    Write-Host "[!] $text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$text)
    Write-Host "[X] $text" -ForegroundColor Red
}

Write-Header 'FLOWSTOCK - Automated Native Environment Setup'
Write-Host 'Free-Only | Zero-Docker | Multi-Tenant B2B SaaS Platform' -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# 1. Prerequisite Verification
# ------------------------------------------------------------------------------
Write-Header 'Step 1: Checking System Prerequisites'

# Check Python
try {
    $pythonVersionStr = python --version 2>&1
    Write-Step "Found Python: $pythonVersionStr"
    $pyVerMatch = [regex]::Match($pythonVersionStr, '\d+\.\d+')
    if ($pyVerMatch.Success) {
        $pyVer = [double]$pyVerMatch.Value
        if ($pyVer -lt 3.10) {
            Write-Err "Python 3.10 or higher is required. Found version: $pythonVersionStr"
            exit 1
        }
    }
} catch {
    Write-Err 'Python is not installed or not in PATH. Please install Python 3.10+ from python.org'
    exit 1
}

# Check Node.js
try {
    $nodeVersionStr = node --version 2>&1
    Write-Step "Found Node.js: $nodeVersionStr"
    $nodeVerMatch = [regex]::Match($nodeVersionStr, 'v(\d+)')
    if ($nodeVerMatch.Success) {
        $nodeMajor = [int]$nodeVerMatch.Groups[1].Value
        if ($nodeMajor -lt 18) {
            Write-Warn "Node.js 18+ is recommended. Found version: $nodeVersionStr"
        }
    }
} catch {
    Write-Err 'Node.js is not installed or not in PATH. Please install Node.js 18+ from nodejs.org'
    exit 1
}

# Check npm
try {
    $npmVersionStr = npm --version 2>&1
    Write-Step "Found npm: v$npmVersionStr"
} catch {
    Write-Err 'npm is not installed or not in PATH.'
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Environment Configuration Files (.env)
# ------------------------------------------------------------------------------
Write-Header 'Step 2: Configuring Environment Files'

# Root .env
if (-not (Test-Path '.env')) {
    if (Test-Path '.env.example') {
        Copy-Item '.env.example' '.env'
        Write-Step 'Created root .env from .env.example'
    } else {
        Write-Warn '.env.example not found at root. Skipping root .env copy.'
    }
} else {
    Write-Step 'Root .env already exists. Preserving existing configuration.'
}

# Frontend .env.local
if (-not (Test-Path 'frontend/.env.local')) {
    if (Test-Path 'frontend/.env.example') {
        Copy-Item 'frontend/.env.example' 'frontend/.env.local'
        Write-Step 'Created frontend/.env.local from frontend/.env.example'
    } else {
        @'
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=FlowStock
'@ | Set-Content -Path 'frontend/.env.local'
        Write-Step 'Generated default frontend/.env.local'
    }
} else {
    Write-Step 'frontend/.env.local already exists. Preserving existing configuration.'
}

# ------------------------------------------------------------------------------
# 3. Backend Setup (Virtualenv & Pip Dependencies)
# ------------------------------------------------------------------------------
Write-Header 'Step 3: Setting Up Backend Python Environment'

$VENV_DIR = 'backend/venv'
$VENV_PYTHON = "$VENV_DIR/Scripts/python.exe"
$VENV_PIP = "$VENV_DIR/Scripts/pip.exe"

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Step "Creating Python virtual environment in $VENV_DIR..."
    python -m venv $VENV_DIR
} else {
    Write-Step "Python virtual environment already exists in $VENV_DIR."
}

Write-Step 'Installing backend dependencies from backend/requirements.txt...'
& $VENV_PYTHON -m pip install --upgrade pip --quiet
& $VENV_PIP install -r backend/requirements.txt --quiet

Write-Step 'Backend dependencies installed successfully.'

# ------------------------------------------------------------------------------
# 4. Frontend Setup (NPM Dependencies)
# ------------------------------------------------------------------------------
Write-Header 'Step 4: Setting Up Frontend Dependencies'

Write-Step 'Installing frontend packages via npm install in ./frontend...'
Push-Location 'frontend'
try {
    npm install --silent
    Write-Step 'Frontend dependencies installed successfully.'
} finally {
    Pop-Location
}

# ------------------------------------------------------------------------------
# 5. Database Initialization & Demo Data Verification
# ------------------------------------------------------------------------------
Write-Header 'Step 5: Database Initialization and Demo Seeding'

$env:PYTHONPATH = 'backend'
Write-Step 'Verifying database tables and seeding demo organizations (Acme and Apex)...'
& $VENV_PYTHON -m app.core.seed
Write-Step 'Database schema verified and pre-seeded successfully.'

# ------------------------------------------------------------------------------
# 6. Setup Summary
# ------------------------------------------------------------------------------
Write-Header 'Setup Complete! FlowStock is Ready to Run'
Write-Host ''
Write-Host 'To launch both backend and frontend automatically:' -ForegroundColor Yellow
Write-Host '   .\start.ps1' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Or start them manually in separate terminals:' -ForegroundColor Yellow
Write-Host '   Terminal 1 (Backend):  .\backend\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload' -ForegroundColor White
Write-Host '   Terminal 2 (Frontend): cd frontend; npm run dev' -ForegroundColor White
Write-Host ''
Write-Host 'Access URLs:' -ForegroundColor Yellow
Write-Host '   Frontend Web Cockpit:  http://localhost:3000' -ForegroundColor White
Write-Host '   Backend API & Health:  http://127.0.0.1:8000/api/v1/health' -ForegroundColor White
Write-Host '   Interactive API Docs:  http://127.0.0.1:8000/docs' -ForegroundColor White
Write-Host ''
Write-Host 'Pre-seeded Tenants and Demo Users:' -ForegroundColor Yellow
Write-Host '   Acme Logistics Ltd: alice@acme.com (Admin) | ramesh@acme.com (Warehouse) | vikram@acme.com (Sales) | pooja@acme.com (Viewer)' -ForegroundColor White
Write-Host '   Apex Global Ind:    sunil@apex.com (Admin) | bob@apex.com (Warehouse)    | kavita@apex.com (Sales) | deepak@apex.com (Viewer)' -ForegroundColor White
Write-Host '==============================================================================' -ForegroundColor Cyan
