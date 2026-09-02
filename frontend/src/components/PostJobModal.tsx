import React, { useState } from 'react';
import { api } from '../services/api';
import {
  X,
  PlusCircle,
  Trash2,
} from 'lucide-react';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('InnovateX Global');
  const [location, setLocation] = useState('Bengaluru');
  const [type, setType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid'>('Full-time');
  const [minExperience, setMinExperience] = useState(2);
  const [salaryRange, setSalaryRange] = useState('₹ 15 - 25 Lacs PA');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB']);
  const [skillInput, setSkillInput] = useState('');
  const [perks, setPerks] = useState<string[]>(['Health Insurance', 'Flexible Hours', 'Annual Bonus']);
  const [perkInput, setPerkInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleAddPerk = () => {
    if (perkInput.trim() && !perks.includes(perkInput.trim())) {
      setPerks([...perks, perkInput.trim()]);
      setPerkInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.createJob({
        title,
        company,
        location,
        type,
        experienceRequired: `${minExperience}-${minExperience + 3} Yrs`,
        minExperience,
        salaryRange,
        description,
        skills,
        perks,
      });
      onJobCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#e7e7f0] shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#717b9e] hover:text-[#121224] hover:bg-[#f4f5f7] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#121224]">Post a Job Opening</h2>
          <p className="text-xs text-[#717b9e] mt-0.5">Reach top matching candidates on Naukri</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Company Name</label>
              <input
                type="text"
                placeholder="e.g. InnovateX Global"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru, Hyderabad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Job Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              >
                <option value="Full-time">Full-time</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Salary (CTC)</label>
              <input
                type="text"
                placeholder="e.g. ₹ 18 - 25 Lacs PA"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#474d6a] font-medium mb-1">
              Minimum Experience: {minExperience} {minExperience === 1 ? 'Year' : 'Years'}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={minExperience}
              onChange={(e) => setMinExperience(parseInt(e.target.value, 10))}
              className="w-full accent-[#275df5] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[#474d6a] font-medium mb-1">Job Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Enter role responsibilities and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>

          {/* Key Skills */}
          <div>
            <label className="block text-[#474d6a] font-medium mb-1">Key Skills ({skills.length})</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Type skill & click Add"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill(e))}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-1.5 rounded-lg bg-[#275df5] text-white font-semibold"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-md bg-[#f4f5f7] text-[#474d6a] border border-[#e7e7f0] flex items-center gap-1.5"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                    className="text-[#939bb4] hover:text-[#e11d48]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#f0f0f5] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-[#717b9e] hover:bg-[#f4f5f7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full font-bold text-white bg-[#09804c] hover:bg-[#076a3e] shadow-xs"
            >
              {loading ? 'Posting...' : 'Post Job Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
