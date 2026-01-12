@echo off
echo.
echo ===============================================
echo    RedShield - Stopping All Services
echo ===============================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo Successfully stopped all services!
) else (
    echo No running services found.
)

echo.
echo ===============================================
echo    All Services Stopped
echo ===============================================
echo.
echo Press any key to close this window...
pause >nul
