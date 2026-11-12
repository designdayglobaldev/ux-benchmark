-- Phase 1 Migration: Zibo Payments, Credits & Ledger
-- Author: @SATYAJIT PUJAPANDA Spec Implementation
-- Invariants: I1, I2, I3 (Non-negative balances, append-only ledger, idempotent operations)

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "LedgerType" AS ENUM (
        'FREE_WELCOME_GRANT',
        'MONTHLY_SUBSCRIPTION_REFILL',
        'ROLLOVER_EXPIRY',
        'CREDIT_PACK_PURCHASE',
        'AI_QUERY_DEBIT',
        'SYSTEM_REFUND',
        'PAYMENT_REFUND_CLAWBACK',
        'ADMIN_MANUAL_GRANT',
        'ADMIN_MANUAL_DEDUCTION',
        'MIGRATION_BACKFILL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReservationStatus" AS ENUM ('RESERVED', 'SETTLED', 'RELEASED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionStatus" AS ENUM (
        'INCOMPLETE',
        'ACTIVE',
        'PAST_DUE',
        'HALTED',
        'PAUSED',
        'CANCELLED',
        'COMPLETED',
        'EXPIRED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM (
        'SUBSCRIPTION_MANDATE_INIT',
        'SUBSCRIPTION_RECURRING',
        'CREDIT_PACK_PURCHASE',
        'ADMIN_MANUAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter Existing App Table (Premium Content Gating)
ALTER TABLE "App" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "App" ADD COLUMN IF NOT EXISTS "previewLimit" INTEGER NOT NULL DEFAULT 4;

-- 3. Alter Existing ClientUser Table (Ledger & Tier Overrides)
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "creditsBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "tierOverride" "UserTier";
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "tierOverrideUntil" TIMESTAMP(3);
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "tierOverrideReason" TEXT;
ALTER TABLE "ClientUser" ADD COLUMN IF NOT EXISTS "welcomeGrantedAt" TIMESTAMP(3);

-- 4. Alter Existing AiChatMessage (Idempotency Key)
ALTER TABLE "AiChatMessage" ADD COLUMN IF NOT EXISTS "clientMessageId" TEXT;
DO $$ BEGIN
    CREATE UNIQUE INDEX "AiChatMessage_sessionId_clientMessageId_key" ON "AiChatMessage"("sessionId", "clientMessageId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create CreditReservation Table
CREATE TABLE IF NOT EXISTS "CreditReservation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "releaseReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditReservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreditReservation_userId_requestKey_key" ON "CreditReservation"("userId", "requestKey");
CREATE INDEX IF NOT EXISTS "CreditReservation_status_expiresAt_idx" ON "CreditReservation"("status", "expiresAt");

-- 6. Create CreditLedger Table
CREATE TABLE IF NOT EXISTS "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountDelta" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "type" "LedgerType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "reservationId" TEXT,
    "paymentId" TEXT,
    "reason" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CreditLedger_idempotencyKey_key" ON "CreditLedger"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");

-- 7. Create SubscriptionPlan & PlanPrice Tables
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");

CREATE TABLE IF NOT EXISTS "PlanPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "razorpayPlanId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "monthlyCredits" INTEGER NOT NULL DEFAULT 2500,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PlanPrice_razorpayPlanId_key" ON "PlanPrice"("razorpayPlanId");
CREATE UNIQUE INDEX IF NOT EXISTS "PlanPrice_planId_currency_amountMinor_key" ON "PlanPrice"("planId", "currency", "amountMinor");

-- 8. Create UserSubscription Table
CREATE TABLE IF NOT EXISTS "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planPriceId" TEXT NOT NULL,
    "razorpaySubId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "razorpayStatus" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "entitledUntil" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "lastEventAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserSubscription_planPriceId_fkey" FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserSubscription_razorpaySubId_key" ON "UserSubscription"("razorpaySubId");
CREATE INDEX IF NOT EXISTS "UserSubscription_userId_idx" ON "UserSubscription"("userId");
CREATE INDEX IF NOT EXISTS "UserSubscription_status_idx" ON "UserSubscription"("status");

-- 9. Create PaymentTransaction Table
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planPriceId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentType" "PaymentType" NOT NULL DEFAULT 'SUBSCRIPTION_RECURRING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySubscriptionId" TEXT,
    "razorpaySignature" TEXT,
    "creditsGranted" INTEGER NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "rawWebhookPayload" JSONB,
    "errorCode" TEXT,
    "errorDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentTransaction_planPriceId_fkey" FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_razorpayPaymentId_key" ON "PaymentTransaction"("razorpayPaymentId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_razorpayOrderId_idx" ON "PaymentTransaction"("razorpayOrderId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_razorpaySubscriptionId_idx" ON "PaymentTransaction"("razorpaySubscriptionId");

-- 10. Create PaymentWebhookEvent & Failure Tables
CREATE TABLE IF NOT EXISTS "PaymentWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentWebhookEvent_eventId_key" ON "PaymentWebhookEvent"("eventId");

CREATE TABLE IF NOT EXISTS "PaymentWebhookFailure" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "event" TEXT,
    "payload" JSONB NOT NULL,
    "error" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookFailure_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PaymentWebhookFailure_resolvedAt_idx" ON "PaymentWebhookFailure"("resolvedAt");

-- 11. Create AdminAuditLog Table
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdminAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "ClientUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminAuditLog_requestKey_key" ON "AdminAuditLog"("requestKey");

-- 12. Create AiRequestLog Table
CREATE TABLE IF NOT EXISTS "AiRequestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "clientMessageId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cacheCreationTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10, 6) NOT NULL,
    "creditsDeducted" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AiRequestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ClientUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AiRequestLog_clientMessageId_key" ON "AiRequestLog"("clientMessageId");
CREATE INDEX IF NOT EXISTS "AiRequestLog_userId_createdAt_idx" ON "AiRequestLog"("userId", "createdAt");

-- 13. RAW SQL INVARIANT GUARDS (Page 7 of Implementation Plan)
DO $$ BEGIN
    ALTER TABLE "ClientUser" ADD CONSTRAINT credits_non_negative CHECK ("creditsBalance" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CreditLedger" ADD CONSTRAINT ledger_balance_non_negative CHECK ("balanceAfter" >= 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "CreditReservation" ADD CONSTRAINT reservation_cost_positive CHECK (cost > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- At most one live subscription per user; double-click on Start With PRO cannot create two (Race R10 & R11)
CREATE UNIQUE INDEX IF NOT EXISTS one_live_subscription_per_user
ON "UserSubscription" ("userId")
WHERE status IN ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'PAUSED');

