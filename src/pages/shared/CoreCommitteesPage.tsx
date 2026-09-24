import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Users, Plus, Trash2, Calendar, User as UserIcon, MapPin,
  Clock, Printer, Download, Eye, X, CheckCircle2, Shield, Sparkles, Award, Star,
  Key, Lock, Mail, Phone, GraduationCap, AlertCircle, Check, Info, ChevronRight, UserPlus
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  start_date?: string;
  venue?: string;
}

interface StudentItem {
  id: number;
  name: string;
  roll_number?: string;
  department?: string;
  phone?: string;
  email?: string;
  course_branch?: string;
  year?: string;
}

interface StudentRoleData {
  role_name: string;
  student_id?: number | null;
  student_name: string;
  student_roll_no?: string;
  department?: string;
  semester?: string;
  email?: string;
  phone?: string;
  is_president?: boolean;
  has_account?: boolean;
  responsibilities?: string;
}

interface CoreCommitteeData {
  id: number;
  title: string;
  event_id: number;
  event_title: string;
  event_date?: string;
  faculty_id: number;
  faculty_name: string;
  description?: string;
  student_roles: StudentRoleData[];
  created_by: number;
  creator_name: string;
  created_at: string;
}

interface NonPresidentRoleRow {
  id: string;
  role_name: string;
  student_name: string;
  student_roll_no: string;
  department: string;
  semester: string;
  email: string;
  phone: string;
  responsibilities: string;
}

const COMMON_ROLE_SUGGESTIONS = [
  "Vice President",
  "General Secretary",
  "Technical Lead",
  "Media & PR Head",
  "Logistics & Venue Head",
  "Hospitality & Reception Lead",
  "Stage & Production Coordinator",
  "Creative & Design Lead",
  "Finance & Sponsorship In-charge",
  "Discipline & Security Lead",
  "Executive Member"
];

export const CoreCommitteesPage: React.FC = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'super_admin' || user?.role === 'faculty';

  const [committees, setCommittees] = useState<CoreCommitteeData[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [eventDate, setEventDate] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | ''>('');
  const [committeeTitle, setCommitteeTitle] = useState('');
  const [committeeDescription, setCommitteeDescription] = useState('');

  // President Appoint State (Creates Portal Account)
  const [hasPresident, setHasPresident] = useState(true);
  const [presidentRoleTitle, setPresidentRoleTitle] = useState('President / Student Convenor');
  const [presidentName, setPresidentName] = useState('');
  const [presidentRoll, setPresidentRoll] = useState('');
  const [presidentDept, setPresidentDept] = useState('Computer Science & Engineering');
  const [presidentSemester, setPresidentSemester] = useState('6th Sem');
  const [presidentEmail, setPresidentEmail] = useState('');
  const [presidentPassword, setPresidentPassword] = useState('President@123');
  const [presidentPhone, setPresidentPhone] = useState('');
  const [presidentResponsibilities, setPresidentResponsibilities] = useState('Overall committee leadership, team mobilization, and execution management.');

  // Non-President Registered Students (No Portal Accounts)
  const [otherRoles, setOtherRoles] = useState<NonPresidentRoleRow[]>([
    {
      id: 'role_1',
      role_name: 'Vice President / Co-Convenor',
      student_name: '',
      student_roll_no: '',
      department: 'Computer Science & Engineering',
      semester: '6th Sem',
      email: '',
      phone: '',
      responsibilities: 'Assist in coordination, operations and committee management.'
    },
    {
      id: 'role_2',
      role_name: 'Media & PR Head',
      student_name: '',
      student_roll_no: '',
      department: 'Management & Commerce',
      semester: '4th Sem',
      email: '',
      phone: '',
      responsibilities: 'Oversee promotions, photography and campus outreach.'
    }
  ]);

  // View / Print Modal State
  const [selectedCommitteeForPrint, setSelectedCommitteeForPrint] = useState<CoreCommitteeData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cData, evData, facData, stuData] = await Promise.all([
        apiRequest<CoreCommitteeData[]>('/committees'),
        apiRequest<EventItem[]>('/events'),
        apiRequest<User[]>('/users/faculty'),
        apiRequest<StudentItem[]>('/users/students')
      ]);
      setCommittees(cData);
      setEventsList(evData);
      setFacultyList(facData);
      setStudentsList(stuData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEventSelect = (eId: number) => {
    setSelectedEventId(eId);
    const ev = eventsList.find(e => e.id === eId);
    if (ev) {
      setCommitteeTitle(`Student Core Committee - ${ev.title}`);
      if (ev.start_date) {
        setEventDate(ev.start_date.split('T')[0]);
      }
    }
  };

  const handleAddOtherRole = () => {
    setOtherRoles([
      ...otherRoles,
      {
        id: `role_${Date.now()}`,
        role_name: '',
        student_name: '',
        student_roll_no: '',
        department: 'Engineering & Technology',
        semester: '4th Sem',
        email: '',
        phone: '',
        responsibilities: ''
      }
    ]);
  };

  const handleRemoveOtherRole = (index: number) => {
    setOtherRoles(otherRoles.filter((_, idx) => idx !== index));
  };

  const handleOtherRoleChange = (index: number, field: keyof NonPresidentRoleRow, value: string) => {
    const updated = [...otherRoles];
    updated[index] = { ...updated[index], [field]: value };
    setOtherRoles(updated);
  };

  const handleAutofillFromExisting = (index: number, studentIdStr: string) => {
    if (!studentIdStr) return;
    const stu = studentsList.find(s => s.id === Number(studentIdStr));
    if (stu) {
      const updated = [...otherRoles];
      updated[index] = {
        ...updated[index],
        student_name: stu.name || '',
        student_roll_no: stu.roll_number || '',
        department: stu.department || stu.course_branch || updated[index].department,
        semester: stu.year || updated[index].semester,
        email: stu.email || '',
        phone: stu.phone || ''
      };
      setOtherRoles(updated);
    }
  };

  const handleAutofillPresident = (studentIdStr: string) => {
    if (!studentIdStr) return;
    const stu = studentsList.find(s => s.id === Number(studentIdStr));
    if (stu) {
      setPresidentName(stu.name || '');
      setPresidentRoll(stu.roll_number || '');
      setPresidentDept(stu.department || stu.course_branch || presidentDept);
      setPresidentSemester(stu.year || presidentSemester);
      setPresidentEmail(stu.email || '');
      setPresidentPhone(stu.phone || '');
    }
  };

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return alert('Please select an event!');
    if (!selectedFacultyId) return alert('Please select a Faculty Coordinator / Mentor!');
    if (!committeeTitle.trim()) return alert('Please enter a Committee Title!');

    const rolesPayload: any[] = [];

    // 1. Add President (Account will be created on portal)
    if (hasPresident) {
      if (!presidentName.trim()) return alert('Please enter the President / Convenor Student Name!');
      if (!presidentEmail.trim()) return alert('Please enter the President Email Address for login!');
      if (!presidentPassword.trim()) return alert('Please set a password for the President portal login!');

      rolesPayload.push({
        role_name: presidentRoleTitle || 'President',
        student_name: presidentName.trim(),
        student_roll_no: presidentRoll.trim(),
        department: presidentDept.trim(),
        semester: presidentSemester.trim(),
        email: presidentEmail.trim(),
        phone: presidentPhone.trim(),
        password: presidentPassword.trim(),
        is_president: true,
        responsibilities: presidentResponsibilities.trim()
      });
    }

    // 2. Add other registered students (NO portal accounts created)
    for (const r of otherRoles) {
      if (r.student_name.trim() || r.role_name.trim()) {
        if (!r.role_name.trim()) return alert('Please provide a Role Title for all added members!');
        if (!r.student_name.trim()) return alert(`Please provide Student Name for role "${r.role_name}"!`);
        
        rolesPayload.push({
          role_name: r.role_name.trim(),
          student_name: r.student_name.trim(),
          student_roll_no: r.student_roll_no.trim(),
          department: r.department.trim(),
          semester: r.semester.trim(),
          email: r.email.trim(),
          phone: r.phone.trim(),
          password: null, // NO password for regular roles
          is_president: false,
          responsibilities: r.responsibilities.trim()
        });
      }
    }

    if (rolesPayload.length === 0) {
      return alert('Please add at least one member to the core committee!');
    }

    try {
      await apiRequest('/committees', 'POST', {
        title: committeeTitle,
        event_id: Number(selectedEventId),
        event_date: eventDate,
        faculty_id: Number(selectedFacultyId),
        description: committeeDescription,
        student_roles: rolesPayload
      });

      setIsCreateModalOpen(false);
      setCommitteeTitle('');
      setCommitteeDescription('');
      setSelectedEventId('');
      setSelectedFacultyId('');
      setEventDate('');
      setPresidentName('');
      setPresidentRoll('');
      setPresidentEmail('');
      setPresidentPhone('');
      setOtherRoles([
        {
          id: 'role_1',
          role_name: 'Vice President / Co-Convenor',
          student_name: '',
          student_roll_no: '',
          department: 'Computer Science & Engineering',
          semester: '6th Sem',
          email: '',
          phone: '',
          responsibilities: 'Assist in coordination, operations and committee management.'
        }
      ]);
      fetchData();
      alert('Student Core Committee formed successfully!\n\n👑 President portal login account was provisioned.\n📝 Other student roles were registered in the official committee roster.');
    } catch (err: any) {
      alert(err.message || 'Failed to create Core Committee');
    }
  };

  const handleDeleteCommittee = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiRequest(`/committees/${id}`, 'DELETE');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete Core Committee');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" /> Student Core Committees & Leadership
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Form official student organizing committees, provision President login accounts, register committee office bearers, and generate formal DSW appointment letters.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary bg-emerald-600 hover:bg-emerald-500 shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Form Core Committee
          </button>
        )}
      </div>

      {/* Info Callout Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <strong className="font-bold">Role & Account Governance:</strong> President role receives active Portal Login credentials (Email & Password) to manage submissions and team tasks. Other committee roles are registered with full academic details without creating extraneous user accounts.
          </div>
        </div>
      </div>

      {/* Core Committees List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">Loading core committees...</div>
        ) : committees.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] glass-panel">
            No student core committees formed yet. {canCreate && "Click 'Form Core Committee' to appoint student leaders."}
          </div>
        ) : (
          committees.map(comm => (
            <div key={comm.id} className="glass-panel p-6 space-y-4 hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {comm.event_title}
                    </span>
                    {comm.event_date && (
                      <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date: {comm.event_date}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> {comm.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedCommitteeForPrint(comm)}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Appointment Order
                  </button>
                  {canCreate && (
                    <button
                      onClick={() => handleDeleteCommittee(comm.id, comm.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                      title="Delete Committee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-secondary)] font-medium">Faculty Mentor / In-Charge</div>
                  <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-emerald-500" /> {comm.faculty_name}
                  </div>
                </div>

                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-secondary)] font-medium">Student Committee Size</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {comm.student_roles.length} Appointed Leaders
                  </div>
                </div>

                <div className="bg-[var(--card-bg-to)] p-3 rounded-xl border border-[var(--panel-border)]">
                  <div className="text-xs text-[var(--text-secondary)] font-medium">Scope & Mandate</div>
                  <div className="text-xs text-[var(--text-primary)] truncate mt-1">{comm.description || 'Full event planning, execution & coordination.'}</div>
                </div>
              </div>

              {/* Student Appointed Leaders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {comm.student_roles.map((st, idx) => {
                  const isPres = st.is_president || (st.role_name && st.role_name.toLowerCase().includes('president'));
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                        isPres
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-[var(--card-bg-to)] border-[var(--panel-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 ${
                          isPres ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {isPres ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <Shield className="w-3.5 h-3.5 text-teal-500" />}
                          {st.role_name}
                        </span>
                        {isPres ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <Key className="w-2.5 h-2.5" /> Portal Login
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-[var(--text-muted)] border border-[var(--panel-border)]">
                            📝 Registered
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold text-[var(--text-primary)]">{st.student_name}</div>

                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between pt-0.5">
                        <span className="font-mono font-medium">Roll: {st.student_roll_no || 'N/A'}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{st.department || 'Student'}</span>
                      </div>

                      {st.semester && (
                        <div className="text-[10px] text-[var(--text-muted)]">
                          Sem: {st.semester} {st.phone && `• ${st.phone}`}
                        </div>
                      )}

                      {st.responsibilities && (
                        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1 italic pt-0.5">
                          "{st.responsibilities}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Core Committee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel p-6 shadow-2xl relative space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" /> Form Student Core Committee
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Appoint student leaders, provision President login, and record committee member registrations.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommittee} className="space-y-6">
              {/* Event, Date, Faculty Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Select Event *</label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={e => handleEventSelect(Number(e.target.value))}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Select Event --</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Faculty Mentor In-Charge *</label>
                  <select
                    required
                    value={selectedFacultyId}
                    onChange={e => setSelectedFacultyId(e.target.value ? Number(e.target.value) : '')}
                    className="glass-input text-xs"
                  >
                    <option value="">-- Select Faculty --</option>
                    {facultyList.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.department || 'Faculty'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Committee Title *</label>
                <input
                  required
                  type="text"
                  value={committeeTitle}
                  onChange={e => setCommitteeTitle(e.target.value)}
                  placeholder="Student Organizing Core Committee - TechFest 2026"
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)]">Scope & Mandate / Directives</label>
                  <ImproveEnglishButton text={committeeDescription} onImproved={setCommitteeDescription} context="Core committee charter, scope, and objectives" />
                </div>
                <textarea
                  rows={2}
                  value={committeeDescription}
                  onChange={e => setCommitteeDescription(e.target.value)}
                  placeholder="Describe committee objective, deliverables and responsibilities..."
                  className="glass-input text-xs"
                />
              </div>

              {/* SECTION 1: PRESIDENT ROLE (WITH PORTAL LOGIN ACCOUNT) */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Star className="w-4 h-4 fill-amber-500" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                        Appoint Committee President / Lead Convenor
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        🔑 A Portal login account (email + password) will be automatically created/linked for the President.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPresident}
                      onChange={e => setHasPresident(e.target.checked)}
                      className="rounded border-[var(--panel-border)] text-amber-600 focus:ring-amber-500"
                    />
                    <span>Include President</span>
                  </label>
                </div>

                {hasPresident && (
                  <div className="space-y-3 pt-2 border-t border-amber-500/20">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">President Full Name *</label>
                        <input
                          required={hasPresident}
                          type="text"
                          value={presidentName}
                          onChange={e => setPresidentName(e.target.value)}
                          placeholder="e.g. Yash Vardhan"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Roll Number *</label>
                        <input
                          required={hasPresident}
                          type="text"
                          value={presidentRoll}
                          onChange={e => setPresidentRoll(e.target.value)}
                          placeholder="GU2026101"
                          className="glass-input text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Portal Login Email *</label>
                        <input
                          required={hasPresident}
                          type="email"
                          value={presidentEmail}
                          onChange={e => setPresidentEmail(e.target.value)}
                          placeholder="president@geeta.edu.in"
                          className="glass-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department / Branch</label>
                        <input
                          type="text"
                          value={presidentDept}
                          onChange={e => setPresidentDept(e.target.value)}
                          placeholder="B.Tech CSE"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Semester</label>
                        <input
                          type="text"
                          value={presidentSemester}
                          onChange={e => setPresidentSemester(e.target.value)}
                          placeholder="6th Sem"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          value={presidentPhone}
                          onChange={e => setPresidentPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Login Password *
                        </label>
                        <input
                          required={hasPresident}
                          type="text"
                          value={presidentPassword}
                          onChange={e => setPresidentPassword(e.target.value)}
                          placeholder="President@123"
                          className="glass-input text-xs font-mono border-amber-500/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Designation Title</label>
                        <input
                          type="text"
                          value={presidentRoleTitle}
                          onChange={e => setPresidentRoleTitle(e.target.value)}
                          placeholder="President / Student Convenor"
                          className="glass-input text-xs font-semibold text-amber-700 dark:text-amber-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Key Responsibilities</label>
                        <input
                          type="text"
                          value={presidentResponsibilities}
                          onChange={e => setPresidentResponsibilities(e.target.value)}
                          placeholder="Overall coordination, team mobilization, stage execution"
                          className="glass-input text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: OTHER CORE COMMITTEE STUDENT ROLES (REGISTRATION ONLY - NO ACCOUNTS) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[var(--panel-border)]">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" /> Core Committee Student Roster ({otherRoles.length} Members)
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      📝 <strong>Registration Only:</strong> Academic details and designations will be recorded for official DSW appointment orders without creating portal login accounts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOtherRole}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Student Role
                  </button>
                </div>

                <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                  {otherRoles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--panel-border)] rounded-2xl">
                      No additional student roles added yet. Click "Add Student Role" to appoint more committee members.
                    </div>
                  ) : (
                    otherRoles.map((row, idx) => (
                      <div key={row.id || idx} className="p-4 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl space-y-3 relative hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-teal-500" /> Member #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOtherRole(idx)}
                            className="text-rose-500 hover:text-rose-400 flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>

                        {/* Quick role suggestions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">Suggestions:</span>
                          {COMMON_ROLE_SUGGESTIONS.slice(0, 5).map(sug => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleOtherRoleChange(idx, 'role_name', sug)}
                              className="px-2 py-0.5 rounded-md text-[10px] bg-[var(--panel-border)] hover:bg-emerald-500/20 text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Designation / Role Title *</label>
                            <input
                              required
                              type="text"
                              value={row.role_name}
                              onChange={e => handleOtherRoleChange(idx, 'role_name', e.target.value)}
                              placeholder="e.g. Vice President, Technical Lead"
                              className="glass-input text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Student Full Name *</label>
                            <input
                              required
                              type="text"
                              value={row.student_name}
                              onChange={e => handleOtherRoleChange(idx, 'student_name', e.target.value)}
                              placeholder="e.g. Anjali Sharma"
                              className="glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Roll Number *</label>
                            <input
                              required
                              type="text"
                              value={row.student_roll_no}
                              onChange={e => handleOtherRoleChange(idx, 'student_roll_no', e.target.value)}
                              placeholder="GU2026205"
                              className="glass-input text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department / Branch</label>
                            <input
                              type="text"
                              value={row.department}
                              onChange={e => handleOtherRoleChange(idx, 'department', e.target.value)}
                              placeholder="B.Tech CSE"
                              className="glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Semester</label>
                            <input
                              type="text"
                              value={row.semester}
                              onChange={e => handleOtherRoleChange(idx, 'semester', e.target.value)}
                              placeholder="4th Sem"
                              className="glass-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
                            <input
                              type="email"
                              value={row.email}
                              onChange={e => handleOtherRoleChange(idx, 'email', e.target.value)}
                              placeholder="anjali@geeta.edu.in"
                              className="glass-input text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Contact Phone</label>
                            <input
                              type="tel"
                              value={row.phone}
                              onChange={e => handleOtherRoleChange(idx, 'phone', e.target.value)}
                              placeholder="+91 98765 00000"
                              className="glass-input text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Key Responsibilities (Optional)</label>
                          <input
                            type="text"
                            value={row.responsibilities}
                            onChange={e => handleOtherRoleChange(idx, 'responsibilities', e.target.value)}
                            placeholder="e.g. Lead stage sound & lighting setup"
                            className="glass-input text-xs"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-[var(--text-muted)]">
                  Appointed members will be listed on the official DSW Core Committee roster and appointment order.
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs font-bold py-2 px-5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Form & Publish Core Committee
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Appointment Letter Printable View Modal */}
      {selectedCommitteeForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-950 text-slate-100 p-8 rounded-2xl shadow-2xl relative space-y-6 my-8 border border-slate-800 print:m-0 print:p-0 print:border-none print:bg-white print:text-black">
            
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" /> Official Appointment Order Preview
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="btn-primary bg-emerald-600 hover:bg-emerald-500 text-xs py-2 px-4 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button onClick={() => setSelectedCommitteeForPrint(null)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Official Appointment Order Document */}
            <div className="p-6 bg-white text-slate-900 rounded-xl space-y-6 shadow-inner font-sans border border-slate-300">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <img src="/geeta-logo.png" alt="Geeta University" className="h-14 mx-auto object-contain mb-1" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">OFFICE OF THE DEAN STUDENT WELFARE (DSW)</h1>
                <div className="text-sm font-extrabold text-emerald-900 uppercase tracking-wide mt-1">OFFICIAL STUDENT CORE COMMITTEE APPOINTMENT ORDER</div>
                <div className="text-xs font-semibold text-slate-500">Ref: DSW/GU/CC/{selectedCommitteeForPrint.id}/2026 • Date: {new Date(selectedCommitteeForPrint.created_at).toLocaleDateString()}</div>
              </div>

              {/* Event & Faculty Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-100 rounded border border-slate-300 text-xs">
                <div>
                  <p><strong>Event Name:</strong> {selectedCommitteeForPrint.event_title}</p>
                  <p><strong>Event Date:</strong> {selectedCommitteeForPrint.event_date || 'TBA'}</p>
                  <p><strong>Committee Title:</strong> {selectedCommitteeForPrint.title}</p>
                </div>
                <div>
                  <p><strong>Faculty Mentor In-Charge:</strong> {selectedCommitteeForPrint.faculty_name}</p>
                  <p><strong>Issuing Authority:</strong> {selectedCommitteeForPrint.creator_name}</p>
                  <p><strong>Status:</strong> Approved & Published</p>
                </div>
              </div>

              {/* Order Preamble */}
              <p className="text-xs text-slate-800 leading-relaxed">
                As per the approval of the Dean Student Welfare (DSW), the following students are hereby appointed as office bearers and core committee members for the upcoming university event <strong>"{selectedCommitteeForPrint.event_title}"</strong>. The committee shall work under the direct supervision of Faculty Mentor <strong>{selectedCommitteeForPrint.faculty_name}</strong>.
              </p>

              {/* Appointed Students Table */}
              <div className="overflow-x-auto border border-slate-300 rounded-lg">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="bg-slate-200 font-bold text-slate-900 border-b border-slate-300 uppercase">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300 text-center w-12">S.No</th>
                      <th className="p-2.5 border-r border-slate-300">Designation / Role</th>
                      <th className="p-2.5 border-r border-slate-300">Student Name</th>
                      <th className="p-2.5 border-r border-slate-300">Roll Number</th>
                      <th className="p-2.5 border-r border-slate-300">Department / Sem</th>
                      <th className="p-2.5">Responsibilities</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-slate-900 font-medium">
                    {selectedCommitteeForPrint.student_roles.map((st, idx) => {
                      const isPres = st.is_president || (st.role_name && st.role_name.toLowerCase().includes('president'));
                      return (
                        <tr key={idx} className={isPres ? 'bg-amber-50 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-700">{idx + 1}</td>
                          <td className="p-2.5 border-r border-slate-300 font-bold text-emerald-900">
                            {st.role_name} {isPres && '(President)'}
                          </td>
                          <td className="p-2.5 border-r border-slate-300 font-bold text-slate-900">{st.student_name}</td>
                          <td className="p-2.5 border-r border-slate-300 font-mono text-slate-700">{st.student_roll_no || 'N/A'}</td>
                          <td className="p-2.5 border-r border-slate-300 text-slate-600">
                            {st.department || 'General'} {st.semester && `• ${st.semester}`}
                          </td>
                          <td className="p-2.5 text-slate-700 text-[11px]">{st.responsibilities || 'General Committee Duties'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs text-slate-700 font-bold border-t border-slate-200 mt-6">
                <div>
                  <div className="w-36 h-10 border-b border-dashed border-slate-400 mb-1" />
                  <p className="font-bold text-slate-900">{selectedCommitteeForPrint.faculty_name}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Faculty Mentor In-Charge</p>
                </div>
                <div className="text-right">
                  <div className="w-36 h-10 border-b border-dashed border-slate-400 ml-auto mb-1" />
                  <p className="font-bold text-slate-900 text-sm">Dean, Student Welfare</p>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Geeta University, Panipat</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
