import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ClipboardCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface DPRTodayStatus {
  is_submitted: boolean;
  report_id?: number | null;
  report_date: string;
  streak_count: number;
}

export const DPRFloatingBadge: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<DPRTodayStatus | null>(null);

  useEffect(() => {
    if (user && (user.role === 'faculty' || user.role === 'super_admin')) {
      apiRequest<DPRTodayStatus>('/dpr/today-status')
        .then(data => setStatus(data))
        .catch(() => {});
    }
  }, [user]);

  if (!user || user.role === 'student' || !status) {
    return null;
  }

  const dprPath = user.role === 'super_admin' ? '/admin/dpr' : '/faculty/dpr';

  if (status.is_submitted) {
    return (
      <NavLink
        to={dprPath}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-2xs select-none"
        title="Today's DPR is submitted. Click to view or edit."
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>DPR Submitted</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={dprPath}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 transition-all animate-pulse shadow-sm select-none"
      title="Today's DPR is pending! Click to submit now."
    >
      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
      <span className="hidden xs:inline">DPR Pending</span>
      <span className="xs:hidden">DPR</span>
    </NavLink>
  );
};
