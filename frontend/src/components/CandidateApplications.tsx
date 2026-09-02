import React, { useState, useEffect } from 'react';
import { Application } from '../types';
import { api } from '../services/api';
import {
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export const CandidateApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getMyApplications();
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#121224]">Applied Jobs ({applications.length})</h1>
        <p className="text-xs text-[#717b9e] mt-1">
          Track the status of your applications and recruiter responses.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#717b9e] text-xs">Loading applied jobs...</div>
      ) : applications.length === 0 ? (
        <div className="naukri-card p-12 text-center bg-white">
          <Clock className="w-12 h-12 text-[#275df5] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#121224]">No Applications Yet</h3>
          <p className="text-xs text-[#717b9e] mt-1 max-w-sm mx-auto">
            You haven't applied to any jobs yet. Browse available jobs and apply in one click!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="naukri-card p-5 bg-white space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#121224]">{app.job?.title || 'Engineering Role'}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#717b9e] mt-1">
                    <span className="font-semibold text-[#275df5]">{app.job?.company}</span>
                    <span>•</span>
                    <span>{app.job?.location}</span>
                    <span>•</span>
                    <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize self-start sm:self-auto ${
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
                  {app.status === 'hired' ? 'Selected / Offer' : app.status}
                </span>
              </div>

              {app.recruiterNotes && (
                <div className="p-3 rounded-lg bg-[#f8f9fb] border border-[#eef1f6] text-xs flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-[#275df5] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#121224]">Recruiter Note: </span>
                    <span className="text-[#474d6a]">{app.recruiterNotes}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
