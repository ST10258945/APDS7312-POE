# GlobeWire - International Payment Portal

**APDS7311 Task 2 - Group 5**

A secure international payment processing backend built with Next.js, TypeScript, and comprehensive security hardening measures. This system enables customers to create international payments while providing employees with verification and approval workflows.

## 🏗️ Architecture

- **Backend**: Next.js 15 with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with HTTP-only cookies
- **Security**: Comprehensive input validation, CSRF protection, rate limiting, audit logging
- **Payment Processing**: International payment creation with SWIFT integration support

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd APDS7312-POE
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the `JWT_SECRET` with a strong secret key.

4. **Set up database**:
   ```bash
   pnpm run migrate
   pnpm run prisma:generate
   ```

5. **Start the development server**:
   ```bash
   pnpm run dev
   ```

6. **Access the application**:
   - API Base URL: `http://localhost:3000`
   - Health Check: `GET /api/csrf` (returns CSRF token)

## 📡 API Endpoints

### Authentication
- `GET /api/csrf` - Get CSRF token (required for mutations)
- `POST /api/customer/register` - Customer registration
- `POST /api/customer/login` - Customer authentication
- `POST /api/employee/login` - Employee authentication
- `POST /api/logout` - Logout (clears session)

### Payments (Customer)
- `POST /api/payments/create` - Create international payment
- `GET /api/payments/list` - List customer's payments

### Employee Operations
- `POST /api/employee/request-action-token` - Request action token for privileged operations
- `POST /api/payments/verify` - Verify/approve pending payments
- `POST /api/employee/submit-to-swift` - Submit verified payments to SWIFT

### Request Examples

**Customer Registration**:
```json
POST /api/customer/register
Content-Type: application/json
x-csrf-token: <csrf-token>

{
  "fullName": "John Doe",
  "idNumber": "1234567890123",
  "accountNumber": "123456789012",
  "username": "johndoe123",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Create Payment**:
```json
POST /api/payments/create
Content-Type: application/json
x-csrf-token: <csrf-token>
Cookie: session=<jwt-session-token>

{
  "amount": "150.75",
  "currency": "USD",
  "provider": "SWIFT",
  "recipientName": "Jane Smith",
  "recipientAccount": "987654321012",
  "swiftCode": "ABCDUS33XXX",
  "paymentReference": "Invoice #12345"
}
```

## 🔒 Security Features

This application implements comprehensive security measures as documented in the "Portal Hardening - Design & Implementation Summary" document:

- **Input Validation**: WhiteList RegEx patterns for all inputs
- **Authentication**: JWT tokens with HTTP-only cookies
- **CSRF Protection**: Synchronous token pattern
- **SQL Injection Prevention**: Parameterized queries via Prisma ORM
- **Rate Limiting**: Per-IP and per-route throttling
- **Audit Logging**: Tamper-evident chain with SHA-256 hashing
- **Transport Security**: HTTPS enforcement with HSTS
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **Password Security**: bcrypt hashing with configurable rounds
- **Action Tokens**: Single-use tokens for privileged operations

## 🗄️ Database Schema

Key entities:
- **Customer**: User accounts for payment creation
- **Employee**: Staff accounts for payment verification
- **Payment**: International payment transactions
- **AuditLog**: Tamper-evident audit trail

Run `pnpm run prisma:studio` to explore the database schema visually.

## 🛠️ Development Scripts

```bash
# Development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm run start

# Database operations
pnpm run migrate          # Run database migrations
pnpm run prisma:generate  # Generate Prisma client
pnpm run prisma:studio    # Open database browser

# Code quality
pnpm run lint             # ESLint check
```

## 🔧 Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL`: SQLite database file path
- `JWT_SECRET`: Strong secret for JWT signing (minimum 32 characters)
- `BCRYPT_ROUNDS`: Password hashing rounds (default: 12)
- `NODE_ENV`: Environment mode (development/production)

## 🧪 Testing

Use the provided Postman collection for comprehensive API testing:

1. Import the collection and environment from the project root
2. Set up environment variables (baseUrl, test credentials)
3. Run the collection to test all endpoints
4. Includes positive and negative test cases

## 📋 Production Checklist

- [ ] Strong JWT secret configured
- [ ] Database migrations applied
- [ ] HTTPS/TLS certificate configured
- [ ] Environment variables secured
- [ ] Rate limiting configured for production load
- [ ] Audit log retention policy defined
- [ ] Monitoring and logging configured

## 📚 Documentation

- **Security Implementation**: See "Portal Hardening - Design & Implementation Summary.pdf"
- **API Documentation**: Endpoint details in this README
- **Database Schema**: `prisma/schema.prisma`
- **Architecture**: Modular structure with clear separation of concerns

## 🎯 Academic Context

This project fulfills the requirements for APDS7311 Task 2, demonstrating:
- Secure backend development practices
- International payment processing workflows
- Comprehensive attack mitigation strategies
- Professional code quality and documentation

## 👥 Team

**Group 5** - APDS7311 Class of 2025

---

*Built with security-first principles for academic excellence.*
