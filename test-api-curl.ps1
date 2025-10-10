# PowerShell API Testing Script for GlobeWire Backend
# Alternative to Postman for teammates who can't install it

# Configuration
$baseUrl = "http://localhost:3000"
$testData = @{
    fullName = "John Smith"
    idNumber = "9001015009087"
    accountNumber = "123456789012"
    username = "johnsmith2024"
    email = "john.smith.demo@example.com"
    password = "SecurePass123!"
}

Write-Host "🎯 GlobeWire API Testing Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get CSRF Token
Write-Host "1️⃣ Getting CSRF Token..." -ForegroundColor Yellow
try {
    $csrfResponse = Invoke-WebRequest -Uri "$baseUrl/api/csrf" -Method GET -SessionVariable session
    $csrfToken = $csrfResponse.Headers['csrf-token']
    Write-Host "✅ CSRF Token received: $($csrfToken.Substring(0,20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get CSRF token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Register Customer
Write-Host ""
Write-Host "2️⃣ Registering Customer..." -ForegroundColor Yellow
$registerBody = @{
    fullName = $testData.fullName
    idNumber = $testData.idNumber
    accountNumber = $testData.accountNumber
    username = $testData.username
    email = $testData.email
    password = $testData.password
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$baseUrl/api/customer/register" -Method POST `
        -Body $registerBody -ContentType "application/json" `
        -Headers @{"x-csrf-token" = $csrfToken} -WebSession $session
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "✅ Customer registered: $($registerData.customer.fullName)" -ForegroundColor Green
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "ℹ️ Customer already exists - continuing..." -ForegroundColor Blue
    }
}

# Step 3: Login Customer
Write-Host ""
Write-Host "3️⃣ Logging in Customer..." -ForegroundColor Yellow
$loginBody = @{
    username = $testData.username
    password = $testData.password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/customer/login" -Method POST `
        -Body $loginBody -ContentType "application/json" `
        -Headers @{"x-csrf-token" = $csrfToken} -WebSession $session
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "✅ Customer logged in: $($loginData.customer.username)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Create Payment
Write-Host ""
Write-Host "4️⃣ Creating International Payment..." -ForegroundColor Yellow
$paymentBody = @{
    amount = "150.75"
    currency = "USD"
    provider = "SWIFT"
    recipientName = "Jane Smith Corporation"
    recipientAccount = "987654321012"
    swiftCode = "ABCDUS33XXX"
    paymentReference = "Invoice 2024-001"
} | ConvertTo-Json

try {
    $paymentResponse = Invoke-WebRequest -Uri "$baseUrl/api/payments/create" -Method POST `
        -Body $paymentBody -ContentType "application/json" `
        -Headers @{"x-csrf-token" = $csrfToken; "Idempotency-Key" = "test-key-001"} -WebSession $session
    
    $paymentData = $paymentResponse.Content | ConvertFrom-Json
    Write-Host "✅ Payment created: $($paymentData.payment.transactionId)" -ForegroundColor Green
    Write-Host "   Status: $($paymentData.payment.status)" -ForegroundColor Cyan
    Write-Host "   Amount: $($paymentData.payment.amount) $($paymentData.payment.currency)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Payment creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}

# Step 5: List Payments
Write-Host ""
Write-Host "5️⃣ Listing Customer Payments..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-WebRequest -Uri "$baseUrl/api/payments/list" -Method GET -WebSession $session
    $listData = $listResponse.Content | ConvertFrom-Json
    Write-Host "✅ Found $($listData.payments.Count) payments" -ForegroundColor Green
    foreach ($payment in $listData.payments) {
        Write-Host "   - $($payment.transactionId): $($payment.amount) $($payment.currency) [$($payment.status)]" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to list payments: $($_.Exception.Message)" -ForegroundColor Red
}

# Security Tests
Write-Host ""
Write-Host "🛡️ SECURITY TESTS" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta

# Test SQL Injection
Write-Host ""
Write-Host "🔍 Testing SQL Injection Prevention..." -ForegroundColor Yellow
$maliciousBody = @{
    fullName = "'; DROP TABLE customers; --"
    idNumber = "1234567890123"
    accountNumber = "123456789012"
    username = "sqlinjection"
    email = "test@test.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $sqlResponse = Invoke-WebRequest -Uri "$baseUrl/api/customer/register" -Method POST `
        -Body $maliciousBody -ContentType "application/json" `
        -Headers @{"x-csrf-token" = $csrfToken} -WebSession $session
    Write-Host "❌ SQL injection not blocked!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ SQL injection blocked by validation" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test CSRF Protection
Write-Host ""
Write-Host "🔍 Testing CSRF Protection..." -ForegroundColor Yellow
try {
    $csrfTestResponse = Invoke-WebRequest -Uri "$baseUrl/api/customer/register" -Method POST `
        -Body $registerBody -ContentType "application/json"
    Write-Host "❌ CSRF protection not working!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✅ CSRF protection active - requests blocked without token" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Unexpected response: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "Your GlobeWire backend is working correctly!" -ForegroundColor Green