-- CreateEnum
CREATE TYPE "ProKind" AS ENUM ('BUSINESS', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('TESDA', 'PRC', 'DTI', 'PERMIT', 'OTHER');

-- CreateTable
CREATE TABLE "Pro" (
    "id" TEXT NOT NULL,
    "kind" "ProKind" NOT NULL,
    "businessName" TEXT,
    "ownerName" TEXT NOT NULL,
    "teamSize" INTEGER,
    "trade" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "area" TEXT NOT NULL,
    "about" TEXT,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "email" TEXT,
    "messenger" TEXT,
    "address" TEXT,
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProDay" (
    "id" TEXT NOT NULL,
    "proId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "open" BOOLEAN NOT NULL,
    "fromTime" TEXT NOT NULL,
    "toTime" TEXT NOT NULL,

    CONSTRAINT "ProDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "proId" TEXT NOT NULL,
    "type" "LicenseType" NOT NULL,
    "title" TEXT NOT NULL,
    "number" TEXT,
    "expiry" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pro_trade_idx" ON "Pro"("trade");

-- CreateIndex
CREATE INDEX "Pro_area_idx" ON "Pro"("area");

-- CreateIndex
CREATE UNIQUE INDEX "ProDay_proId_dayOfWeek_key" ON "ProDay"("proId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "License_proId_idx" ON "License"("proId");

-- AddForeignKey
ALTER TABLE "ProDay" ADD CONSTRAINT "ProDay_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_proId_fkey" FOREIGN KEY ("proId") REFERENCES "Pro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
