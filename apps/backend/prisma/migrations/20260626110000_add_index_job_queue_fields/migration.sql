ALTER TABLE "index_jobs"
  ADD COLUMN "parent_job_id" UUID,
  ADD COLUMN "attempt_of_job_id" UUID,
  ADD COLUMN "queue_job_id" TEXT,
  ADD COLUMN "cancel_requested_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "index_jobs_queue_job_id_key"
  ON "index_jobs"("queue_job_id");

CREATE INDEX "index_jobs_parent_job_id_idx"
  ON "index_jobs"("parent_job_id");

CREATE INDEX "index_jobs_attempt_of_job_id_idx"
  ON "index_jobs"("attempt_of_job_id");

CREATE UNIQUE INDEX "index_jobs_active_document_operation_key"
  ON "index_jobs"("document_id", "type")
  WHERE "document_id" IS NOT NULL
    AND "status" IN ('pending', 'running');

ALTER TABLE "index_jobs"
  ADD CONSTRAINT "index_jobs_parent_job_id_fkey"
  FOREIGN KEY ("parent_job_id") REFERENCES "index_jobs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "index_jobs"
  ADD CONSTRAINT "index_jobs_attempt_of_job_id_fkey"
  FOREIGN KEY ("attempt_of_job_id") REFERENCES "index_jobs"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
