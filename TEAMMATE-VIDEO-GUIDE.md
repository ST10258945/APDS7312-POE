# 🎬 APDS7311 Task 2 - Video Recording Guide for Teammates
**Complete Step-by-Step Instructions**

---

## 🎯 **What You'll Be Demonstrating**
A secure international payment backend with 13 different security implementations, showing professional-grade coding and security awareness.

---

## 📋 **BEFORE YOU START - Pre-Recording Checklist**

### **1. Software Requirements**
- [ ] **Node.js 18+** installed
- [ ] **Git** installed
- [ ] **Postman Desktop App** installed (not web version)
- [ ] **Screen Recording Software** (OBS Studio recommended - free)
- [ ] **Good Quality Microphone** or headset

### **2. Download and Setup OBS Studio (Free Screen Recorder)**
1. Download from: https://obsproject.com/
2. Install with default settings
3. **Basic Setup**:
   - Create new Scene called "Desktop Recording"
   - Add Source → Display Capture → Select your main monitor
   - Audio: Enable Desktop Audio
   - Settings → Output → Recording Quality: High Quality, Medium File Size
   - Settings → Video → Base Resolution: 1920x1080, FPS: 30

### **3. Environment Setup**
```bash
# 1. Navigate to project folder
cd "path/to/APDS7312-POE"

# 2. Install dependencies
npm install

# 3. Start the server
npm run dev
```

**Verify server is running**: Open browser to http://localhost:3000

---

## 📥 **POSTMAN SETUP - Step by Step**

### **Step 1: Import the Collection**
1. **Open Postman Desktop App**
2. **Click "Import"** (top-left corner)
3. **Drag and drop** OR **Browse** for these files from your project folder:
   - `GlobeWire-API-Collection.postman_collection.json`
   - `GlobeWire-Local.postman_environment.json`

### **Step 2: Set Up the Environment**
1. **Click the Environment dropdown** (top-right corner)
2. **Select "GlobeWire Local Development"**
3. **Verify variables are set**:
   - baseUrl: `http://localhost:3000`
   - testFullName: `John Smith`
   - testEmail: `john.smith.demo@example.com`
   - testPassword: `SecurePass123!`

### **Step 3: Test the Collection**
**Before recording, run through this sequence once to make sure everything works:**

#### **A. Authentication Flow**
1. **Get CSRF Token**
   - Folder: 🔐 Authentication
   - Request: "Get CSRF Token"
   - Click **Send**
   - ✅ Should return status 200 with csrf-token in headers

2. **Register Customer**
   - Request: "Register Customer" 
   - Click **Send**
   - ✅ Should return status 201 with customer details

3. **Login Customer**
   - Request: "Login Customer"
   - Click **Send** 
   - ✅ Should return status 200 (session cookie set automatically)

#### **B. Payment Flow**
4. **Create Payment**
   - Folder: 💰 Payments
   - Request: "Create International Payment"
   - Click **Send**
   - ✅ Should return status 201 with transaction ID

5. **List Payments**
   - Request: "List Customer Payments"
   - Click **Send**
   - ✅ Should return status 200 with payment array

#### **C. Security Tests**
6. **Test SQL Injection Prevention**
   - Folder: 🛡️ Security Tests
   - Request: "SQL Injection Attempt - Registration"
   - Click **Send**
   - ✅ Should return status 400 (blocked)

**If any test fails, restart the server and clear cookies in Postman (Settings → Clear Cookies)**

---

## 🎬 **VIDEO RECORDING SCRIPT (10-12 minutes)**

### **Recording Setup**
1. **Close unnecessary applications** (Discord, Slack, etc.)
2. **Set VS Code to high contrast theme** for visibility
3. **Arrange windows**: VS Code (left), Postman (right), Browser (as needed)
4. **Start OBS Studio** and verify capture looks good
5. **Test microphone levels** - speak at normal volume

### **⏱️ TIMELINE & SCRIPT**

---

#### **00:00 - 01:30: Introduction**
**Start Recording**

> "Hello, I'm [Your Name] from Group 5, presenting our APDS7311 Task 2 submission - the GlobeWire international payment backend."

**Show on screen**:
- Desktop with project folder open
- Open VS Code with project structure visible

> "This is a comprehensive secure backend built with Next.js and TypeScript, implementing 13 different security techniques to protect against common attacks."

**Point out key folders**: `pages/api`, `lib`, `prisma`

---

#### **01:30 - 03:00: Security Architecture**
**Open the Portal Hardening PDF document**

> "Our security implementation is fully documented. Let me show you the 13 attack vectors we protect against."

**Scroll through the PDF table of contents quickly**

**Switch to VS Code, open these files**:
- `middleware.ts` - show CSRF protection
- `lib/validation.ts` - show RegEx patterns
- `lib/auth.ts` - show JWT and bcrypt

**Highlight specific code**:
```typescript
// Show this in validation.ts
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  SWIFT_CODE: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  // ... more patterns
}
```

> "Every input is validated with whitelist RegEx patterns, preventing injection attacks."

---

#### **03:00 - 06:30: Live API Testing**
**Switch to Postman**

#### **03:00 - 03:30: CSRF & Registration**
> "Let me demonstrate the API functionality, starting with CSRF protection."

1. **Click "Get CSRF Token"** → **Send**
   - Show the csrf-token in response headers
   - "The CSRF token is automatically captured for subsequent requests"

2. **Click "Register Customer"** → **Send**
   - Show successful 201 response
   - "All inputs are validated - name, ID number, account number, email, password complexity"

#### **03:30 - 04:30: Authentication**
> "Now I'll authenticate this customer."

3. **Click "Login Customer"** → **Send**
   - Show 200 response
   - **Point to Cookies tab**: "Session token stored in HTTP-only cookie for security"

#### **04:30 - 05:30: Payment Creation**
> "Let's create an international payment with full validation."

4. **Click "Create International Payment"** → **Send**
   - Show 201 response with transaction ID
   - Highlight: amount, currency (USD), SWIFT code validation
   - "Payment status is PENDING - awaiting employee verification"

5. **Click "List Customer Payments"** → **Send**
   - Show the created payment in the array

#### **05:30 - 06:30: Idempotency Testing**
> "Our system prevents duplicate payments using idempotency keys."

6. **Click "Test Idempotency (Duplicate Payment)"** → **Send**
   - Show 200 response (not 201)
   - "Same response returned from cache - no duplicate payment created"

---

#### **06:30 - 08:30: Security Testing**
> "Now I'll demonstrate our security protections by attempting various attacks."

#### **06:30 - 07:00: Invalid Login**
7. **Click "Invalid Credentials Login"** → **Send**
   - Show 401 response
   - "Failed attempts are logged for security monitoring"

#### **07:00 - 07:30: SQL Injection Prevention**
> "Let's try a SQL injection attack."

8. **Show request body first** (malicious SQL in fullName field)
9. **Click "SQL Injection Attempt - Registration"** → **Send**
   - Show 400 response with validation error
   - "RegEx validation catches injection patterns before they reach the database"

#### **07:30 - 08:00: Invalid Payment Data**
10. **Click "Invalid Payment Data"** → **Send**
    - Show detailed validation errors for each field
    - "Negative amounts, invalid currencies, XSS attempts - all blocked"

#### **08:00 - 08:30: CSRF Protection**
11. **Click "Missing CSRF Token"** → **Send**
    - Show 403 Forbidden
    - "All mutating operations require CSRF tokens"

---

#### **08:30 - 09:30: Code Quality & Architecture**
**Switch back to VS Code**

> "Let me show you our database design and code organization."

**Open `prisma/schema.prisma`**:
- Show Customer, Employee, Payment models
- Highlight AuditLog with hash chaining
- "Tamper-evident audit trail using SHA-256 hashing"

**Show audit log model**:
```typescript
model AuditLog {
  id          String   @id @default(cuid())
  entityType  String   // Customer, Employee, Payment
  prevHash    String?  // Previous log entry hash
  hash        String   @unique // Current entry hash
  // ... other fields
}
```

**Open `middleware.ts`** briefly:
- Show security headers being set
- "HSTS, CSP, X-Frame-Options - comprehensive browser protection"

---

#### **09:30 - 10:30: Documentation & Academic Context**
**Open README.md**

> "Our submission includes comprehensive documentation."

- Scroll through README showing setup instructions
- Show API endpoints documentation
- Reference the Portal Hardening document

**Back to Postman**:
- Show the collection structure
- "Complete test suite with 15+ scenarios including security tests"

> "This demonstrates our commitment to professional development practices and meets all APDS7311 Task 2 requirements:"
- ✅ Password security with bcrypt hashing and salting
- ✅ Input whitelisting with comprehensive RegEx patterns  
- ✅ SSL enforcement ready for production
- ✅ Protection against all major attack vectors
- ✅ Complete international payment workflow

---

#### **10:30 - 12:00: Conclusion**
> "This GlobeWire backend demonstrates enterprise-grade security for international payment processing."

**Key points to emphasize**:
- "13 different security techniques implemented"
- "Every input validated with whitelist approach"
- "Complete payment workflow with employee verification"
- "Production-ready with comprehensive documentation"
- "Built with security-first principles throughout"

> "Thank you for watching. This submission represents our team's dedication to secure application development and fully satisfies the APDS7311 Task 2 requirements."

**Stop Recording**

---

## 🚨 **TROUBLESHOOTING**

### **If Server Won't Start**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000
# Kill process if needed, then restart
npm run dev
```

### **If Postman Tests Fail**
1. **Restart the server**: `Ctrl+C` then `npm run dev`
2. **Clear Postman cookies**: Settings → Cookies → Remove All
3. **Re-run CSRF token request** first
4. **Check environment is selected**: Top-right dropdown should show "GlobeWire Local Development"

### **If Customer Registration Fails**
- **Duplicate user error**: Change the username/email in environment variables
- **Validation errors**: Check that all fields meet requirements (password complexity, etc.)

### **Recording Issues**
- **No audio**: Check OBS Audio settings → Desktop Audio enabled
- **Blurry screen**: OBS Settings → Video → Base Resolution should be 1920x1080
- **Large file size**: OBS Settings → Output → Recording Quality → "High Quality, Medium File Size"

---

## ✅ **FINAL QUALITY CHECKLIST**

### **Before Recording**
- [ ] Server running successfully on localhost:3000
- [ ] Postman collection imported and tested
- [ ] Environment variables configured
- [ ] OBS recording setup tested
- [ ] Microphone levels tested
- [ ] All unnecessary applications closed
- [ ] VS Code high contrast theme enabled

### **During Recording**  
- [ ] Speak clearly and explain what you're doing
- [ ] Show request/response details in Postman
- [ ] Highlight security features as you demonstrate
- [ ] Keep transitions smooth between applications
- [ ] Stay within 10-12 minute timeframe

### **After Recording**
- [ ] Video quality is clear and readable
- [ ] Audio is clear throughout
- [ ] All key features demonstrated
- [ ] File size is reasonable for upload
- [ ] Upload to platform and test link access

---

## 🎯 **SUCCESS TIPS**

1. **Practice once** before recording - run through the entire sequence
2. **Speak confidently** - you know this material well
3. **Explain security benefits** as you show features
4. **Keep it professional** - this is academic work
5. **Don't worry about small mistakes** - the content is excellent
6. **Remember**: You're demonstrating Distinction-level work!

---

**Your backend implementation is outstanding. This video will showcase the professional quality and security-first approach your team has achieved. Good luck!** 🚀