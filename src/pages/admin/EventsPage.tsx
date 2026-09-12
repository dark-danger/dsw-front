import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { Calendar, Plus, FileText, CheckCircle2, Clock, MapPin, User as UserIcon, X, Eye, Trash2, AlertTriangle } from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  venue: string;
  coordinator?: User;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  tasks_count: number;
  completed_tasks_count: number;
  completion_percentage: number;
}

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reportHtmlModal, setReportHtmlModal] = useState<string | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Seminar / Symposium');
  const [venue, setVenue] = useState('Main University Auditorium');
  const [coordinatorId, setCoordinatorId] = useState<number | ''>('');

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const [evData, facData] = await Promise.all([
        apiRequest<EventItem[]>('/events'),
        apiRequest<User[]>('/users/faculty')
      ]);
      setEvents(evData);
      setFacultyList(facData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/events', 'POST', {
        title,
        description,
        event_type: eventType,
        venue,
        coordinator_id: coordinatorId ? Number(coordinatorId) : null,
        status: 'planned'
      });
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      fetchEventsData();
    } catch (err: any) {
      alert(err.message || 'Failed to create event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteConfirmEvent) return;
    try {
      setDeleting(true);
      await apiRequest(`/events/${deleteConfirmEvent.id}`, 'DELETE');
      setEvents(prev => prev.filter(e => e.id !== deleteConfirmEvent.id));
      setDeleteConfirmEvent(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handlePreviewMergedReport = async (eventId: number) => {
    try {
      const html = await apiRequest<string>(`/events/${eventId}/reports/merged`);
      setReportHtmlModal(html);
    } catch (e: any) {
      alert('Failed to generate merged report preview');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Events & Automated Reporting</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Create campus events, attach task work, and generate 1-click Micro & Merged PDF reports.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Campus Event
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-[var(--text-muted)]">Loading campus events...</div>
        ) : events.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-[var(--text-muted)]">No events found. Click 'Create New Campus Event' to get started.</div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="glass-panel p-6 space-y-4 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      {ev.event_type}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      ev.status === 'completed' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                      ev.status === 'ongoing' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}>
                      {ev.status.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteConfirmEvent(ev)}
                    title="Delete Event"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] mt-3">{ev.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{ev.description || 'No description'}</p>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-[var(--text-secondary)] bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-medium text-[var(--text-primary)]">{ev.venue || 'Main Campus'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium text-[var(--text-primary)]">Coord: {ev.coordinator?.name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Task Progress Bar */}
                <div className="mt-4 pt-3 border-t border-[var(--panel-border)]">
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                    <span>Task Completion Progress</span>
                    <span className="font-bold text-[var(--text-primary)]">{ev.completed_tasks_count} / {ev.tasks_count} tasks ({ev.completion_percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all" style={{ width: `${ev.completion_percentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-2 border-t border-[var(--panel-border)]">
                <button
                  onClick={() => handlePreviewMergedReport(ev.id)}
                  className="btn-secondary text-xs py-2 px-3 flex-1 justify-center"
                >
                  <Eye className="w-4 h-4 text-blue-500" /> 1-Click Preview & Generate Merged PDF Report
                </button>
                <button
                  onClick={() => setDeleteConfirmEvent(ev)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" /> Create Campus Event
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Annual Sports Day 2026" className="glass-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed description..." className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Type</label>
                  <input required type="text" value={eventType} onChange={e => setEventType(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Venue</label>
                  <input required type="text" value={venue} onChange={e => setVenue(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Faculty Coordinator</label>
                <select
                  value={coordinatorId}
                  onChange={e => setCoordinatorId(e.target.value ? Number(e.target.value) : '')}
                  className="glass-input"
                >
                  <option value="">-- Select Faculty Coordinator --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HTML Report Preview Modal */}
      {reportHtmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-sm">Automated Event PDF Report Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1 bg-emerald-600 rounded text-xs font-semibold hover:bg-emerald-500">
                  Print / Save PDF
                </button>
                <button onClick={() => setReportHtmlModal(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              srcDoc={reportHtmlModal}
              title="Report Preview"
              className="w-full flex-1 border-none bg-white"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Delete Campus Event</h3>
                <p className="text-xs text-[var(--text-secondary)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)] mb-5">
              Are you sure you want to permanently delete event <strong className="text-[var(--text-primary)] font-bold">"{deleteConfirmEvent.title}"</strong>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmEvent(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteEvent}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Deleting...' : 'Yes, Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
