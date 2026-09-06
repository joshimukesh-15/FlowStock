#!/usr/bin/env bash
# ==============================================================================
# FLOWSTOCK — AUTOMATED LOCAL SETUP SCRIPT (macOS / Linux)
# Governed by FLOWSTOCK_MASTER_SPEC.md: Free-Only, Zero-Docker, Native Local
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}  FLOWSTOCK — Automated Native Environment Setup (POSIX)${NC}"
echo -e "${CYAN}  Free-Only | Zero-Docker | Multi-Tenant B2B SaaS Platform${NC}"
echo -e "${CYAN}==============================================================================${NC}"

# 1. Prerequisite Verification
echo -e "\n${CYAN}[1/5] Checking System Prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[X] python3 is not installed or not in PATH. Please install Python 3.10+${NC}"
    exit 1
fi

PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo -e "${GREEN}[+] Found Python $PY_VER${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}[X] node is not installed or not in PATH. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Found Node.js $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[X] npm is not installed or not in PATH.${NC}"
    exit 1
fi
echo -e "${GREEN}[+] Found npm $(npm --version)${NC}"

# 2. Environment Files
echo -e "\n${CYAN}[2/5] Configuring Environment Files...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}[+] Created root .env from .env.example${NC}"
    fi
else
    echo -e "${GREEN}[+] Root .env already exists.${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env.local
        echo -e "${GREEN}[+] Created frontend/.env.local from frontend/.env.example${NC}"
    fi
else
    echo -e "${GREEN}[+] frontend/.env.local already exists.${NC}"
fi

# 3. Backend Virtualenv & Dependencies
echo -e "\n${CYAN}[3/5] Setting Up Backend Python Environment...${NC}"
if [ ! -d "backend/venv" ]; then
    echo -e "${GREEN}[+] Creating virtual environment in backend/venv...${NC}"
    python3 -m venv backend/venv
else
    echo -e "${GREEN}[+] Python virtual environment exists in backend/venv.${NC}"
fi

echo -e "${GREEN}[+] Installing Python dependencies from backend/requirements.txt...${NC}"
backend/venv/bin/pip install --upgrade pip --quiet
backend/venv/bin/pip install -r backend/requirements.txt --quiet
echo -e "${GREEN}[+] Backend dependencies installed successfully.${NC}"

# 4. Frontend Dependencies
echo -e "\n${CYAN}[4/5] Setting Up Frontend Dependencies...${NC}"
(
    cd frontend
    echo -e "${GREEN}[+] Installing npm packages...${NC}"
    npm install --silent
)
echo -e "${GREEN}[+] Frontend dependencies installed successfully.${NC}"

# 5. Database Initialization & Demo Seeding
echo -e "\n${CYAN}[5/5] Initializing Database & Seeding Demo Records...${NC}"
PYTHONPATH=backend backend/venv/bin/python -m app.core.seed
echo -e "${GREEN}[+] Database schema verified and pre-seeded successfully.${NC}"

# Summary
echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${GREEN}  Setup Complete! FlowStock is Ready to Run${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo -e "\nTo launch both services together:"
echo -e "   ${CYAN}./start.sh${NC}"
echo -e "\nOr start manually in separate terminals:"
echo -e "   Terminal 1 (Backend):  ./backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload"
echo -e "   Terminal 2 (Frontend): cd frontend && npm run dev"
echo -e "\nAccess URLs:"
echo -e "   Frontend Cockpit:      http://localhost:3000"
echo -e "   Backend API & Health:  http://127.0.0.1:8000/api/v1/health"
echo -e "   Interactive API Docs:  http://127.0.0.1:8000/docs"
echo -e "${CYAN}==============================================================================${NC}\n"
