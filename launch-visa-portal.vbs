Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

appPath = "C:\Users\Administrator\Desktop\all my websites\visa-portal-app"

' 1) Make sure MongoDB is running (hidden)
objShell.Run "cmd /c sc query MongoDB ^| find ""RUNNING"" >nul ^&^& if errorlevel 1 net start MongoDB >nul 2^>^&1", 0, True

' 2) Kill any leftover node processes (hidden)
objShell.Run "taskkill /f /im node.exe >nul 2^>^&1", 0, True
WScript.Sleep 1000

' 3) Start the Node server in a hidden window (0 = hidden)
objShell.Run "cmd /c cd /d """ ^& appPath ^& """ ^&^& node server\server.js", 0, False

' 4) Wait for server to be ready
WScript.Sleep 6000

' 5) Open the app in standalone window (Chrome app mode - no URL bar)
If objFSO.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    objShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:4500/admin.html --no-first-run", 1, False
Else
    objShell.Run "http://localhost:4500/admin.html", 1, False
End If
