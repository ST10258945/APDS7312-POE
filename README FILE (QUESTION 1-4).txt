GlobeWire – Task 3 (Employee Portal Hardening)

This document explains the changes I added for Task 3 (requirements 1–4) on top of the Task 2 project, and how to run and verify them.

What I added (Task 3 – Q1 to Q4)
1) Users are created (no self-registration for employees)

New admin-only endpoint: POST /api/employee/admin/create

Available only to admins via header: x-admin-token: <ADMIN_TOKEN>.

Creates Employee with a temporary password that is hashed before storage.

Rejects unknown/extra fields and invalid formats.

Public registration remains for customers only:

POST /api/auth/register blocks any attempt to create an employee (e.g., ?type=employee → 403).

Files
pages/api/employee/admin/create.ts (new)
pages/api/auth/register.ts (updated to block employee self-registration)

2) Password security with hashing & salting

Uses bcrypt for hashing (configurable rounds via BCRYPT_ROUNDS).

Login verifies passwords with bcrypt.compare.

No plaintext passwords are returned or stored.

Files
lib/auth.ts (hash/verify helpers, JWT helpers)
pages/api/auth/login.ts (verifies password)
pages/api/employee/admin/create.ts (hash temp password)

3) Whitelist (allow-list) input validation with RegEx

Centralized validators in lib/validation.ts (email, strong password, names, IDs, currency, etc).

Allow-list approach: only known-good characters are accepted; suspicious patterns rejected.

Endpoints call validateFields and/or strict regex for specific fields.

Files
lib/validation.ts (major)
pages/api/employee/admin/create.ts (strict checks)
pages/api/auth/register.ts (uses validators)

4) All traffic served over SSL (and general hardening)

Middleware security:

HTTPS enforced in production.

CSRF check for mutating requests (admin create is explicitly exempt so it can be called directly in tests).

Basic rate-limit on login routes.

Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS in production.

Optional local HTTPS demo supported via self-signed cert + local proxy on https://localhost:3443.

Files
middleware.ts (enforce HTTPS in prod, CSRF gate, rate-limit, security headers)
lib/rateLimit.ts (token bucket limiter)
generate-ssl.ps1 (helper to generate local certs if you want the SSL demo)

New/updated endpoints (summary)
Endpoint	Method	Purpose	Auth
/api/employee/admin/create	POST	Admin creates an employee (no self-registration)	x-admin-token header
/api/auth/register	POST	Customer registration; blocks employee type	Public
/api/auth/login	POST	Login with bcrypt verification	Public
/api/csrf	GET	Issues CSRF token/cookie for other mutating requests	Public
Postman (included)

APDS7311 Task 2 – GlobeWire Backend.postman_collection.json

GlobeWire Advanced Security Tests.postman_collection.json

GlobeWire-Local.postman_environment.json (uses {{baseUrl}} and {{adminToken}})

Set adminToken in the environment to the same value as .env ADMIN_TOKEN.
Set baseUrl to http://localhost:3001 (simple) or https://localhost:3443 (if using local HTTPS proxy).

How to run
1) Install
npm ci

2) Environment

Create .env in the repo root:

ADMIN_TOKEN=<long_random_hex>
BCRYPT_ROUNDS=12
JWT_SECRET=<another_long_random_hex>


Never commit .env. A .env.example may be provided with placeholders.

3) Database (Prisma)
npx prisma generate
npx prisma migrate dev --name init
# optional seed:
# node prisma/seed.js

4) Start the dev server
npm run dev   # Next.js (typically http://localhost:3001 if 3000 is busy)

(Optional) Local HTTPS demo

If you want to show SSL locally (for Q4), run a proxy that terminates TLS:

# create certs (mkcert recommended)
mkcert -install
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost

# start HTTPS proxy 3443 -> 3001
npx local-ssl-proxy --source 3443 --target 3001 --cert certs/localhost-cert.pem --key certs/localhost-key.pem


Then set Postman baseUrl = https://localhost:3443 (accept self-signed warning once).

How to verify the rubric items

No employee self-registration

Call POST /api/employee/admin/create with x-admin-token: {{adminToken}} and JSON body:

{ "employeeId":"EMP-1001","fullName":"Jane Doe","email":"jane.doe@company.com","tempPassword":"Str0ng!Passw0rd" }


Expect 201 with new employee id.
Missing/wrong token → 403. Duplicates → 409.

Try registering an employee via /api/auth/register (e.g., ?type=employee) → 403.

Hashed passwords

Prisma DB shows passwordHash (bcrypt), not plaintext. Login succeeds with correct password.

Allow-list RegEx

Send invalid employeeId or <script> in fullName → 400 with validation errors.

SSL & security

In production: middleware redirects HTTP→HTTPS and sets HSTS/CSP headers.

Locally (optional): hit https://localhost:3443/* via proxy to demo SSL.

Files touched/added

New: pages/api/employee/admin/create.ts

Updated: pages/api/auth/register.ts, pages/api/auth/login.ts

Validation: lib/validation.ts

Auth utils: lib/auth.ts

Rate limit: lib/rateLimit.ts

Security/CSRF/HTTPS: middleware.ts

DB glue: lib/db.ts

Helper: generate-ssl.ps1

Postman: collections + environment

Troubleshooting

403 on admin create → x-admin-token doesn’t match .env ADMIN_TOKEN.

CSRF errors on other POSTs → call /api/csrf first and send x-csrf-token cookie/header pair.

ECONNREFUSED 3443 → HTTPS proxy not running (use baseUrl=http://localhost:3001 instead).

Port change → update baseUrl (server often starts on 3001 if 3000 is busy).