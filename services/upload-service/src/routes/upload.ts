import { Router, Request, Response } from 'express';
import multer from 'multer';
import { UploadSessionDB } from '../database';
import { UploadStorage } from '../storage';
import type {
  InitUploadRequest,
  UploadChunkRequest,
  CompleteUploadRequest,
} from '../types';
import { Readable } from 'stream';

const router : Router = Router();

// configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per chunk
  },
});

// initialize upload session
router.post('/init', async (req: Request, res: Response) => {
  try {
    const {
      userId,
      recordingId,
      filename,
      mimeType,
      totalSize,
      chunkSize = 5 * 1024 * 1024, // Default 5MB chunks
    } = req.body as InitUploadRequest;

    if (!userId || !recordingId || !filename || !mimeType || !totalSize) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const totalChunks = Math.ceil(totalSize / chunkSize);

    const storageKey = UploadStorage.generateStorageKey(
      userId,
      recordingId,
      filename
    );

    // initialize s3 multipart upload if supported
    let uploadId: string | undefined;
    const useMultipart = UploadStorage.supportsMultipart() && totalSize > 100 * 1024 * 1024; // > 100MB 

    if (useMultipart) {
      uploadId = await UploadStorage.initMultipartUpload(storageKey, mimeType);
    }

    const session = await UploadSessionDB.create({
      userId,
      recordingId,
      filename,
      mimeType,
      totalSize,
      chunkSize,
      totalChunks,
      uploadedChunks: [],
      storageKey,
      uploadId,
      status: 'initializing',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await UploadSessionDB.update(session.id, { status: 'uploading' });

    res.json({
      sessionId: session.id,
      uploadUrl: `/api/upload/chunk`,
      chunkSize,
      totalChunks,
      useMultipart,
    });
  } catch (error) {
    console.error('Init upload error:', error);
    res.status(500).json({
      error: 'Failed to initialize upload',
      message: (error as Error).message,
    });
  }
});

// upload a single chunk
router.post(
  '/chunk',
  upload.single('chunk'),
  async (req: Request, res: Response) => {
    try {
      const { sessionId, chunkIndex, totalChunks } = req.body;
      const chunk = req.file;

      if (!sessionId || chunkIndex === undefined || !chunk) {
        return res.status(400).json({
          error: 'Missing required fields',
        });
      }

      const index = parseInt(chunkIndex);
      if (index < 0 || index >= totalChunks) {
        return res.status(400).json({ error: 'Invalid chunk index' });
      }
  

      const session = await UploadSessionDB.getById(sessionId);
      if (!session) {
        return res.status(404).json({
          error: 'Upload session not found',
        });
      }

      if (session.status !== 'uploading') {
        return res.status(400).json({
          error: 'Upload session not active',
        });
      }

      const alreadyUploaded = await UploadSessionDB.isChunkUploaded(
        sessionId,
        index
      );

      if (!alreadyUploaded) {

        const stream = Readable.from(chunk.buffer);

        if (session.uploadId) {
          // use s3 multipart
          const etag = await UploadStorage.uploadMultipartChunk(
            session.storageKey,
            session.uploadId,
            index + 1, // s3 part numbers start at 1
            stream,
            chunk.size
          );

          // Store ETag for completion (we will need to add this to database)
          // await UploadSessionDB.storePartETag(sessionId, index + 1, etag);
        } else {
        await UploadStorage.uploadChunkStream(
          session.storageKey,
          index,
          stream,
          session.mimeType
        );
      }

        await UploadSessionDB.markChunkUploaded(sessionId, index);
      }

      const updatedSession = await UploadSessionDB.getById(sessionId);
      const progress = (updatedSession!.uploadedChunks.length / updatedSession!.totalChunks) *100;

      res.json({
        chunkIndex: index,
        uploaded: true,
        progress: Math.round(progress),
      });
    } catch (error) {
      console.error('Upload chunk error:', error);
      res.status(500).json({
        error: 'Failed to upload chunk',
        message: (error as Error).message,
      });
    }
  }
);

// check if chunk is already uploaded
router.get('/chunk/:sessionId/:chunkIndex', async (req: Request, res: Response) => {
  try {
    const { sessionId, chunkIndex } = req.params as { sessionId: string; chunkIndex: string };

    const uploaded = await UploadSessionDB.isChunkUploaded(
      sessionId,
      parseInt(chunkIndex)
    );

    res.json({ uploaded });
  } catch (error) {
    console.error('Check chunk error:', error);
    res.status(500).json({
      error: 'Failed to check chunk',
      message: (error as Error).message,
    });
  }
});

// complete upload and merge chunks
router.post('/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body as CompleteUploadRequest;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
      });
    }

    const session = await UploadSessionDB.getById(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Upload session not found',
      });
    }

    if (session.uploadedChunks.length !== session.totalChunks) {
      return res.status(400).json({
        error: 'Not all chunks uploaded',
        uploaded: session.uploadedChunks.length,
        total: session.totalChunks,
      });
    }

    let result;

    await UploadSessionDB.update(sessionId, { status: 'merging' });

    if (session.uploadId) {
      // complete s3 multipart upload
      // we will need to retrieve stored ETags from database
      const parts = session.uploadedChunks.map((index) => ({
        PartNumber: index + 1,
        ETag: 'stored-etag', // retrieve from DB
      }));

      result = await UploadStorage.completeMultipartUpload(
        session.storageKey,
        session.uploadId,
        parts
      );
    } else {
      // merge chunks using streaming
      result = await UploadStorage.mergeChunksStreaming(
        session.storageKey,
        session.totalChunks,
        session.mimeType
      );
    }

    await UploadSessionDB.update(sessionId, { status: 'completed' });

    res.json({
      url: result.url,
      storageKey: session.storageKey,
    });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({
      error: 'Failed to complete upload',
      message: (error as Error).message,
    });
  }
});

// cancel upload and cleanup
router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params as { sessionId: string };

    const session = await UploadSessionDB.getById(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Upload session not found',
      });
    }

    // cleanup chunks from storage
    await UploadStorage.abortUpload(session.storageKey, session.totalChunks);

    await UploadSessionDB.update(sessionId, { status: 'cancelled' });

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel upload error:', error);
    res.status(500).json({
      error: 'Failed to cancel upload',
      message: (error as Error).message,
    });
  }
});

// get upload session status
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params as { sessionId: string };

    const session = await UploadSessionDB.getById(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Upload session not found',
      });
    }

    const progress = (session.uploadedChunks.length / session.totalChunks) * 100;

    res.json({
      sessionId: session.id,
      status: session.status,
      progress: Math.round(progress),
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: 'Failed to get session',
      message: (error as Error).message,
    });
  }
});

export default router;
