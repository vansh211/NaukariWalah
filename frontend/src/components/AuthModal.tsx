import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Building, MapPin, Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'candidate' | 'recruiter';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'candidate',
}) => {
  const { login, signup, demoLogin } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'candidate' | 'recruiter'>(defaultRole);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signup({
          name,
          email,
          password,
          role,
          company: role === 'recruiter' ? company : undefined,
          phone,
          location,
        });
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (demoRole: 'candidate' | 'recruiter') => {
    setLoading(true);
    try {
      await demoLogin(demoRole);
      onClose();
    } catch {
      setError('Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-[#e7e7f0] shadow-2xl p-6 sm:p-8">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#717b9e] hover:text-[#121224] hover:bg-[#f4f5f7] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <span className="font-black text-2xl tracking-tight text-[#1a2b49]">
            naukri<span className="text-[#ff7555] text-3xl font-black leading-none">.</span>
            <span className="text-xs font-bold text-[#275df5] ml-0.5">com</span>
          </span>
          <h2 className="text-lg font-bold text-[#121224] mt-2">
            {isSignUp ? 'Create your Naukri account' : 'Login to your account'}
          </h2>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="bg-[#f8f9fb] border border-[#eef1f6] rounded-xl p-3 mb-4">
          <div className="text-[11px] font-semibold text-[#717b9e] mb-1.5 text-center">
            Quick 1-Click Demo Login
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('candidate')}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-[#eef3ff] hover:bg-[#e2ebfc] text-[#275df5] border border-[#d0dcf5] transition"
            >
              Demo Jobseeker
            </button>
            <button
              type="button"
              onClick={() => handleDemo('recruiter')}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-[#f4fbf7] hover:bg-[#e6f4ea] text-[#09804c] border border-[#c3e6cb] transition"
            >
              Demo Employer
            </button>
          </div>
        </div>

        {/* Role Toggle when signing up */}
        {isSignUp && (
          <div className="flex rounded-lg bg-[#f4f5f7] p-1 mb-4">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                role === 'candidate' ? 'bg-white text-[#121224] shadow-xs' : 'text-[#717b9e]'
              }`}
            >
              I am a Jobseeker
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                role === 'recruiter' ? 'bg-white text-[#121224] shadow-xs' : 'text-[#717b9e]'
              }`}
            >
              I am an Employer
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-[#fce8e6] border border-[#fad2cf] text-[#c5221f] text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isSignUp && (
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
          )}

          <div>
            <label className="block text-[#474d6a] font-medium mb-1">Email ID</label>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>

          <div>
            <label className="block text-[#474d6a] font-medium mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
            />
          </div>

          {isSignUp && role === 'recruiter' && (
            <div>
              <label className="block text-[#474d6a] font-medium mb-1">Company Name</label>
              <input
                type="text"
                required
                placeholder="e.g. InnovateX Global"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
              />
            </div>
          )}

          {isSignUp && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#474d6a] font-medium mb-1">City</label>
                <input
                  type="text"
                  placeholder="Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
                />
              </div>
              <div>
                <label className="block text-[#474d6a] font-medium mb-1">Mobile</label>
                <input
                  type="text"
                  placeholder="+91 98765..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#fafbfd] border border-[#e7e7f0] text-[#121224] focus:outline-none focus:border-[#275df5]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full font-bold text-white bg-[#275df5] hover:bg-[#1e4bd8] transition shadow-xs mt-2"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Register Now' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-[#717b9e]">
          {isSignUp ? 'Already registered?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="font-bold text-[#275df5] hover:underline"
          >
            {isSignUp ? 'Login' : 'Register for free'}
          </button>
        </div>
      </div>
    </div>
  );
};
