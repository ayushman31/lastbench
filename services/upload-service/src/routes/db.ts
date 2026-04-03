import { Router, Request, Response } from 'express';
import { UploadTrackRequest, UploadTrackRecordingRequest } from '../types';
import { TrackDB } from '../trackDb';
import { RecordingDB } from '../recordingDb';

const router : Router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            projectId,
            title,
            duration,
            status,
            storageUrl,
            trackUrl,
            trackType,
            userId,
        } = req.body as UploadTrackRecordingRequest;

        if (!trackUrl || !trackType || !userId || !duration || !storageUrl) {
            return res.status(400).json({
                error: 'Missing required fields',
            });
        }

        const recording = await RecordingDB.create({
            projectId: null,
            title : title || 'Untitled Recording',
            duration,
            status: 'uploaded',
            storageUrl,
        });

        const track = await TrackDB.create({
            recordingId: recording.id,
            trackUrl,
            trackType,
            userId,
        })

        res.json({
            recordingId: recording.id,
            title: recording.title,
            duration: recording.duration,
            status: recording.status,
            storageUrl: recording.storageUrl,
            trackId: track.id,
            trackUrl: track.trackUrl,
            trackType: track.trackType,
            userId: track.userId,
            createdAt: track.createdAt,
        });
        
    } catch (error) {
        console.error('Error creating track:', error);
        res.status(500).json({
            error: 'Failed to create track',
            message: (error as Error).message,
        });
    }
} )

router.get('/track/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const track = await TrackDB.getById(id);

        if (!track) {
            return res.status(404).json({
                error: 'Track not found',
            });
        }

        res.json({
            trackId: track.id,
            trackUrl: track.trackUrl,
            trackType: track.trackType,
            userId: track.userId,
            createdAt: track.createdAt,
        });
    } catch (error) {
        console.error('Error getting track:', error);
        res.status(500).json({
            error: 'Failed to get track',
            message: (error as Error).message,
        });
    }
})

router.get('/recording/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const recording = await RecordingDB.getById(id);

        if (!recording) {
            return res.status(404).json({
                error: 'Recording not found',
            });
        }

        res.json({
            recordingId: recording.id,
            title: recording.title,
            duration: recording.duration,
            status: recording.status,
            storageUrl: recording.storageUrl,
            createdAt: recording.createdAt,
            updatedAt: recording.updatedAt,
            tracks: recording.tracks,
        });
    } catch (error) {
        console.error('Error getting recording:', error);
        res.status(500).json({
            error: 'Failed to get recording',
            message: (error as Error).message,
        });
    }
})

router.get('/track/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params as { userId: string };

        const tracks = await TrackDB.getByUserId(userId);

        if (!tracks) {
            return res.status(404).json({
                error: 'No tracks found',
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('Error getting tracks:', error);
        res.status(500).json({
            error: 'Failed to get tracks',
            message: (error as Error).message,
        });
    }
})

router.get('/recording/user/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params as { userId: string };

        const recordings = await RecordingDB.getByUserId(userId);

        if (!recordings) {
            return res.status(404).json({
                error: 'No recordings found',
            });
        }

        res.json(recordings);
    } catch (error) {
        console.error('Error getting recordings:', error);
        res.status(500).json({
            error: 'Failed to get recordings',
            message: (error as Error).message,
        });
    }
})

router.get('/track/recording/:recordingId', async (req: Request, res: Response) => {
    try {
        const { recordingId } = req.params as { recordingId: string };

        const tracks = await TrackDB.getByRecordingId(recordingId);

        if (!tracks) {
            return res.status(404).json({
                error: 'No tracks found',
            });
        }

        res.json(tracks);
    } catch (error) {
        console.error('Error getting tracks:', error);
        res.status(500).json({
            error: 'Failed to get tracks',
            message: (error as Error).message,
        });
    }
})

router.delete('/track/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const track = await TrackDB.getById(id);

        if (!track) {
            return res.status(404).json({
                error: 'Track not found',
            });
        }

        await TrackDB.delete(id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting track:', error);
        res.status(500).json({
            error: 'Failed to delete track',
            message: (error as Error).message,
        });
    }
})

    router.delete('/recording/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };

        const recording = await RecordingDB.getById(id);

        if (!recording) {
            return res.status(404).json({
                error: 'Recording not found',
            });
        }

        await RecordingDB.delete(id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting recording:', error);
        res.status(500).json({
            error: 'Failed to delete recording',
            message: (error as Error).message,
        });
    }
})

router.patch('/track/:id', async (req: Request, res: Response) => {
    try {
      const updatedTrack = await TrackDB.update(req.params.id as string, req.body);
      res.json(updatedTrack);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update track', message: (err as Error).message });
    }
  });

  router.patch('/recording/:id', async (req: Request, res: Response) => {
    try {
      const updatedRecording = await RecordingDB.update(req.params.id as string, req.body);
      res.json(updatedRecording);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update recording', message: (err as Error).message });
    }
  });

export default router;