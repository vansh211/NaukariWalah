import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'candidate' | 'recruiter';
  company?: string;
  title?: string;
  phone?: string;
  location?: string;
  createdAt: string;
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
  rating?: number;
  reviewCount?: number;
}

export interface Application {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  resumeId: string;
  resumeData: Partial<ResumeData>;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchVerdict: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  appliedAt: string;
  recruiterNotes?: string;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  savedAt: string;
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

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Companies List for generating 200+ realistic jobs
const COMPANIES = [
  { name: 'Google', domain: 'google.com', color: '#4285F4', rating: 4.6, reviews: 1420 },
  { name: 'Microsoft', domain: 'microsoft.com', color: '#00A4EF', rating: 4.5, reviews: 1890 },
  { name: 'Amazon', domain: 'amazon.com', color: '#FF9900', rating: 4.3, reviews: 3450 },
  { name: 'Flipkart', domain: 'flipkart.com', color: '#2874F0', rating: 4.2, reviews: 920 },
  { name: 'Swiggy', domain: 'swiggy.com', color: '#FC8019', rating: 4.1, reviews: 680 },
  { name: 'Zomato', domain: 'zomato.com', color: '#CB202D', rating: 4.2, reviews: 750 },
  { name: 'Razorpay', domain: 'razorpay.com', color: '#0C2340', rating: 4.4, reviews: 430 },
  { name: 'CRED', domain: 'cred.club', color: '#1B1B1B', rating: 4.3, reviews: 310 },
  { name: 'Groww', domain: 'groww.in', color: '#00D09C', rating: 4.4, reviews: 390 },
  { name: 'Zerodha', domain: 'zerodha.com', color: '#387ED1', rating: 4.7, reviews: 520 },
  { name: 'Paytm', domain: 'paytm.com', color: '#002E6E', rating: 3.9, reviews: 1200 },
  { name: 'PhonePe', domain: 'phonepe.com', color: '#5F259F', rating: 4.3, reviews: 610 },
  { name: 'Uber', domain: 'uber.com', color: '#000000', rating: 4.3, reviews: 890 },
  { name: 'Atlassian', domain: 'atlassian.com', color: '#0052CC', rating: 4.7, reviews: 410 },
  { name: 'Adobe', domain: 'adobe.com', color: '#FF0000', rating: 4.5, reviews: 780 },
  { name: 'Stripe', domain: 'stripe.com', color: '#635BFF', rating: 4.6, reviews: 290 },
  { name: 'Cisco', domain: 'cisco.com', color: '#1BA0D7', rating: 4.3, reviews: 1100 },
  { name: 'Oracle', domain: 'oracle.com', color: '#F80000', rating: 4.1, reviews: 1450 },
  { name: 'TCS', domain: 'tcs.com', color: '#0F2C59', rating: 4.0, reviews: 6200 },
  { name: 'Infosys', domain: 'infosys.com', color: '#007CC3', rating: 3.9, reviews: 5400 },
  { name: 'Wipro', domain: 'wipro.com', color: '#351C75', rating: 3.8, reviews: 4100 },
  { name: 'Meesho', domain: 'meesho.com', color: '#8B1E63', rating: 4.1, reviews: 480 },
  { name: 'Zepto', domain: 'zeptonow.com', color: '#5C1D8D', rating: 4.0, reviews: 320 },
  { name: 'Blinkit', domain: 'blinkit.com', color: '#F8CB46', rating: 4.1, reviews: 410 },
  { name: 'Jio Platforms', domain: 'jio.com', color: '#00539C', rating: 4.0, reviews: 2100 },
  { name: 'Airtel Digital', domain: 'airtel.in', color: '#E40000', rating: 4.1, reviews: 1300 },
  { name: 'Ola Cabs', domain: 'olacabs.com', color: '#323232', rating: 3.9, reviews: 890 },
  { name: 'Urban Company', domain: 'urbancompany.com', color: '#111111', rating: 4.3, reviews: 360 },
  { name: 'Nykaa', domain: 'nykaa.com', color: '#FC2779', rating: 4.0, reviews: 490 },
  { name: 'Tata Digital', domain: 'tatadigital.com', color: '#1B365D', rating: 4.2, reviews: 620 },
];

const ROLES = [
  {
    title: 'Senior Full Stack Developer (React / Node.js)',
    skills: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Docker', 'REST API'],
    expMin: 3,
    expText: '3-6 Yrs',
    salary: '₹ 22 - 35 Lacs PA',
    type: 'Full-time',
  },
  {
    title: 'Lead Frontend Engineer - React 19 & Next.js',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'GraphQL', 'Web Performance'],
    expMin: 4,
    expText: '4-8 Yrs',
    salary: '₹ 28 - 42 Lacs PA',
    type: 'Remote',
  },
  {
    title: 'Backend Software Development Engineer (SDE-2)',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Microservices', 'Kafka', 'AWS', 'System Design'],
    expMin: 2,
    expText: '2-5 Yrs',
    salary: '₹ 18 - 30 Lacs PA',
    type: 'Full-time',
  },
  {
    title: 'AI & Full Stack Integration Engineer',
    skills: ['Python', 'Node.js', 'React', 'OpenAI API', 'LangChain', 'FastAPI', 'Vector DB', 'Docker'],
    expMin: 2,
    expText: '2-4 Yrs',
    salary: '₹ 25 - 40 Lacs PA',
    type: 'Hybrid',
  },
  {
    title: 'DevOps & Cloud Infrastructure Engineer',
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Prometheus', 'Linux'],
    expMin: 3,
    expText: '3-6 Yrs',
    salary: '₹ 20 - 32 Lacs PA',
    type: 'Full-time',
  },
  {
    title: 'Junior React Frontend Developer',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Git', 'REST API'],
    expMin: 0,
    expText: '0-2 Yrs',
    salary: '₹ 8 - 14 Lacs PA',
    type: 'Full-time',
  },
  {
    title: 'Data Engineer - Spark & Distributed Pipelines',
    skills: ['Python', 'SQL', 'Apache Spark', 'Kafka', 'Airflow', 'AWS S3', 'Snowflake'],
    expMin: 2,
    expText: '2-5 Yrs',
    salary: '₹ 18 - 28 Lacs PA',
    type: 'Hybrid',
  },
  {
    title: 'Mobile App Developer (React Native / Flutter)',
    skills: ['React Native', 'TypeScript', 'iOS', 'Android', 'Redux', 'REST API', 'Firebase'],
    expMin: 2,
    expText: '2-5 Yrs',
    salary: '₹ 16 - 26 Lacs PA',
    type: 'Remote',
  },
  {
    title: 'Software Development Engineer in Test (SDET)',
    skills: ['TypeScript', 'Playwright', 'Cypress', 'Jest', 'Selenium', 'CI/CD', 'API Testing'],
    expMin: 2,
    expText: '2-4 Yrs',
    salary: '₹ 14 - 22 Lacs PA',
    type: 'Full-time',
  },
  {
    title: 'Staff Platform Architect',
    skills: ['System Design', 'Distributed Systems', 'Kubernetes', 'Node.js', 'Go', 'AWS', 'Security'],
    expMin: 6,
    expText: '6-12 Yrs',
    salary: '₹ 45 - 70 Lacs PA',
    type: 'Hybrid',
  },
];

const LOCATIONS = [
  'Bengaluru',
  'Bengaluru (Hybrid)',
  'Hyderabad',
  'Hyderabad (Hybrid)',
  'Pune',
  'Gurugram / Delhi NCR',
  'Noida',
  'Mumbai',
  'Chennai',
  'Remote (Pan India)',
];

class DatabaseStore {
  public users: User[] = [];
  public resumes: ResumeData[] = [];
  public jobs: Job[] = [];
  public applications: Application[] = [];
  public savedJobs: SavedJob[] = [];
  public notifications: Notification[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.resumes = data.resumes || [];
        this.jobs = data.jobs || [];
        this.applications = data.applications || [];
        this.savedJobs = data.savedJobs || [];
        this.notifications = data.notifications || [];

        // If jobs count is low, generate full 200 jobs
        if (this.jobs.length < 150) {
          this.generate200Jobs();
          this.save();
        }
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (e) {
      console.warn('Initializing in-memory store:', e);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const snapshot = {
        users: this.users,
        resumes: this.resumes,
        jobs: this.jobs,
        applications: this.applications,
        savedJobs: this.savedJobs,
        notifications: this.notifications,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist store:', e);
    }
  }

  private generate200Jobs() {
    const recruiterId = 'user_rec_1';
    const jobsList: Job[] = [];

    let count = 1;
    for (let i = 0; i < COMPANIES.length; i++) {
      const comp = COMPANIES[i];
      for (let j = 0; j < ROLES.length; j++) {
        if (count > 205) break;

        const role = ROLES[j];
        const location = LOCATIONS[(i * 3 + j) % LOCATIONS.length];
        const daysAgo = (count % 14) + 1;
        const applicants = Math.floor(Math.random() * 45) + 3;

        jobsList.push({
          id: `job_${count}`,
          recruiterId,
          recruiterName: `Priya Mehta (${comp.name} Talent)`,
          company: comp.name,
          companyLogo: `https://logo.clearbit.com/${comp.domain}`,
          companyColor: comp.color,
          title: role.title,
          description: `We at ${comp.name} are looking for a talented ${role.title} to join our high-scale engineering team in ${location}. You will design resilient systems, work with modern cloud stacks, write clean modular TypeScript/JavaScript/Python code, collaborate with product managers, and deliver world-class products.`,
          location,
          type: role.type as any,
          experienceRequired: role.expText,
          minExperience: role.expMin,
          salaryRange: role.salary,
          skills: role.skills,
          perks: ['Comprehensive Health Insurance', 'Annual Learning & Wellness Allowance', 'Flexible Working Hours', 'Performance Bonus & ESOPs'],
          postedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          applicantsCount: applicants,
          rating: comp.rating,
          reviewCount: comp.reviews,
        });

        count++;
      }
    }

    this.jobs = jobsList;
  }

  private seedInitialData() {
    const candidateId = 'user_cand_1';
    const recruiterId = 'user_rec_1';

    this.users = [
      {
        id: candidateId,
        name: 'Vansh Sharma',
        email: 'candidate@demo.com',
        passwordHash: '$2a$10$19Wz8a3Xj4G6gY5XQYQn8.g75JmHk3U5M1cR0f8.j3gq5XgZzL1qa',
        role: 'candidate',
        title: 'Full Stack Software Engineer',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
        createdAt: new Date().toISOString(),
      },
      {
        id: recruiterId,
        name: 'Priya Mehta',
        email: 'recruiter@demo.com',
        passwordHash: '$2a$10$19Wz8a3Xj4G6gY5XQYQn8.g75JmHk3U5M1cR0f8.j3gq5XgZzL1qa',
        role: 'recruiter',
        company: 'InnovateX Global Technologies',
        title: 'Senior Technical Talent Partner',
        phone: '+91 98111 22334',
        location: 'Bengaluru / Remote',
        createdAt: new Date().toISOString(),
      },
    ];

    this.resumes = [
      {
        id: 'res_1',
        userId: candidateId,
        fileName: 'Vansh_Sharma_Resume.pdf',
        fileUrl: '/uploads/sample_resume.pdf',
        fullName: 'Vansh Sharma',
        email: 'candidate@demo.com',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
        title: 'Senior Full Stack Developer (React / Node.js / TypeScript)',
        summary:
          'Passionate Full Stack Developer with 4+ years of hands-on experience designing and building scalable cloud microservices, reactive UI applications, RESTful APIs, and AI-assisted workflows using modern React, Node.js, TypeScript, PostgreSQL, and MongoDB.',
        skills: [
          'React',
          'TypeScript',
          'JavaScript',
          'Node.js',
          'Express',
          'MongoDB',
          'PostgreSQL',
          'Tailwind CSS',
          'Next.js',
          'Docker',
          'REST API',
          'GraphQL',
          'Git',
          'AWS',
        ],
        experienceYears: 4,
        experience: [
          {
            company: 'TechFlow Systems',
            role: 'Lead Frontend / Full Stack Engineer',
            duration: '2023 - Present',
            description:
              'Architected responsive enterprise dashboards in React & TypeScript. Reduced API response times by 40% and improved Web Vitals to 95+ score.',
          },
          {
            company: 'NexGen Cloud Labs',
            role: 'Software Development Engineer',
            duration: '2021 - 2023',
            description:
              'Built scalable backend microservices using Node.js, Express, MongoDB, and Redis. Implemented secure JWT authentication and role-based access control.',
          },
        ],
        education: [
          {
            institution: 'Indian Institute of Technology / Tech Institute',
            degree: 'B.Tech in Computer Science & Engineering',
            year: '2017 - 2021',
          },
        ],
        projects: [
          {
            name: 'JobWallah Career Platform',
            tech: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
            description:
              'Automated resume skill extraction and job compatibility scoring with real-time feedback pipeline.',
          },
        ],
        uploadedAt: new Date().toISOString(),
      },
    ];

    this.generate200Jobs();

    this.applications = [
      {
        id: 'app_1',
        jobId: 'job_1',
        candidateId: candidateId,
        candidateName: 'Vansh Sharma',
        candidateEmail: 'candidate@demo.com',
        candidatePhone: '+91 98765 43210',
        resumeId: 'res_1',
        resumeData: {
          title: 'Senior Full Stack Developer',
          skills: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Docker'],
          experienceYears: 4,
        },
        matchScore: 94,
        matchedSkills: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Docker', 'REST API'],
        missingSkills: [],
        matchVerdict: 'Exceptional Match 🎯',
        status: 'shortlisted',
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        recruiterNotes: 'Strong profile with 4+ yrs React/Node experience. Shortlisted for round 1 technical interview.',
      },
    ];

    this.notifications = [
      {
        id: 'notif_1',
        userId: candidateId,
        title: 'Application Shortlisted! 🎉',
        message: 'Google reviewed your profile for "Senior Full Stack Developer" and moved you to Shortlisted.',
        type: 'status_change',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const db = new DatabaseStore();
