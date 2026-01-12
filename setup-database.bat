@echo off
echo RedShield Database Setup
echo ========================
echo.

echo Initializing database schema...
psql -U postgres -d redshield -f database\init.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Database initialized successfully!
    echo.
    echo You can now start the bot and web dashboard.
) else (
    echo.
    echo ✗ Database initialization failed.
    echo Please ensure PostgreSQL is installed and the 'redshield' database exists.
    echo.
)

pause
