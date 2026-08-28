@echo off
set PATH=%ProgramFiles%\nodejs;%APPDATA%\npm;%PATH%
cd /d "%~dp0"
echo Starting kicknap... (do not close this window)
echo Scan the QR code with your iPhone camera.
echo.
npx expo start --host lan
pause