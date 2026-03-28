import { Router, Request, Response } from 'express';
import { UploadTrackRequest } from '../types';
import { TrackDB } from '../trackDb';

const router : Router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const {
            recordingId,
            trackUrl,
            trackType,
            userId,
        } = req.body as UploadTrackRequest;

        // TODO : we have removed !recordingId because we are not going to have a recordingId for the track. but later we will need it.( we are just doing this to make this work for now)
        if (!trackUrl || !trackType || !userId) {
            return res.status(400).json({
                error: 'Missing required fields',
            });
        }

        const track = await TrackDB.create({
            recordingId,
            trackUrl,
            trackType,
            userId,
        })

        res.json({
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

router.get('./:id', async (req: Request, res: Response) => {
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

router.get('./:userId', async (req: Request, res: Response) => {
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

router.get('./:recordingId', async (req: Request, res: Response) => {
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

router.delete('./:id', async (req: Request, res: Response) => {
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


// TODO : there is not much to update right now. but later we will let the user name the tracks and this is where we will need the following route
router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const updatedTrack = await TrackDB.update(req.params.id as string, req.body);
      res.json(updatedTrack);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update track', message: (err as Error).message });
    }
  });

export default router;