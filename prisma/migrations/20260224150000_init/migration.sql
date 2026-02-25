-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('RECEIVED', 'LLM_EXTRACTED', 'VALIDATED', 'STORED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CONSUMO_SPIKE', 'GASTO_FORA_PADRAO');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "numeroCliente" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "mesReferenciaDate" TIMESTAMP(3) NOT NULL,
    "energiaEletricaKwh" DOUBLE PRECISION NOT NULL,
    "energiaEletricaRs" DOUBLE PRECISION NOT NULL,
    "energiaSceeeKwh" DOUBLE PRECISION NOT NULL,
    "energiaSceeeRs" DOUBLE PRECISION NOT NULL,
    "energiaCompensadaGdiKwh" DOUBLE PRECISION NOT NULL,
    "energiaCompensadaGdiRs" DOUBLE PRECISION NOT NULL,
    "contribIlumRs" DOUBLE PRECISION NOT NULL,
    "consumoKwh" DOUBLE PRECISION NOT NULL,
    "energiaCompensadaKwh" DOUBLE PRECISION NOT NULL,
    "valorTotalSemGd" DOUBLE PRECISION NOT NULL,
    "economiaGdRs" DOUBLE PRECISION NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "dedupCompositeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceProcessing" (
    "id" TEXT NOT NULL,
    "hashSha256" TEXT NOT NULL,
    "sourceFilename" TEXT NOT NULL,
    "dedupCompositeKey" TEXT,
    "numeroCliente" TEXT,
    "mesReferencia" TEXT,
    "status" "ProcessingStatus" NOT NULL,
    "rawLlmJson" JSONB,
    "redactedLlmJson" JSONB,
    "errorReason" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "numeroCliente" TEXT NOT NULL,
    "mesReferencia" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION,
    "baselineValue" DOUBLE PRECISION,
    "deltaPercent" DOUBLE PRECISION,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TariffPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TariffSimulation" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tariffPlanId" TEXT NOT NULL,
    "baselineCostRs" DOUBLE PRECISION NOT NULL,
    "estimatedCostRs" DOUBLE PRECISION NOT NULL,
    "savingsRs" DOUBLE PRECISION NOT NULL,
    "savingsPercent" DOUBLE PRECISION NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TariffSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_hashSha256_key" ON "Invoice"("hashSha256");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dedupCompositeKey_key" ON "Invoice"("dedupCompositeKey");

-- CreateIndex
CREATE INDEX "Invoice_numeroCliente_mesReferencia_idx" ON "Invoice"("numeroCliente", "mesReferencia");

-- CreateIndex
CREATE INDEX "Invoice_mesReferenciaDate_idx" ON "Invoice"("mesReferenciaDate");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceProcessing_hashSha256_key" ON "InvoiceProcessing"("hashSha256");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceProcessing_dedupCompositeKey_key" ON "InvoiceProcessing"("dedupCompositeKey");

-- CreateIndex
CREATE INDEX "InvoiceProcessing_numeroCliente_mesReferencia_idx" ON "InvoiceProcessing"("numeroCliente", "mesReferencia");

-- CreateIndex
CREATE INDEX "Alert_numeroCliente_mesReferencia_idx" ON "Alert"("numeroCliente", "mesReferencia");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_numeroCliente_mesReferencia_alertType_key" ON "Alert"("numeroCliente", "mesReferencia", "alertType");

-- CreateIndex
CREATE UNIQUE INDEX "TariffPlan_name_key" ON "TariffPlan"("name");

-- CreateIndex
CREATE INDEX "TariffSimulation_invoiceId_idx" ON "TariffSimulation"("invoiceId");

-- CreateIndex
CREATE INDEX "TariffSimulation_tariffPlanId_idx" ON "TariffSimulation"("tariffPlanId");

-- AddForeignKey
ALTER TABLE "InvoiceProcessing" ADD CONSTRAINT "InvoiceProcessing_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffSimulation" ADD CONSTRAINT "TariffSimulation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TariffSimulation" ADD CONSTRAINT "TariffSimulation_tariffPlanId_fkey" FOREIGN KEY ("tariffPlanId") REFERENCES "TariffPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
