# Convenience script to start a production server running in prod mode over HTTP
# WARNING: For debugging only — not for real production use

# Example usage (PowerShell):
#   .\scripts\start-prod-http.ps1 -Host 192.168.1.8 -Port 3000 -Secret "someverylongsecret"

param(
  [string]$HostIP = "192.168.1.8",
  [int]$Port = 3000,
  [string]$Secret = "change-me-for-testing"
)

$env:NODE_ENV = 'production'
$serverUrl = "http://${HostIP}:${Port}"
$env:NEXTAUTH_URL = $serverUrl
$env:NEXT_PUBLIC_APP_URL = $serverUrl
$env:NEXTAUTH_COOKIE_SECURE = 'false'
$env:ALLOW_INSECURE_PROD = 'true'
$env:NEXTAUTH_SECRET = $Secret

# Optional: set DB & pgAdmin envs for docker-compose
$env:POSTGRES_PASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { 'postgres123' }
$env:PGADMIN_DEFAULT_EMAIL = if ($env:PGADMIN_DEFAULT_EMAIL) { $env:PGADMIN_DEFAULT_EMAIL } else { 'admin@bizcore.dev' }
$env:PGADMIN_DEFAULT_PASSWORD = if ($env:PGADMIN_DEFAULT_PASSWORD) { $env:PGADMIN_DEFAULT_PASSWORD } else { 'admin123' }

Write-Host "NODE_ENV=$env:NODE_ENV"
Write-Host "NEXTAUTH_URL=$env:NEXTAUTH_URL"
Write-Host "NEXT_PUBLIC_APP_URL=$env:NEXT_PUBLIC_APP_URL"
Write-Host "NEXTAUTH_COOKIE_SECURE=$env:NEXTAUTH_COOKIE_SECURE"
Write-Host "ALLOW_INSECURE_PROD=$env:ALLOW_INSECURE_PROD"

# Start Next.js production server
npm run build
npm run start
