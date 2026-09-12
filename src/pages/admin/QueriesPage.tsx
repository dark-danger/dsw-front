import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { HelpCircle, CheckCircle2, RotateCcw, Clock, User as UserIcon, MessageSquare, X, PlusCircle, Send } from 'lucide-react';

interface QueryItem {
  id: number;
  raised_by: number;
  raiser?: User;
  raiser_role: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'closed';
  admin_remarks?: string;
  closer?: User;
  closed_at?: string;
  created_at: string;
}

export const QueriesPage: React.FC = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | ''>('');
  const [roleFilter, setRoleFilter] = useState<'faculty' | 'student' | ''>('');
  const [loading, setLoading] = useState(true);

  // Create Query Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Close Query Modal
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  const fetchQueries = async () => {
    setLoading(true);
    try {
      let url = '/queries?';
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (roleFilter && user?.role === 'super_admin') url += `role_filter=${roleFilter}&`;
      const data = await apiRequest<QueryItem[]>(url);
      setQueries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [statusFilter, roleFilter]);

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;
    setSubmitting(true);
    try {
      await apiRequest('/queries', 'POST', {
        subject: newSubject,
        category: newCategory,
        description: newDescription
      });
      setShowCreateModal(false);
      setNewSubject('');
      setNewCategory('General');
      setNewDescription('');
      fetchQueries();
    } catch (err: any) {
      alert(err.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;
    try {
      await apiRequest(`/queries/${selectedQuery.id}/close`, 'POST', {
        admin_remarks: adminRemarks
      });
      setSelectedQuery(null);
      setAdminRemarks('');
      fetchQueries();
    } catch (err: any) {
      alert(err.message || 'Failed to close query');
    }
  };

  const handleReopen = async (id: number) => {
    try {
      await apiRequest(`/queries/${id}/reopen`, 'POST');
      fetchQueries();
    } catch (e) {
      alert('Failed to reopen query');
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-500" /> Grievance & Query Portal
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isSuperAdmin
              ? 'Review student & faculty tickets, issue official resolution responses, and reopen issues when necessary.'
              : 'Submit your queries, requests or grievances directly to the Dean of Student Welfare office.'}
          </p>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="glass-input text-xs w-36">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          {isSuperAdmin && (
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="glass-input text-xs w-36">
              <option value="">All Roles</option>
              <option value="student">From Students</option>
              <option value="faculty">From Faculty</option>
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise New Query</span>
          </button>
        </div>
      </div>

      {/* Queries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">Loading queries...</div>
        ) : queries.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel space-y-3">
            <p>No queries found matching the selected filters.</p>
            {!isSuperAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Raise Your First Query
              </button>
            )}
          </div>
        ) : (
          queries.map(q => (
            <div
              key={q.id}
              className={`glass-panel p-6 space-y-3 relative ${
                q.status === 'open' ? 'border-l-4 border-l-rose-500 bg-[var(--card-bg-to)]' : 'border-l-4 border-l-emerald-500'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                    q.status === 'open' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {q.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--card-bg-to)] text-[var(--text-secondary)] border border-[var(--panel-border)]">
                    Category: {q.category}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{new Date(q.created_at).toLocaleString()}</span>
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)]">{q.subject}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.description}</p>

              <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between text-xs">
                <div className="text-[var(--text-muted)] flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Raised by: <strong className="text-[var(--text-primary)]">{q.raiser?.name || 'User'}</strong> ({q.raiser_role.toUpperCase()})
                  </span>
                </div>

                {isSuperAdmin && (
                  <div>
                    {q.status === 'open' ? (
                      <button
                        onClick={() => {
                          setSelectedQuery(q);
                          setAdminRemarks('');
                        }}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Close Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReopen(q.id)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reopen Ticket
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Resolution Box */}
              {q.status === 'closed' && q.admin_remarks && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> DSW Admin Resolution Remarks:
                  </div>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{q.admin_remarks}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create New Query Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" /> Raise Query / Grievance
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject / Query Title *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Issue regarding hostel wifi access / Exam schedule discrepancy"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="glass-input"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Academic">Academic & Exams</option>
                  <option value="Hostel">Hostel & Campus Facilities</option>
                  <option value="Financial">Financial & Fees</option>
                  <option value="Sports & Events">Sports & Extra-Curricular Events</option>
                  <option value="Grievance">Grievance / Complaint</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Please describe your query or grievance in detail..."
                  className="glass-input"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal (Admin only) */}
      {selectedQuery && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Resolve Ticket: {selectedQuery.subject}
              </h3>
              <button onClick={() => setSelectedQuery(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseQuery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Official Resolution Remarks</label>
                <textarea
                  required
                  rows={4}
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  placeholder="Provide resolution details for the ticket raiser..."
                  className="glass-input"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedQuery(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Close Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

