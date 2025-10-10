# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**GlobeWire** is a secure international payment portal built with Next.js 15, featuring dual user authentication (customers and employees) with comprehensive input validation and audit logging. This is an academic project for APDS7311 - Application Development Security.

## Development Commands

### Package Manager
This project uses **pnpm** as the package manager (see pnpm-lock.yaml).

### Core Development Commands
```powershell
# Install dependencies
pnpm install

# Start development server with Turbopack (faster builds)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Database Commands
```powershell
# Generate Prisma client (runs automatically after install)
npx prisma generate

# Apply database migrations
npx prisma migrate dev

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio (GUI database viewer)
npx prisma studio

# Push schema changes without migration (development)
npx prisma db push
```

## Architecture Overview

### Technology Stack
- **Frontend/Backend**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom JWT + bcryptjs
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm

### Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── globals.css        # Global styles (Tailwind)
│   ├── layout.tsx         # Root layout component
│   └── page.tsx          # Home page
├── pages/api/             # API routes (Pages Router for API)
│   ├── auth/             # General authentication endpoints
│   ├── customer/         # Customer-specific endpoints
│   ├── employee/         # Employee-specific endpoints
│   └── payments/         # Payment processing endpoints
├── lib/                   # Shared utilities
│   ├── auth.ts           # JWT & password hashing utilities
│   ├── db.ts             # Prisma client singleton
│   └── validation.ts     # Comprehensive input validation
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema definition
│   ├── dev.db           # SQLite database file
│   └── migrations/      # Database migration history
└── public/              # Static assets
```

### Database Architecture

The system uses **dual user authentication** with separate models:

1. **Customer** - End users making international payments
   - Stores: fullName, idNumber, accountNumber, username, email, passwordHash
   - Relations: One-to-many with Payment

2. **Employee** - Staff members who verify payments
   - Stores: employeeId, fullName, email, passwordHash, isActive
   - Relations: One-to-many with Payment (as verifier)

3. **Payment** - International payment transactions
   - Stores: amount, currency, provider, recipient details, SWIFT code
   - Status workflow: PENDING → VERIFIED → SUBMITTED → COMPLETED/REJECTED
   - Includes audit trail with timestamps

4. **AuditLog** - Security monitoring and compliance
   - Tracks all system actions with metadata
   - Records: entityType, action, userId, ipAddress, userAgent

### Security Architecture

**Input Validation** (`lib/validation.ts`):
- **Whitelist approach**: RegEx patterns reject dangerous characters
- Validates: emails, passwords, names, bank details, SWIFT codes, currencies
- Comprehensive sanitization for all user inputs
- Password requirements: 8-128 chars, mixed case, numbers, symbols

**Authentication Flow**:
- JWT tokens with 1-hour expiration
- bcryptjs password hashing (configurable rounds)
- Separate login endpoints for customers vs employees

**API Structure**:
- `/api/auth/` - General authentication
- `/api/customer/` - Customer registration/login
- `/api/employee/` - Employee authentication
- `/api/payments/` - Payment processing

### Environment Configuration

Required environment variables:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
BCRYPT_ROUNDS="12"
```

## Development Guidelines

### API Routes
- Use Next.js API routes in `pages/api/` directory
- Follow RESTful conventions where appropriate
- Always validate inputs using `lib/validation.ts` functions
- Return consistent JSON error responses

### Database Operations
- Use the Prisma client from `lib/db.ts` (singleton pattern)
- Leverage Prisma's type safety for all database operations
- Always handle database errors gracefully
- Use transactions for multi-step operations

### Security Practices
- Never trust user input - always validate with whitelist patterns
- Hash passwords before storing using `lib/auth.ts`
- Implement proper JWT token validation
- Log security-relevant actions to AuditLog table

### Code Organization
- Keep validation logic in `lib/validation.ts`
- Centralize database access patterns in `lib/db.ts`
- Use TypeScript interfaces from Prisma schema
- Follow Next.js App Router conventions for new pages

### Testing Database Schema Changes
```powershell
# After modifying schema.prisma
npx prisma migrate dev --name "descriptive-name"

# Or for quick prototyping (no migration file)
npx prisma db push
```