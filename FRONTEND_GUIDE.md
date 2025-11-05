# Frontend Portal Guide

## 🚀 Quick Start

### Start the Application

```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📱 Portal Overview

### Landing Page (/)
- Navigation hub for both portals
- Customer Portal (green/teal theme)
- Employee Portal (blue/indigo theme)

---

## 👤 **CUSTOMER PORTAL** (Green Theme)

### 1. Customer Registration (`/customer/register`)

**Test Data:**
```
Full Name: John Doe
ID Number: 1234567890123 (13 digits)
Account Number: 123456789012 (8-12 digits)
Username: johndoe123
Email: john@example.com
Password: SecurePass123!
```

**Required Password Format:**
- 8-128 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*...)

### 2. Customer Login (`/customer/login`)

**Credentials:** Use the account you registered above

**Fields:**
- Username
- Account Number
- Password

### 3. Create Payment (`/customer/payments`)

**Test Payment:**
```
Amount: 1000.50
Currency: USD
Provider: SWIFT
SWIFT Code: ABCDUS33XXX (8 or 11 chars)
Recipient Name: Jane Smith
Recipient Account: 987654321012
Payment Reference: Invoice #12345 (optional)
```

**What happens:** Payment is created with status `PENDING` and appears in employee portal

---

## 👨‍💼 **EMPLOYEE PORTAL** (Blue Theme)

### 1. Employee Login (`/employee/login`)

**Default Credentials** (from seed script):
```
Employee ID: EMP001
Password: EmpSecurePass123!
```

### 2. Employee Dashboard (`/employee/dashboard`)

**Features:**
- **Filter payments** by status: ALL | PENDING | VERIFIED | SUBMITTED
- **View payment list** with all details
- **Click "View"** to open payment details modal
- **Refresh button** to reload payments

### 3. Payment Actions

**For PENDING payments:**
1. Click "View" on a payment
2. Review all details
3. Click **"✓ Verify Payment"**
4. Confirm the action
5. Status changes to `VERIFIED`

**For VERIFIED payments:**
1. Click "View" on a verified payment
2. Click **"→ Submit to SWIFT"**
3. Confirm the action
4. Status changes to `SUBMITTED`
5. **This is the final step** (your job ends here per requirements)

---

## 🎬 Demo Video Flow

### Full End-to-End Demo:

1. **Landing Page** → Show both portals
2. **Customer Registration** → Register new account
3. **Customer Login** → Sign in with new account
4. **Create Payment** → Submit international payment
5. **Employee Login** → Sign in as EMP001
6. **Employee Dashboard** → Show payment appears as PENDING
7. **Verify Payment** → Click View → Verify button → Status changes to VERIFIED
8. **Submit to SWIFT** → Click View → Submit button → Status changes to SUBMITTED
9. **Show CircleCI** → Navigate to GitHub Actions/CircleCI to show pipeline running

---

## 🔐 Security Demonstration Points

### For Your Video:

1. **CSRF Protection**: Point out the automatic CSRF token fetching in api-client.ts
2. **Input Validation**: Show validation errors (e.g., wrong password format)
3. **Authentication**: Show redirect to login when not authenticated
4. **Action Tokens**: Explain that verify/submit require single-use action tokens
5. **Audit Logging**: Mention that all actions are logged with tamper-evident chain
6. **Rate Limiting**: Explain that excessive login attempts are blocked

---

## 🐛 Troubleshooting

### "Not authenticated" error
- You may need to log in again
- Session cookies might have expired

### Payment doesn't appear in employee portal
- Click the **🔄 Refresh** button
- Make sure you're logged in as an employee

### Can't create payment
- Ensure all required fields are filled
- Check SWIFT code format (8 or 11 characters, uppercase)
- Verify amount format (max 2 decimal places)

---

## 📊 Technical Details

### Page Structure:
```
app/
├── page.tsx                    # Landing page
├── customer/
│   ├── register/page.tsx       # Customer registration
│   ├── login/page.tsx          # Customer login
│   └── payments/page.tsx       # Create payment
└── employee/
    ├── login/page.tsx          # Employee login
    └── dashboard/page.tsx      # Employee dashboard + actions
```

### API Client:
- `lib/api-client.ts` - Handles CSRF tokens and authenticated requests
- All API calls use this client automatically

### Color Scheme:
- **Customer Portal**: Green/Teal (#14b8a6)
- **Employee Portal**: Blue/Indigo (#4f46e5)
- **Landing**: Gradient blend of both

---

## ✅ Task 3 Completion Checklist

- [x] Employee login page
- [x] Employee dashboard with payment list
- [x] Verify payment functionality
- [x] Submit to SWIFT functionality
- [x] Customer login page (for demo)
- [x] Customer registration page (for demo)
- [x] Create payment page (for demo)
- [x] Full end-to-end flow
- [x] Action token integration
- [x] Status filtering
- [x] Professional UI with proper styling
- [ ] Record demo video
- [ ] Show CircleCI pipeline running

---

## 🎥 Recording Your Demo Video

### Recommended Tool:
**OBS Studio** (free) or **Windows Game Bar** (built-in)

### Script:
1. (0:00-0:30) Show landing page, explain two portals
2. (0:30-1:30) Customer flow: Register → Login → Create Payment
3. (1:30-2:30) Employee flow: Login → Show dashboard → Verify payment
4. (2:30-3:00) Submit to SWIFT → Show final status
5. (3:00-3:30) Show GitHub repo → CircleCI pipeline running
6. (3:30-4:00) Quick overview of security features from README

### Total Time: ~4 minutes

---

**Good luck with your demo! 🚀**
