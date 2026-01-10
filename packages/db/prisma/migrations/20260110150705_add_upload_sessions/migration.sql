-- CreateTable
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "totalSize" INTEGER NOT NULL,
    "chunkSize" INTEGER NOT NULL,
    "totalChunks" INTEGER NOT NULL,
    "uploadedChunks" INTEGER[],
    "storageKey" TEXT NOT NULL,
    "uploadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initializing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_userId_idx" ON "UploadSession"("userId");

-- CreateIndex
CREATE INDEX "UploadSession_recordingId_idx" ON "UploadSession"("recordingId");

-- CreateIndex
CREATE INDEX "UploadSession_status_idx" ON "UploadSession"("status");

-- CreateIndex
CREATE INDEX "UploadSession_expiresAt_idx" ON "UploadSession"("expiresAt");
