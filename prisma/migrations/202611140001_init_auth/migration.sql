-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(60),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "key" VARCHAR(64) NOT NULL,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "request_limits" (
    "key" VARCHAR(64) NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "request_limits_expires_at_idx" ON "request_limits"("expires_at");

-- Defensa adicional de integridad, además de las validaciones de la aplicación.
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized" CHECK (email = lower(btrim(email)));
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_nonnegative" CHECK (failed_attempts >= 0);
ALTER TABLE "request_limits" ADD CONSTRAINT "request_limits_positive" CHECK (hits >= 1);
