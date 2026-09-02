import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, SavedJob } from '../services/store';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/extras/saved-jobs
router.get('/saved-jobs', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const saved = db.savedJobs.filter((s) => s.userId === userId);
  const jobs = saved
    .map((s) => {
      const job = db.jobs.find((j) => j.id === s.jobId);
      return job ? { ...job, savedAt: s.savedAt } : null;
    })
    .filter(Boolean);

  return res.json({ savedJobs: jobs });
});

// POST /api/extras/saved-jobs/:jobId (Toggle save)
router.post('/saved-jobs/:jobId', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const existingIdx = db.savedJobs.findIndex((s) => s.userId === userId && s.jobId === jobId);

  if (existingIdx >= 0) {
    db.savedJobs.splice(existingIdx, 1);
    db.save();
    return res.json({ isSaved: false, message: 'Job removed from saved.' });
  } else {
    const newSave: SavedJob = {
      id: 'save_' + uuidv4().substring(0, 8),
      userId,
      jobId,
      savedAt: new Date().toISOString(),
    };
    db.savedJobs.push(newSave);
    db.save();
    return res.json({ isSaved: true, message: 'Job saved to your bookmarks!' });
  }
});

// GET /api/extras/notifications
router.get('/notifications', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const notifs = db.notifications.filter((n) => n.userId === userId);
  return res.json({
    notifications: notifs,
    unreadCount: notifs.filter((n) => !n.isRead).length,
  });
});

// PATCH /api/extras/notifications/mark-read
router.patch('/notifications/mark-read', authenticate, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  db.notifications.forEach((n) => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  db.save();
  return res.json({ message: 'All notifications marked as read.' });
});

// GET /api/extras/stats (Platform stats)
router.get('/stats', (req, res: Response) => {
  return res.json({
    totalJobs: db.jobs.length,
    totalCandidates: db.resumes.length,
    totalApplications: db.applications.length,
    hiredCount: db.applications.filter((a) => a.status === 'hired').length,
  });
});

export default router;
