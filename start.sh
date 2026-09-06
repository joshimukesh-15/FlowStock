#!/usr/bin/env bash
# ==============================================================================
# FLOWSTOCK — DUAL SERVER LAUNCHER (macOS / Linux)
# Launches both FastAPI Backend and Next.js Frontend concurrently
# ==============================================================================

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}  FLOWSTOCK — Launching Local Services (POSIX)${NC}"
echo -e "${CYAN}==============================================================================${NC}"

if [ ! -f "backend/venv/bin/uvicorn" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}[!] Missing dependencies. Please run setup first:${NC}"
    echo -e "    ${CYAN}./setup.sh${NC}\n"
    exit 1
fi

# Ensure env files exist
[ ! -f ".env" ] && [ -f ".env.example" ] && cp .env.example .env
[ ! -f "frontend/.env.local" ] && [ -f "frontend/.env.example" ] && cp frontend/.env.example frontend/.env.local

# Cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}[!] Shutting down FlowStock services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}[+] Starting Backend (FastAPI on http://127.0.0.1:8000)...${NC}"
./backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload &
BACKEND_PID=$!

echo -e "${GREEN}[+] Starting Frontend (React + Vite on http://localhost:3000)...${NC}"
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo -e "\n${GREEN}Both services are running!${NC}"
echo -e "Press ${YELLOW}Ctrl+C${NC} in this window to stop all services.\n"

wait
