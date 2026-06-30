@echo off
setlocal

cd /d "C:\Users\Administrator\Desktop\all my websites\visa-portal-app\electron-app"

:: Use full path to node.exe to ensure it's found
echo [Visa Portal] Starting desktop app...
start "" /B "node_modules\electron\dist\electron.exe" "."
exit

