@echo off
REM ============================================================
REM Self-Signed SSL Certificate Generator (Windows Batch)
REM Use this for DEVELOPMENT ONLY!
REM ============================================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "CERT_FILE=%SCRIPT_DIR%cert.pem"
set "KEY_FILE=%SCRIPT_DIR%key.pem"
set "DOMAIN=localhost"
set "DAYS=365"

echo.
echo ========================================
echo 🔐 SSL Certificate Generator
echo ========================================
echo.
echo Domain: %DOMAIN%
echo Valid for: %DAYS% days
echo Location: %SCRIPT_DIR%
echo.

REM Check if OpenSSL is available
where openssl >nul 2>nul
if errorlevel 1 (
    echo ❌ OpenSSL not found!
    echo.
    echo To install OpenSSL on Windows:
    echo 1. Download from: https://slproweb.com/products/Win32OpenSSL.html
    echo 2. Install "Win64 OpenSSL v3.x (Light)"
    echo 3. Add to PATH: C:\Program Files\OpenSSL-Win64\bin
    echo 4. Restart Command Prompt
    echo.
    echo Or use Windows Subsystem for Linux (WSL):
    echo wsl bash nginx/ssl/generate-self-signed-cert.sh
    echo.
    pause
    exit /b 1
)

echo ✅ OpenSSL found
echo.
echo Generating certificate...
echo.

REM Generate the self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes ^
  -out "%CERT_FILE%" ^
  -keyout "%KEY_FILE%" ^
  -days %DAYS% ^
  -subj "/C=US/ST=State/L=City/O=BizCore/CN=%DOMAIN%"

if errorlevel 1 (
    echo.
    echo ❌ Error generating certificate!
    pause
    exit /b 1
)

echo.
echo ✅ Certificate generated successfully!
echo.
echo 📁 Certificate files:
echo    Certificate: %CERT_FILE%
echo    Private Key: %KEY_FILE%
echo.

REM Show file sizes
for %%A in ("%CERT_FILE%") do echo    Cert size: %%~zA bytes
for %%A in ("%KEY_FILE%") do echo    Key size:  %%~zA bytes
echo.

echo ⚠️  Certificate is self-signed - browsers will show warning
echo ✅ Safe to use for local development and testing
echo.
echo 🔧 To use in nginx:
echo    1. Uncomment HTTPS server block in nginx/conf.d/bizcore-secure.conf
echo    2. Restart nginx container
echo    3. Access via https://localhost
echo.

REM Show certificate details
echo 📋 Certificate Details:
openssl x509 -in "%CERT_FILE%" -text -noout | findstr "Subject:" "Issuer:" "Not Before:" "Not After:"
echo.

echo ✅ Setup complete!
echo.
pause
