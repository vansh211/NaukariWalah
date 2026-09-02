import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, Application, Notification } from '../services/store';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { computeJobMatch } from '../services/matchEngine';

const router = Router();

// POST /api/applications (Candidate applies to job)
router.post('/', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.body;
    const userId = req.user!.id;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required.' });
    }

    const job = db.jobs.find((j) => j.id === jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    const resume = db.resumes.find((r) => r.userId === userId);
    if (!resume) {
      return res.status(400).json({
        error: 'Please upload or build your resume in the Resume section before applying to jobs.',
      });
    }

    // Check if already applied
    const existing = db.applications.find((a) => a.jobId === jobId && a.candidateId === userId);
    if (existing) {
      return res.status(400).json({
        error: 'You have already submitted an application for this role.',
        application: existing,
      });
    }

    const user = db.users.find((u) => u.id === userId);
    const match = computeJobMatch(job, resume);

    const newApplication: Application = {
      id: 'app_' + uuidv4().substring(0, 8),
      jobId,
      candidateId: userId,
      candidateName: resume.fullName || user?.name || 'Candidate',
      candidateEmail: user?.email || resume.email,
      candidatePhone: resume.phone || user?.phone,
      resumeId: resume.id,
      resumeData: {
        id: resume.id,
        fullName: resume.fullName,
        title: resume.title,
        skills: resume.skills,
        experienceYears: resume.experienceYears,
        summary: resume.summary,
        fileUrl: resume.fileUrl,
        fileName: resume.fileName,
        experience: resume.experience,
        education: resume.education,
      },
      matchScore: match.score,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      matchVerdict: match.verdict,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    };

    db.applications.unshift(newApplication);

    // Create notification for Recruiter
    const notif: Notification = {
      id: 'notif_' + uuidv4().substring(0, 8),
      userId: job.recruiterId,
      title: 'New Candidate Applied 📬',
      message: `${newApplication.candidateName} applied for "${job.title}" with a ${match.score}% AI Match Score.`,
      type: 'application',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: `/recruiter?jobId=${job.id}`,
    };
    db.notifications.unshift(notif);

    db.save();

    return res.status(201).json({
      message: 'Application submitted successfully!',
      application: newApplication,
      match,
    });
  } catch (err) {
    console.error('Application error:', err);
    return res.status(500).json({ error: 'Failed to submit application.' });
  }
});

// GET /api/applications/me (Candidate view their applications)
router.get('/me', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const myApps = db.applications
    .filter((a) => a.candidateId === userId)
    .map((app) => {
      const job = db.jobs.find((j) => j.id === app.jobId);
      return {
        ...app,
        job: job || {
          id: app.jobId,
          title: 'Position Closed / Archived',
          company: 'Unknown',
          location: 'N/A',
          salaryRange: 'N/A',
          type: 'Full-time',
        },
      };
    });

  myApps.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  return res.json({ applications: myApps });
});

// GET /api/applications/job/:jobId (Recruiter view all applicants for a job)
router.get('/job/:jobId', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const job = db.jobs.find((j) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const apps = db.applications
    .filter((a) => a.jobId === jobId)
    .map((app) => {
      const candidateUser = db.users.find((u) => u.id === app.candidateId);
      const fullResume = db.resumes.find((r) => r.userId === app.candidateId);
      return {
        ...app,
        candidateLocation: candidateUser?.location || fullResume?.location || 'Remote',
        fullResume: fullResume || app.resumeData,
      };
    });

  // Rank by matchScore descending by default
  apps.sort((a, b) => b.matchScore - a.matchScore);

  return res.json({
    job,
    totalApplicants: apps.length,
    applications: apps,
  });
});

// PATCH /api/applications/:id/status (Recruiter updates candidate application status)
router.patch('/:id/status', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, recruiterNotes } = req.body;

    const allowedStatuses = ['applied', 'shortlisted', 'interview', 'hired', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${allowedStatuses.join(', ')}.` });
    }

    const application = db.applications.find((a) => a.id === id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const job = db.jobs.find((j) => j.id === application.jobId);
    if (!job || job.recruiterId !== req.user!.id) {
      return res.status(403).json({ error: 'You can only manage applications for your own postings.' });
    }

    application.status = status;
    if (recruiterNotes !== undefined) {
      application.recruiterNotes = recruiterNotes;
    }

    // Send notification to candidate
    const statusLabels: Record<string, string> = {
      shortlisted: 'Shortlisted for Next Round ⭐',
      interview: 'Interview Scheduled 📞',
      hired: 'Offer Extended / Hired! 🥳',
      rejected: 'Application Update 📩',
      applied: 'Application Received 📋',
    };

    const notif: Notification = {
      id: 'notif_' + uuidv4().substring(0, 8),
      userId: application.candidateId,
      title: statusLabels[status] || 'Application Status Changed',
      message: `Your application for "${job.title}" at ${job.company} was updated to: ${status.toUpperCase()}.`,
      type: 'status_change',
      isRead: false,
      createdAt: new Date().toISOString(),
      link: '/candidate/applications',
    };
    db.notifications.unshift(notif);

    db.save();

    return res.json({
      message: `Status updated to ${status}. Candidate has been notified.`,
      application,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
});

export default router;
