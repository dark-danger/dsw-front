import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import confetti from 'canvas-confetti';
import {
  ClipboardCheck, CheckCircle2, Clock, AlertCircle, ArrowRight, ArrowLeft,
  Sparkles, Calendar, Plus, Trash2, Check, Flame, ChevronRight, FileText,
  Briefcase, Send, Info, Eye, BarChart3, CheckSquare, Layers, Award
} from 'lucide-react';

interface TaskOut {
  id: number;
  title: string;
  description?: string;
  task_type: string;
  event_id?: number;
  event_title?: string;
  due_date?: string;
  priority: string;
  status: string;
}

interface TaskUpdateState {
  task_id: number;
  task_title: string;
  today_work_summary: string;
  status_update: 'completed' | 'in_progress' | 'blocked' | 'no_activity';
  progress_percentage: number;
  hours_spent: number;
  remarks: string;
}

interface OtherTaskState {
  title: string;
  description: string;
  hours_spent: number;
  status: 'completed' | 'in_progress';
}

interface DPROut {
  id: number;
  user_id: number;
  user_name?: string;
  report_date: string;
  total_hours: number;
  summary?: string;
  challenges?: string;
  plan_for_tomorrow?: string;
  other_tasks: OtherTaskState[];
  task_updates: {
    id: number;
    task_id: number;
    task_title: string;
    today_work_summary: string;
    status_update: string;
    progress_percentage: number;
    hours_spent: number;
    remarks?: string;
  }[];
  status: string;
  admin_remarks?: string;
  acknowledged_by_name?: string;
  acknowledged_at?: string;
  created_at: string;
}

interface DPRTodayStatus {
  is_submitted: boolean;
  report_id?: number | null;
  report_date: string;
  submitted_at?: string | null;
  assigned_tasks_count: number;
  pending_tasks_count: number;
  streak_count: number;
  dpr?: DPROut | null;
}

export const DPRPage: React.FC = () => {
  const { user } = useAuth();

  // Active Main Tab: "form" vs "history"
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Multi-step Wizard Step: 1 (Assigned Tasks), 2 (Other Tasks & Summary), 3 (Review & Submit)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data Loading States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // DPR State
  const [todayStatus, setTodayStatus] = useState<DPRTodayStatus | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskOut[]>([]);
  const [historyList, setHistoryList] = useState<DPROut[]>([]);
  const [selectedHistoryDpr, setSelectedHistoryDpr] = useState<DPROut | null>(null);

  // Form Fields
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdateState[]>([]);
  const [otherTasks, setOtherTasks] = useState<OtherTaskState[]>([]);
  const [overallSummary, setOverallSummary] = useState('');
  const [challenges, setChallenges] = useState('');
  const [planForTomorrow, setPlanForTomorrow] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Today Status
      const statusData = await apiRequest<DPRTodayStatus>('/dpr/today-status');
      setTodayStatus(statusData);

      // 2. Fetch User's Active Tasks
      const tasksData = await apiRequest<TaskOut[]>('/dpr/my-active-tasks');
      setActiveTasks(tasksData);

      // 3. Fetch DPR History
      const histData = await apiRequest<DPROut[]>('/dpr/my-history');
      setHistoryList(histData);

      // If today is already submitted, pre-populate form with existing submission
      if (statusData.is_submitted && statusData.dpr) {
        const existing = statusData.dpr;
        setOverallSummary(existing.summary || '');
        setChallenges(existing.challenges || '');
        setPlanForTomorrow(existing.plan_for_tomorrow || '');
        setOtherTasks(existing.other_tasks || []);

        // Map existing task updates
        const mappedUpdates: TaskUpdateState[] = tasksData.map(t => {
          const match = existing.task_updates?.find(u => u.task_id === t.id);
          if (match) {
            return {
              task_id: t.id,
              task_title: t.title,
              today_work_summary: match.today_work_summary,
              status_update: (match.status_update as any) || 'in_progress',
              progress_percentage: match.progress_percentage || (t.status === 'approved' ? 100 : 50),
              hours_spent: match.hours_spent || 1.0,
              remarks: match.remarks || ''
            };
          }
          return {
            task_id: t.id,
            task_title: t.title,
            today_work_summary: '',
            status_update: 'in_progress',
            progress_percentage: t.status === 'approved' ? 100 : 0,
            hours_spent: 0,
            remarks: ''
          };
        });
        setTaskUpdates(mappedUpdates);
      } else {
        // Initialize blank updates for active tasks
        const initialUpdates: TaskUpdateState[] = tasksData.map(t => ({
          task_id: t.id,
          task_title: t.title,
          today_work_summary: '',
          status_update: 'in_progress',
          progress_percentage: 25,
          hours_spent: 1.0,
          remarks: ''
        }));
        setTaskUpdates(initialUpdates);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load DPR workstation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update a specific task field
  const handleTaskUpdateChange = (taskId: number, field: keyof TaskUpdateState, value: any) => {
    setTaskUpdates(prev =>
      prev.map(tu => {
        if (tu.task_id === taskId) {
          const updated = { ...tu, [field]: value };
          // Auto-adjust progress percentage if marked completed
          if (field === 'status_update' && value === 'completed') {
            updated.progress_percentage = 100;
          }
          return updated;
        }
        return tu;
      })
    );
  };

  // Other tasks handlers
  const handleAddOtherTask = () => {
    setOtherTasks(prev => [
      ...prev,
      { title: '', description: '', hours_spent: 1.0, status: 'completed' }
    ]);
  };

  const handleRemoveOtherTask = (index: number) => {
    setOtherTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleOtherTaskChange = (index: number, field: keyof OtherTaskState, value: any) => {
    setOtherTasks(prev =>
      prev.map((ot, i) => (i === index ? { ...ot, [field]: value } : ot))
    );
  };

  // Calculate total hours
  const totalAssignedHours = taskUpdates.reduce((acc, curr) => acc + (Number(curr.hours_spent) || 0), 0);
  const totalOtherHours = otherTasks.reduce((acc, curr) => acc + (Number(curr.hours_spent) || 0), 0);
  const totalDailyHours = Number((totalAssignedHours + totalOtherHours).toFixed(1));

  // Step 1 validation
  const validateStep1 = () => {
    if (taskUpdates.length > 0) {
      // Check if user filled at least summary or status for active tasks
      const emptyTasks = taskUpdates.filter(t => !t.today_work_summary.trim());
      if (emptyTasks.length > 0) {
        // Warn if some tasks are completely empty
        if (!window.confirm(`You haven't entered work summaries for ${emptyTasks.length} task(s). Proceed anyway?`)) {
          return false;
        }
      }
    }
    return true;
  };

  // Step 2 validation
  const validateStep2 = () => {
    // Check if other tasks have titles if created
    for (let i = 0; i < otherTasks.length; i++) {
      if (!otherTasks[i].title.trim()) {
        alert(`Please specify a title for Additional Task #${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProceedToStep3 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Submission Handler
  const handleSubmitDPR = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        total_hours: totalDailyHours,
        summary: overallSummary.trim() || undefined,
        challenges: challenges.trim() || undefined,
        plan_for_tomorrow: planForTomorrow.trim() || undefined,
        task_updates: taskUpdates.map(tu => ({
          task_id: tu.task_id,
          task_title: tu.task_title,
          today_work_summary: tu.today_work_summary.trim() || 'No updates logged.',
          status_update: tu.status_update,
          progress_percentage: Number(tu.progress_percentage) || 0,
          hours_spent: Number(tu.hours_spent) || 0,
          remarks: tu.remarks.trim() || undefined
        })),
        other_tasks: otherTasks.filter(ot => ot.title.trim()).map(ot => ({
          title: ot.title.trim(),
          description: ot.description.trim(),
          hours_spent: Number(ot.hours_spent) || 0,
          status: ot.status
        }))
      };

      await apiRequest<DPROut>('/dpr/submit', 'POST', payload);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setSubmitSuccess(true);
      // Refresh status and history
      await fetchData();
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to submit DPR. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-fade-in">
        <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[var(--text-secondary)]">Loading Daily Progress Report Workstation...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in">
      {/* Workstation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-[var(--panel-border)] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              DSW Workstation
            </span>
            <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              {formattedToday}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] font-display flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-emerald-500" />
            Daily Progress Report (DPR)
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Mandatory daily work update portal for task tracking, activity reporting, and performance scoring.
          </p>
        </div>

        {/* Top Quick Status Chips */}
        <div className="flex items-center gap-2.5 z-10 flex-wrap">
          {todayStatus?.is_submitted ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div>Today's DPR Submitted</div>
                <div className="text-[10px] font-medium text-emerald-600/80 dark:text-emerald-400/80">
                  Total: {todayStatus.dpr?.total_hours || 0} Hours Logged
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
              <div>
                <div>DPR Pending Today</div>
                <div className="text-[10px] font-medium text-amber-600/80 dark:text-amber-400/80">
                  {activeTasks.length} Assigned Tasks
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-[var(--text-primary)] text-xs font-bold shadow-xs">
            <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
            <div>
              <div>{todayStatus?.streak_count || 0} Days Streak</div>
              <div className="text-[10px] text-[var(--text-muted)]">Active Submission</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--panel-border)] pb-2">
        <button
          onClick={() => { setActiveTab('form'); setSubmitSuccess(false); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'form'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{todayStatus?.is_submitted ? 'Edit / View Today\'s DPR' : 'Fill Today\'s DPR'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Past DPR History ({historyList.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =======================================================================
          TAB 1: MULTI-STEP DPR FORM WORKSTATION
      ======================================================================= */}
      {activeTab === 'form' && (
        <div className="space-y-6">
          {/* Step Progress Wizard Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-[var(--panel-border)] shadow-xs">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
              {/* Step 1 */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
                  currentStep === 1
                    ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 dark:text-emerald-400 font-bold'
                    : currentStep > 1
                    ? 'bg-[var(--card-bg-to)] border border-emerald-500/30 text-emerald-500 font-semibold'
                    : 'opacity-50 text-[var(--text-muted)]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === 1
                    ? 'bg-emerald-500 text-white'
                    : currentStep > 1
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-[var(--card-bg-to)] text-[var(--text-muted)]'
                }`}>
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <div className="hidden xs:block">
                  <div className="text-xs font-bold truncate">Assigned Tasks</div>
                  <div className="text-[10px] opacity-75">{activeTasks.length} Active Tasks</div>
                </div>
              </button>

              {/* Step 2 */}
              <button
                type="button"
                onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
                  currentStep === 2
                    ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 dark:text-emerald-400 font-bold'
                    : currentStep > 2
                    ? 'bg-[var(--card-bg-to)] border border-emerald-500/30 text-emerald-500 font-semibold'
                    : 'opacity-50 text-[var(--text-muted)]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === 2
                    ? 'bg-emerald-500 text-white'
                    : currentStep > 2
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-[var(--card-bg-to)] text-[var(--text-muted)]'
                }`}>
                  {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <div className="hidden xs:block">
                  <div className="text-xs font-bold truncate">Other Tasks & Summary</div>
                  <div className="text-[10px] opacity-75">{otherTasks.length} Extra Tasks</div>
                </div>
              </button>

              {/* Step 3 */}
              <button
                type="button"
                onClick={() => { if (validateStep1() && validateStep2()) setCurrentStep(3); }}
                className={`flex items-center gap-2.5 p-2 sm:p-3 rounded-xl transition-all text-left ${
                  currentStep === 3
                    ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-500 dark:text-emerald-400 font-bold'
                    : 'opacity-50 text-[var(--text-muted)]'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === 3
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--card-bg-to)] text-[var(--text-muted)]'
                }`}>
                  3
                </div>
                <div className="hidden xs:block">
                  <div className="text-xs font-bold truncate">Review & Submit</div>
                  <div className="text-[10px] opacity-75">{totalDailyHours} Total Hrs</div>
                </div>
              </button>
            </div>
          </div>

          {/* ===================================================================
              STEP 1: ASSIGNED TASKS UPDATES
          =================================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                    Step 1: Updates on Assigned Tasks ({activeTasks.length})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Provide a detailed progress breakdown and status for each task assigned to you today.
                  </p>
                </div>
              </div>

              {activeTasks.length === 0 ? (
                <div className="glass-panel p-8 text-center rounded-2xl border border-dashed border-[var(--panel-border)] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">No Pending Assigned Tasks</h3>
                  <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                    You currently have no tasks assigned to you in the system. You can proceed to Step 2 to log any other unplanned or routine activities you completed today!
                  </p>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-2"
                  >
                    <span>Proceed to Additional Work</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTasks.map((task, idx) => {
                    const update = taskUpdates.find(u => u.task_id === task.id) || {
                      task_id: task.id,
                      task_title: task.title,
                      today_work_summary: '',
                      status_update: 'in_progress',
                      progress_percentage: 0,
                      hours_spent: 1.0,
                      remarks: ''
                    };

                    const priorityColor =
                      task.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        : task.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/30';

                    return (
                      <div
                        key={task.id}
                        className="glass-panel p-5 rounded-2xl border border-[var(--panel-border)] hover:border-emerald-500/30 transition-all shadow-sm space-y-4"
                      >
                        {/* Task Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--panel-border)] pb-3">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              #{idx + 1}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-[var(--text-primary)]">{task.title}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-[var(--text-muted)]">
                                {task.event_title && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                                    {task.event_title}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${priorityColor}`}>
                                  {task.priority} Priority
                                </span>
                                {task.due_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Option for this specific task */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <label className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                              Status Today:
                            </label>
                            <select
                              value={update.status_update}
                              onChange={e => handleTaskUpdateChange(task.id, 'status_update', e.target.value)}
                              className="glass-input py-1.5 px-3 text-xs font-bold rounded-xl"
                            >
                              <option value="in_progress">⏳ In Progress / Ongoing</option>
                              <option value="completed">✅ Completed Today</option>
                              <option value="blocked">⚠️ Blocked / Facing Issues</option>
                              <option value="no_activity">⏸️ No Activity Today</option>
                            </select>
                          </div>
                        </div>

                        {/* Detailed update input with AI Improve button */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <span>What specific work was accomplished today on this task?</span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <ImproveEnglishButton
                              text={update.today_work_summary}
                              onImproved={improved => handleTaskUpdateChange(task.id, 'today_work_summary', improved)}
                              context={`Daily progress update for task: ${task.title}`}
                              size="xs"
                            />
                          </div>
                          <textarea
                            rows={3}
                            required
                            value={update.today_work_summary}
                            onChange={e => handleTaskUpdateChange(task.id, 'today_work_summary', e.target.value)}
                            placeholder={`Describe what you worked on today for "${task.title}". Example: Drafted event schedule, coordinated with student team, finalized venue sound requirements...`}
                            className="glass-input text-xs leading-relaxed"
                          />
                        </div>

                        {/* Progress percentage slider & Hours spent */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                              <span>Task Completion Progress:</span>
                              <span className="font-extrabold text-emerald-500">{update.progress_percentage}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={update.progress_percentage}
                              onChange={e => handleTaskUpdateChange(task.id, 'progress_percentage', Number(e.target.value))}
                              className="w-full accent-emerald-500 cursor-pointer h-2 bg-[var(--card-bg-to)] rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                              Hours Spent Today on this Task:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={update.hours_spent}
                                onChange={e => handleTaskUpdateChange(task.id, 'hours_spent', Number(e.target.value))}
                                className="glass-input py-1.5 text-xs font-bold w-28"
                              />
                              <span className="text-xs text-[var(--text-muted)] font-medium">Hours</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 1 Navigation CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--panel-border)]">
                <div className="text-xs text-[var(--text-muted)] font-medium">
                  Assigned Tasks Hours: <strong className="text-emerald-500">{totalAssignedHours} hrs</strong>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="btn-primary py-2.5 px-5 text-xs font-bold gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>Proceed to Other Tasks & Summary</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              STEP 2: OTHER TASKS DONE & DAILY SUMMARY
          =================================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-500" />
                    Step 2: Additional Work & Daily Executive Summary
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Log any other unplanned duties, meetings, student mentoring, and overall summary of the day.
                  </p>
                </div>
              </div>

              {/* Additional / Other Tasks Repeater */}
              <div className="glass-panel p-5 rounded-2xl border border-[var(--panel-border)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-teal-500" />
                      Other Tasks / Unplanned Activities ({otherTasks.length})
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Ad-hoc duties, committee sessions, disciplinary meetings, student guidance, etc.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOtherTask}
                    className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Task</span>
                  </button>
                </div>

                {otherTasks.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[var(--text-muted)] italic">
                    No additional tasks added yet. Click <strong>"+ Add Another Task"</strong> if you performed other duties beyond assigned tasks today.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otherTasks.map((ot, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] space-y-3 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                              Activity / Task Title #{idx + 1}
                            </label>
                            <input
                              type="text"
                              required
                              value={ot.title}
                              onChange={e => handleOtherTaskChange(idx, 'title', e.target.value)}
                              placeholder="e.g. Conducted Club Executive meeting, Reviewed scholarship petitions..."
                              className="glass-input py-1.5 text-xs font-bold"
                            />
                          </div>

                          <div className="w-32">
                            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                              Hours Spent
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={ot.hours_spent}
                              onChange={e => handleOtherTaskChange(idx, 'hours_spent', Number(e.target.value))}
                              className="glass-input py-1.5 text-xs font-bold"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveOtherTask(idx)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors mt-4"
                            title="Remove this extra task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-bold text-[var(--text-secondary)]">
                              Detailed Summary of Work Done:
                            </label>
                            <ImproveEnglishButton
                              text={ot.description}
                              onImproved={improved => handleOtherTaskChange(idx, 'description', improved)}
                              context={`Summary for additional task: ${ot.title}`}
                              size="xs"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={ot.description}
                            onChange={e => handleOtherTaskChange(idx, 'description', e.target.value)}
                            placeholder="Detail what was achieved in this activity..."
                            className="glass-input text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Overall Day Summaries */}
              <div className="glass-panel p-5 rounded-2xl border border-[var(--panel-border)] space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--panel-border)] pb-3">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Overall Day Summary, Blockers & Plan for Tomorrow
                </h3>

                {/* Overall Summary */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Key Accomplishments & Daily Summary:
                    </label>
                    <ImproveEnglishButton
                      text={overallSummary}
                      onImproved={setOverallSummary}
                      context="Daily progress report summary highlights"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={overallSummary}
                    onChange={e => setOverallSummary(e.target.value)}
                    placeholder="Brief highlight of key milestones and outcomes achieved today across your duties..."
                    className="glass-input text-xs leading-relaxed"
                  />
                </div>

                {/* Challenges / Blockers */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Challenges, Impediments or Blockers Faced (if any):
                    </label>
                    <ImproveEnglishButton
                      text={challenges}
                      onImproved={setChallenges}
                      context="Challenges faced in daily progress report"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={challenges}
                    onChange={e => setChallenges(e.target.value)}
                    placeholder="Mention any issues requiring administrative support or inter-departmental approval..."
                    className="glass-input text-xs leading-relaxed"
                  />
                </div>

                {/* Plan for Tomorrow */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[var(--text-primary)]">
                      Priorities & Plan for Next Working Day:
                    </label>
                    <ImproveEnglishButton
                      text={planForTomorrow}
                      onImproved={setPlanForTomorrow}
                      context="Plan for tomorrow in daily progress report"
                      size="xs"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={planForTomorrow}
                    onChange={e => setPlanForTomorrow(e.target.value)}
                    placeholder="What are the main tasks you will focus on tomorrow?"
                    className="glass-input text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* Step 2 Navigation CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--panel-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Assigned Tasks</span>
                </button>

                <div className="text-xs text-[var(--text-muted)] font-medium">
                  Total Hours Logged: <strong className="text-emerald-500">{totalDailyHours} hrs</strong>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep3}
                  className="btn-primary py-2.5 px-5 text-xs font-bold gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>Proceed to Final Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================
              STEP 3: REVIEW & FINAL SUBMIT
          =================================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-500" />
                    Step 3: Review & Finalize Today's DPR
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Please inspect your daily updates before submitting to the Dean of Student Welfare office.
                  </p>
                </div>
              </div>

              {submitSuccess && (
                <div className="glass-panel p-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-300">
                      DPR Successfully Submitted & Archived!
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                      Your Daily Progress Report for <strong className="text-[var(--text-primary)]">{formattedToday}</strong> has been recorded and saved in <strong className="text-emerald-500">Google Drive &gt; DSW &gt; DPR &gt; {todayStatus?.report_date || formattedToday}</strong>.
                    </p>
                  </div>

                  {todayStatus?.dpr?.id && (
                    <div className="p-3 rounded-xl bg-[var(--card-bg-to)] border border-emerald-500/30 max-w-md mx-auto flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-left">
                        <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">Official DPR Document</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Saved in DSW/DPR/{todayStatus.report_date}/</div>
                        </div>
                      </div>

                      <a
                        href={`/api/dpr/${todayStatus.dpr.id}/document`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary py-1.5 px-3 text-xs font-bold shrink-0 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className="btn-secondary py-2 px-4 text-xs font-bold"
                    >
                      View in History
                    </button>
                  </div>
                </div>
              )}


              {/* Review Executive Summary Card */}
              <div className="glass-panel p-6 rounded-2xl border border-[var(--panel-border)] space-y-5">
                {/* Meta stats banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs">
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Report Date</div>
                    <div className="font-extrabold text-[var(--text-primary)] mt-0.5">{formattedToday}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Employee</div>
                    <div className="font-extrabold text-[var(--text-primary)] mt-0.5">{user?.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Assigned Tasks</div>
                    <div className="font-extrabold text-emerald-500 mt-0.5">{taskUpdates.length} Updated</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Work Hours</div>
                    <div className="font-extrabold text-purple-400 mt-0.5">{totalDailyHours} Hours</div>
                  </div>
                </div>

                {/* Assigned Tasks Summary Review */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    Assigned Tasks Updates ({taskUpdates.length})
                  </h4>

                  {taskUpdates.length === 0 ? (
                    <div className="text-xs text-[var(--text-muted)] italic">No assigned tasks logged.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {taskUpdates.map((tu, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                              <span>#{idx + 1}</span> {tu.task_title}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              tu.status_update === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : tu.status_update === 'blocked'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {tu.status_update.replace('_', ' ')} • {tu.progress_percentage}% ({tu.hours_spent}h)
                            </span>
                          </div>
                          <p className="text-[var(--text-secondary)] leading-relaxed pl-5 border-l-2 border-emerald-500/30">
                            {tu.today_work_summary || 'No detailed narrative entered.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional Tasks Review */}
                {otherTasks.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-teal-500" />
                      Other Activities Completed ({otherTasks.length})
                    </h4>
                    <div className="space-y-2">
                      {otherTasks.map((ot, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                            <span>{ot.title}</span>
                            <span className="text-teal-400">{ot.hours_spent} Hours</span>
                          </div>
                          {ot.description && (
                            <p className="text-[var(--text-secondary)] leading-relaxed">{ot.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall Summary & Notes Review */}
                {(overallSummary || challenges || planForTomorrow) && (
                  <div className="space-y-3 pt-3 border-t border-[var(--panel-border)] text-xs">
                    {overallSummary && (
                      <div>
                        <div className="font-bold text-[var(--text-primary)] mb-0.5">Key Highlights:</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{overallSummary}</p>
                      </div>
                    )}
                    {challenges && (
                      <div>
                        <div className="font-bold text-amber-400 mb-0.5">Challenges / Blockers:</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{challenges}</p>
                      </div>
                    )}
                    {planForTomorrow && (
                      <div>
                        <div className="font-bold text-purple-400 mb-0.5">Plan for Tomorrow:</div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{planForTomorrow}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--panel-border)]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Edit</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitDPR}
                  className="btn-primary py-3 px-8 text-sm font-black gap-2 shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Submitting DPR...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{todayStatus?.is_submitted ? 'Update Today\'s DPR' : 'Submit Today\'s DPR'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 2: PAST DPR HISTORY & CALENDAR
      ======================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                My DPR Submission History
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Archived logs of all daily progress reports submitted by you.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--card-bg-to)] border border-[var(--panel-border)]">
                🔥 Streak: <strong className="text-orange-500">{todayStatus?.streak_count || 0} Days</strong>
              </span>
            </div>
          </div>

          {historyList.length === 0 ? (
            <div className="glass-panel p-10 text-center rounded-2xl border border-[var(--panel-border)] space-y-3">
              <Calendar className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">No Past DPR Records</h3>
              <p className="text-xs text-[var(--text-secondary)]">You have not submitted any Daily Progress Reports yet.</p>
              <button
                onClick={() => { setActiveTab('form'); setCurrentStep(1); }}
                className="btn-primary py-2 px-4 text-xs font-bold"
              >
                Submit First DPR
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {historyList.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedHistoryDpr(item)}
                  className="glass-panel p-5 rounded-2xl border border-[var(--panel-border)] hover:border-emerald-500/40 cursor-pointer transition-all hover:shadow-lg space-y-3 group"
                >
                  <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span className="font-black text-sm text-[var(--text-primary)]">
                        {item.report_date}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      item.status === 'acknowledged'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Hours</div>
                      <div className="font-extrabold text-[var(--text-primary)]">{item.total_hours}h</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Tasks</div>
                      <div className="font-extrabold text-emerald-500">{item.task_updates?.length || 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--card-bg-to)]">
                      <div className="text-[10px] text-[var(--text-muted)]">Other Duties</div>
                      <div className="font-extrabold text-teal-400">{item.other_tasks?.length || 0}</div>
                    </div>
                  </div>

                  {item.summary && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>
                  )}

                  {item.admin_remarks && (
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
                      <strong>DSW Remark:</strong> {item.admin_remarks}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-emerald-500 font-bold group-hover:translate-x-1 transition-transform pt-1">
                    <span>View Detailed Report</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          MODAL: DETAILED PAST DPR VIEW
      ======================================================================= */}
      {selectedHistoryDpr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-panel p-6 rounded-2xl border border-[var(--panel-border)] shadow-2xl space-y-5 text-[var(--text-primary)] relative">
            <button
              onClick={() => setSelectedHistoryDpr(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">Daily Progress Report — {selectedHistoryDpr.report_date}</h3>
                <p className="text-xs text-[var(--text-secondary)]">Total Logged Hours: {selectedHistoryDpr.total_hours} Hours</p>
              </div>
            </div>

            {/* Tasks breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Assigned Task Progress
              </h4>
              {selectedHistoryDpr.task_updates?.map((tu, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>{tu.task_title}</span>
                    <span className="text-emerald-500">{tu.status_update} • {tu.progress_percentage}% ({tu.hours_spent}h)</span>
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{tu.today_work_summary}</p>
                </div>
              ))}
            </div>

            {/* Additional tasks */}
            {selectedHistoryDpr.other_tasks?.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Additional Work
                </h4>
                {selectedHistoryDpr.other_tasks.map((ot, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--card-bg-to)] border border-[var(--panel-border)] text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span>{ot.title}</span>
                      <span className="text-teal-400">{ot.hours_spent}h</span>
                    </div>
                    {ot.description && <p className="text-[var(--text-secondary)]">{ot.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Summaries */}
            {selectedHistoryDpr.summary && (
              <div className="pt-2 text-xs">
                <div className="font-bold text-[var(--text-primary)]">Key Highlights:</div>
                <p className="text-[var(--text-secondary)] mt-0.5">{selectedHistoryDpr.summary}</p>
              </div>
            )}

            {/* Document and Drive Folder Info */}
            <div className="p-3.5 rounded-xl bg-[var(--card-bg-to)] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Geeta University Official DPR Document</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  📁 Drive Location: DSW &gt; DPR &gt; {selectedHistoryDpr.report_date}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/dpr/${selectedHistoryDpr.id}/document`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Document</span>
                </a>
              </div>
            </div>

            {selectedHistoryDpr.admin_remarks && (
              <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-300">
                <strong>DSW Acknowledgement:</strong> {selectedHistoryDpr.admin_remarks} (by {selectedHistoryDpr.acknowledged_by_name || 'Admin'})
              </div>
            )}

            <button
              onClick={() => setSelectedHistoryDpr(null)}
              className="w-full btn-secondary py-2 text-xs font-bold justify-center"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
