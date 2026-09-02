import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { api } from '../services/api';
import {
  Bell,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Briefcase,
  PlusCircle,
  Building2,
  Users,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAuthModal: () => void;
  openPostJobModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openAuthModal,
  openPostJobModal,
  darkMode,
  setDarkMode,
}) => {
  const { user, logout, demoLogin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [showEmployerDropdown, setShowEmployerDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async () => {
    try {
      await api.markNotificationsRead();
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleSwitchRole = async (role: 'candidate' | 'recruiter') => {
    await demoLogin(role);
    setShowEmployerDropdown(false);
    if (role === 'recruiter') {
      setActiveTab('recruiter-jobs');
    } else {
      setActiveTab('jobs');
    }
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors border-b ${
      darkMode ? 'bg-[#131a29] border-[#222f44]' : 'bg-white border-[#e7e7f0]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Left: JobWallah Logo & Main Links */}
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setActiveTab(user?.role === 'recruiter' ? 'recruiter-jobs' : 'jobs')}
            >
              {/* JobWallah Icon */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1b5afb] to-[#4f46e5] flex items-center justify-center shadow-xs text-white font-black text-base">
                JW
              </div>
              <span className="font-black text-2xl tracking-tight text-[#1b5afb]">
                Job<span className="text-[#ff7555]">Wallah</span>
              </span>
            </div>

            {/* Left Nav items */}
            <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
              {user?.role === 'recruiter' ? (
                <>
                  <button
                    onClick={() => setActiveTab('recruiter-jobs')}
                    className={`transition pb-1 ${
                      activeTab === 'recruiter-jobs'
                        ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                        : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    Job Postings
                  </button>
                  <button
                    onClick={() => setActiveTab('talent-search')}
                    className={`transition pb-1 ${
                      activeTab === 'talent-search'
                        ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                        : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    Search Candidates
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className={`transition pb-1 ${
                      activeTab === 'jobs'
                        ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                        : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className={`transition pb-1 ${
                      activeTab === 'recommendations'
                        ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                        : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    Companies
                  </button>
                  <button
                    onClick={() => setActiveTab('resume-studio')}
                    className={`transition pb-1 ${
                      activeTab === 'resume-studio'
                        ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                        : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    Services & Resume
                  </button>
                  {user && (
                    <button
                      onClick={() => setActiveTab('applications')}
                      className={`transition pb-1 ${
                        activeTab === 'applications'
                          ? 'text-[#1b5afb] font-bold border-b-2 border-[#1b5afb]'
                          : darkMode ? 'text-[#94a3b8] hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                      }`}
                    >
                      Applied Jobs
                    </button>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Right: Actions, Dark Mode, Login, Register, For Employers */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition border ${
                darkMode
                  ? 'bg-[#1e293b] border-[#334155] text-amber-400 hover:text-amber-300'
                  : 'bg-[#f8f9fa] border-[#e7e7f0] text-[#474d6a] hover:text-[#121224]'
              }`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifPopover(!showNotifPopover);
                      if (unreadCount > 0) handleMarkRead();
                    }}
                    className={`p-2 rounded-full transition relative border ${
                      darkMode
                        ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-white'
                        : 'bg-[#f8f9fa] border-[#e7e7f0] text-[#474d6a] hover:text-[#121224]'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e11d48] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Popover */}
                  {showNotifPopover && (
                    <div className={`absolute right-0 mt-2 w-80 rounded-xl p-3 shadow-2xl border z-50 ${
                      darkMode ? 'bg-[#182234] border-[#2a3850]' : 'bg-white border-[#e7e7f0]'
                    }`}>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-700/20 mb-2">
                        <span className={`font-bold text-xs ${darkMode ? 'text-white' : 'text-[#121224]'}`}>Notifications</span>
                        <span className="text-[11px] text-[#1b5afb] font-semibold">{notifications.length} updates</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-[#94a3b8] text-center py-4">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-lg text-xs border ${
                                darkMode ? 'bg-[#1e2b42] border-[#293a58]' : 'bg-[#f8f9fb] border-[#eef1f6]'
                              }`}
                            >
                              <div className={`font-semibold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>{n.title}</div>
                              <p className={`mt-0.5 ${darkMode ? 'text-slate-300' : 'text-[#474d6a]'}`}>{n.message}</p>
                              <span className="text-[10px] text-[#94a3b8] mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className={`flex items-center gap-2 pl-2 border-l ${darkMode ? 'border-[#334155]' : 'border-[#e7e7f0]'}`}>
                  <div className="w-8 h-8 rounded-full bg-[#1b5afb] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className={`text-xs font-bold leading-tight ${darkMode ? 'text-white' : 'text-[#121224]'}`}>{user.name}</div>
                    <div className="text-[10px] text-[#717b9e] capitalize">
                      {user.role === 'recruiter' ? 'Employer' : 'Jobseeker'}
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 rounded-md text-[#717b9e] hover:text-[#e11d48] hover:bg-[#fdf2f4] transition ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={openAuthModal}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-[#1b5afb] border border-[#1b5afb] hover:bg-[#f0f4ff] transition"
                >
                  Login
                </button>

                <button
                  onClick={openAuthModal}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#e03b22] hover:bg-[#c9321c] transition shadow-xs"
                >
                  Register
                </button>
              </>
            )}

            {/* "For employers" Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowEmployerDropdown(!showEmployerDropdown)}
                className={`text-sm font-medium flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  darkMode ? 'text-slate-300 hover:text-white' : 'text-[#474d6a] hover:text-[#121224]'
                }`}
              >
                <span>For employers</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showEmployerDropdown && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl p-2 shadow-xl border z-50 ${
                  darkMode ? 'bg-[#182234] border-[#2a3850]' : 'bg-white border-[#e7e7f0]'
                }`}>
                  <div className="p-2 border-b border-slate-700/10 mb-1">
                    <div className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-[#121224]'}`}>Employer Zone</div>
                    <div className="text-[11px] text-[#717b9e]">Post jobs & hire top talent</div>
                  </div>
                  <button
                    onClick={() => handleSwitchRole('recruiter')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      darkMode ? 'hover:bg-[#1e2b42] text-slate-200' : 'hover:bg-[#f4f5f7] text-[#121224]'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#1b5afb]" />
                    Switch to Employer Portal
                  </button>
                  <button
                    onClick={() => {
                      setShowEmployerDropdown(false);
                      openPostJobModal();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      darkMode ? 'hover:bg-[#1e2b42] text-slate-200' : 'hover:bg-[#f4f5f7] text-[#121224]'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-[#09804c]" />
                    Post a Job Vacancy
                  </button>
                  <button
                    onClick={() => handleSwitchRole('candidate')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                      darkMode ? 'hover:bg-[#1e2b42] text-slate-200' : 'hover:bg-[#f4f5f7] text-[#121224]'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#717b9e]" />
                    Switch to Jobseeker Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
