import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  ClipboardCheck, CheckCircle2, Clock, AlertCircle, ArrowRight,
  Calendar, Search, Filter, Bell, Send, Check, User, Briefcase,
  Layers, MessageSquare, ChevronRight, BarChart3, Download, Sparkles,
  Flame, FileText, Award, RefreshCw, CheckSquare
} from 'lucide-react';


interface MissingEmployee {
  id: number;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  employee_id?: string;
  role: string;
  active_tasks_count: number;
  last_dpr_date?: string | null;
}

interface DPRTaskUpdateOut {
  id: number;
  task_id: number;
  task_title: string;
  today_work_summary: string;
  status_update: string;
  progress_percentage: number;
  hours_spent: number;
  remarks?: string;
}

interface OtherTaskOut {
  title: string;
  description: string;
  hours_spent: number;
  status: string;
}

interface DPROut {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  user_department?: string;
  user_designation?: string;
  user_employee_id?: string;
  report_date: string;
  total_hours: number;
  summary?: string;
  challenges?: string;
  plan_for_tomorrow?: string;
  other_tasks: OtherTaskOut[];
  task_updates: DPRTaskUpdateOut[];
  status: string;
  admin_remarks?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  created_at: string;
}

interface AdminOverviewData {
  date: string;
  total_employees: number;
  submitted_count: number;
  pending_count: number;
  submission_rate_percentage: number;
  total_hours_logged: number;
  missing_employees: MissingEmployee[];
  submissions: DPROut[];
}

export const AdminDPRPage: React.FC = () => {
  const { user } = useAuth();

  // Filters
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayDateStr);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Tab: "missing" vs "submissions" vs "archive"
  const [activeTab, setActiveTab] = useState<'missing' | 'submissions' | 'archive'>('missing');

  // Data Loading
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<AdminOverviewData | null>(null);
  const [archiveList, setArchiveList] = useState<DPROut[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reminder & Acknowledgement States
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [selectedDprForReview, setSelectedDprForReview] = useState<DPROut | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<string>('');
  const [acknowledging, setAcknowledging] = useState(false);

  // Departments list for filter
  const departments = [
    'All Departments',
    'Computer Science & Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Management & Commerce',
    'Law & Legal Studies',
    'Pharmacy & Health Sciences',
    'Agriculture & Applied Sciences',
    'DSW Administration'
  ];

  const fetchDailyOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const deptParam = selectedDept !== 'all' && selectedDept !== 'All Departments' ? `&department=${encodeURIComponent(selectedDept)}` : '';
      const data = await apiRequest<AdminOverviewData>(`/dpr/admin/daily-overview?date=${selectedDate}${deptParam}`);
      setOverviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load DPR administration overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = async () => {
    try {
      const data = await apiRequest<DPROut[]>('/dpr/admin/all');
      setArchiveList(data);
    } catch (err) {
      console.warn('Could not load archive:', err);
    }
  };

  useEffect(() => {
    fetchDailyOverview();
  }, [selectedDate, selectedDept]);

  useEffect(() => {
    if (activeTab === 'archive') {
      fetchArchive();
    }
  }, [activeTab]);

  // Send Broadcast Reminders to Missing Staff
  const handleSendReminders = async () => {
    setReminderSending(true);
    setReminderMsg(null);
    try {
      const res = await apiRequest<{ message: string; reminders_sent: number }>('/dpr/admin/send-reminders', 'POST');
      setReminderMsg(`✅ ${res.message}`);
      setTimeout(() => setReminderMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to send reminders');
    } finally {
      setReminderSending(false);
    }
  };

  // Acknowledge DPR
  const handleAcknowledgeDpr = async () => {
    if (!selectedDprForReview) return;
    setAcknowledging(true);
    try {
      const updated = await apiRequest<DPROut>(
        `/dpr/admin/${selectedDprForReview.id}/acknowledge`,
        'POST',
        { admin_remarks: adminRemarks.trim() || undefined, status: 'acknowledged' }
      );
      // Update local state
      setOverviewData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: prev.submissions.map(s => (s.id === updated.id ? updated : s))
        };
      });
      setSelectedDprForReview(null);
      setAdminRemarks('');
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge DPR');
    } finally {
      setAcknowledging(false);
    }
  };

  // Filter missing employees
  const filteredMissing = overviewData?.missing_employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.department && emp.department.toLowerCase().includes(q)) ||
      (emp.designation && emp.designation.toLowerCase().includes(q)) ||
      emp.email.toLowerCase().includes(q)
    );
  }) || [];

  // Filter submitted DPRs
  const filteredSubmissions = overviewData?.submissions.filter(sub => {
    const q = searchQuery.toLowerCase();
    return (
      (sub.user_name && sub.user_name.toLowerCase().includes(q)) ||
      (sub.user_department && sub.user_department.toLowerCase().includes(q)) ||
      (sub.summary && sub.summary.toLowerCase().includes(q))
    );
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-[var(--panel-border)] shadow-md relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              DSW Office Governance
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Target: {selectedDate}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-500" />
            DPR Monitoring & Oversight Portal
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Track daily progress report submissions across all university departments, inspect task updates, and enforce daily compliance.
          </p>
        </div>

        {/* Global Action: 1-Click Reminder */}
        <div className="flex items-center gap-3 z-10 flex-wrap">
          <button
            type="button"
            disabled={reminderSending}
            onClick={handleSendReminders}
            className="btn-primary py-2.5 px-4 text-xs font-bold gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-lg shadow-amber-500/20 text-white"
          >
            {reminderSending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Sending Broadcast...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>📢 Send Reminder to Pending Staff</span>
              </>
            )}
          </button>
        </div>
      </div>

      {reminderMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{reminderMsg}</span>
        </div>
      )}

      {/* Date & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 glass-panel p-4 rounded-2xl border border-[var(--panel-border)] text-xs">
        {/* Date Selector */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Select Report Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="glass-input py-1.5 text-xs font-bold"
          />
        </div>

        {/* Quick Date Presets */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Quick Date Presets:</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedDate(todayDateStr)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedDate === todayDateStr
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:bg-[var(--panel-border)]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setSelectedDate(y.toISOString().split('T')[0]);
              }}
              className="px-3 py-1.5 rounded-xl font-bold bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:bg-[var(--panel-border)]"
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Department Filter:</label>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="glass-input py-1.5 text-xs font-semibold"
          >
            {departments.map(d => (
              <option key={d} value={d === 'All Departments' ? 'all' : d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">Search Employee / Task:</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, dept..."
              className="glass-input pl-8 py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Faculty */}
        <div className="glass-panel p-4 rounded-2xl border border-[var(--panel-border)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <span>Total Faculty</span>
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)]">
            {overviewData?.total_employees || 0}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">Active Staff</div>
        </div>

        {/* Submitted Count */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 shadow-xs space-y-1 bg-emerald-500/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-500 uppercase tracking-wider">
            <span>DPRs Submitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500">
            {overviewData?.submitted_count || 0}
          </div>
          <div className="text-[10px] font-bold text-emerald-500/80">
            {overviewData?.submission_rate_percentage || 0}% Compliance Rate
          </div>
        </div>

        {/* Pending / Missing */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 shadow-xs space-y-1 bg-amber-500/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-500 uppercase tracking-wider">
            <span>DPRs Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">
            {overviewData?.pending_count || 0}
          </div>
          <div className="text-[10px] font-bold text-amber-500/80">
            Awaiting Submission
          </div>
        </div>

        {/* Total Work Hours */}
        <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 shadow-xs space-y-1 bg-purple-500/5">
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            <span>Total Hours Logged</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">
            {overviewData?.total_hours_logged || 0} hrs
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Across {overviewData?.submitted_count || 0} Reports
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--panel-border)] pb-2">
        <button
          onClick={() => setActiveTab('missing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'missing'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Missing Submissions ({filteredMissing.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'submissions'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Submitted Reports Feed ({filteredSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('archive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'archive'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All-Time Archive</span>
        </button>
      </div>

      {/* =======================================================================
          TAB 1: MISSING EMPLOYEES (PENDING DPR)
      ======================================================================= */}
      {activeTab === 'missing' && (
        <div className="space-y-4 animate-in fade-in">
          {filteredMissing.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-emerald-500">100% DPR Compliance!</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                All faculty and staff members have submitted their Daily Progress Report for <strong>{selectedDate}</strong>.
              </p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-[var(--panel-border)] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] text-[var(--text-secondary)] font-bold">
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Designation</th>
                      <th className="p-3.5">Active Tasks</th>
                      <th className="p-3.5">Last DPR Submitted</th>
                      <th className="p-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)]">
                    {filteredMissing.map(emp => (
                      <tr key={emp.id} className="hover:bg-[var(--card-bg-to)] transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-[var(--text-primary)]">{emp.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{emp.email}</div>
                        </td>
                        <td className="p-3.5 text-[var(--text-secondary)] font-medium">
                          {emp.department || '—'}
                        </td>
                        <td className="p-3.5 text-[var(--text-secondary)]">
                          {emp.designation || 'Faculty'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            {emp.active_tasks_count} Tasks
                          </span>
                        </td>
                        <td className="p-3.5 text-[var(--text-muted)]">
                          {emp.last_dpr_date ? (
                            <span className="font-medium text-[var(--text-secondary)]">{emp.last_dpr_date}</span>
                          ) : (
                            <span className="italic">Never submitted</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 2: SUBMITTED REPORTS FEED
      ======================================================================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-4 animate-in fade-in">
          {filteredSubmissions.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-[var(--panel-border)] space-y-2">
              <ClipboardCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No DPR Submissions Yet for this Date</h3>
              <p className="text-xs text-[var(--text-secondary)]">Submissions will appear here in real-time as employees submit their DPR.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubmissions.map(sub => (
                <div
                  key={sub.id}
                  className="glass-panel p-5 rounded-2xl border border-[var(--panel-border)] hover:border-emerald-500/40 transition-all shadow-sm space-y-4"
                >
                  {/* Submitter header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[var(--panel-border)] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {sub.user_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{sub.user_name}</h3>
                        <div className="text-[11px] text-[var(--text-muted)]">{sub.user_department || 'Faculty'}</div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      sub.status === 'acknowledged'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {sub.status}
                    </span>
                  </div>

                  {/* Summary counts */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)] text-center">
                      <div className="text-[10px] text-[var(--text-muted)]">Hours</div>
                      <div className="font-extrabold text-[var(--text-primary)]">{sub.total_hours}h</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)] text-center">
                      <div className="text-[10px] text-[var(--text-muted)]">Tasks Logged</div>
                      <div className="font-extrabold text-emerald-500">{sub.task_updates?.length || 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)] text-center">
                      <div className="text-[10px] text-[var(--text-muted)]">Other Duties</div>
                      <div className="font-extrabold text-teal-400">{sub.other_tasks?.length || 0}</div>
                    </div>
                  </div>

                  {/* Key summary snippet */}
                  {sub.summary && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                      {sub.summary}
                    </p>
                  )}

                  {/* Remarks status */}
                  {sub.admin_remarks && (
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                      <strong>DSW Feedback:</strong> {sub.admin_remarks}
                    </div>
                  )}

                  {/* Review Action */}
                  <div className="pt-2 border-t border-[var(--panel-border)] flex items-center justify-between">
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Submitted at {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDprForReview(sub);
                        setAdminRemarks(sub.admin_remarks || '');
                      }}
                      className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 3: ALL-TIME ARCHIVE
      ======================================================================= */}
      {activeTab === 'archive' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass-panel rounded-2xl border border-[var(--panel-border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--panel-border)] bg-[var(--card-bg-to)] text-[var(--text-secondary)] font-bold">
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Hours</th>
                    <th className="p-3.5">Tasks</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--panel-border)]">
                  {archiveList.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--card-bg-to)] transition-colors">
                      <td className="p-3.5 font-bold text-[var(--text-primary)]">{r.report_date}</td>
                      <td className="p-3.5 font-semibold text-[var(--text-primary)]">{r.user_name}</td>
                      <td className="p-3.5 text-[var(--text-secondary)]">{r.user_department || '—'}</td>
                      <td className="p-3.5 font-bold text-purple-400">{r.total_hours}h</td>
                      <td className="p-3.5 text-emerald-500 font-bold">{r.task_updates?.length || 0}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'acknowledged'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDprForReview(r);
                            setAdminRemarks(r.admin_remarks || '');
                          }}
                          className="btn-secondary py-1 px-2.5 text-[11px] font-bold text-emerald-500"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADMIN REVIEW & ACKNOWLEDGE DPR
      ======================================================================= */}
      {selectedDprForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel p-6 rounded-2xl border border-[var(--panel-border)] shadow-2xl space-y-5 text-[var(--text-primary)] relative">
            <button
              onClick={() => setSelectedDprForReview(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[var(--panel-border)] pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-lg">
                {selectedDprForReview.user_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-base font-black">
                  DPR Review: {selectedDprForReview.user_name}
                </h3>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mt-0.5">
                  <span>{selectedDprForReview.user_department}</span>
                  <span>•</span>
                  <span>Date: <strong>{selectedDprForReview.report_date}</strong></span>
                  <span>•</span>
                  <span className="text-purple-400 font-bold">{selectedDprForReview.total_hours} Hours Logged</span>
                </div>
              </div>
            </div>

            {/* Assigned Tasks Updates */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                Assigned Tasks Breakdown ({selectedDprForReview.task_updates?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {selectedDprForReview.task_updates?.map((tu, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[var(--text-primary)]">{tu.task_title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        tu.status_update === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tu.status_update === 'blocked'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {tu.status_update.replace('_', ' ')} • {tu.progress_percentage}% ({tu.hours_spent}h)
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-emerald-500/30">
                      {tu.today_work_summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Tasks */}
            {selectedDprForReview.other_tasks?.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-500" />
                  Other Activities Logged ({selectedDprForReview.other_tasks.length})
                </h4>
                <div className="space-y-2">
                  {selectedDprForReview.other_tasks.map((ot, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span>{ot.title}</span>
                        <span className="text-teal-400">{ot.hours_spent}h</span>
                      </div>
                      {ot.description && <p className="text-[var(--text-secondary)]">{ot.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Day Summaries */}
            {(selectedDprForReview.summary || selectedDprForReview.challenges || selectedDprForReview.plan_for_tomorrow) && (
              <div className="space-y-3 pt-3 border-t border-[var(--panel-border)] text-xs">
                {selectedDprForReview.summary && (
                  <div>
                    <div className="font-bold text-[var(--text-primary)] mb-0.5">Key Daily Accomplishments:</div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{selectedDprForReview.summary}</p>
                  </div>
                )}
                {selectedDprForReview.challenges && (
                  <div>
                    <div className="font-bold text-amber-400 mb-0.5">Challenges / Blockers:</div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{selectedDprForReview.challenges}</p>
                  </div>
                )}
                {selectedDprForReview.plan_for_tomorrow && (
                  <div>
                    <div className="font-bold text-purple-400 mb-0.5">Plan for Tomorrow:</div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{selectedDprForReview.plan_for_tomorrow}</p>
                  </div>
                )}
              </div>
            )}

            {/* Official Document & Google Drive Location */}
            <div className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Standard Geeta University DPR Document</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  📁 Drive Location: DSW &gt; DPR &gt; {selectedDprForReview.report_date}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/dpr/${selectedDprForReview.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Official Document</span>
                </a>
              </div>
            </div>

            {/* DSW Admin Acknowledgement & Remarks Input */}
            <div className="p-4 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span>DSW Office Feedback / Acknowledgement Remarks:</span>
                </label>
                <ImproveEnglishButton
                  text={adminRemarks}
                  onImproved={setAdminRemarks}
                  context="Admin feedback on employee daily progress report"
                  size="xs"
                />
              </div>
              <textarea
                rows={2}
                value={adminRemarks}
                onChange={e => setAdminRemarks(e.target.value)}
                placeholder="Optional feedback, guidance, or acknowledgement remarks for the faculty member..."
                className="glass-input text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedDprForReview(null)}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Close
              </button>


              <button
                type="button"
                disabled={acknowledging}
                onClick={handleAcknowledgeDpr}
                className="btn-primary py-2.5 px-6 text-xs font-bold gap-2 shadow-lg shadow-emerald-500/20"
              >
                {acknowledging ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Acknowledging...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acknowledge DPR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
