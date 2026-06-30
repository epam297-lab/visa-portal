@echo off
title Visa Portal - Installation
cls
echo ============================================
echo     VISA PORTAL - Automated Installation
echo ============================================
echo.
echo Checking prerequisites...
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Download and install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found

:: Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm found

:: Check if MongoDB is installed
where mongod >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB is not in PATH
    echo Attempting to start from default location...
    set "MONGO_PATH=C:\Program Files\MongoDB\Server\7.0\bin"
    if exist "%MONGO_PATH%\mongod.exe" (
        echo [OK] MongoDB found at %MONGO_PATH%
    ) else (
        echo [ERROR] MongoDB not installed.
        echo Please install MongoDB Community Server from:
        echo https://www.mongodb.com/try/download/community
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] MongoDB found
)

:: Start MongoDB if not running
echo.
echo Starting MongoDB...
sc query MongoDB | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB is already running
) else (
    net start MongoDB 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB started successfully
    ) else (
        echo [WARNING] Could not start MongoDB service
        echo Starting mongod manually...
        start /B mongod --dbpath "%CD%\database\data" --logpath "%CD%\database\log.txt"
    )
)

:: Install npm dependencies
echo.
echo Installing npm packages...
cd /d "%~dp0.."
npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Seed database
echo.
echo Seeding database with test clients...
node database\seed.js
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Seeding failed - database may already have data
)

:: Create desktop shortcut
echo.
echo Creating desktop shortcut...
powershell -ExecutionPolicy Bypass -File "installer\create-shortcut.ps1"
if %ERRORLEVEL% EQU 0 (
    echo [OK] Desktop shortcut created!
)

:: Start server
echo.
echo ============================================
echo    Starting Visa Portal Server...
echo ============================================
echo.
start "" http://localhost:4500
start "" "%~dp0..\start-visa-portal.bat"
echo.
echo Server is starting...
echo You can also use the "Visa Portal" shortcut on your desktop.
echo.
timeout /t 5 /nobreak >nul
exit /b 0
echo.
echo ============================================
echo    Starting Visa Portal Server...
echo ============================================
echo.
start "" http://localhost:4500
node server\server.js

pause
