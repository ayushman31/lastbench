-- CreateTable
CREATE TABLE "RecordingSession" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT,
    "title" TEXT,
    "description" TEXT,
    "inviteToken" TEXT NOT NULL,
    "maxGuests" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingGuest" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecordingSession_inviteToken_key" ON "RecordingSession"("inviteToken");

-- CreateIndex
CREATE INDEX "RecordingSession_hostId_idx" ON "RecordingSession"("hostId");

-- CreateIndex
CREATE INDEX "RecordingSession_inviteToken_idx" ON "RecordingSession"("inviteToken");

-- CreateIndex
CREATE INDEX "RecordingSession_status_idx" ON "RecordingSession"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingGuest_clientId_key" ON "RecordingGuest"("clientId");

-- CreateIndex
CREATE INDEX "RecordingGuest_sessionId_idx" ON "RecordingGuest"("sessionId");

-- CreateIndex
CREATE INDEX "RecordingGuest_clientId_idx" ON "RecordingGuest"("clientId");

-- AddForeignKey
ALTER TABLE "RecordingGuest" ADD CONSTRAINT "RecordingGuest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RecordingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
