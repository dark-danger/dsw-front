import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import {
  CheckSquare, Plus, CornerDownRight, CheckCircle2, XCircle, Clock,
  AlertCircle, FileText, User as UserIcon, Calendar, X, Eye, Pencil, Trash2
} from 'lucide-react';

interface Submission {
  id: number;
  submitted_by: number;
  submitter?: User;
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
  event_id?: number;
  event_title?: string;
  parent_task_id?: number;
  assigned_to: number;
  assignee?: User;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'declined';
  created_at: string;
  submissions: Submission[];
  subtasks: TaskItem[];
}

interface EventItem {
  id: number;
  title: string;
}

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<TaskItem | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [parentTaskIdForSubtask, setParentTaskIdForSubtask] = useState<number | null>(null);

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState<number | ''>('');
  const [editEventId, setEditEventId] = useState<number | ''>('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<number | ''>('');
  const [eventId, setEventId] = useState<number | ''>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const fetchTasksData = async () => {
    setLoading(true);
    try {
      const [tData, facData, evData] = await Promise.all([
        apiRequest<TaskItem[]>('/tasks'),
        apiRequest<User[]>('/users/faculty'),
        apiRequest<EventItem[]>('/events')
      ]);
      setTasks(tData);
      setFacultyList(facData);
      setEventsList(evData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) return alert('Select a faculty assignee');

    try {
      await apiRequest('/tasks', 'POST', {
        title,
        description,
        task_type: eventId ? 'event_linked' : 'general',
        event_id: eventId ? Number(eventId) : null,
        parent_task_id: parentTaskIdForSubtask,
        assigned_to: Number(assignedTo),
        priority,
      });

      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setParentTaskIdForSubtask(null);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to assign task');
    }
  };

  const handleOpenEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setEditTitle(t.title);
    setEditDescription(t.description || '');
    setEditAssignedTo(t.assigned_to);
    setEditEventId(t.event_id || '');
    setEditPriority(t.priority);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editAssignedTo) return alert('Select a faculty assignee');

    try {
      await apiRequest(`/tasks/${editingTask.id}`, 'PATCH', {
        title: editTitle,
        description: editDescription,
        assigned_to: Number(editAssignedTo),
        event_id: editEventId ? Number(editEventId) : null,
        priority: editPriority,
      });

      setEditingTask(null);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete task "${taskTitle}"?`)) return;
    try {
      await apiRequest(`/tasks/${taskId}`, 'DELETE');
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleApprove = async (taskId: number) => {
    try {
      await apiRequest(`/tasks/${taskId}/approve`, 'POST');
      setSelectedTaskForReview(null);
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Approve failed');
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForReview) return;
    if (!declineRemarks.trim()) return alert('Mandatory decline remarks must be provided!');

    try {
      await apiRequest(`/tasks/${selectedTaskForReview.id}/decline`, 'POST', {
        review_remarks: declineRemarks
      });
      setSelectedTaskForReview(null);
      setDeclineRemarks('');
      fetchTasksData();
    } catch (err: any) {
      alert(err.message || 'Decline failed');
    }
  };

  const renderTaskCard = (t: TaskItem, isSubtask = false) => {
    const latestSub = t.submissions && t.submissions.length > 0 ? t.submissions[t.submissions.length - 1] : null;

    return (
      <div
        key={t.id}
        className={`glass-card p-5 space-y-3 ${
          isSubtask ? 'ml-6 border-l-2 border-l-emerald-500 bg-black/40' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isSubtask && <CornerDownRight className="w-4 h-4 text-emerald-400 shrink-0" />}
            <h4 className="font-bold text-white text-base">{t.title}</h4>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
              t.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
              t.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {t.priority}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              t.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              t.status === 'submitted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              t.status === 'declined' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {t.status.toUpperCase()}
            </span>

            <button
              onClick={() => handleOpenEditModal(t)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Edit Task / Reassign Faculty"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDeleteTask(t.id, t.title)}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{t.description || 'No description provided.'}</p>

        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-blue-400" /> Assignee: <strong>{t.assignee?.name || 'Unassigned'}</strong>
            </span>
            {t.event_title && (
              <span className="flex items-center gap-1 text-purple-400">
                <Calendar className="w-3.5 h-3.5" /> {t.event_title}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSubtask && (
              <button
                onClick={() => {
                  setParentTaskIdForSubtask(t.id);
                  setIsCreateModalOpen(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + Add Subtask
              </button>
            )}

            {t.submissions && t.submissions.length > 0 ? (
              <button
                onClick={() => setSelectedTaskForReview(t)}
                className="btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Review Submission ({t.submissions.length})
              </button>
            ) : t.status !== 'approved' ? (
              <button
                onClick={() => handleApprove(t.id)}
                className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs py-1 px-3 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Task (+10 pts)
              </button>
            ) : null}
          </div>
        </div>

        {/* Nested Subtasks Render */}
        {t.subtasks && t.subtasks.length > 0 && (
          <div className="space-y-2 pt-2">
            {t.subtasks.map(st => renderTaskCard(st, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Task Assignment & Review Queue</h2>
          <p className="text-xs text-slate-400 mt-1">Assign micro-tasks, reassign duties, edit or delete tasks, and approve/decline submissions with automatic score adjustments.</p>
        </div>
        <button
          onClick={() => {
            setParentTaskIdForSubtask(null);
            setIsCreateModalOpen(true);
          }}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" /> Assign New Task
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 glass-panel">Loading task engine...</div>
        ) : tasks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 glass-panel">No tasks found. Click 'Assign New Task' to begin.</div>
        ) : (
          tasks.map(t => renderTaskCard(t))
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                {parentTaskIdForSubtask ? 'Create Nested Subtask' : 'Assign New Task'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Finalize Guest Accommodations" className="glass-input" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Instructions</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide detailed steps..." className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assignee (Faculty)</label>
                  <select required value={assignedTo} onChange={e => setAssignedTo(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                    <option value="">-- Select Faculty --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value as any)} className="glass-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Link to Event (Optional)</label>
                <select value={eventId} onChange={e => setEventId(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                  <option value="">-- Standalone Task --</option>
                  {eventsList.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task / Reassign Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-emerald-400" />
                Edit Task / Reassign Faculty
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
                <input required type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="glass-input" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Instructions</label>
                <textarea rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assignee (Reassign Duty)</label>
                  <select required value={editAssignedTo} onChange={e => setEditAssignedTo(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                    <option value="">-- Select Faculty --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select value={editPriority} onChange={e => setEditPriority(e.target.value as any)} className="glass-input">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Link to Event (Optional)</label>
                <select value={editEventId} onChange={e => setEditEventId(e.target.value ? Number(e.target.value) : '')} className="glass-input">
                  <option value="">-- Standalone Task --</option>
                  {eventsList.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {selectedTaskForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-xl glass-panel p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Review Submission: {selectedTaskForReview.title}</h3>
              <button onClick={() => setSelectedTaskForReview(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-400">
                Assigned to: <strong className="text-slate-200">{selectedTaskForReview.assignee?.name}</strong>
              </div>

              {selectedTaskForReview.submissions.map((sub, idx) => (
                <div key={sub.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400">Submission #{idx + 1}</span>
                    <span>{new Date(sub.submitted_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{sub.description}</p>
                  {sub.file_url && (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-mono"
                    >
                      <FileText className="w-4 h-4" /> View Proof File: {sub.file_name || 'Attachment'}
                    </a>
                  )}
                  {sub.review_remarks && (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300">
                      Previous Remark: {sub.review_remarks}
                    </div>
                  )}
                </div>
              ))}

              <form onSubmit={handleDecline} className="pt-2 space-y-3 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  Decline Remarks <span className="text-rose-400">(Mandatory if declining)</span>
                </label>
                <textarea
                  rows={2}
                  value={declineRemarks}
                  onChange={e => setDeclineRemarks(e.target.value)}
                  placeholder="Explain why revision is needed..."
                  className="glass-input"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-crimson text-xs py-2 px-4"
                  >
                    <XCircle className="w-4 h-4" /> Decline Task (-3 pts)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedTaskForReview.id)}
                    className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs py-2 px-4"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Task (+10 pts)
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
