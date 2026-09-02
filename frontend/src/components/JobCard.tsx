import React, { useState } from 'react';
import { Job } from '../types';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Star,
  Bookmark,
  CheckCircle,
  Building2,
} from 'lucide-react';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  hasApplied?: boolean;
  onSelect: (job: Job) => void;
  onApply: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved = false,
  hasApplied = false,
  onSelect,
  onApply,
  onToggleSave,
}) => {
  const match = job.match;
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="naukri-job-card p-5 relative flex flex-col justify-between group transition">
      <div>
        {/* Top: Company Logo + Title + Rating */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Real Company Logo or Stylized Fallback */}
            <div className="w-12 h-12 rounded-xl border border-[#e7e7f0] dark:border-[#2a3850] bg-white dark:bg-[#1f2b40] flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1">
              {!logoError && job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div
                  className="w-full h-full rounded-lg flex items-center justify-center font-black text-sm text-white"
                  style={{ backgroundColor: job.companyColor || '#1b5afb' }}
                >
                  {job.company.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                onClick={() => onSelect(job)}
                className="font-bold text-base text-[#121224] dark:text-white hover:text-[#1b5afb] dark:hover:text-[#60a5fa] transition cursor-pointer leading-snug line-clamp-1"
              >
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                <span className="font-semibold text-[#474d6a] dark:text-slate-300 truncate max-w-[140px]">
                  {job.company}
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f4fbf7] dark:bg-[#0f2e1f] text-[#09804c] dark:text-[#4ade80] font-bold text-[11px] border border-[#d2edd9] dark:border-[#14532d]">
                  {job.rating || 4.3} <Star className="w-2.5 h-2.5 fill-current" />
                </span>
                <span className="text-[#939bb4] dark:text-slate-500 text-[11px]">
                  ({job.reviewCount || 420} Reviews)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(job.id);
            }}
            className={`p-2 rounded-full transition ${
              isSaved
                ? 'text-[#e03b22] bg-[#fff3f0] dark:bg-[#3b1c1c]'
                : 'text-[#939bb4] hover:text-[#474d6a] hover:bg-[#f4f5f7] dark:hover:bg-[#1e293b]'
            }`}
            title={isSaved ? 'Saved' : 'Save Job'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Experience, Salary, Location row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs my-3 text-[#717b9e] dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#939bb4]" />
            <span className="text-[#474d6a] dark:text-slate-200 font-medium">{job.experienceRequired}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#939bb4]" />
            <span className="text-[#474d6a] dark:text-slate-200 font-medium">{job.salaryRange}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#939bb4]" />
            <span className="text-[#474d6a] dark:text-slate-200 font-medium truncate max-w-[130px]">
              {job.location}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-[#717b9e] dark:text-slate-400 line-clamp-2 mb-3.5 leading-relaxed">
          {job.description}
        </p>

        {/* Skills Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 5).map((skill) => {
            const isMatched = match?.matchedSkills.some(
              (m) => m.toLowerCase() === skill.toLowerCase()
            );
            return (
              <span
                key={skill}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${
                  isMatched
                    ? 'bg-[#e6f4ea] text-[#0d652d] border border-[#ceead6] dark:bg-[#0f2e1f] dark:text-[#4ade80] dark:border-[#14532d]'
                    : 'bg-[#f4f5f7] text-[#474d6a] border border-[#e7e7f0] dark:bg-[#1e293b] dark:text-slate-300 dark:border-[#334155]'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {job.skills.length > 5 && (
            <span className="text-[11px] px-2 py-1 rounded-md bg-[#f4f5f7] text-[#717b9e] border border-[#e7e7f0] dark:bg-[#1e293b] dark:text-slate-400 dark:border-[#334155]">
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: Posted time + Apply Button */}
      <div className="pt-3 border-t border-[#f0f0f5] dark:border-[#222f44] flex items-center justify-between gap-3 text-xs">
        <span className="text-[#939bb4] dark:text-slate-500 text-[11px]">
          {job.applicantsCount || 0} applicants • {new Date(job.postedAt).toLocaleDateString()}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelect(job)}
            className="text-xs font-semibold text-[#1b5afb] dark:text-[#60a5fa] hover:underline"
          >
            View Details
          </button>
          {hasApplied ? (
            <span className="px-3.5 py-1.5 rounded-full bg-[#e6f4ea] text-[#0d652d] dark:bg-[#0f2e1f] dark:text-[#4ade80] font-bold text-xs flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Applied
            </span>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#1b5afb] hover:bg-[#1648c7] transition shadow-xs"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
