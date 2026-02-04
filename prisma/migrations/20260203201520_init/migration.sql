-- CreateTable
CREATE TABLE "saga_executions" (
    "id" TEXT NOT NULL,
    "sagaId" TEXT NOT NULL,
    "sagaType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input_data" JSONB NOT NULL,
    "output_data" JSONB,
    "completed_steps" JSONB NOT NULL DEFAULT '[]',
    "compensated_steps" JSONB NOT NULL DEFAULT '[]',
    "current_step" TEXT,
    "error_message" TEXT,
    "error_code" TEXT,
    "error_stack" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3),
    "user_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "saga_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saga_step_metadata" (
    "id" TEXT NOT NULL,
    "saga_id" TEXT NOT NULL,
    "step_name" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "service_name" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "snapshot_id" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,

    CONSTRAINT "saga_step_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saga_executions_sagaId_key" ON "saga_executions"("sagaId");

-- CreateIndex
CREATE INDEX "saga_executions_status_last_updated_at_idx" ON "saga_executions"("status", "last_updated_at");

-- CreateIndex
CREATE INDEX "saga_executions_sagaType_status_idx" ON "saga_executions"("sagaType", "status");

-- CreateIndex
CREATE INDEX "saga_executions_user_id_idx" ON "saga_executions"("user_id");

-- CreateIndex
CREATE INDEX "saga_executions_started_at_idx" ON "saga_executions"("started_at");

-- CreateIndex
CREATE INDEX "saga_executions_next_retry_at_idx" ON "saga_executions"("next_retry_at");

-- CreateIndex
CREATE INDEX "saga_step_metadata_saga_id_step_order_idx" ON "saga_step_metadata"("saga_id", "step_order");

-- CreateIndex
CREATE INDEX "saga_step_metadata_resource_type_resource_id_idx" ON "saga_step_metadata"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "saga_step_metadata_status_idx" ON "saga_step_metadata"("status");

-- AddForeignKey
ALTER TABLE "saga_step_metadata" ADD CONSTRAINT "saga_step_metadata_saga_id_fkey" FOREIGN KEY ("saga_id") REFERENCES "saga_executions"("sagaId") ON DELETE CASCADE ON UPDATE CASCADE;
