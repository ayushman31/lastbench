import { Router, Request, Response } from 'express';
import { SessionService } from '../SessionService.js';

const router: Router = Router();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { hostId, hostName, title, description, maxGuests, expiresInHours } = req.body;

    if (!hostId) {
      return res.status(400).json({ error: 'Host ID required' });
    }

    const result = await SessionService.createSession({
      hostId,
      hostName,
      title,
      description,
      maxGuests,
      expiresInHours,
    });

    res.json({
      session: result.session,
      inviteLink: result.inviteLink,
      inviteToken: result.inviteToken,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// get session info by invite token (for guest preview)
router.get('/invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const session = await SessionService.getSessionByToken(token);

    res.json({
      id: session.id,
      hostName: session.hostName,
      title: session.title,
      description: session.description,
      maxGuests: session.maxGuests,
      currentGuests: session.guests.filter(g => g.status === 'joined').length,
      expiresAt: session.expiresAt,
      status: session.status,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(404).json({ error: (error as Error).message });
  }
});

// get session details (authenticated)
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await SessionService.getSessionById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update session status
router.patch('/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;

    const session = await SessionService.updateSessionStatus(sessionId, status);

    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.post('/:sessionId/kick/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;

    await SessionService.kickGuest(guestId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error kicking guest:', error);
    res.status(500).json({ error: 'Failed to kick guest' });
  }
});

export default router;
