# Create Desktop Shortcut for Visa Portal
$WScriptShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Visa Portal.lnk"
$TargetPath = Join-Path (Split-Path $PSScriptRoot) "start-visa-portal.bat"

$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetPath
$Shortcut.WorkingDirectory = Split-Path $TargetPath
$Shortcut.Description = "Visa Portal Server"
$Shortcut.IconLocation = "shell32.dll,21"
$Shortcut.Save()

Write-Host "Desktop shortcut created: $ShortcutPath"
