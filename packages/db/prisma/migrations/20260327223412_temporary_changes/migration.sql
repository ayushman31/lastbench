-- AlterTable
ALTER TABLE "Recording" ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Track" ALTER COLUMN "recordingId" DROP NOT NULL;
