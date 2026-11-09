@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing. Install Node.js 24 LTS and try again.
  pause
  exit /b 1
)
node scripts/setup-local.js
if errorlevel 1 goto failed
if not exist "node_modules" (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
echo.
echo Open http://127.0.0.1:5000 after the MongoDB connected message appears.
echo Keep this window open while using the app. Press Ctrl+C to stop it.
call npm.cmd start
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo The app could not start. Copy the error above and share it with Codex.
echo Never share passwords or private connection strings.
pause
exit /b 1
