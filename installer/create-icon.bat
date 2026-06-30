@echo off
echo Creating Visa Portal Icon...

:: Create a simple ico using PowerShell to generate a base64 encoded icon
powershell -Command "
Add-Type -AssemblyName System.Drawing;
\$bmp = New-Object System.Drawing.Bitmap(64, 64);
\$g = [System.Drawing.Graphics]::FromImage(\$bmp);
\$g.SmoothingMode = 'HighQuality';

:: Background circle
\$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)), (New-Object System.Drawing.Point(64,64)), [System.Drawing.Color]::FromArgb(0,36,90), [System.Drawing.Color]::FromArgb(233,69,96));
\$g.FillEllipse(\$brush, 2, 2, 60, 60);

:: Passport icon - white outline
\$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.5);
\$g.DrawRectangle(\$pen, 15, 12, 34, 28);

:: Lines on passport
\$pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200,255,255,255), 1.5);
\$g.DrawLine(\$pen2, 20, 22, 44, 22);
\$g.DrawLine(\$pen2, 20, 28, 40, 28);
\$g.DrawLine(\$pen2, 20, 34, 35, 34);

:: Globe circle right side
\$g.DrawEllipse(\$pen, 28, 32, 22, 22);

:: Checkmark
\$penGreen = New-Object System.Drawing.Pen([System.Drawing.Color]::LimeGreen, 3);
\$g.DrawLine(\$penGreen, 34, 48, 40, 53);
\$g.DrawLine(\$penGreen, 40, 53, 50, 40);

\$g.Dispose();
\$bmp.Save('C:\Users\Administrator\Desktop\all my websites\visa-portal-app\icon.png', [System.Drawing.Imaging.ImageFormat]::Png);
\$bmp.Dispose();
Write-Host 'Icon PNG created!';
"
echo Done!
