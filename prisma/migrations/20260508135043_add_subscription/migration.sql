-- CreateTable
CREATE TABLE "Subscription" (
    "shop" TEXT NOT NULL PRIMARY KEY,
    "planName" TEXT NOT NULL DEFAULT 'pro',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "trialEndsAt" DATETIME,
    "billingOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
