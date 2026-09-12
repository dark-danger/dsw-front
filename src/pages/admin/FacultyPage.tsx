import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { User } from '../../context/AuthContext';
import { UserPlus, Search, Shield, Award, CheckCircle2, Clock, X, BarChart3, Trash2 } from 'lucide-react';

interface FacultyStats {
  faculty_id: number;
  faculty_name: string;
  total_assigned: number;
  completed_approved: number;
  pending_count: number;
  declined_count: number;
  completion_rate_percentage: number;
  performance_score: number;
}

export const FacultyPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statsModalData, setStatsModalData] = useState<FacultyStats | null>(null);

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
      await apiRequest('/users/faculty', 'POST', {
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
      fetchFaculty();
    } catch (err: any) {
      alert(err.message || 'Failed to add faculty member');
    }
  };

  const handleViewStats = async (facId: number) => {
    try {
      const stats = await apiRequest<FacultyStats>(`/users/faculty/${facId}/stats`);
      setStatsModalData(stats);
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

  return (
    <div className="space-y-6">

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Faculty & Staff Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Register faculty members, monitor duty completion rates, and view staff scores.</p>
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
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Faculty Name</th>
              <th className="p-4">Department & Designation</th>
              <th className="p-4">Employee ID</th>
              <th className="p-4">Email / Contact</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading faculty members...</td></tr>
            ) : facultyList.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">No faculty members found.</td></tr>
            ) : (
              facultyList.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                        {f.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100">{f.name}</div>
                        <div className="text-xs text-slate-500">Role: Faculty</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-200 font-medium">{f.department || 'N/A'}</div>
                    <div className="text-xs text-slate-400">{f.designation || 'Staff'}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-blue-400">{f.employee_id || 'N/A'}</td>
                  <td className="p-4">
                    <div className="text-xs text-slate-300">{f.email}</div>
                    <div className="text-xs text-slate-500">{f.phone || 'N/A'}</div>
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
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
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
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" /> Register New Faculty Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Prof. Jane Doe" className="glass-input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@geeta.edu.in" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <input required type="text" value={department} onChange={e => setDepartment(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Designation</label>
                  <input required type="text" value={designation} onChange={e => setDesignation(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GU-CSE-099" className="glass-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password</label>
                  <input required type="text" value={password} onChange={e => setPassword(e.target.value)} className="glass-input" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duty Analytics Stats Modal */}
      {statsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-100">{statsModalData.faculty_name}</h3>
              <button onClick={() => setStatsModalData(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Automatic Staff Score</span>
                <span className="text-xl font-bold text-emerald-400">{statsModalData.performance_score} pts</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Assigned</div>
                  <div className="text-lg font-bold text-slate-100 mt-1">{statsModalData.total_assigned}</div>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="text-xs text-emerald-400">Completed & Approved</div>
                  <div className="text-lg font-bold text-emerald-300 mt-1">{statsModalData.completed_approved}</div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="text-xs text-amber-400">Pending Duties</div>
                  <div className="text-lg font-bold text-amber-300 mt-1">{statsModalData.pending_count}</div>
                </div>
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <div className="text-xs text-rose-400">Declined Duties</div>
                  <div className="text-lg font-bold text-rose-300 mt-1">{statsModalData.declined_count}</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Duty Completion Rate</span>
                  <span className="font-semibold text-slate-200">{statsModalData.completion_rate_percentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${statsModalData.completion_rate_percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
