# FlowStock Developer Launcher
# Starts FastAPI backend on port 8000 and Next.js frontend on port 3000

$BackendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd backend; .env\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000" -PassThru
Write-Host "FastAPI Backend starting on http://localhost:8000" -ForegroundColor Green

$FrontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru
Write-Host "Next.js Frontend starting on http://localhost:3000" -ForegroundColor Green

Write-Host "FlowStock development environment initiated." -ForegroundColor Cyan
