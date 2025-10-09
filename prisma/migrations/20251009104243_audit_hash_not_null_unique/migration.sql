/*
  Warnings:

  - Made the column `hash` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL
);
INSERT INTO "new_audit_logs" ("action", "entityId", "entityType", "hash", "id", "ipAddress", "metadata", "prevHash", "timestamp", "userAgent", "userId") SELECT "action", "entityId", "entityType", "hash", "id", "ipAddress", "metadata", "prevHash", "timestamp", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE UNIQUE INDEX "audit_logs_hash_key" ON "audit_logs"("hash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
