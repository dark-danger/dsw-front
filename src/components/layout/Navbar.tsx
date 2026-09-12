import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Shield, GraduationCap, Briefcase, Sparkles } from 'lucide-react';
import { NotificationModal } from '../notifications/NotificationModal';

export const Navbar: React.FC<{ title: string }> = ({ title }) => {
  const { user, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const roleBadge = () => {
    if (user?.role === 'super_admin') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-xs">
          <Shield className="w-3 h-3" /> DSW Admin
        </span>
      );
    }
    if (user?.role === 'faculty') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1 shadow-xs">
          <Briefcase className="w-3 h-3" /> Faculty
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
        <GraduationCap className="w-3 h-3" /> Student
      </span>
    );
  };

  return (
    <>
      <header className="h-16 border-b border-white/10 bg-[#040806]/90 backdrop-blur-2xl sticky top-0 z-40 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-gradient-to-b from-[#0e8a6e] to-emerald-400 rounded-full" />
          <h1 className="text-lg font-extrabold tracking-tight text-white font-display">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNotifOpen(true)}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-950/40 border border-white/10 transition-all relative"
            title="Broadcast Notifications"
          >
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 badge-pulse" />
          </button>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0e8a6e] to-emerald-500 border border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.name.charAt(0) || 'U'}
            </div>

            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white">{user?.name}</div>
              <div className="mt-0.5">{roleBadge()}</div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <NotificationModal isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
