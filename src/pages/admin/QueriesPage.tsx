import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  HelpCircle, CheckCircle2, RotateCcw, Clock, User as UserIcon,
  MessageSquare, X, PlusCircle, Send, Building2, GraduationCap, Shield
} from 'lucide-react';

interface QueryItem {
  id: number;
  raised_by: number;
  raiser?: User;
  raiser_role: string;
  subject: string;
  category: string;
  description: string;
  status: 'open' | 'closed';
  target_type?: string;
  target_faculty_id?: number;
  target_faculty_name?: string;
  target_faculty?: User;
  admin_remarks?: string;
  closer?: User;
  closed_at?: string;
  created_at: string;
}

export const QueriesPage: React.FC = () => {
  const { user } = useAuth();
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | ''>('');
  const [roleFilter, setRoleFilter] = useState<'faculty' | 'student' | ''>('');
  const [loading, setLoading] = useState(true);

  // Create Query Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetType, setTargetType] = useState<'admin' | 'faculty_head'>('admin');
  const [targetFacultyId, setTargetFacultyId] = useState<number | ''>('');
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

  const fetchFaculty = async () => {
    try {
      const data = await apiRequest<User[]>('/users/faculty');
      setFacultyList(data);
      if (data.length > 0 && !targetFacultyId) {
        setTargetFacultyId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchQueries();
    fetchFaculty();
  }, [statusFilter, roleFilter]);

  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    let facName = undefined;
    if (targetType === 'faculty_head' && targetFacultyId) {
      const facObj = facultyList.find(f => f.id === Number(targetFacultyId));
      facName = facObj?.name;
    }

    setSubmitting(true);
    try {
      await apiRequest('/queries', 'POST', {
        subject: newSubject,
        category: newCategory,
        description: newDescription,
        target_type: targetType,
        target_faculty_id: targetType === 'faculty_head' && targetFacultyId ? Number(targetFacultyId) : null,
        target_faculty_name: facName
      });
      setShowCreateModal(false);
      setNewSubject('');
      setNewCategory('General');
      setNewDescription('');
      setTargetType('admin');
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
            <HelpCircle className="w-5 h-5 text-emerald-500" /> Grievance & Query Resolution Portal
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isSuperAdmin
              ? 'Review student & faculty tickets, issue official resolution responses, and resolve grievances.'
              : user?.role === 'faculty'
              ? 'View queries directed to you as Faculty Head/Coordinator or submit inquiries to DSW.'
              : 'Submit your queries or grievances directly to either Admin (DSW Office) or your Faculty Head / Club Coordinator.'}
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
          queries.map(q => {
            const canResolve = isSuperAdmin || (user?.role === 'faculty' && q.target_faculty_id === user?.id);

            return (
              <div
                key={q.id}
                className={`glass-panel p-6 space-y-3 relative ${
                  q.status === 'open' ? 'border-l-4 border-l-rose-500 bg-[var(--card-bg-to)]' : 'border-l-4 border-l-emerald-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      q.status === 'open' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {q.status}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--card-bg-to)] text-[var(--text-secondary)] border border-[var(--panel-border)]">
                      Category: {q.category}
                    </span>

                    {/* Target Recipient Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      q.target_type === 'faculty_head'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                    }`}>
                      {q.target_type === 'faculty_head' ? (
                        <>
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>To: Faculty Head ({q.target_faculty_name || q.target_faculty?.name || 'Coordinator'})</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3.5 h-3.5" />
                          <span>To: Admin (DSW Office)</span>
                        </>
                      )}
                    </span>
                  </div>

                  <span className="text-xs text-[var(--text-muted)]">{new Date(q.created_at).toLocaleString()}</span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)]">{q.subject}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{q.description}</p>

                <div className="pt-3 border-t border-[var(--panel-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[var(--text-muted)] flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      Raised by: <strong className="text-[var(--text-primary)]">{q.raiser?.name || 'User'}</strong> ({q.raiser_role.toUpperCase()})
                    </span>
                  </div>

                  <div>
                    {canResolve && q.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedQuery(q);
                          setAdminRemarks('');
                        }}
                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Close Ticket
                      </button>
                    )}

                    {isSuperAdmin && q.status === 'closed' && (
                      <button
                        onClick={() => handleReopen(q.id)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reopen Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Resolution Remarks Box */}
                {q.status === 'closed' && q.admin_remarks && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Official Resolution Remarks:
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{q.admin_remarks}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create New Query Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" /> Raise Query / Grievance
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="space-y-4">
              {/* Recipient Selection: 2 Options */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-primary)]">
                  Select Query Recipient *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setTargetType('admin')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      targetType === 'admin'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                        : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs">Admin (DSW Office)</span>
                  </div>

                  <div
                    onClick={() => setTargetType('faculty_head')}
                    className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      targetType === 'faculty_head'
                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                        : 'bg-[var(--card-bg-to)] border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-purple-500/30'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                    <span className="text-xs">Faculty Head / Coordinator</span>
                  </div>
                </div>
              </div>

              {/* Conditional Faculty Coordinator Dropdown */}
              {targetType === 'faculty_head' && (
                <div className="animate-in fade-in duration-150">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Select Faculty Head / Coordinator *
                  </label>
                  <select
                    required
                    value={targetFacultyId}
                    onChange={e => setTargetFacultyId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Choose Faculty Head --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.department || 'DSW Faculty'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject / Query Title *</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g. Issue regarding club activity budget / event permission"
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="glass-input text-xs"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Club & Society">Student Club & Society</option>
                  <option value="Academic">Academic & Exams</option>
                  <option value="Hostel">Hostel & Campus Facilities</option>
                  <option value="Financial">Financial & Fees</option>
                  <option value="Sports & Events">Sports & Extra-Curricular Events</option>
                  <option value="Grievance">Grievance / Complaint</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Detailed Description *</label>
                  <ImproveEnglishButton text={newDescription} onImproved={setNewDescription} context="Official grievance, query, or campus assistance request" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Please describe your query or grievance in detail..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Modal (Admin or Targeted Faculty) */}
      {selectedQuery && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Official Resolution Remarks *</label>
                  <ImproveEnglishButton text={adminRemarks} onImproved={setAdminRemarks} context="Official administrative resolution remarks and solution to student/faculty query" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                  placeholder="Provide resolution details for the ticket raiser..."
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedQuery(null)} className="btn-secondary text-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs">Close Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


