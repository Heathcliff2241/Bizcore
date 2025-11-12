@echo off
echo ========================================
echo BizCore Development Servers
echo ========================================
echo.
echo Starting Next.js App on port 3000...
start "BizCore - Next.js" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul
echo.
echo Starting BrandStudio on port 5175...
start "BizCore - BrandStudio" cmd /k "cd brandstudio-vite && npm run dev"
echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Next.js:     http://localhost:3000
echo BrandStudio: http://localhost:5175
echo.
echo Press any key to close this window...
pause >nul
