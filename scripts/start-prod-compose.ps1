[CmdletBinding()]
param(
  [string]$Domain = 'bizcore.test',
  [string]$Email = 'admin@bizcore.dev',
  [switch]$Staging = $false,
  [switch]$SkipCertbot = $false
)

# This script will: 1) Obtain staging certs (if needed), 2) start prod docker compose

$cwd = (Get-Location).Path
$sslDir = Join-Path $cwd 'nginx/ssl'
if (-not (Test-Path $sslDir)) { New-Item -Path $sslDir -ItemType Directory | Out-Null }

Write-Host "Running certbot for domain $Domain (staging: $($Staging.IsPresent))"
$stagingFlag = $Staging.IsPresent

# Auto-skip certbot in environments where ACME won't work (e.g. .test domains or private IPs)
function IsPrivateOrTestDomain($domainName) {
  if (-not $domainName) { return $false }
  # Quick regex checks: .test TLD or localhost or an IPv4 address
  if ($domainName -match '\.test$' -or $domainName -match '^localhost$' -or $domainName -match '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$') {
    return $true
  }
  return $false
}

if ($SkipCertbot.IsPresent -or (IsPrivateOrTestDomain $Domain)) {
  Write-Host "Skipping certbot (domain seems local or SkipCertbot was passed). Ensure certs exist in nginx/ssl or create self-signed certs."
} else {
  # Obtain certs using local script
  & .\scripts\obtain-certs.ps1 -Domain $Domain -Email $Email -Staging:$stagingFlag
  if ($LASTEXITCODE -ne 0) {
    Write-Error 'Certificate obtain failed. Aborting.'
    exit $LASTEXITCODE
  }
}

Write-Host 'Starting docker-compose with production override...'
# Set envs for production
$env:NODE_ENV = 'production'
$env:NEXTAUTH_URL = "https://$Domain"
$env:NEXT_PUBLIC_APP_URL = "https://$Domain"
$env:NEXTAUTH_COOKIE_SECURE = 'true'
# Make sure the production secret is set, or you'll get an error about missing secret
if (-not $env:NEXTAUTH_SECRET) {
  $env:NEXTAUTH_SECRET = [Guid]::NewGuid().ToString() + [Guid]::NewGuid().ToString()
  Write-Host 'WARNING: NEXTAUTH_SECRET not set - generated a random token for the duration of this run. Use a stable secret in production.' -ForegroundColor Yellow
}

# Ensure .env.local or env vars are set for DB credentials
$env:POSTGRES_PASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { 'postgres123' }

# Launch docker compose with prod override
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

if ($LASTEXITCODE -eq 0) {
  Write-Host 'Docker Compose production stack started.'
  Write-Host 'Visit: https://' + $Domain
} else {
  Write-Error 'Docker Compose failed to start.'
}

exit $LASTEXITCODE
