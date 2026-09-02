import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, Job } from '../services/store';
import { authenticate, AuthRequest, requireRole, JWT_SECRET } from '../middleware/auth';
import { computeJobMatch } from '../services/matchEngine';
import jwt from 'jsonwebtoken';

const router = Router();

// Helper to optionally extract candidate from token without failing if public
function getOptionalCandidateResume(req: AuthRequest) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.role === 'candidate') {
        return db.resumes.find((r) => r.userId === decoded.id) || null;
      }
    } catch {
      // ignore invalid optional token
    }
  }
  return null;
}

// GET /api/jobs (Browse jobs with filters & match score)
router.get('/', (req: AuthRequest, res: Response) => {
  const { search, location, skill, type, minExp } = req.query;
  const candidateResume = getOptionalCandidateResume(req);

  let filtered = [...db.jobs];

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (location && location !== 'all') {
    const loc = (location as string).toLowerCase();
    filtered = filtered.filter((j) => j.location.toLowerCase().includes(loc));
  }

  if (skill && skill !== 'all') {
    const sQuery = (skill as string).toLowerCase();
    filtered = filtered.filter((j) => j.skills.some((s) => s.toLowerCase().includes(sQuery)));
  }

  if (type && type !== 'all') {
    filtered = filtered.filter((j) => j.type.toLowerCase() === (type as string).toLowerCase());
  }

  if (minExp) {
    const expNum = parseInt(minExp as string, 10);
    if (!isNaN(expNum)) {
      filtered = filtered.filter((j) => j.minExperience <= expNum);
    }
  }

  // Calculate dynamic applicant count and match score
  const resultJobs = filtered.map((job) => {
    const apps = db.applications.filter((a) => a.jobId === job.id);
    let matchData = null;

    if (candidateResume) {
      matchData = computeJobMatch(job, candidateResume);
    }

    return {
      ...job,
      applicantsCount: apps.length,
      match: matchData,
    };
  });

  // Sort by match score if candidate has resume, else by posted date
  if (candidateResume) {
    resultJobs.sort((a, b) => ((b.match?.score || 0) - (a.match?.score || 0)));
  } else {
    resultJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }

  return res.json({
    total: resultJobs.length,
    jobs: resultJobs,
  });
});

// GET /api/jobs/recommendations (AI Job Recommendations for candidate)
router.get('/recommendations', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const resume = db.resumes.find((r) => r.userId === userId);

  if (!resume || !resume.skills || resume.skills.length === 0) {
    return res.json({
      hasResume: false,
      message: 'Please upload or create a resume to get AI-powered job recommendations.',
      recommendedJobs: [],
    });
  }

  const jobsWithScores = db.jobs.map((job) => {
    const match = computeJobMatch(job, resume);
    const applicantsCount = db.applications.filter((a) => a.jobId === job.id).length;
    const isApplied = db.applications.some((a) => a.jobId === job.id && a.candidateId === userId);
    return {
      ...job,
      applicantsCount,
      isApplied,
      match,
    };
  });

  // Filter top matches (>= 40%) and sort descending
  const recommendedJobs = jobsWithScores
    .filter((j) => j.match.score >= 40)
    .sort((a, b) => b.match.score - a.match.score);

  return res.json({
    hasResume: true,
    candidateTitle: resume.title,
    candidateSkills: resume.skills,
    topMatchCount: recommendedJobs.filter((j) => j.match.score >= 75).length,
    recommendedJobs,
  });
});

// GET /api/jobs/my/posted (Recruiter view own posted jobs)
router.get('/my/posted', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  const recruiterId = req.user!.id;
  const myJobs = db.jobs
    .filter((j) => j.recruiterId === recruiterId)
    .map((job) => {
      const apps = db.applications.filter((a) => a.jobId === job.id);
      return {
        ...job,
        applicantsCount: apps.length,
        shortlistedCount: apps.filter((a) => a.status === 'shortlisted' || a.status === 'interview').length,
        hiredCount: apps.filter((a) => a.status === 'hired').length,
      };
    });

  myJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  return res.json({ jobs: myJobs });
});

// GET /api/jobs/:id (Get single job details)
router.get('/:id', (req: AuthRequest, res: Response) => {
  const job = db.jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const candidateResume = getOptionalCandidateResume(req);
  let matchData = null;
  if (candidateResume) {
    matchData = computeJobMatch(job, candidateResume);
  }

  const apps = db.applications.filter((a) => a.jobId === job.id);
  return res.json({
    job: {
      ...job,
      applicantsCount: apps.length,
      match: matchData,
    },
  });
});

// POST /api/jobs (Recruiter: create a new job posting)
router.post('/', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  try {
    const { title, company, description, location, type, experienceRequired, minExperience, salaryRange, skills, perks } =
      req.body;

    if (!title || !description || !location || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Title, description, location, and at least 1 skill are required.' });
    }

    const user = db.users.find((u) => u.id === req.user!.id);

    const newJob: Job = {
      id: 'job_' + uuidv4().substring(0, 8),
      recruiterId: req.user!.id,
      recruiterName: user?.name || 'Recruiter',
      company: company?.trim() || user?.company || 'Leading Enterprise',
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      type: type || 'Full-time',
      experienceRequired: experienceRequired || '2-5 years',
      minExperience: Number(minExperience) || 2,
      salaryRange: salaryRange || 'Best in Industry',
      skills: skills.map((s: string) => s.trim()).filter(Boolean),
      perks: Array.isArray(perks) ? perks.map((p: string) => p.trim()).filter(Boolean) : ['Health Insurance', 'Flexible Hours'],
      postedAt: new Date().toISOString(),
      applicantsCount: 0,
    };

    db.jobs.unshift(newJob);
    db.save();

    return res.status(201).json({ message: 'Job posting published successfully!', job: newJob });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create job.' });
  }
});

// PUT /api/jobs/:id (Recruiter: edit job)
router.put('/:id', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  const job = db.jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  if (job.recruiterId !== req.user!.id) {
    return res.status(403).json({ error: 'You can only edit your own job postings.' });
  }

  const { title, company, description, location, type, experienceRequired, minExperience, salaryRange, skills, perks } =
    req.body;

  if (title) job.title = title.trim();
  if (company) job.company = company.trim();
  if (description) job.description = description.trim();
  if (location) job.location = location.trim();
  if (type) job.type = type;
  if (experienceRequired) job.experienceRequired = experienceRequired;
  if (minExperience !== undefined) job.minExperience = Number(minExperience);
  if (salaryRange) job.salaryRange = salaryRange;
  if (Array.isArray(skills)) job.skills = skills.map((s: string) => s.trim()).filter(Boolean);
  if (Array.isArray(perks)) job.perks = perks.map((p: string) => p.trim()).filter(Boolean);

  db.save();
  return res.json({ message: 'Job posting updated successfully!', job });
});

// DELETE /api/jobs/:id (Recruiter: delete job)
router.delete('/:id', authenticate, requireRole(['recruiter']), (req: AuthRequest, res: Response) => {
  const index = db.jobs.findIndex((j) => j.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  if (db.jobs[index].recruiterId !== req.user!.id) {
    return res.status(403).json({ error: 'You can only delete your own job postings.' });
  }

  db.jobs.splice(index, 1);
  // Also clean up applications for this job
  db.applications = db.applications.filter((a) => a.jobId !== req.params.id);
  db.save();

  return res.json({ message: 'Job posting deleted.' });
});

export default router;
