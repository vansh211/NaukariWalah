import { Router, Response } from 'express';
import { db } from '../services/store';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/candidates/search (Recruiter talent search by skills, experience, query)
router.get('/search', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  const { skill, title, minExp, location } = req.query;

  let results = db.resumes.map((resume) => {
    const user = db.users.find((u) => u.id === resume.userId);
    return {
      id: resume.id,
      userId: resume.userId,
      name: resume.fullName || user?.name || 'Candidate',
      email: user?.email || resume.email,
      phone: resume.phone,
      location: resume.location || user?.location || 'Remote',
      title: resume.title,
      summary: resume.summary,
      skills: resume.skills,
      experienceYears: resume.experienceYears,
      fileUrl: resume.fileUrl,
      fileName: resume.fileName,
      experience: resume.experience,
      education: resume.education,
      uploadedAt: resume.uploadedAt,
    };
  });

  if (skill) {
    const sQuery = (skill as string).toLowerCase();
    results = results.filter((c) => c.skills.some((s) => s.toLowerCase().includes(sQuery)));
  }

  if (title) {
    const tQuery = (title as string).toLowerCase();
    results = results.filter((c) => c.title.toLowerCase().includes(tQuery) || c.name.toLowerCase().includes(tQuery));
  }

  if (location) {
    const lQuery = (location as string).toLowerCase();
    results = results.filter((c) => c.location.toLowerCase().includes(lQuery));
  }

  if (minExp) {
    const min = parseInt(minExp as string, 10);
    if (!isNaN(min)) {
      results = results.filter((c) => c.experienceYears >= min);
    }
  }

  return res.json({
    total: results.length,
    candidates: results,
  });
});

export default router;
