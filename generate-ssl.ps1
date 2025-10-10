# Generate SSL certificates for development
# This script creates self-signed SSL certificates for localhost

Write-Host "Generating SSL certificates for development..." -ForegroundColor Green

# Create certs directory
New-Item -ItemType Directory -Force -Path "certs"

# Generate private key
Write-Host "Generating private key..." -ForegroundColor Yellow
openssl genrsa -out certs/localhost-key.pem 2048

# Generate certificate signing request
Write-Host "Generating certificate signing request..." -ForegroundColor Yellow
$subject = "/C=ZA/ST=Gauteng/L=Johannesburg/O=IIE/OU=APDS7311/CN=localhost"
openssl req -new -key certs/localhost-key.pem -out certs/localhost-csr.pem -subj $subject

# Generate self-signed certificate
Write-Host "Generating self-signed certificate..." -ForegroundColor Yellow
openssl x509 -req -days 365 -in certs/localhost-csr.pem -signkey certs/localhost-key.pem -out certs/localhost-cert.pem

# Clean up CSR
Remove-Item certs/localhost-csr.pem

Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "  - certs/localhost-key.pem (private key)" -ForegroundColor White
Write-Host "  - certs/localhost-cert.pem (certificate)" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install --save-dev https" -ForegroundColor White
Write-Host "2. Update package.json dev script to use HTTPS" -ForegroundColor White
Write-Host "3. Access your app at: https://localhost:3000" -ForegroundColor White
Write-Host "4. Accept the browser warning (self-signed cert)" -ForegroundColor White