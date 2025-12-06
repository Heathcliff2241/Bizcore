# Self-Signed Certificate Generator Using .NET (No OpenSSL Required)
# Works on Windows without installing additional software

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

# Create certificate using .NET
Add-Type -AssemblyName System.Security

try {
    # Generate self-signed certificate using PowerShell
    Write-Host "Creating certificate..." -ForegroundColor Cyan
    
    $subject = "CN=$Domain, O=BizCore, L=City, ST=State, C=US"
    $cert = New-SelfSignedCertificate -DnsName $Domain -CertStoreLocation "cert:\LocalMachine\My" `
        -Subject $subject -NotAfter (Get-Date).AddDays($Days) -KeyLength 4096 `
        -KeyAlgorithm RSA -KeyUsage DigitalSignature,KeyEncipherment `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") 2>$null
    
    if ($cert) {
        Write-Host "Certificate created: $($cert.Thumbprint)" -ForegroundColor Green
        
        # Export certificate and key
        Write-Host "Exporting certificate..." -ForegroundColor Cyan
        
        # Export as PEM (certificate)
        $cert | Export-Certificate -FilePath $CertFile -Type CERT -Force | Out-Null
        
        # Get the private key and export as PEM
        $key = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
        $keyBytes = $key.ExportRSAPrivateKey()
        $keyPem = @"
-----BEGIN RSA PRIVATE KEY-----
$([Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks))
-----END RSA PRIVATE KEY-----
"@
        Set-Content -Path $KeyFile -Value $keyPem -Force
        
        Write-Host ""
        Write-Host "SUCCESS: Certificate generated!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Certificate files:"
        Write-Host "  Cert: $CertFile"
        Write-Host "  Key:  $KeyFile"
        Write-Host ""
        
        if ((Test-Path $CertFile) -and (Test-Path $KeyFile)) {
            Write-Host "Cert size: $((Get-Item $CertFile).Length) bytes"
            Write-Host "Key size: $((Get-Item $KeyFile).Length) bytes"
        }
        
        Write-Host ""
        Write-Host "Certificate Details:"
        Write-Host "  Subject: $($cert.Subject)"
        Write-Host "  Not Before: $($cert.NotBefore)"
        Write-Host "  Not After: $($cert.NotAfter)"
        Write-Host "  Thumbprint: $($cert.Thumbprint)"
        Write-Host ""
        Write-Host "Next steps:"
        Write-Host "1. Uncomment HTTPS block in nginx/conf.d/bizcore-secure.conf"
        Write-Host "2. Restart nginx"
        Write-Host "3. Access https://localhost"
        
    } else {
        Write-Host "ERROR: Failed to create certificate" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
