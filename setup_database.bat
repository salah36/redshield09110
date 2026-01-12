@echo off
echo ========================================
echo RedShield Database Setup
echo ========================================
echo.
echo This will:
echo 1. Set MySQL root password to: RedShield2025!Secure#DB
echo 2. Create/verify redshield database
echo 3. Create trusted_partners table
echo.
echo Press any key to continue or CTRL+C to cancel...
pause >nul
echo.

REM Find MariaDB/MySQL installation
set MYSQL_PATH=
if exist "C:\Program Files\MariaDB 10.11\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 10.11\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.0\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.0\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.1\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.1\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.2\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.2\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.3\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.3\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.4\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.4\bin\mysql.exe
if exist "C:\Program Files\MariaDB 11.5\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MariaDB 11.5\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
if exist "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe" set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe

if "%MYSQL_PATH%"=="" (
    echo ERROR: Could not find mysql.exe
    echo Please install MariaDB or MySQL first
    echo.
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo.
echo Attempting to connect with NO password first...
echo If this fails, you'll be prompted for your CURRENT password.
echo.

REM Try without password first
"%MYSQL_PATH%" -u root --password= < "%~dp0setup_database.sql" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database setup completed!
    echo ========================================
    echo.
    echo Your new MySQL credentials:
    echo   Host: localhost
    echo   Port: 3306
    echo   User: root
    echo   Password: RedShield2025!Secure#DB
    echo   Database: redshield
    echo.
    echo .env file has been updated with these credentials.
    echo.
    pause
    exit /b 0
)

echo.
echo No password didn't work. Trying with password prompt...
echo Please enter your CURRENT MySQL root password when prompted:
echo.

"%MYSQL_PATH%" -u root -p < "%~dp0setup_database.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Database setup completed!
    echo ========================================
    echo.
    echo Your new MySQL credentials:
    echo   Host: localhost
    echo   Port: 3306
    echo   User: root
    echo   Password: RedShield2025!Secure#DB
    echo   Database: redshield
    echo.
    echo .env file has been updated with these credentials.
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to execute SQL script
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Incorrect current password
    echo 2. MySQL/MariaDB service not running
    echo 3. Insufficient permissions
    echo.
    echo To check if MySQL is running:
    echo   sc query MariaDB
    echo.
    echo To start MySQL:
    echo   net start MariaDB
    echo.
)

echo.
pause
