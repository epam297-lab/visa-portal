@echo off
title Install MongoDB
cls
echo ============================================
echo     MongoDB Installation Helper
echo ============================================
echo.
echo This will open the MongoDB Community Server download page.
echo.
echo Steps:
echo 1. Download MongoDB Community Server (Windows x64 MSI)
echo 2. Run the installer - keep all default settings
echo 3. Make sure "Install MongoDB as a Service" is CHECKED
echo 4. Complete installation
echo 5. Run setup.bat to start the Visa Portal
echo.
echo Opening download page...
start https://www.mongodb.com/try/download/community
echo.
echo After installing MongoDB, run setup.bat
echo.
pause
