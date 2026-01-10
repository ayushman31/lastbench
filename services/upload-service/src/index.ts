import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload';
import { UploadSessionDB } from './database';

const app = express();
const PORT = process.env.UPLOAD_SERVICE_PORT || 4001;

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);

app.get('/health', ( _,res: Response) => {
  res.json({ status: 'ok', service: 'upload-service' });
});

app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
);

// cleanup expired sessions periodically
setInterval(
  async () => {
    try {
      const deleted = await UploadSessionDB.cleanupExpired();
      if (deleted > 0) {
        console.log(`Cleaned up ${deleted} expired upload sessions`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },
  60 * 60 * 1000
); 

app.listen(PORT, () => {
  console.log(`Upload service running on port ${PORT}`);
});
