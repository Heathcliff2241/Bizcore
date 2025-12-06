# Self-Signed SSL Certificate Generator (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File generate-self-signed-cert.ps1

param(
    [string]$Domain = "localhost",
    [int]$Days = 365
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CertFile = Join-Path $ScriptDir "cert.pem"
$KeyFile = Join-Path $ScriptDir "key.pem"

Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Green
Write-Host "Domain: $Domain"
Write-Host "Valid for: $Days days"
Write-Host ""

# Check if openssl is available
try {
    $opensslPath = Get-Command openssl -ErrorAction Stop | Select-Object -ExpandProperty Source
    Write-Host "OpenSSL found at: $opensslPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: OpenSSL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To install OpenSSL on Windows:"
    Write-Host "1. Download from: https://slproweb.com/products/Win32OpenSSL.html"
    Write-Host "2. Install Win64 OpenSSL v3.x (Light)"
    Write-Host "3. Add to PATH: C:\Program Files\OpenSSL-Win64\bin"
    Write-Host "4. Restart PowerShell"
    exit 1
}

Write-Host ""
Write-Host "Generating certificate..." -ForegroundColor Cyan

# Generate certificate
$params = @(
    "req",
    "-x509",
    "-newkey", "rsa:4096",
    "-nodes",
    "-out", $CertFile,
    "-keyout", $KeyFile,
    "-days", $Days,
    "-subj", "/C=US/ST=State/L=City/O=BizCore/CN=$Domain"
)

& openssl @params 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Certificate generated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Certificate files:"
    Write-Host "  Cert: $CertFile"
    Write-Host "  Key:  $KeyFile"
    Write-Host ""
    Write-Host "Certificate size: $((Get-Item $CertFile).Length) bytes"
    Write-Host "Key size: $((Get-Item $KeyFile).Length) bytes"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Uncomment HTTPS block in nginx/conf.d/bizcore-secure.conf"
    Write-Host "2. Restart nginx"
    Write-Host "3. Access https://localhost"
} else {
    Write-Host ""
    Write-Host "ERROR: Certificate generation failed!" -ForegroundColor Red
    exit 1
}
