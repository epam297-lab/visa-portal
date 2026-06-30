@echo off
cd /d "C:\Users\Administrator\Desktop\all my websites\visa-portal-app"
title VISA PORTAL SYSTEM
echo ============================================
echo          VISA PORTAL SYSTEM
echo ============================================
echo.
echo [1/3] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul
if errorlevel 1 (
    net start MongoDB >nul 2>&1 && echo [OK] MongoDB started
) else (
    echo [OK] MongoDB is running
)
echo.
echo [2/3] Starting server...
start "Visa Portal Server" /MIN node server\server.js
echo.
echo [3/3] Waiting for server...
:waitloop
timeout /t 2 /nobreak >nul
curl -s http://localhost:4500 >nul 2>&1
if errorlevel 1 goto waitloop
echo [OK] Server is ready!
echo.
echo Opening app as standalone window...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:4500/admin.html --no-first-run
) else (
    start "" msedge.exe --app=http://localhost:4500/admin.html 2>nul
    if errorlevel 1 start "" http://localhost:4500/admin.html
)
echo.
echo ============================================
echo   Server running at http://localhost:4500
echo   Close this window to stop the server
echo ============================================
:keepopen
pause >nul
