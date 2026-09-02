import React from 'react';
import { Job } from '../types';
import {
  X,
  Building2,
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  CheckCircle,
  Users,
} from 'lucide-react';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job) => void;
  hasApplied: boolean;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply,
  hasApplied,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#e7e7f0] shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#717b9e] hover:text-[#121224] hover:bg-[#f4f5f7] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pr-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[#121224] leading-tight">{job.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#474d6a] mt-1.5">
            <span className="font-semibold text-[#275df5] text-sm">{job.company}</span>
            <span>•</span>
            <span className="text-[#717b9e]">{job.location}</span>
            <span>•</span>
            <span className="text-[#717b9e]">{job.type}</span>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#f8f9fb] border border-[#eef1f6] text-xs mb-6">
          <div>
            <div className="text-[#939bb4] font-medium">Experience Required</div>
            <div className="font-bold text-[#121224] mt-0.5 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-[#275df5]" />
              {job.experienceRequired}
            </div>
          </div>
          <div>
            <div className="text-[#939bb4] font-medium">Salary (CTC)</div>
            <div className="font-bold text-[#09804c] mt-0.5 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#09804c]" />
              {job.salaryRange}
            </div>
          </div>
          <div>
            <div className="text-[#939bb4] font-medium">Total Applicants</div>
            <div className="font-bold text-[#121224] mt-0.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#275df5]" />
              {job.applicantsCount || 0} applied
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-[#121224] uppercase tracking-wider mb-2">Job Description</h4>
          <div className="text-xs sm:text-sm text-[#474d6a] leading-relaxed whitespace-pre-line bg-[#fafbfd] p-4 rounded-xl border border-[#f0f0f5]">
            {job.description}
          </div>
        </div>

        {/* Key Skills */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-[#121224] uppercase tracking-wider mb-2">Key Skills</h4>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-md text-xs font-medium bg-[#f4f5f7] text-[#474d6a] border border-[#e7e7f0]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Perks */}
        {job.perks && job.perks.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-[#121224] uppercase tracking-wider mb-2">Perks and Benefits</h4>
            <div className="flex flex-wrap gap-2">
              {job.perks.map((perk) => (
                <span
                  key={perk}
                  className="px-3 py-1 rounded-md text-xs bg-[#f4fbf7] text-[#09804c] border border-[#d2edd9]"
                >
                  ✓ {perk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#f0f0f5] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#717b9e] hover:bg-[#f4f5f7] transition"
          >
            Close
          </button>
          {hasApplied ? (
            <div className="px-5 py-2 rounded-full bg-[#e6f4ea] text-[#0d652d] font-bold text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Already Applied
            </div>
          ) : (
            <button
              onClick={() => onApply(job)}
              className="px-6 py-2 rounded-full text-xs font-bold text-white bg-[#275df5] hover:bg-[#1e4bd8] transition shadow-xs"
            >
              Apply to Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
