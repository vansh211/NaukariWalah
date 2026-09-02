import { Job, ResumeData } from './store';

const SKILL_ALIASES: Record<string, string> = {
  'react.js': 'react',
  'reactjs': 'react',
  'node': 'node.js',
  'nodejs': 'node.js',
  'ts': 'typescript',
  'js': 'javascript',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'tailwind': 'tailwind css',
  'tailwindcss': 'tailwind css',
  'aws': 'aws',
  'amazon web services': 'aws',
  'expressjs': 'express',
  'express.js': 'express',
  'nextjs': 'next.js',
  'next': 'next.js',
  'rest': 'rest api',
  'restful': 'rest api',
  'docker container': 'docker',
  'k8s': 'kubernetes',
};

export function normalizeSkill(skill: string): string {
  const clean = skill.trim().toLowerCase();
  return SKILL_ALIASES[clean] || clean;
}

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  verdict: string;
  recommendationReason: string;
  breakdown: {
    skillScore: number;
    experienceScore: number;
    titleScore: number;
  };
}

export function computeJobMatch(job: Job, resume: Partial<ResumeData>): MatchResult {
  const candidateSkills = (resume.skills || []).map(normalizeSkill);
  const jobSkills = (job.skills || []).map(normalizeSkill);

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Match skills
  job.skills.forEach((originalJobSkill) => {
    const norm = normalizeSkill(originalJobSkill);
    const isMatched = candidateSkills.some(
      (candSkill) => candSkill === norm || candSkill.includes(norm) || norm.includes(candSkill)
    );
    if (isMatched) {
      matchedSkills.push(originalJobSkill);
    } else {
      missingSkills.push(originalJobSkill);
    }
  });

  const skillScore =
    job.skills.length > 0 ? Math.round((matchedSkills.length / job.skills.length) * 100) : 75;

  // Experience evaluation
  const candidateExp = resume.experienceYears || 0;
  const minExp = job.minExperience || 0;
  let experienceScore = 100;
  if (candidateExp < minExp) {
    const diff = minExp - candidateExp;
    experienceScore = Math.max(30, 100 - diff * 25);
  } else if (candidateExp >= minExp) {
    experienceScore = 100;
  }

  // Title / summary semantic overlap
  let titleScore = 70;
  const jobTitleLower = job.title.toLowerCase();
  const candTitleLower = (resume.title || '').toLowerCase();
  if (candTitleLower && (jobTitleLower.includes(candTitleLower) || candTitleLower.includes(jobTitleLower))) {
    titleScore = 95;
  } else if (candTitleLower.split(' ').some((w) => w.length > 3 && jobTitleLower.includes(w))) {
    titleScore = 85;
  }

  // Weighted aggregate: 60% skills, 25% experience, 15% title
  const finalScore = Math.min(
    99,
    Math.max(10, Math.round(skillScore * 0.6 + experienceScore * 0.25 + titleScore * 0.15))
  );

  let verdict = 'Good Potential 💡';
  let recommendationReason = `Matches ${matchedSkills.length} out of ${job.skills.length} core requirements.`;

  if (finalScore >= 85) {
    verdict = 'Exceptional Match 🎯';
    recommendationReason = `High skill match (${matchedSkills.length}/${job.skills.length}) and experience level fits perfectly with ${job.company}'s requirements.`;
  } else if (finalScore >= 70) {
    verdict = 'Strong Match ✨';
    recommendationReason = `Strong background in ${matchedSkills.slice(0, 3).join(', ')}. Quick upskilling in ${missingSkills.slice(0, 2).join(', ') || 'niche areas'} recommended.`;
  } else if (finalScore >= 50) {
    verdict = 'Moderate Fit 📈';
    recommendationReason = `Partially matches requirements. Consider highlighting relevant projects or skills like ${missingSkills.slice(0, 2).join(', ')}.`;
  } else {
    verdict = 'Skill Gap Identified 📚';
    recommendationReason = `Missing key requirements (${missingSkills.slice(0, 3).join(', ')}).`;
  }

  return {
    score: finalScore,
    matchedSkills,
    missingSkills,
    verdict,
    recommendationReason,
    breakdown: {
      skillScore,
      experienceScore,
      titleScore,
    },
  };
}
