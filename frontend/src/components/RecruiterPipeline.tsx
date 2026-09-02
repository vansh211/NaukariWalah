import React, { useState, useEffect } from 'react';
import { Job, Application } from '../types';
import { api } from '../services/api';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecruiterPipelineProps {
  onOpenPostJob: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const RecruiterPipeline: React.FC<RecruiterPipelineProps> = ({
  onOpenPostJob,
  onSuccessToast,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [recruiterNote, setRecruiterNote] = useState('');
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    loadMyJobs();
  }, []);

  const loadMyJobs = async () => {
    try {
      const res = await api.getMyPostedJobs();
      const jobList: Job[] = res.jobs || [];
      setJobs(jobList);
      if (jobList.length > 0) {
        selectJob(jobList[0]);
      }
    } catch (err) {
      console.error('Failed to load recruiter jobs', err);
    }
  };

  const selectJob = async (job: Job) => {
    setSelectedJob(job);
    setSelectedApp(null);
    setLoadingApps(true);
    try {
      const res = await api.getJobApplications(job.id);
      setApplications(res.applications || []);
      if (res.applications && res.applications.length > 0) {
        setSelectedApp(res.applications[0]);
        setRecruiterNote(res.applications[0].recruiterNotes || '');
      }
    } catch (err) {
      console.error('Failed to load job applications', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, newStatus, recruiterNote);
      if (newStatus === 'hired') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus as any, recruiterNotes: recruiterNote } : a))
      );
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus as any, recruiterNotes: recruiterNote });
      }

      if (onSuccessToast) {
        onSuccessToast(`Candidate marked as ${newStatus.toUpperCase()}`);
      }
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredApps = applications.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0);
  const totalShortlisted = jobs.reduce((sum, j) => sum + (j.shortlistedCount || 0), 0);
  const totalHired = jobs.reduce((sum, j) => sum + (j.hiredCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#121224]">Employer Dashboard</h1>
          <p className="text-xs text-[#717b9e] mt-0.5">
            Manage your job postings and review candidate applications.
          </p>
        </div>

        <button
          onClick={onOpenPostJob}
          className="px-5 py-2.5 rounded-full font-bold text-white bg-[#09804c] hover:bg-[#076a3e] text-xs shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <Briefcase className="w-4 h-4" />
          Post New Job
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="naukri-card p-4 bg-white">
          <div className="text-xs text-[#717b9e] font-medium">Active Jobs</div>
          <div className="text-2xl font-bold text-[#121224] mt-1">{jobs.length}</div>
        </div>
        <div className="naukri-card p-4 bg-white">
          <div className="text-xs text-[#717b9e] font-medium">Total Applicants</div>
          <div className="text-2xl font-bold text-[#275df5] mt-1">{totalApplicants}</div>
        </div>
        <div className="naukri-card p-4 bg-white">
          <div className="text-xs text-[#717b9e] font-medium">Shortlisted</div>
          <div className="text-2xl font-bold text-[#1a73e8] mt-1">{totalShortlisted}</div>
        </div>
        <div className="naukri-card p-4 bg-white">
          <div className="text-xs text-[#717b9e] font-medium">Selected / Offers</div>
          <div className="text-2xl font-bold text-[#09804c] mt-1">{totalHired}</div>
        </div>
      </div>

      {/* 2-Column Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Job Selector & Applicant list */}
        <div className="lg:col-span-5 space-y-4">
          <div className="naukri-card p-4 bg-white space-y-2">
            <h3 className="text-xs font-bold text-[#717b9e] uppercase tracking-wider">
              Select Job ({jobs.length})
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => selectJob(job)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between text-xs ${
                    selectedJob?.id === job.id
                      ? 'bg-[#eef3ff] border-[#275df5] text-[#121224] font-semibold'
                      : 'bg-white border-[#e7e7f0] text-[#474d6a] hover:bg-[#f8f9fb]'
                  }`}
                >
                  <div>
                    <div className="line-clamp-1">{job.title}</div>
                    <div className="text-[11px] text-[#939bb4]">{job.location}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#f4f5f7] text-[#474d6a] font-bold text-[11px]">
                    {job.applicantsCount || 0} applied
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Applicants */}
          {selectedJob && (
            <div className="naukri-card p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#121224]">
                  Applicants ({filteredApps.length})
                </h3>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 rounded bg-white border border-[#e7e7f0] text-xs text-[#474d6a] focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview">Interview</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loadingApps ? (
                <div className="text-center py-6 text-xs text-[#939bb4]">Loading applicants...</div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#939bb4]">No applicants matching status.</div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedApp(app);
                        setRecruiterNote(app.recruiterNotes || '');
                      }}
                      className={`p-3 rounded-lg border transition cursor-pointer text-xs ${
                        selectedApp?.id === app.id
                          ? 'bg-[#eef3ff] border-[#275df5] text-[#121224]'
                          : 'bg-white border-[#e7e7f0] text-[#474d6a] hover:bg-[#f8f9fb]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-[#121224]">{app.candidateName}</div>
                          <div className="text-[11px] text-[#717b9e]">{app.candidateEmail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#f4fbf7] text-[#09804c] font-bold text-[11px]">
                          {app.matchScore}% Match
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#f0f0f5] text-[11px]">
                        <span className="text-[#939bb4]">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold capitalize ${
                            app.status === 'hired'
                              ? 'bg-[#e6f4ea] text-[#0d652d]'
                              : app.status === 'shortlisted'
                              ? 'bg-[#e8f0fe] text-[#1a73e8]'
                              : app.status === 'interview'
                              ? 'bg-[#fef7e0] text-[#b06000]'
                              : app.status === 'rejected'
                              ? 'bg-[#fce8e6] text-[#c5221f]'
                              : 'bg-[#f1f3f4] text-[#3c4043]'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Candidate Review & Status controls */}
        <div className="lg:col-span-7">
          {selectedApp ? (
            <div className="naukri-card p-6 bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f0f5]">
                <div>
                  <h2 className="text-xl font-bold text-[#121224]">{selectedApp.candidateName}</h2>
                  <p className="text-xs font-semibold text-[#275df5] mt-0.5">
                    {selectedApp.resumeData?.title || 'Software Engineer'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#717b9e] mt-1.5">
                    <span>{selectedApp.candidateEmail}</span>
                    {selectedApp.candidatePhone && <span>• {selectedApp.candidatePhone}</span>}
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase self-start sm:self-auto ${
                    selectedApp.status === 'hired'
                      ? 'bg-[#e6f4ea] text-[#0d652d]'
                      : selectedApp.status === 'shortlisted'
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : selectedApp.status === 'interview'
                      ? 'bg-[#fef7e0] text-[#b06000]'
                      : selectedApp.status === 'rejected'
                      ? 'bg-[#fce8e6] text-[#c5221f]'
                      : 'bg-[#f1f3f4] text-[#3c4043]'
                  }`}
                >
                  {selectedApp.status}
                </span>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-xs font-bold text-[#121224] uppercase tracking-wider mb-1.5">
                  Candidate Key Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedApp.resumeData?.skills || []).map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-md bg-[#f4f5f7] text-[#474d6a]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedApp.resumeData?.summary && (
                <div>
                  <h4 className="text-xs font-bold text-[#121224] uppercase tracking-wider mb-1">
                    Profile Summary
                  </h4>
                  <p className="text-xs text-[#474d6a] leading-relaxed bg-[#f8f9fb] p-3 rounded-lg border border-[#eef1f6]">
                    {selectedApp.resumeData.summary}
                  </p>
                </div>
              )}

              {/* Feedback Note & Controls */}
              <div className="pt-4 border-t border-[#f0f0f5] space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-[#121224] mb-1">
                    Recruiter Note / Feedback for Candidate
                  </label>
                  <textarea
                    rows={2}
                    value={recruiterNote}
                    onChange={(e) => setRecruiterNote(e.target.value)}
                    placeholder="e.g. Profile shortlisted for round 1 interview."
                    className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold text-[#717b9e] mb-2">Update Application Stage:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'shortlisted')}
                      className="py-2 px-3 rounded-lg text-xs font-bold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] transition text-center"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'interview')}
                      className="py-2 px-3 rounded-lg text-xs font-bold text-[#b06000] bg-[#fef7e0] hover:bg-[#feefc3] transition text-center"
                    >
                      Interview
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'hired')}
                      className="py-2 px-3 rounded-lg text-xs font-bold text-[#0d652d] bg-[#e6f4ea] hover:bg-[#ceead6] transition text-center"
                    >
                      Hire Candidate
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                      className="py-2 px-3 rounded-lg text-xs font-bold text-[#c5221f] bg-[#fce8e6] hover:bg-[#fad2cf] transition text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="naukri-card p-16 text-center bg-white text-[#939bb4] text-xs">
              Select an applicant from the left list to review profile and update hiring stage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
