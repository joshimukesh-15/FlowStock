@echo off
title FlowStock Backend (FastAPI :8000)
cd /d "%~dp0"
echo ==============================================================================
echo   FLOWSTOCK BACKEND - FastAPI Server on http://127.0.0.1:8000
echo ==============================================================================
echo.
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend exited with error code %ERRORLEVEL%
    pause
)
