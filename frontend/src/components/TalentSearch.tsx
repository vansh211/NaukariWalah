import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  MapPin,
  Briefcase,
  Mail,
} from 'lucide-react';

export const TalentSearch: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [skill, setSkill] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [minExp, setMinExp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await api.searchCandidates({
        skill: skill.trim() || undefined,
        title: title.trim() || undefined,
        location: location.trim() || undefined,
        minExp: minExp > 0 ? minExp.toString() : undefined,
      });
      setCandidates(res.candidates || []);
    } catch (err) {
      console.error('Failed to search candidates', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#121224]">Search Candidates (Talent Pool)</h1>
        <p className="text-xs text-[#717b9e] mt-0.5">
          Find matching profiles by skills, experience, and location.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="naukri-card p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#939bb4] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Skills (e.g. React, Node.js)"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>

          <div className="relative">
            <Briefcase className="w-4 h-4 text-[#939bb4] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Designation (e.g. Full Stack)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-[#939bb4] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Location (e.g. Bengaluru, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-xs text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#f0f0f5]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#717b9e]">
              Min Experience: <strong className="text-[#121224]">{minExp} Yrs</strong>
            </span>
            <input
              type="range"
              min="0"
              max="10"
              value={minExp}
              onChange={(e) => setMinExp(parseInt(e.target.value, 10))}
              className="w-28 accent-[#275df5] cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSkill('');
                setTitle('');
                setLocation('');
                setMinExp(0);
                setTimeout(handleSearch, 50);
              }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-[#717b9e] hover:bg-[#f4f5f7]"
            >
              Reset
            </button>
            <button
              onClick={handleSearch}
              className="px-5 py-1.5 rounded-full bg-[#275df5] hover:bg-[#1e4bd8] text-white text-xs font-bold"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#939bb4]">Searching candidate database...</div>
      ) : candidates.length === 0 ? (
        <div className="naukri-card p-12 text-center bg-white text-[#717b9e] text-xs">
          No candidates found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="naukri-card p-5 bg-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-[#121224]">{cand.name}</h3>
                    <p className="text-xs text-[#275df5] font-semibold">{cand.title}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#f4f5f7] text-[#474d6a] font-semibold text-[11px]">
                    {cand.experienceYears}+ yrs exp
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#717b9e] mb-3">
                  <span>{cand.location}</span>
                  <span>•</span>
                  <span>{cand.email}</span>
                </div>

                <p className="text-xs text-[#717b9e] line-clamp-2 mb-3 leading-relaxed">
                  {cand.summary || 'Demonstrated experience in software development.'}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {(cand.skills || []).slice(0, 6).map((s: string) => (
                    <span
                      key={s}
                      className="text-[11px] px-2 py-0.5 rounded bg-[#f4f5f7] text-[#474d6a]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0f0f5]">
                <a
                  href={`mailto:${cand.email}?subject=Job Opportunity`}
                  className="w-full py-1.5 rounded-full bg-[#eef3ff] text-[#275df5] hover:bg-[#275df5] hover:text-white transition text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Candidate
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
