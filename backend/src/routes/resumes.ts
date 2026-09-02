import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, ResumeData } from '../services/store';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { extractTextFromFile, parseResumeText } from '../services/resumeParser';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Multer storage configuration
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `resume_${Date.now()}_${uuidv4().substring(0, 6)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, DOC, and TXT files are supported.'));
    }
  },
});

// POST /api/resumes/upload
router.post(
  '/upload',
  authenticate,
  requireRole(['candidate']),
  upload.single('resumeFile'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please select a resume file (PDF, DOCX, or TXT).' });
      }

      const userId = req.user!.id;
      const user = db.users.find((u) => u.id === userId);
      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const fileUrl = `/uploads/${req.file.filename}`;

      // Extract text and parse
      const extractedText = await extractTextFromFile(filePath, originalName);
      const parsedResume = parseResumeText(
        extractedText,
        originalName,
        fileUrl,
        userId,
        user?.name,
        user?.email
      );

      // Override with user's registered name/email if detected values were defaults or corrupted
      if (user) {
        if (!parsedResume.fullName || parsedResume.fullName === 'Candidate User' || parsedResume.fullName.includes('%') || parsedResume.fullName.length < 2) {
          parsedResume.fullName = user.name;
        }
        if (!parsedResume.email || parsedResume.email.includes('example.com')) {
          parsedResume.email = user.email;
        }
        if (user.phone && (!parsedResume.phone || parsedResume.phone.length < 5)) parsedResume.phone = user.phone;
        if (user.location) parsedResume.location = user.location;
      }

      // Check if resume already exists for user, update or insert
      const existingIdx = db.resumes.findIndex((r) => r.userId === userId);
      if (existingIdx >= 0) {
        parsedResume.id = db.resumes[existingIdx].id;
        db.resumes[existingIdx] = parsedResume;
      } else {
        db.resumes.push(parsedResume);
      }
      db.save();

      return res.status(200).json({
        message: 'Resume uploaded and parsed successfully by AI!',
        resume: parsedResume,
        extractedSkillCount: parsedResume.skills.length,
      });
    } catch (err: any) {
      console.error('Resume upload/parse error:', err);
      return res.status(500).json({ error: 'Failed to parse resume: ' + (err.message || 'Unknown error') });
    }
  }
);

// GET /api/resumes/me
router.get('/me', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const resume = db.resumes.find((r) => r.userId === userId);
  if (!resume) {
    return res.json({ resume: null });
  }
  return res.json({ resume });
});

// GET /api/resumes/user/:id (Recruiter view candidate resume)
router.get('/user/:id', authenticate, (req: AuthRequest, res: Response) => {
  const candidateId = req.params.id;
  const resume = db.resumes.find((r) => r.userId === candidateId || r.id === candidateId);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found.' });
  }
  return res.json({ resume });
});

// PUT /api/resumes/me (Manual update / edit resume fields)
router.put('/me', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.users.find((u) => u.id === userId);
  const data = req.body;

  let resume = db.resumes.find((r) => r.userId === userId);

  if (!resume) {
    resume = {
      id: 'res_' + uuidv4().substring(0, 8),
      userId,
      fileName: 'Generated_Profile_Resume.pdf',
      fileUrl: '',
      fullName: data.fullName || user?.name || 'Candidate',
      email: data.email || user?.email || '',
      phone: data.phone || user?.phone || '+91 98765 43210',
      location: data.location || user?.location || 'Bengaluru, India',
      title: data.title || 'Software Engineer',
      summary: data.summary || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      experienceYears: Number(data.experienceYears) || 1,
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      uploadedAt: new Date().toISOString(),
    };
    db.resumes.push(resume);
  } else {
    // Update fields
    if (data.fullName) resume.fullName = data.fullName;
    if (data.email) resume.email = data.email;
    if (data.phone) resume.phone = data.phone;
    if (data.location) resume.location = data.location;
    if (data.title) resume.title = data.title;
    if (data.summary) resume.summary = data.summary;
    if (Array.isArray(data.skills)) resume.skills = data.skills;
    if (data.experienceYears !== undefined) resume.experienceYears = Number(data.experienceYears);
    if (Array.isArray(data.experience)) resume.experience = data.experience;
    if (Array.isArray(data.education)) resume.education = data.education;
    if (Array.isArray(data.projects)) resume.projects = data.projects;
  }

  db.save();
  return res.json({ message: 'Resume profile saved successfully!', resume });
});

// POST /api/resumes/ai-feedback (AI ATS feedback & Optimization recommendations)
router.post('/ai-feedback', authenticate, requireRole(['candidate']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const resume = db.resumes.find((r) => r.userId === userId);

  if (!resume) {
    return res.status(400).json({ error: 'Please upload or create a resume first.' });
  }

  const skillCount = resume.skills.length;
  const hasExp = resume.experience && resume.experience.length > 0;
  const hasEdu = resume.education && resume.education.length > 0;
  const hasSummary = resume.summary && resume.summary.length > 50;

  const suggestions: string[] = [];
  let atsScore = 65;

  if (skillCount >= 8) {
    atsScore += 15;
  } else {
    suggestions.push(`Add at least 3 more modern core technologies to improve ATS keyword detection (currently ${skillCount} listed).`);
  }

  if (hasSummary) {
    atsScore += 10;
  } else {
    suggestions.push('Add an impactful 3-4 line Executive Summary highlighting key achievements and domains.');
  }

  if (hasExp) {
    atsScore += 10;
  } else {
    suggestions.push('Detail previous roles with quantified metrics (e.g., "improved load time by 30%").');
  }

  const hotInDemandSkills = ['TypeScript', 'React', 'Node.js', 'Docker', 'AWS', 'Next.js', 'PostgreSQL', 'System Design'];
  const recommendedAdditions = hotInDemandSkills.filter(
    (s) => !resume.skills.map((k) => k.toLowerCase()).includes(s.toLowerCase())
  );

  return res.json({
    atsScore: Math.min(98, atsScore),
    feedback: `Your resume is in the top ${100 - atsScore}% bracket for Tech roles.`,
    suggestions,
    recommendedKeywords: recommendedAdditions.slice(0, 4),
  });
});

export default router;
