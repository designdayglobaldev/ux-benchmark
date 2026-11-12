-- CreateTable
CREATE TABLE "FlowDocument" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "embedding" vector(1024),
    "sourceHash" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlowDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FlowDocument_status_check" CHECK ("status" IN ('PENDING', 'READY', 'STALE', 'FAILED')),
    CONSTRAINT "FlowDocument_ready_needs_embedding" CHECK ("status" <> 'READY' OR "embedding" IS NOT NULL)
);

-- CreateTable
CREATE TABLE "ScreenFieldEmbedding" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "sourceText" TEXT,
    "promptVersion" TEXT,
    "textHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "embedding" vector(1024) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreenFieldEmbedding_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ScreenFieldEmbedding_field_check" CHECK ("field" IN ('METADATA', 'WHERE_TO_USE', 'WHERE_NOT_TO_USE', 'TONALITY', 'CONTEXT_NOTE'))
);

-- CreateIndex
CREATE UNIQUE INDEX "FlowDocument_flowId_promptVersion_key" ON "FlowDocument"("flowId", "promptVersion");

-- Partial Unique Index (Enforces strictly one active document per flow)
CREATE UNIQUE INDEX "FlowDocument_one_active" ON "FlowDocument"("flowId") WHERE "isActive";

-- CreateIndex
CREATE UNIQUE INDEX "ScreenFieldEmbedding_screenId_field_model_key" ON "ScreenFieldEmbedding"("screenId", "field", "model");

-- AddForeignKey
ALTER TABLE "FlowDocument" ADD CONSTRAINT "FlowDocument_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "Flow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreenFieldEmbedding" ADD CONSTRAINT "ScreenFieldEmbedding_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
