@echo off
echo ========================================
echo RedShield - Fix Database and Start All
echo ========================================
echo.

set MYSQL_PATH=C:\Program Files\MariaDB 12.1\bin\mysql.exe

echo Step 1: Removing MySQL root password...
echo.
echo Trying to connect to reset password...
echo If prompted, enter your CURRENT MySQL password.
echo.

"%MYSQL_PATH%" -u root -p -e "ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES; SELECT 'Password removed successfully!' as Status;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Trying without password...
    "%MYSQL_PATH%" -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY ''; FLUSH PRIVILEGES; SELECT 'Password removed successfully!' as Status;"

    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ========================================
        echo ERROR: Could not remove password
        echo ========================================
        echo.
        echo Please manually connect to MariaDB and run:
        echo   ALTER USER 'root'@'localhost' IDENTIFIED BY '';
        echo   FLUSH PRIVILEGES;
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo SUCCESS! Password removed
echo ========================================
echo.
echo Now starting all services...
echo.

REM Kill any existing processes on ports 8081 and 8082
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082') do taskkill /F /PID %%a 2>nul

echo Starting Discord Bot...
start "RedShield Bot" cmd /k "cd /d C:\Users\Setup Game\Desktop\RedShield\bot && node src/index.js"

timeout /t 3 /nobreak >nul

echo Starting Dashboard Backend...
start "RedShield Dashboard Backend" cmd /k "cd /d C:\Users\Setup Game\Desktop\RedShield\redshield-dashboard2\server && npm start"

timeout /t 3 /nobreak >nul

echo Starting Dashboard Frontend...
start "RedShield Dashboard Frontend" cmd /k "cd /d C:\Users\Setup Game\Desktop\RedShield\redshield-dashboard2 && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Discord Bot: Running in separate window
echo Dashboard Backend: http://localhost:8081
echo Dashboard Frontend: Check the window for the port (likely 8080 or 8082)
echo.
echo Close this window when done.
pause
