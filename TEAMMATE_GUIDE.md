# GlobeWire Backend - Teammate Setup & Demo Guide

## Quick Start Checklist
- [ ] Pull latest code from main branch
- [ ] Install dependencies with `npm install`
- [ ] Start backend with `npm run dev`
- [ ] Import Postman collection and environment
- [ ] Test basic API endpoints
- [ ] Record video demonstration

---

## 1. Project Setup

### Pull Latest Code
```bash
git pull origin main
```

### Install Dependencies
```bash
npm install
```

### Start the Backend Server
```bash
npm run dev
```
**Expected output:** Server running on port 3000

### Create Default Employee Account
```bash
npx prisma db seed
```
**Expected output:** Created default employee: Admin Employee (EMP001)
**Note:** This creates the employee account needed for testing employee functions

### Verify Server is Running
Open browser to: `http://localhost:3000`
You should see: "GlobeWire Payment API is running!"

---

## 2. Postman Setup

### Import Collection & Environment
1. Open Postman
2. Click "Import" button (top left)
3. Import these files:
   - `GlobeWire-API-Collection.postman_collection.json`
   - `GlobeWire-Local.postman_environment.json`

### Select Environment
1. Click environment dropdown (top right)
2. Select "GlobeWire Local"
3. Verify variables are set:
   - `base_url`: `http://localhost:3000`
   - `csrf_token`: (will be auto-populated)
   - `customer_token`: (will be auto-populated)
   - `employee_token`: (will be auto-populated)

---

## 3. API Testing Sequence

### Test Order (Important!)
Follow this exact sequence as tokens depend on each other:

#### A. CSRF & Authentication Tests
1. **Get CSRF Token** - ⚠️ **MANDATORY FIRST STEP** - Sets cookie and token
2. **Customer Registration** - Creates new customer account
3. **Customer Login** - Gets customer JWT token
4. **Employee Login** - Use credentials: `EMP001` / `EmpSecurePass123!`

#### B. Payment Operations
4. **Create Payment (Customer)** - Customer creates payment (requires customer login)
5. **Test Idempotency (Duplicate Payment)** - Same payment with same idempotency key
6. **Employee Login** - Login as employee to access payment management
7. **List Payments (Employee)** - Employee views all payments (requires employee login)
8. **Verify Payment (Employee)** - Employee verifies payment

#### C. Security & Error Tests
7. **Invalid Payment** - Tests validation
8. **Unauthorized Access** - Tests security
9. **Rate Limiting** - Tests protection

### Expected Results
✅ **Green responses (200-201)**: Authentication, valid operations
✅ **Red responses (400-401-403-429)**: Error cases (this is correct!)

---

## 4. Video Recording Guide

### Recording Setup
- **Duration**: Aim for 10-12 minutes
- **Screen**: Record full screen at 1080p if possible
- **Audio**: Clear narration explaining each step
- **Tools**: OBS Studio, Windows Game Bar, or similar

### Recording Script Structure

#### Introduction (1-2 minutes)
- "This is [Your Name] demonstrating the GlobeWire secure payment backend"
- "I'll show the API endpoints, security features, and code walkthrough"
- Show project structure in VS Code

#### API Demonstration (6-8 minutes)
Follow the Postman sequence above while explaining:
- **Registration**: "Creating a new customer account with validation"
- **Authentication**: "Logging in with JWT token generation"
- **CSRF Protection**: "Notice the X-CSRF-Token header auto-populated"
- **Create Payment**: "Customer submitting a payment with all required fields"
- **Employee Operations**: "Employee viewing and verifying payments"
- **Security Tests**: "Demonstrating input validation and access control"

#### Code Walkthrough (2-3 minutes)
Show key files in VS Code:
- `server.js` - Main server setup and security middleware
- `routes/` - API endpoint implementations
- `middleware/` - Authentication and validation
- `models/` - Database schemas
- Mention security features: bcrypt, rate limiting, audit logging

#### Conclusion (30 seconds)
- "All endpoints working correctly with proper security"
- "Ready for production deployment"

### Recording Tips
1. **Practice first** - Do a dry run without recording
2. **Speak clearly** - Explain what you're doing and why
3. **Show results** - Let viewers see response bodies and status codes
4. **Handle errors gracefully** - If something fails, explain and retry
5. **Keep moving** - Don't spend too long on one section

---

## 5. Troubleshooting

### Server Won't Start
- Check if port 3000 is in use: `netstat -ano | findstr :3000`
- Kill process if needed: `taskkill /PID <process_id> /F`
- Restart with `npm run dev`

### Postman Errors
- **CSRF Token Missing/403 Forbidden**: 
  - **CRITICAL**: Run "Get CSRF Token" request FIRST before any POST requests
  - Verify environment is selected ("GlobeWire Local" in top right)
  - Check that `csrfToken` variable is populated in environment
  - Ensure Postman cookie management is enabled (Settings > General > Cookie Jar)
- **401 Unauthorized**: 
  - Check if customer/employee login succeeded
  - Verify JWT tokens in environment variables
- **Connection Refused**: 
  - Ensure backend server is running (check external PowerShell window)
  - Verify URL is `http://localhost:3000`
- **500 Internal Server Error**:
  - CSRF validation passed! (This is progress from 403)
  - Check server console for detailed error messages
  - Usually indicates missing API endpoint or database issue
- **Logout Returns No Data**:
  - Status 204 = Success with no content (this is correct!)
  - Logout successfully clears session cookie
- **401 on List Payments**:
  - "List Payments" requires EMPLOYEE login, not customer
  - Make sure you've logged in as employee before accessing

### Database Issues
- **MongoDB Connection**: Server will show connection status in console
- **Collections**: Will be created automatically on first use
- **Data Persistence**: Data survives server restarts

### Common Mistakes
- ❌ Wrong test order (tokens needed for later tests)
- ❌ Environment not selected in Postman
- ❌ Server not running when testing
- ❌ Recording too quietly or too fast

---

## 6. Quality Checklist

Before submitting, verify:
- [ ] All 9 Postman tests run successfully
- [ ] Video shows both success and error cases
- [ ] Audio is clear and understandable
- [ ] Code walkthrough covers security features
- [ ] Video length is 10-15 minutes
- [ ] Demonstrates professional API testing approach

---

## 7. File Locations

### Key Files to Understand
```
APDS7312-POE/
├── server.js                 # Main server setup
├── package.json              # Dependencies and scripts  
├── .env                      # Environment variables
├── routes/
│   ├── auth.js              # Authentication endpoints
│   └── payments.js          # Payment endpoints
├── middleware/
│   ├── auth.js              # JWT validation
│   ├── validation.js        # Input validation
│   └── security.js          # CSRF, rate limiting
├── models/
│   ├── Customer.js          # Customer schema
│   ├── Employee.js          # Employee schema
│   └── Payment.js           # Payment schema
└── postman/                 # API testing files
    ├── GlobeWire-API-Collection.postman_collection.json
    └── GlobeWire-Local.postman_environment.json
```

---

## Need Help?

If you encounter issues:
1. Check this troubleshooting guide first
2. Verify server console for error messages
3. Test endpoints individually in browser/Postman
4. Review the video script HTML file for detailed guidance

**Good luck with your demonstration!** 🚀

---

*Generated for APDS7312 POE Task 2 - GlobeWire Payment Backend*