import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { JobCard } from './components/JobCard';
import { JobDetailsModal } from './components/JobDetailsModal';
import { ResumeStudio } from './components/ResumeStudio';
import { CandidateApplications } from './components/CandidateApplications';
import { PostJobModal } from './components/PostJobModal';
import { RecruiterPipeline } from './components/RecruiterPipeline';
import { TalentSearch } from './components/TalentSearch';
import { Job, Application } from './types';
import { api } from './services/api';
import {
  Search,
  MapPin,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Home,
  Building,
  TrendingUp,
  Package,
  ShoppingBag,
  IndianRupee,
  FileText,
  CheckCircle,
  BarChart2,
  Rocket,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('jobs');

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isPostJobOpen, setIsPostJobOpen] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [minExp, setMinExp] = useState<number>(0);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Synchronize dark-mode class on body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user?.role === 'recruiter') {
      setActiveTab('recruiter-jobs');
    } else {
      if (activeTab === 'recruiter-jobs' || activeTab === 'talent-search') {
        setActiveTab('jobs');
      }
    }
  }, [user]);

  useEffect(() => {
    loadJobs();
    if (user?.role === 'candidate') {
      loadRecommendations();
      loadCandidateData();
    }
  }, [user, locationFilter, skillFilter, typeFilter, minExp]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await api.getJobs({
        search: searchQuery.trim() || undefined,
        location: locationFilter !== 'all' ? locationFilter : undefined,
        skill: skillFilter !== 'all' ? skillFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        minExp: minExp > 0 ? minExp.toString() : undefined,
      });
      setJobs(res.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await api.getRecommendations();
      if (res.recommendedJobs) {
        setRecommendedJobs(res.recommendedJobs);
      }
    } catch {
      // ignore
    }
  };

  const loadCandidateData = async () => {
    try {
      const [savedRes, appsRes] = await Promise.all([api.getSavedJobs(), api.getMyApplications()]);
      if (savedRes.savedJobs) {
        setSavedJobIds(savedRes.savedJobs.map((j: any) => j.id));
      }
      if (appsRes.applications) {
        setAppliedJobIds(appsRes.applications.map((a: Application) => a.jobId));
      }
    } catch {
      // ignore
    }
  };

  const handleApply = async (job: Job) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    try {
      await api.applyToJob(job.id);
      setAppliedJobIds((prev) => [...prev, job.id]);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      showToast(`Application submitted for ${job.title}!`);
      if (selectedJob?.id === job.id) {
        setSelectedJob(null);
      }
      loadJobs();
    } catch (err: any) {
      if (err.message && err.message.includes('resume')) {
        showToast('Please upload your resume in the Services tab before applying.');
        setActiveTab('resume-studio');
      } else {
        alert(err.message || 'Failed to apply.');
      }
    }
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await api.toggleSaveJob(jobId);
      if (res.isSaved) {
        setSavedJobIds((prev) => [...prev, jobId]);
        showToast('Job saved to your bookmarks.');
      } else {
        setSavedJobIds((prev) => prev.filter((id) => id !== jobId));
        showToast('Job removed from bookmarks.');
      }
    } catch (err: any) {
      alert('Error saving job: ' + err.message);
    }
  };

  const handleCategoryClick = (categoryText: string) => {
    setSearchQuery(categoryText);
    setTimeout(loadJobs, 50);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      darkMode ? 'bg-[#0f141e] text-[#f1f5f9]' : 'bg-[#f8f9fa] text-[#121224]'
    }`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 ${
          darkMode ? 'bg-[#1e293b] text-white border border-[#334155]' : 'bg-[#1a2b49] text-white'
        }`}>
          <CheckCircle className="w-4 h-4 text-[#09804c]" />
          {toastMessage}
        </div>
      )}

      {/* Exact Naukri Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAuthModal={() => setIsAuthOpen(true)}
        openPostJobModal={() => setIsPostJobOpen(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* RECRUITER VIEWS */}
        {user?.role === 'recruiter' && (
          <>
            {activeTab === 'recruiter-jobs' && (
              <RecruiterPipeline
                onOpenPostJob={() => setIsPostJobOpen(true)}
                onSuccessToast={showToast}
              />
            )}
            {activeTab === 'talent-search' && <TalentSearch />}
          </>
        )}

        {/* JOBSEEKER VIEWS */}
        {user?.role !== 'recruiter' && (
          <>
            {/* JOBS EXPLORER (EXACT NAUKRI HOMEPAGE AS IN SCREENSHOT) */}
            {activeTab === 'jobs' && (
              <div className="space-y-8">
                {/* Hero Section */}
                <div className={`py-12 sm:py-16 px-4 transition-colors ${
                  darkMode ? 'bg-[#131a29]' : 'bg-transparent'
                }`}>
                  <div className="max-w-4xl mx-auto text-center space-y-3">
                    {/* Exact Headline */}
                    <h1 className={`text-3xl sm:text-5xl font-extrabold tracking-tight ${
                      darkMode ? 'text-white' : 'text-[#121224]'
                    }`}>
                      Find your dream job now
                    </h1>
                    {/* Exact Subtitle */}
                    <p className="text-base text-[#717b9e] font-normal">
                      5 lakh+ jobs for you to explore
                    </p>

                    {/* Exact Pill Search Box */}
                    <div className="pt-6">
                      <div className={`p-2 rounded-full shadow-lg border flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x max-w-4xl mx-auto transition-colors ${
                        darkMode
                          ? 'bg-[#18202f] border-[#283548] divide-[#283548]'
                          : 'bg-white border-[#e7e7f0] divide-[#e7e7f0]'
                      }`}>
                        {/* 1. Skills / Designations / Companies */}
                        <div className="flex items-center gap-3 px-4 py-2 flex-1 w-full">
                          <Search className="w-5 h-5 text-[#939bb4] shrink-0" />
                          <input
                            type="text"
                            placeholder="Enter skills / designations / companies"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
                            className={`w-full text-sm placeholder-[#939bb4] focus:outline-none bg-transparent ${
                              darkMode ? 'text-white' : 'text-[#121224]'
                            }`}
                          />
                        </div>

                        {/* 2. Experience Dropdown */}
                        <div className="flex items-center gap-2 px-4 py-2 w-full md:w-48">
                          <select
                            value={minExp}
                            onChange={(e) => setMinExp(parseInt(e.target.value, 10))}
                            className={`w-full text-sm bg-transparent focus:outline-none cursor-pointer ${
                              darkMode ? 'text-slate-300' : 'text-[#717b9e]'
                            }`}
                          >
                            <option value={0}>Select experience</option>
                            <option value={1}>1 Year</option>
                            <option value={2}>2 Years</option>
                            <option value={3}>3 Years</option>
                            <option value={4}>4 Years</option>
                            <option value={5}>5+ Years</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#939bb4] shrink-0 pointer-events-none" />
                        </div>

                        {/* 3. Location */}
                        <div className="flex items-center gap-2 px-4 py-2 w-full md:w-48">
                          <input
                            type="text"
                            placeholder="Enter location"
                            value={locationFilter === 'all' ? '' : locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value || 'all')}
                            onKeyDown={(e) => e.key === 'Enter' && loadJobs()}
                            className={`w-full text-sm placeholder-[#939bb4] focus:outline-none bg-transparent ${
                              darkMode ? 'text-white' : 'text-[#121224]'
                            }`}
                          />
                        </div>

                        {/* 4. Exact Search Button */}
                        <div className="p-1 w-full md:w-auto">
                          <button
                            onClick={loadJobs}
                            className="w-full md:w-auto px-8 py-3 rounded-full font-bold text-white bg-[#1b5afb] hover:bg-[#1648c7] text-sm transition shadow-sm"
                          >
                            Search
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Exact Category Pill Grid as in the Screenshot */}
                    <div className="pt-10 max-w-4xl mx-auto space-y-3.5">
                      {/* Row 1 */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        <div onClick={() => handleCategoryClick('Remote')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-[#717b9e]" />
                            <span>Remote</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('MNC')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-[#717b9e]" />
                            <span>MNC</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Analytics')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-[#717b9e]" />
                            <span>Analytics</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Supply Chain')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#717b9e]" />
                            <span>Supply Ch...</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Sales')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-[#717b9e]" />
                            <span>Sales</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Banking')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-[#717b9e]" />
                            <span>Banking & ...</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
                        <div onClick={() => handleCategoryClick('Internship')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#717b9e]" />
                            <span>Internship</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Marketing')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#717b9e]" />
                            <span>Marketing</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Project Manager')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#717b9e]" />
                            <span>Project Mg...</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Data Science')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-[#717b9e]" />
                            <span>Data Scien...</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>

                        <div onClick={() => handleCategoryClick('Startup')} className="naukri-pill-card">
                          <div className="flex items-center gap-2">
                            <Rocket className="w-4 h-4 text-[#717b9e]" />
                            <span>Startup</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#939bb4]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Companies Hiring Banner */}
                <div className="text-center pt-2">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>
                    Top companies hiring now
                  </h2>
                </div>

                {/* Job Listings Grid */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-[#717b9e]'}`}>
                      Showing {jobs.length} Verified Jobs
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={darkMode ? 'text-slate-400' : 'text-[#717b9e]'}>Work Type:</span>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={`px-3 py-1 rounded border text-xs focus:outline-none ${
                          darkMode ? 'bg-[#18202f] border-[#283548] text-white' : 'bg-white border-[#e7e7f0] text-[#121224]'
                        }`}
                      >
                        <option value="all">All Types</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  {loadingJobs ? (
                    <div className="text-center py-20 text-xs text-[#939bb4]">Loading jobs...</div>
                  ) : jobs.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border text-xs ${
                      darkMode ? 'bg-[#18202f] border-[#283548] text-slate-400' : 'bg-white border-[#e7e7f0] text-[#717b9e]'
                    }`}>
                      No jobs found matching your search. Try another keyword.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jobs.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          isSaved={savedJobIds.includes(job.id)}
                          hasApplied={appliedJobIds.includes(job.id)}
                          onSelect={(j) => setSelectedJob(j)}
                          onApply={handleApply}
                          onToggleSave={handleToggleSave}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RECOMMENDED JOBS */}
            {activeTab === 'recommendations' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>
                    Companies & Matching Roles
                  </h1>
                  <p className="text-xs text-[#717b9e] mt-0.5">
                    Roles matching your profile skills and experience.
                  </p>
                </div>

                {recommendedJobs.length === 0 ? (
                  <div className={`p-12 text-center rounded-2xl border ${
                    darkMode ? 'bg-[#18202f] border-[#283548]' : 'bg-white border-[#e7e7f0]'
                  }`}>
                    <Sparkles className="w-12 h-12 text-[#1b5afb] mx-auto mb-3" />
                    <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>Upload Your Resume</h3>
                    <p className="text-xs text-[#717b9e] mt-1 max-w-sm mx-auto mb-4">
                      Upload your resume in Services to see personalized recommendations.
                    </p>
                    <button
                      onClick={() => setActiveTab('resume-studio')}
                      className="px-5 py-2.5 rounded-full font-bold text-white bg-[#1b5afb] hover:bg-[#1648c7] text-xs shadow-xs"
                    >
                      Go to Services / Profile
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isSaved={savedJobIds.includes(job.id)}
                        hasApplied={appliedJobIds.includes(job.id)}
                        onSelect={(j) => setSelectedJob(j)}
                        onApply={handleApply}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES / RESUME STUDIO */}
            {activeTab === 'resume-studio' && <ResumeStudio onSuccessToast={showToast} />}

            {/* APPLIED JOBS */}
            {activeTab === 'applications' && <CandidateApplications />}

            {/* SAVED JOBS */}
            {activeTab === 'saved' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>Saved Jobs</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs
                    .filter((j) => savedJobIds.includes(j.id))
                    .map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        isSaved={true}
                        hasApplied={appliedJobIds.includes(job.id)}
                        onSelect={(j) => setSelectedJob(j)}
                        onApply={handleApply}
                        onToggleSave={handleToggleSave}
                      />
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Cookie Banner matching screenshot */}
      <footer className="bg-[#121620] text-slate-400 py-3 text-xs border-t border-[#1e2738]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px]">
            We use cookies to improve your experience. By continuing to browse this site, you agree to our <a href="#" className="text-[#3b82f6] hover:underline">Privacy Policy</a> & <a href="#" className="text-[#3b82f6] hover:underline">Cookie Policy</a>.
          </p>
          <button
            onClick={() => showToast('Cookie preferences saved.')}
            className="px-4 py-1 rounded bg-[#1b5afb] text-white font-bold text-xs hover:bg-[#1648c7]"
          >
            Got it
          </button>
        </div>
      </footer>

      {/* Popups & Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <JobDetailsModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onApply={handleApply}
        hasApplied={selectedJob ? appliedJobIds.includes(selectedJob.id) : false}
      />
      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={() => {
          showToast('Job posted successfully!');
          loadJobs();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
