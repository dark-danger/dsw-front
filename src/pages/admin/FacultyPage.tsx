import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { UserPlus, Search, Shield, Award, CheckCircle2, Clock, X, BarChart3, Trash2, Calendar, RotateCcw } from 'lucide-react';

interface PeriodStats {
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
  period_label: string;
  reset_date?: string;
}

interface FacultyStats {
  faculty_id: number;
  faculty_name: string;
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
  weekly?: PeriodStats;
  monthly?: PeriodStats;
  all_time?: PeriodStats;
}

export const FacultyPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statsModalData, setStatsModalData] = useState<FacultyStats | null>(null);
  const [activePeriodTab, setActivePeriodTab] = useState<'monthly' | 'weekly' | 'all_time'>('monthly');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('Faculty@123');

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<User[]>(`/users/faculty${search ? `?search=${search}` : ''}`);
      setFacultyList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [search]);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newFac = await apiRequest<User>('/users/faculty', 'POST', {
        name,
        email,
        phone,
        department,
        designation,
        employee_id: employeeId || `GU-${Date.now().toString().slice(-4)}`,
        password
      });
      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setEmployeeId('');
      fetchFaculty();
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    }
  };

  const handleViewStats = async (facId: number) => {
    try {
      const stats = await apiRequest<FacultyStats>(`/users/faculty/${facId}/stats`);
      setStatsModalData(stats);
      setActivePeriodTab('monthly');
    } catch (e: any) {
      alert('Failed to fetch faculty stats');
    }
  };

  const handleDeleteFaculty = async (facultyId: number) => {
    if (!window.confirm("Are you sure you want to deactivate and remove this faculty member?")) return;
    try {
      await apiRequest(`/users/faculty/${facultyId}`, 'DELETE');
      setFacultyList(prev => prev.filter(f => f.id !== facultyId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete faculty member.');
    }
  };

  const getActiveStats = (stats: FacultyStats): PeriodStats => {
    if (activePeriodTab === 'weekly' && stats.weekly) return stats.weekly;
    if (activePeriodTab === 'monthly' && stats.monthly) return stats.monthly;
    if (activePeriodTab === 'all_time' && stats.all_time) return stats.all_time;
    return {
      total_assigned: stats.total_assigned,
      completed_approved: stats.completed_approved,
      pending_count: stats.pending_count,
      declined_count: stats.declined_count,
      completion_rate_percentage: stats.completion_rate_percentage,
      performance_score: stats.performance_score,
      period_label: activePeriodTab === 'weekly' ? 'Weekly Window' : activePeriodTab === 'monthly' ? 'Monthly Cycle (Resets 9th)' : 'All-Time Record',
      reset_date: stats.monthly?.reset_date
    };
  };

  const activeStats = statsModalData ? getActiveStats(statsModalData) : null;

  return (
    <div className="space-y-6">

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Faculty & Staff Directory</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Register faculty members, monitor duty completion rates, and view staff scores.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add New Faculty Member
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or department..."
          className="glass-input pl-9"
        />
      </div>

      {/* Faculty Table */}
      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left text-sm text-[var(--text-secondary)]">
          <thead className="bg-[var(--card-bg-to)] text-xs uppercase font-bold text-[var(--text-primary)] border-b border-[var(--panel-border)]">
            <tr>
              <th className="p-4">Faculty Name</th>
              <th className="p-4">Department & Designation</th>
              <th className="p-4">Employee ID</th>
              <th className="p-4">Email / Contact</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--panel-border)]">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">Loading faculty members...</td></tr>
            ) : facultyList.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">No faculty members found.</td></tr>
            ) : (
              facultyList.map((f) => (
                <tr key={f.id} className="hover:bg-emerald-500/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{f.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">Role: Faculty</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-[var(--text-primary)] font-medium">{f.department || 'N/A'}</div>
                    <div className="text-xs text-[var(--text-muted)]">{f.designation || 'Staff'}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">{f.employee_id || 'N/A'}</td>
                  <td className="p-4">
                    <div className="text-xs text-[var(--text-primary)] font-medium">{f.email}</div>
                    <div className="text-xs text-[var(--text-muted)]">{f.phone || 'N/A'}</div>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleViewStats(f.id)}
                      className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Analytics
                    </button>
                    <button
                      onClick={() => handleDeleteFaculty(f.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                      title="Delete Faculty"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Faculty Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" /> Register New Faculty Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Prof. Jane Doe" className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@geeta.edu.in" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Department</label>
                  <input required type="text" value={department} onChange={e => setDepartment(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Designation</label>
                  <input required type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GU-CSE-099" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Initial Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Analytics Stats Modal */}
      {statsModalData && activeStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{statsModalData.faculty_name}</h3>
                <p className="text-xs text-[var(--text-muted)]">Duty Performance & Completion Analytics</p>
              </div>
              <button onClick={() => setStatsModalData(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Period Selector Tabs */}
            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--panel-border)] gap-1 mb-4">
              <button
                onClick={() => setActivePeriodTab('monthly')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Monthly (9th Reset)
              </button>
              <button
                onClick={() => setActivePeriodTab('weekly')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Weekly
              </button>
              <button
                onClick={() => setActivePeriodTab('all_time')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activePeriodTab === 'all_time'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-bg-to)]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> All-Time
              </button>
            </div>

            {/* Period Status Banner */}
            <div className="mb-4">
              {activePeriodTab === 'monthly' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <RotateCcw className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold">{activeStats.period_label}</span>
                    <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Cycle resets on the 9th of every month {activeStats.reset_date ? `• Next reset: ${activeStats.reset_date}` : ''}
                    </span>
                  </div>
                </div>
              )}
              {activePeriodTab === 'weekly' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-200">
                  <Clock className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <span className="font-bold">{activeStats.period_label}</span>
                    <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Rolling 7-day activity snapshot
                    </span>
                  </div>
                </div>
              )}
              {activePeriodTab === 'all_time' && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-purple-800 dark:text-purple-200">
                  <Award className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Cumulative All-Time Performance</span>
                    <span className="block text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Lifetime duty records and performance history
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--card-bg-to)] p-4 rounded-xl border border-[var(--panel-border)] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Automatic Staff Score</span>
                  <span className="block text-[11px] text-[var(--text-muted)]">Based on on-time approvals & tasks</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{activeStats.performance_score} pts</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-muted)]">Total Assigned</div>
                  <div className="text-xl font-bold text-[var(--text-primary)] mt-1">{activeStats.total_assigned}</div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Completed & Approved</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{activeStats.completed_approved}</div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Pending Duties</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">{activeStats.pending_count}</div>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-xs text-rose-700 dark:text-rose-400 font-semibold">Declined Duties</div>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{activeStats.declined_count}</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                  <span className="font-medium">Duty Completion Rate</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeStats.completion_rate_percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${activeStats.completion_rate_percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

