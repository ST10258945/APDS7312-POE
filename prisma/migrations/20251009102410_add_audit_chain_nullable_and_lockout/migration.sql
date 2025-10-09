-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN "hash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "prevHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastFailedLogin" DATETIME,
    "lockedUntil" DATETIME
);
INSERT INTO "new_employees" ("createdAt", "email", "employeeId", "fullName", "id", "isActive", "passwordHash", "updatedAt") SELECT "createdAt", "email", "employeeId", "fullName", "id", "isActive", "passwordHash", "updatedAt" FROM "employees";
DROP TABLE "employees";
ALTER TABLE "new_employees" RENAME TO "employees";
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
