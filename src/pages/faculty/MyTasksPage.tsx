import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { CheckSquare, Upload, FileText, CheckCircle2, AlertCircle, Clock, Send, X } from 'lucide-react';
import { TaskProofSubmitter } from '../../components/tasks/TaskProofSubmitter';
import { ProofViewer } from '../../components/tasks/ProofViewer';

interface TaskSubmission {
  id: number;
  description: string;
  file_url?: string;
  file_name?: string;
  submitted_at: string;
  review_status: string;
  review_remarks?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  task_type: string;
  event_title?: string;
  start_date?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  submissions: TaskSubmission[];
}

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [submitDescription, setSubmitDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofName, setProofName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<TaskItem[]>('/tasks/mine');
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const handleSubmitDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);

    try {
      await apiRequest(`/tasks/${selectedTask.id}/submit`, 'POST', {
        description: submitDescription,
        file_url: proofUrl || undefined,
        file_name: proofName || undefined,
      });

      setSelectedTask(null);
      setSubmitDescription('');
      setProofUrl('');
      setProofName('');
      fetchMyTasks();
    } catch (err: any) {
      alert(err.message || 'Task submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-slate-100">My Assigned Duties & Tasks</h2>
        <p className="text-xs text-slate-400 mt-1">Submit duty completion reports and proof files to DSW Admin to earn leaderboard score (+10 on-time approval).</p>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 glass-panel">Loading your duties...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 glass-panel">You have no active tasks assigned at the moment.</div>
        ) : (
          tasks.map(t => {
            const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;

            return (
              <div
                key={t.id}
                className={`glass-panel p-6 space-y-3 relative ${
                  t.status === 'declined' ? 'border-l-4 border-l-rose-500 bg-slate-900/80' :
                  t.status === 'approved' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    t.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    t.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    Priority: {t.priority}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    t.status === 'submitted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    t.status === 'declined' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100">{t.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{t.description || 'No description'}</p>

                {/* Time Limit Badge */}
                {(t.start_date || t.due_date) && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20 text-xs font-medium text-blue-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      <strong>Duty Window:</strong> {t.start_date ? new Date(t.start_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'} → <strong className="text-amber-400">{t.due_date ? new Date(t.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Open Deadline'}</strong>
                    </span>
                  </div>
                )}

                {/* Previous Submission Proof Display */}
                {latestSub?.file_url && (
                  <div className="pt-1">
                    <ProofViewer url={latestSub.file_url} fileName={latestSub.file_name} />
                  </div>
                )}

                {/* Decline Remark Warning if present */}
                {t.status === 'declined' && latestSub?.review_remarks && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Decline Remarks from DSW Admin:
                    </div>
                    <p className="text-slate-200">{latestSub.review_remarks}</p>
                  </div>
                )}

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Event: {t.event_title || 'General Duty'}
                  </span>

                  {t.status !== 'approved' && (
                    <button
                      onClick={() => {
                        setSelectedTask(t);
                        setSubmitDescription(latestSub?.description || '');
                        setProofUrl(latestSub?.file_url || '');
                        setProofName(latestSub?.file_name || '');
                      }}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t.status === 'declined' ? 'Resubmit Corrected Duty' : 'Submit Duty Completion'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Submit Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" /> Submit Duty: {selectedTask.title}
              </h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDuty} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Completion Summary / Notes</label>
                <textarea
                  required
                  rows={3}
                  value={submitDescription}
                  onChange={e => setSubmitDescription(e.target.value)}
                  placeholder="Describe duty actions taken, venue status, logistics..."
                  className="glass-input"
                />
              </div>

              <TaskProofSubmitter
                valueUrl={proofUrl}
                valueName={proofName}
                onChange={(url, name) => {
                  setProofUrl(url);
                  setProofName(name || '');
                }}
                disabled={submitting}
              />

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting Duty...' : 'Submit to DSW Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
