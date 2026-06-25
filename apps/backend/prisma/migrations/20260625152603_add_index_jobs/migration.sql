-- AlterTable
ALTER TABLE "evaluation_cases" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "evaluation_runs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "index_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_base_documents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "knowledge_bases" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "qa_traces" ALTER COLUMN "id" DROP DEFAULT;
