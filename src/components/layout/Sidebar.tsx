import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, CheckSquare, Megaphone,
  HelpCircle, FileText, MessageSquareHeart, Trophy, Medal,
  GraduationCap, Sparkles, Shield, FileCheck, Award
} from 'lucide-react';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const adminNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Faculty Management', path: '/admin/faculty', icon: <Users className="w-4 h-4" /> },
    { label: 'Events & Reports', path: '/admin/events', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Task Assignment', path: '/admin/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Event Duty Charts', path: '/admin/duty-charts', icon: <FileCheck className="w-4 h-4 text-emerald-400" /> },
    { label: 'Core Committees', path: '/admin/committees', icon: <Award className="w-4 h-4 text-teal-400" /> },
    { label: 'Clubs & Societies', path: '/admin/clubs', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
    { label: 'Announcements', path: '/admin/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Query Inbox', path: '/admin/queries', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Dynamic Forms', path: '/admin/forms', icon: <FileText className="w-4 h-4" /> },
    { label: 'Feedback Forms', path: '/admin/feedback', icon: <MessageSquareHeart className="w-4 h-4" /> },
    { label: 'Student Leaderboard', path: '/admin/leaderboard/students', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { label: 'Staff Leaderboard', path: '/admin/leaderboard/staff', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
    { label: 'Club Leaderboard', path: '/admin/leaderboard/clubs', icon: <Trophy className="w-4 h-4 text-rose-400" /> },
  ];

  const facultyNav: SidebarItem[] = [
    { label: 'My Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Assigned Tasks', path: '/faculty/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { label: 'Event Duty Charts', path: '/faculty/duty-charts', icon: <FileCheck className="w-4 h-4 text-emerald-400" /> },
    { label: 'Core Committees', path: '/faculty/committees', icon: <Award className="w-4 h-4 text-teal-400" /> },
    { label: 'Clubs & Societies', path: '/faculty/clubs', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
    { label: 'Announcements', path: '/faculty/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Raise Query', path: '/faculty/queries', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Staff Leaderboard', path: '/faculty/leaderboard', icon: <Medal className="w-4 h-4 text-emerald-400" /> },
    { label: 'Club Leaderboard', path: '/faculty/leaderboard/clubs', icon: <Trophy className="w-4 h-4 text-rose-400" /> },
  ];

  const studentNav: SidebarItem[] = [
    { label: 'Student Portal', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Core Committees', path: '/student/committees', icon: <Award className="w-4 h-4 text-teal-400" /> },
    { label: 'Clubs & Societies', path: '/student/clubs', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
    { label: 'Announcements', path: '/student/announcements', icon: <Megaphone className="w-4 h-4" /> },
    { label: 'Raise Query', path: '/student/queries', icon: <HelpCircle className="w-4 h-4" /> },
    { label: 'Leaderboard Tasks', path: '/student/leaderboard-tasks', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    { label: 'Student Leaderboard', path: '/student/leaderboard', icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    { label: 'Club Leaderboard', path: '/student/leaderboard/clubs', icon: <Trophy className="w-4 h-4 text-rose-400" /> },
  ];

  const navItems = user?.role === 'super_admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav;

  return (
    <aside className="w-64 border-r border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-2xl h-screen flex flex-col shrink-0 sticky top-0 z-30 shadow-xs transition-colors">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[var(--panel-border)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0e8a6e] via-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-500/30 border border-white/20">
          GU
        </div>
        <div>
          <div className="font-extrabold text-sm text-[var(--text-primary)] tracking-tight flex items-center gap-1.5">
            GEETA UNIVERSITY
          </div>
          <div className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">DSW PORTAL</div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/40 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/10 hover:border hover:border-emerald-500/20 hover:translate-x-0.5'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[var(--panel-border)] bg-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">v1.0 Live</span>
      </div>
    </aside>
  );
};
