export interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter';
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  createdAt?: string;
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

export interface Job {
  id: string;
  recruiterId: string;
  recruiterName: string;
  company: string;
  companyLogo?: string;
  companyColor?: string;
  title: string;
  description: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
  experienceRequired: string;
  minExperience: number;
  salaryRange: string;
  skills: string[];
  perks: string[];
  postedAt: string;
  applicantsCount?: number;
  shortlistedCount?: number;
  hiredCount?: number;
  rating?: number;
  reviewCount?: number;
  match?: MatchResult | null;
}

export interface ResumeData {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experienceYears: number;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    tech: string[];
    description: string;
    link?: string;
  }>;
  uploadedAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateLocation?: string;
  resumeId: string;
  resumeData: Partial<ResumeData>;
  fullResume?: Partial<ResumeData>;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchVerdict: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  appliedAt: string;
  recruiterNotes?: string;
  job?: Job;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'status_change' | 'match' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}
