# 🌐 GlobeWire - International Payment Portal

## 👥 Team Information

**APDS7311 - Group 5 - Task 3**
### Main Developers
- **ST10274142** – Teejay Kamwaro
- **ST10306640** – Keanu Muller

### Secondary Developers
- **ST10267985** – Kabelo Diutluileng
- **ST10258945** – Kyle James

## 🎥 Demo Videos

**Part 3 Demo Video:**  
[Link to be added]

**Previous Task 2 Demo:**  
https://youtu.be/QsTyMCxH0iQ

**Database Coverage:**  
https://youtu.be/iGB8hhKpEwk

---

## 📖 What is GlobeWire?

**GlobeWire** is a secure international payment processing web application that allows:
- **Customers** to create and track international payment transactions
- **Employees** to verify and approve payments before submission to the SWIFT network
- **Administrators** to monitor all system activity through comprehensive audit logs

The system is built with enterprise-grade security including encrypted passwords, input validation, rate limiting, and tamper-evident audit trails.

---

## 🏗️ Technology Stack (MERN)

- **M**ongoDB - Cloud database (MongoDB Atlas)
- **E**xpress - Backend framework (embedded in Next.js)
- **R**eact - Frontend user interface
- **N**ode.js - JavaScript runtime

Additional technologies:
- **TypeScript** - Type-safe code
- **Prisma ORM** - Database management
- **JWT** - Secure authentication
- **bcrypt** - Password encryption
- **Tailwind CSS** - Modern styling

---

## 🚀 QUICK START GUIDE FOR MARKERS/TESTERS

### ⚙️ Prerequisites

Before you begin, ensure you have:
1. **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
2. **Git** - [Download here](https://git-scm.com/)
3. A modern web browser (Chrome, Firefox, Edge, or Safari)

### 📥 Step 1: Download and Install

Open your terminal/command prompt and run:

```bash
# 1. Clone the repository
git clone https://github.com/ST10258945/APDS7312-POE.git
cd APDS7312-POE

# 2. Install all required packages (this may take 2-3 minutes)
npm install

# 3. Set up environment variables
# Windows (PowerShell/CMD):
copy .env.example .env

# Mac/Linux:
# cp .env.example .env
```

### 🔧 Step 2: Configure Environment (IMPORTANT)

Open the `.env` file and configure the following (do NOT commit real secrets):

```bash
# 1) MongoDB Connection (REQUIRED)
# Create a free MongoDB Atlas cluster and paste YOUR connection string below.
# Example (replace placeholders):
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# 2) JWT secret (REQUIRED)
# Use a long random string (32+ chars). Generate one with Node and paste here:
JWT_SECRET=<paste-generated-secret>

# Generate a strong secret (run in any terminal with Node installed)
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3) Development toggles (optional for marking)
# If you are struggling with rate limits, you may disable them temporarily.
# This is allowed only in development, NEVER in production.
DISABLE_RATE_LIMIT=true
ALLOW_REGISTRATION=true
NEXT_PUBLIC_ALLOW_REGISTRATION=true
```

### 🗄️ Step 3: Set Up Database

```bash
# Generate database client
npm run prisma:generate

# Create test accounts (Customer and Employee)
npm run prisma:seed
```

You should see:
```
✓ Created default employee: Admin Employee (EMP001)
✓ Created default customer: Test Customer (testcustomer)
```

### ▶️ Step 4: Start the Application

**For marking (HTTPS recommended):**

```bash
# Generate certificates once
npm run generate-certs

# Start HTTPS server
npm run start:https
```

Open: https://localhost:3000

**For development (plain HTTP):**

```bash
npm run dev
```

Open: http://localhost:3000

**For production (with full security headers & HSTS):**

```bash
# Build the app
npm run build

# Run in production mode with HTTPS (Windows PowerShell)
$env:NODE_ENV='production'; node server.mjs

# Or on Mac/Linux:
NODE_ENV=production node server.mjs
```

Open: https://localhost:3443

**HTTP to HTTPS Redirect:**
- HTTP requests to `http://localhost:3000` will redirect to `https://localhost:3443`
- This demonstrates HTTPS enforcement in production

*Note: Production mode enables strict HTTPS enforcement, HSTS headers, and strict CSP. This is the recommended mode for demonstrating full security compliance.*

### 🌐 Step 5: Open in Browser

- **Development (HTTP)**: http://localhost:3000
- **Production (HTTPS)**: https://localhost:3443
- **HTTP to HTTPS Redirect**: http://localhost:3000 → https://localhost:3443


---

## 👤 TEST ACCOUNTS - USE THESE TO LOGIN

### 🛒 Customer Account (For Creating Payments)

| Field | Value |
|-------|-------|
| **Username** | `testcustomer` |
| **Account Number** | `12345678` |
| **Password** | `TestPass123!` |
| **Login URL** | http://localhost:3000/customer/login |

### 👔 Employee Account (For Verifying Payments)

| Field | Value |
|-------|-------|
| **Employee ID** | `EMP001` |
| **Password** | `EmpSecurePass123!` |
| **Login URL** | http://localhost:3000/employee/login |

> **Note:** Employee registration is permanently disabled for security. Only pre-seeded accounts can access employee functions.

---

## 🧪 COMPLETE TESTING GUIDE (FRONTEND ONLY)

### ✅ Test 1: Customer Registration (Optional)

**If you want to create your own customer account:**

1. Navigate to: http://localhost:3000/customer/register
2. Fill in the registration form:
   - **Full Name**: Your Name (letters, spaces, hyphens only)
   - **ID Number**: 13 digits (e.g., `9901015800081`)
   - **Account Number**: 8-12 digits (e.g., `1234567890`)
   - **Username**: 3-30 characters (e.g., `johndoe123`)
   - **Email**: Valid email (e.g., `john@example.com`)
   - **Password**: Must include:
     - At least 8 characters
     - One uppercase letter
     - One lowercase letter
     - One number
     - One special character (e.g., `MyPass123!`)
3. Click **"Register"**
4. You should see: **"Registration successful! Redirecting to login..."**

**Expected Result:** ✅ Account created, redirected to login page

---

### ✅ Test 2: Customer Login and Payment Creation

#### Part A: Login

1. Navigate to: http://localhost:3000/customer/login
2. Enter credentials:
   - **Username**: `testcustomer`
   - **Account Number**: `12345678`
   - **Password**: `TestPass123!`
3. Click **"Login"**

**Expected Result:** ✅ Redirected to payments dashboard

#### Part B: Create a Valid Payment

1. Click **"Create New Payment"** button
2. Fill in the payment form with **VALID** data:
   - **Amount**: `250.50` (positive number, max 2 decimals)
   - **Currency**: `USD` (3 uppercase letters)
   - **Provider**: `SWIFT`
   - **Recipient Name**: `Jane Smith` (letters and spaces)
   - **Recipient Account**: `987654321012` (8-12 digits)
   - **SWIFT Code**: `ABCDUS33XXX` (8 or 11 characters, uppercase)
   - **Payment Reference**: `Invoice 12345` (optional, alphanumeric)
3. Click **"Submit Payment"**
4. Review details in confirmation modal
5. Click **"Confirm Payment"**

**Expected Result:** ✅ Success modal appears with:
- Transaction ID
- Payment details
- Status: PENDING
- Message: "Payment created successfully"

#### Part C: Test Validation Errors (IMPORTANT)

1. Click **"Create New Payment"** again
2. Enter **INVALID** data to test security:
   - **Amount**: `0` or `-50` (should reject)
   - **SWIFT Code**: `INVALID` or `ABC` (should reject)
   - **Recipient Account**: `123` (too short, should reject)
3. Click **"Submit Payment"**

**Expected Result:** ✅ Form shows validation errors:
- "Amount must be a positive number"
- "SWIFT code must be 8 or 11 characters"
- "Account number must be 8-12 digits"

#### Part D: View Payment History

1. Scroll down to **"Your Payments"** section
2. You should see your created payment(s) with:
   - Transaction ID
   - Amount and currency
   - Recipient details
   - Status (PENDING)
   - Creation date

**Expected Result:** ✅ All payments are listed with correct details

---

### ✅ Test 3: Employee Login and Payment Verification

#### Part A: Employee Login

1. **Logout** from customer account (click Logout button)
2. Navigate to: http://localhost:3000/employee/login
3. Enter credentials:
   - **Employee ID**: `EMP001`
   - **Password**: `EmpSecurePass123!`
4. Click **"Login"**

**Expected Result:** ✅ Redirected to employee dashboard

#### Part B: View Pending Payments

1. On the employee dashboard, you should see:
   - List of all payments in the system
   - Filter options (All, Pending, Verified, Submitted)
2. Click **"Pending"** filter to see only unverified payments

**Expected Result:** ✅ Payment created by testcustomer appears with status PENDING

#### Part C: Verify a Payment (Two-Factor Authentication)

1. Find the payment you created earlier
2. Click **"View Details"** to see full payment information
3. Click **"Verify"** button
4. **IMPORTANT:** The system will:
   - Request an action token (single-use security token)
   - Show a confirmation modal
5. Click **"Confirm Verification"**

**Expected Result:** ✅ 
- Payment status changes to **VERIFIED**
- Success message appears
- Action token is consumed and logged

#### Part D: Submit to SWIFT

1. Find the now-VERIFIED payment
2. Click **"Submit to SWIFT"** button
3. Another action token is requested (security measure)
4. Click **"Confirm Submission"**

**Expected Result:** ✅
- Payment status changes to **SUBMITTED**
- Success message appears
- In production, this would send to SWIFT network

---

### ✅ Test 4: Audit Logs (Security Monitoring)

1. While logged in as employee, click **"View Audit Logs"** in the header
2. You should see a comprehensive log of all system activities:
   - Customer registrations
   - Login attempts (successful and failed)
   - Payment creations
   - Payment verifications
   - Token requests and consumption
   - SWIFT submissions
3. Click **"Details"** on any log entry to see:
   - Timestamp
   - Entity type (Customer, Payment, Employee)
   - Action performed
   - IP address
   - User agent (browser info)
   - Metadata (additional details)

**Expected Result:** ✅ All actions are logged with tamper-evident hashing

---

### ✅ Test 5: Security Features Testing

#### Test 5A: Rate Limiting (Brute Force Protection)

**Note:** Only works if `DISABLE_RATE_LIMIT=false` in `.env`

1. Navigate to: http://localhost:3000/customer/login
2. Enter **wrong password** 3 times rapidly
3. On the 4th attempt, you should be blocked

**Expected Result:** ✅ "Too Many Requests" error after 3 failed attempts

#### Test 5B: XSS Protection (Cross-Site Scripting)

1. Try to register/login with username: `<script>alert('XSS')</script>`
2. The system should reject this input

**Expected Result:** ✅ Validation error: "Invalid characters in username"

#### Test 5C: Session Security

1. Login as customer
2. Open browser DevTools (F12)
3. Go to **Application** tab → **Cookies**
4. Find the `session` cookie
5. Note that it's marked as:
   - **HttpOnly**: ✅ (JavaScript cannot access it)
   - **Secure**: ✅ (HTTPS only in production)
   - **SameSite**: ✅ (CSRF protection)

**Expected Result:** ✅ Session cookie is secure

---

## 🔒 SECURITY FEATURES IMPLEMENTED

### 1. Password Security
- **bcrypt hashing** with 12 rounds
- Passwords never stored in plain text
- Minimum complexity requirements enforced

### 2. Input Validation (Whitelist Approach)
- All inputs validated with strict RegEx patterns
- Only safe characters allowed
- Prevents SQL injection, XSS, and other attacks

**Examples:**
- SWIFT Code: `^[A-Z0-9]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$`
- Amount: `^(?!0(\.00?)?$)\d{1,10}(\.\d{1,2})?$`
- Email: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`

### 3. Authentication & Authorization
- JWT tokens with HTTP-only cookies
- Session expiration (30 minutes)
- Action tokens for privileged operations (5 minutes)
- Single-use token consumption

### 4. CSRF Protection
- Synchronous token pattern
- Token validated on all mutating requests
- Separate token for each session

### 5. Rate Limiting
- 3 requests per minute per IP (configurable)
- Prevents brute force attacks
- Token bucket algorithm

### 6. Audit Logging
- Tamper-evident chain with SHA-256
- Every action logged with:
  - Timestamp
  - User/IP address
  - Action details
  - Previous log hash (blockchain-style)

### 7. Transport Security
- HTTPS enforcement in production
- HSTS headers (Strict-Transport-Security)
- Secure cookie flags

### 8. Security Headers
- `X-Frame-Options: DENY` (clickjacking protection)
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (XSS protection)
- `Referrer-Policy: no-referrer`

### 9. Database Security
- Parameterized queries via Prisma ORM
- No raw SQL queries
- MongoDB Atlas with IP whitelisting

### 10. Static Employee Registration
- Employee accounts only created via database seeding
- No public registration endpoint
- Prevents unauthorized staff access

---

## 🐛 TROUBLESHOOTING

### Problem: "Cannot connect to database"
**Solution:** 
1. Check your internet connection
2. Verify `DATABASE_URL` in `.env` file
3. Ensure MongoDB Atlas IP whitelist includes your IP

### Problem: "Too Many Requests" error
**Solution:** 
1. Set `DISABLE_RATE_LIMIT=true` in `.env`
2. Restart the server: `npm run dev`

### Problem: "Port 3000 already in use"
**Solution:**
1. Stop any other applications using port 3000
2. Or change the port: `npm run dev -- -p 3001`

### Problem: Test accounts don't work
**Solution:**
1. Re-run the seed script: `npm run prisma:seed`
2. Check for "already exists" message (accounts are already created)

### Problem: Page not loading
**Solution:**
1. Ensure server is running (check terminal for "Ready on http://localhost:3000")
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito/private browsing mode

---

## 📂 PROJECT STRUCTURE

```
APDS7312-POE/
├── app/                      # Frontend React pages
│   ├── customer/            # Customer pages (login, payments)
│   ├── employee/            # Employee pages (dashboard, audit logs)
│   └── components/          # Reusable UI components
├── pages/api/               # Backend API routes (Express-style)
│   ├── customer/           # Customer endpoints
│   ├── employee/           # Employee endpoints
│   ├── payments/           # Payment operations
│   └── audit-logs.ts       # Audit log retrieval
├── lib/                     # Shared utilities
│   ├── auth.ts             # JWT and session management
│   ├── validation.ts       # Input validation (RegEx)
│   ├── audit.ts            # Audit logging
│   ├── rateLimit.ts        # Rate limiting
│   └── db.ts               # Database connection
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # MongoDB models
│   └── seed.mjs            # Test account creation
├── middleware.ts            # Security middleware (CSRF, headers)
└── .env                     # Environment configuration
```

---

## 🧪 TESTING CHECKLIST

Use this checklist to verify all functionality:

- [ ] **Installation**: `npm install` completes successfully
- [ ] **Database Setup**: `npm run prisma:seed` creates test accounts
- [ ] **Server Start**: `npm run dev` starts without errors
- [ ] **Customer Registration**: New account can be created with valid data
- [ ] **Customer Registration Validation**: Invalid data is rejected with clear errors
- [ ] **Customer Login**: testcustomer can login successfully
- [ ] **Payment Creation**: Valid payment is created with PENDING status
- [ ] **Payment Validation**: Invalid payment data is rejected
- [ ] **Employee Login**: EMP001 can login successfully
- [ ] **Payment Verification**: Employee can verify PENDING payment
- [ ] **Action Token System**: Two-factor confirmation works for verify/submit
- [ ] **SWIFT Submission**: Verified payment can be submitted
- [ ] **Audit Logs**: All actions are logged and viewable
- [ ] **Audit Log Details**: Clicking details shows full information
- [ ] **Rate Limiting**: (If enabled) Blocks after 3 failed login attempts
- [ ] **Session Security**: Logout clears session and redirects
- [ ] **Employee Registration Block**: /api/employee/register returns 403

---

## 📚 ADDITIONAL RESOURCES

### Database Browser
To view the database directly:
```bash
npm run prisma:studio
```
Opens at: http://localhost:5555

### API Testing (Optional)
Postman collections are available in `tools/postman/` directory for advanced API testing.

### Code Quality
Run linting and tests:
```bash
npm run lint        # Check code quality
npm run test:ci     # Run all tests
```

---

## 📞 SUPPORT

If you encounter any issues during testing:

1. Check the **Troubleshooting** section above
2. Ensure all prerequisites are installed
3. Verify `.env` configuration matches the provided settings
4. Contact the development team:
   - ST10274142 – Teejay Kamwaro
   - ST10267985 – Kabelo Diutluileng
   - ST10306640 – Keanu Muller
   - ST10258945 – Kyle James

---

## 📄 LICENSE & ACADEMIC INTEGRITY

This project is submitted as part of APDS7311 coursework at IIEMSA. All code is original work by Group 5 unless otherwise cited. Unauthorized copying or distribution is prohibited under academic integrity policies.

---

**Last Updated:** November 2024  
**Version:** 3.0 (Task 3 Submission)
