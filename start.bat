@echo off
echo.
echo ===============================================
echo    RedShield - Starting All Services
echo ===============================================
echo.

REM Kill any existing Node.js processes
echo Stopping any existing services...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Discord Bot
echo Starting Discord Bot...
start "RedShield Bot" cmd /k "cd /d "%~dp0bot" && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Backend Server
echo Starting Backend Server...
start "RedShield Backend" cmd /k "cd /d "%~dp0redshield-dashboard2\server" && npm run dev"
timeout /t 3 /nobreak >nul

REM Start Frontend Dashboard
echo Starting Frontend Dashboard...
start "RedShield Frontend" cmd /k "cd /d "%~dp0redshield-dashboard2" && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ===============================================
echo    All Services Started!
echo ===============================================
echo.
echo Discord Bot:       Running in separate window
echo Backend API:       http://localhost:8081
echo Frontend Dashboard: http://localhost:8082
echo.
echo Close the terminal windows to stop services.
echo.
pause
