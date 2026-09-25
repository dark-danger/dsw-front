import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { 
  AlertCircle, CheckCircle2, Clock, ArrowRight, X, 
  Sparkles, Calendar, ClipboardCheck, Flame 
} from 'lucide-react';

interface DPRTodayStatus {
  is_submitted: boolean;
  report_id?: number | null;
  report_date: string;
  submitted_at?: string | null;
  assigned_tasks_count: number;
  pending_tasks_count: number;
  streak_count: number;
}

export const DPRReminderModal: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [dprStatus, setDprStatus] = useState<DPRTodayStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Only show for faculty and staff (or non-super_admin users who submit DPRs)
  const isEligibleRole = user && (user.role === 'faculty' || user.role === 'super_admin');

  const checkStatus = async () => {
    if (!user || user.role === 'student') return;

    try {
      setLoading(true);
      const data = await apiRequest<DPRTodayStatus>('/dpr/today-status');
      setDprStatus(data);

      // Check if user already dismissed the modal in this session for today
      const todayKey = `dpr_reminder_dismissed_${data.report_date}_${user.id}`;
      const isDismissed = sessionStorage.getItem(todayKey);

      // If not submitted, not dismissed, and not currently on the DPR page itself
      if (!data.is_submitted && !isDismissed && !location.pathname.includes('/dpr')) {
        setIsOpen(true);
      }
    } catch (err) {
      console.warn('Could not check DPR status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEligibleRole) {
      checkStatus();
    }
  }, [user?.id, location.pathname]);

  const handleDismiss = () => {
    if (dprStatus) {
      const todayKey = `dpr_reminder_dismissed_${dprStatus.report_date}_${user?.id}`;
      sessionStorage.setItem(todayKey, 'true');
    }
    setIsOpen(false);
  };

  const handleGoToDpr = () => {
    setIsOpen(false);
    if (user?.role === 'super_admin') {
      navigate('/admin/dpr');
    } else {
      navigate('/faculty/dpr');
    }
  };

  if (!isOpen || !dprStatus || dprStatus.is_submitted) {
    return null;
  }

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg glass-panel bg-[var(--card-bg-from)] border-2 border-amber-500/40 shadow-2xl rounded-2xl p-6 relative overflow-hidden text-[var(--text-primary)]"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)] transition-colors"
          title="Remind me later"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 tracking-wide uppercase">
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            Daily DPR Pending
          </span>
          <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-[var(--text-primary)]">
              Daily Progress Report (DPR) Reminder
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
              Hello <strong className="text-[var(--text-primary)]">{user?.name}</strong>, your DPR for today has not been submitted yet. Please log your task updates and activities before closing.
            </p>
          </div>
        </div>

        {/* Quick Highlights Card */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] mb-5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 font-bold">
              {dprStatus.pending_tasks_count}
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">{dprStatus.pending_tasks_count} Active Tasks</div>
              <div className="text-[10px] text-[var(--text-muted)]">Awaiting updates</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-[var(--text-primary)]">{dprStatus.streak_count} Days Streak</div>
              <div className="text-[10px] text-[var(--text-muted)]">Keep it alive!</div>
            </div>
          </div>
        </div>

        {/* Features preview */}
        <div className="space-y-1.5 mb-5 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Update task progress, completion status & hours spent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>Add other extra tasks or unplanned activities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="flex items-center gap-1">
              One-click <Sparkles className="w-3 h-3 text-purple-400 inline" /> Gemini AI text enhancement on all updates
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 btn-secondary justify-center py-2.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Remind Me Later
          </button>
          
          <button
            type="button"
            onClick={handleGoToDpr}
            className="flex-1 btn-primary justify-center py-2.5 text-xs font-bold gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span>Fill DPR Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
