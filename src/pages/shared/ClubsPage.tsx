import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import {
  Users, Award, Plus, Search, Eye, Trash2, Pencil, Printer,
  Download, CheckCircle2, Clock, X, FileText, Send, Sparkles,
  Shield, CheckSquare, ChevronRight, UserPlus, Phone, Mail,
  GraduationCap, Calendar, Trophy, XCircle, AlertCircle, BookmarkCheck
} from 'lucide-react';

interface ClubRole {
  role_id?: string;
  role_name: string;
  student_id?: number;
  student_name?: string;
  roll_number?: string;
  email?: string;
  branch?: string;
  phone?: string;
  semester?: string;
  responsibilities?: string;
}

interface ClubMember {
  member_id?: string;
  student_id?: number;
  name: string;
  email: string;
  roll_number?: string;
  branch?: string;
  phone?: string;
  semester?: string;
  joined_at?: string;
}

interface ClubItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  kras?: string;
  faculty_coordinator_id: number;
  faculty_coordinator_name?: string;
  faculty_coordinator_dept?: string;
  faculty_coordinator_email?: string;
  faculty_coordinator_phone?: string;
  student_roles: ClubRole[];
  members: ClubMember[];
  logo_url?: string;
  total_points: number;
  is_active: boolean;
  created_by: number;
  creator_name?: string;
  created_at: string;
  tasks_count: number;
  completed_tasks_count: number;
}

interface ClubTaskItem {
  id: number;
  club_id: number;
  club_title?: string;
  title: string;
  description?: string;
  points_value: number;
  due_date?: string;
  status: string;
  created_by: number;
  created_at: string;
  submissions_count: number;
}

interface ClubTaskSubmissionItem {
  id: number;
  club_task_id: number;
  task_title?: string;
  club_id: number;
  club_title?: string;
  submitted_by: number;
  submitter_name?: string;
  submitter_roll?: string;
  submission_text?: string;
  file_url?: string;
  submitted_at: string;
  status: string;
  points_awarded?: number;
  review_remarks?: string;
}

const DEFAULT_ROLES = [
  'President / Lead Coordinator',
  'Vice President',
  'General Secretary',
  'Technical Head',
  'Events & Operations Lead',
  'PR & Social Media Lead',
  'Treasurer / Finance Head'
];

export const ClubsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Faculty Directory for allocation
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<User[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null);
  const [selectedClubForRoster, setSelectedClubForRoster] = useState<ClubItem | null>(null);
  const [selectedClubForTasks, setSelectedClubForTasks] = useState<ClubItem | null>(null);
  const [selectedClubForPrint, setSelectedClubForPrint] = useState<ClubItem | null>(null);
  const [printHtmlContent, setPrintHtmlContent] = useState<string | null>(null);

  // Club Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Technical');
  const [formKras, setFormKras] = useState('');
  const [formFacultyId, setFormFacultyId] = useState<number | ''>('');
  const [formRoles, setFormRoles] = useState<{ role_name: string; responsibilities: string }[]>(
    DEFAULT_ROLES.map(r => ({ role_name: r, responsibilities: '' }))
  );

  // Roster Management State
  const [rosterTab, setRosterTab] = useState<'executives' | 'members'>('executives');
  const [rosterRoles, setRosterRoles] = useState<ClubRole[]>([]);
  const [rosterMembers, setRosterMembers] = useState<ClubMember[]>([]);

  // Member Quick Add
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemRoll, setNewMemRoll] = useState('');
  const [newMemBranch, setNewMemBranch] = useState('B.Tech CSE');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemSem, setNewMemSem] = useState('5th Sem');

  // Tasks & Submissions State
  const [clubTasks, setClubTasks] = useState<ClubTaskItem[]>([]);
  const [isAssignTaskOpen, setIsAssignTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPoints, setTaskPoints] = useState(50);
  const [taskDueDate, setTaskDueDate] = useState('');

  // Student Task Submit State
  const [submittingTask, setSubmittingTask] = useState<ClubTaskItem | null>(null);
  const [subText, setSubText] = useState('');
  const [subFileUrl, setSubFileUrl] = useState('');

  // Review Submissions State
  const [reviewingTask, setReviewingTask] = useState<ClubTaskItem | null>(null);
  const [taskSubmissions, setTaskSubmissions] = useState<ClubTaskSubmissionItem[]>([]);
  const [declineRemarks, setDeclineRemarks] = useState('');

  const fetchClubs = async () => {
    setLoading(true);
    try {
      let url = '/clubs?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (categoryFilter) url += `category=${encodeURIComponent(categoryFilter)}&`;
      const data = await apiRequest<ClubItem[]>(url);
      setClubs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      if (isAdmin) {
        const fac = await apiRequest<User[]>('/users/faculty');
        setFacultyList(fac);
      }
      const stu = await apiRequest<User[]>('/users/students');
      setStudentsList(stu);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchAuxData();
  }, [user]);

  // Handle Create / Edit Club
  const handleOpenCreateModal = () => {
    setEditingClub(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Technical');
    setFormKras('1. Organize minimum 2 flagship campus events per semester.\n2. Conduct regular skill workshops for registered members.\n3. Submit monthly activity & finance ledger reports to DSW.');
    setFormFacultyId(facultyList[0]?.id || '');
    setFormRoles(DEFAULT_ROLES.map(r => ({ role_name: r, responsibilities: '' })));
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (club: ClubItem) => {
    setEditingClub(club);
    setFormTitle(club.title);
    setFormDescription(club.description || '');
    setFormCategory(club.category || 'Technical');
    setFormKras(club.kras || '');
    setFormFacultyId(club.faculty_coordinator_id);
    setFormRoles(
      club.student_roles && club.student_roles.length > 0
        ? club.student_roles.map(r => ({ role_name: r.role_name, responsibilities: r.responsibilities || '' }))
        : DEFAULT_ROLES.map(r => ({ role_name: r, responsibilities: '' }))
    );
    setIsCreateModalOpen(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFacultyId) return alert('Please select a Faculty Coordinator');

    const formattedRoles = formRoles.map((r, idx) => ({
      role_id: `role-${idx + 1}-${Date.now()}`,
      role_name: r.role_name,
      responsibilities: r.responsibilities
    }));

    try {
      if (editingClub) {
        await apiRequest(`/clubs/${editingClub.id}`, 'PUT', {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          kras: formKras,
          faculty_coordinator_id: Number(formFacultyId),
          student_roles: formattedRoles
        });
      } else {
        await apiRequest('/clubs', 'POST', {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          kras: formKras,
          faculty_coordinator_id: Number(formFacultyId),
          student_roles: formattedRoles,
          members: []
        });
      }
      setIsCreateModalOpen(false);
      fetchClubs();
    } catch (err: any) {
      alert(err.message || 'Failed to save club');
    }
  };

  const handleDeleteClub = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove '${title}'?`)) return;
    try {
      await apiRequest(`/clubs/${id}`, 'DELETE');
      fetchClubs();
    } catch (e: any) {
      alert(e.message || 'Failed to delete club');
    }
  };

  // Handle Roster Management
  const handleOpenRosterModal = (club: ClubItem) => {
    setSelectedClubForRoster(club);
    setRosterRoles(club.student_roles || []);
    setRosterMembers(club.members || []);
    setRosterTab('executives');
  };

  const handleUpdateRoleStudent = (index: number, studentId: number) => {
    const stu = studentsList.find(s => s.id === studentId);
    if (!stu) return;

    setRosterRoles(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        student_id: stu.id,
        student_name: stu.name,
        roll_number: stu.roll_number || '',
        email: stu.email,
        branch: stu.course_branch || 'B.Tech',
        phone: stu.phone || '',
        semester: stu.year ? `${stu.year}` : 'Current'
      };
      return copy;
    });
  };

  const handleAddCustomExecutiveRole = () => {
    const roleName = window.prompt('Enter new Executive Role Designation (e.g. Head of Photography, Logistics Convenor):');
    if (!roleName) return;
    setRosterRoles(prev => [
      ...prev,
      {
        role_id: `custom-role-${Date.now()}`,
        role_name: roleName,
        responsibilities: 'Lead designated portfolio responsibilities.'
      }
    ]);
  };

  const handleDeleteExecutiveRole = (index: number) => {
    if (!window.confirm('Remove this role from executive committee?')) return;
    setRosterRoles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddGeneralMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim() || !newMemEmail.trim()) return alert('Name and email required');

    const newMem: ClubMember = {
      member_id: `mem-${Date.now()}`,
      name: newMemName,
      email: newMemEmail,
      roll_number: newMemRoll || `GU-${Date.now().toString().slice(-4)}`,
      branch: newMemBranch,
      phone: newMemPhone,
      semester: newMemSem,
      joined_at: new Date().toISOString()
    };

    setRosterMembers(prev => [newMem, ...prev]);
    setNewMemName('');
    setNewMemEmail('');
    setNewMemRoll('');
    setNewMemPhone('');
  };

  const handleDeleteMember = (memberId?: string) => {
    if (!memberId) return;
    setRosterMembers(prev => prev.filter(m => m.member_id !== memberId));
  };

  const handleSaveRoster = async () => {
    if (!selectedClubForRoster) return;
    try {
      await apiRequest(`/clubs/${selectedClubForRoster.id}/members`, 'POST', {
        student_roles: rosterRoles,
        members: rosterMembers
      });
      alert('Club executive committee & members roster saved successfully!');
      setSelectedClubForRoster(null);
      fetchClubs();
    } catch (e: any) {
      alert(e.message || 'Failed to save roster');
    }
  };

  // Handle Printable PDF
  const handleOpenPrintModal = async (club: ClubItem) => {
    setSelectedClubForPrint(club);
    try {
      const html = await apiRequest<string>(`/clubs/${club.id}/report-html`);
      setPrintHtmlContent(html);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Tasks
  const handleOpenTasksModal = async (club: ClubItem) => {
    setSelectedClubForTasks(club);
    try {
      const tasksData = await apiRequest<ClubTaskItem[]>(`/clubs/${club.id}/tasks`);
      setClubTasks(tasksData);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForTasks) return;
    try {
      await apiRequest(`/clubs/${selectedClubForTasks.id}/tasks`, 'POST', {
        title: taskTitle,
        description: taskDescription,
        points_value: Number(taskPoints),
        due_date: taskDueDate || null
      });
      setIsAssignTaskOpen(false);
      setTaskTitle('');
      setTaskDescription('');
      const tasksData = await apiRequest<ClubTaskItem[]>(`/clubs/${selectedClubForTasks.id}/tasks`);
      setClubTasks(tasksData);
      fetchClubs();
    } catch (err: any) {
      alert(err.message || 'Failed to assign club task');
    }
  };

  const handleSubmitTaskProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    try {
      await apiRequest(`/clubs/tasks/${submittingTask.id}/submit`, 'POST', {
        submission_text: subText,
        file_url: subFileUrl
      });
      alert('Task proof submitted successfully for evaluation!');
      setSubmittingTask(null);
      setSubText('');
      setSubFileUrl('');
      if (selectedClubForTasks) {
        const tasksData = await apiRequest<ClubTaskItem[]>(`/clubs/${selectedClubForTasks.id}/tasks`);
        setClubTasks(tasksData);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit proof');
    }
  };

  const handleOpenReviewSubmissions = async (t: ClubTaskItem) => {
    setReviewingTask(t);
    try {
      const subs = await apiRequest<ClubTaskSubmissionItem[]>(`/clubs/tasks/${t.id}/submissions`);
      setTaskSubmissions(subs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveClubSubmission = async (subId: number) => {
    try {
      const res: any = await apiRequest(`/clubs/submissions/${subId}/approve`, 'POST');
      alert(`Submission approved! +${res.points_awarded} Points awarded to the club.`);
      if (reviewingTask) {
        const subs = await apiRequest<ClubTaskSubmissionItem[]>(`/clubs/tasks/${reviewingTask.id}/submissions`);
        setTaskSubmissions(subs);
      }
      if (selectedClubForTasks) {
        const tasksData = await apiRequest<ClubTaskItem[]>(`/clubs/${selectedClubForTasks.id}/tasks`);
        setClubTasks(tasksData);
      }
      fetchClubs();
    } catch (err: any) {
      alert(err.message || 'Failed to approve submission');
    }
  };

  const handleRejectClubSubmission = async (subId: number) => {
    if (!declineRemarks.trim()) return alert('Please provide decline remarks');
    try {
      await apiRequest(`/clubs/submissions/${subId}/reject`, 'POST', { review_remarks: declineRemarks });
      alert('Submission rejected with feedback.');
      setDeclineRemarks('');
      if (reviewingTask) {
        const subs = await apiRequest<ClubTaskSubmissionItem[]>(`/clubs/tasks/${reviewingTask.id}/submissions`);
        setTaskSubmissions(subs);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject submission');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-500" /> Student Clubs & Activity Societies
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isAdmin
              ? 'Charter new university student clubs, appoint faculty coordinators, configure custom leadership roles, and monitor club achievements.'
              : isFaculty
              ? 'Oversee your assigned student club, manage executive roles and member rosters, assign tasks, and generate official club PDF rosters.'
              : 'Explore registered university clubs, participate in club tasks, earn points, and build campus leadership credentials.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Charter New Club
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clubs by title or keywords..."
            className="glass-input pl-10"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['', 'Technical', 'Cultural', 'Literary', 'Sports', 'Social', 'Innovation'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] border border-[var(--panel-border)] hover:border-emerald-500/40'
              }`}
            >
              {cat === '' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)] glass-panel">Loading university clubs directory...</div>
        ) : clubs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[var(--text-muted)] glass-panel space-y-3">
            <p className="text-sm font-medium">No clubs found matching your search.</p>
            {isAdmin && (
              <button onClick={handleOpenCreateModal} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Charter First Club
              </button>
            )}
          </div>
        ) : (
          clubs.map(club => {
            const canManage = isAdmin || (isFaculty && club.faculty_coordinator_id === user?.id);

            return (
              <div
                key={club.id}
                className="glass-panel p-6 space-y-4 relative flex flex-col justify-between hover:border-emerald-500/40 transition-all group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {club.category}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> {club.total_points} pts
                    </span>
                  </div>

                  {/* Club Title & Description */}
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mt-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {club.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                    {club.description || 'Recognized Geeta University student activity society.'}
                  </p>

                  {/* Faculty Coordinator Info Card */}
                  <div className="mt-4 p-3 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-1 text-xs">
                    <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase">Faculty Coordinator</div>
                    <div className="font-bold text-[var(--text-primary)]">{club.faculty_coordinator_name || 'Unassigned'}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{club.faculty_coordinator_dept || 'Geeta University'}</div>
                  </div>

                  {/* Club Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-2 bg-[var(--card-bg-to)] rounded-lg border border-[var(--panel-border)]">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Executive</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{club.student_roles?.length || 0} Roles</div>
                    </div>
                    <div className="p-2 bg-[var(--card-bg-to)] rounded-lg border border-[var(--panel-border)]">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Members</div>
                      <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{club.members?.length || 0} Students</div>
                    </div>
                    <div className="p-2 bg-[var(--card-bg-to)] rounded-lg border border-[var(--panel-border)]">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Completed</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">{club.completed_tasks_count} / {club.tasks_count}</div>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-4 border-t border-[var(--panel-border)] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenPrintModal(club)}
                      className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                      title="Download full official printable PDF charter with executive board & member list"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-500" /> Club PDF Roster
                    </button>

                    <button
                      onClick={() => handleOpenTasksModal(club)}
                      className="btn-primary text-xs py-2 px-3 flex items-center justify-center gap-1.5"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Club Tasks ({club.tasks_count})
                    </button>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => handleOpenRosterModal(club)}
                        className="btn-secondary text-xs py-1.5 px-3 flex-1 flex items-center justify-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-emerald-500" /> Manage Roster
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(club)}
                            className="p-1.5 rounded-lg bg-[var(--card-bg-to)] hover:bg-emerald-500/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)] transition-colors"
                            title="Edit Club Details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClub(club.id, club.title)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors"
                            title="Deactivate Club"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 1. CREATE / EDIT CLUB MODAL (ADMIN ONLY) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                {editingClub ? 'Edit Student Club Profile' : 'Charter New University Student Club'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClub} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Club Title *</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="e.g. Geeta Coding & AI Club"
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Club Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="glass-input"
                  >
                    <option value="Technical">Technical & Innovation</option>
                    <option value="Cultural">Cultural, Arts & Dramatics</option>
                    <option value="Literary">Literary, Quizzing & Debating</option>
                    <option value="Sports">Sports, Fitness & Adventure</option>
                    <option value="Social">Social Welfare & Community Outreach</option>
                    <option value="Innovation">Entrepreneurship & Startups</option>
                    <option value="Media">Media, Design & Photography</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Faculty Coordinator In-Charge *</label>
                <select
                  required
                  value={formFacultyId}
                  onChange={e => setFormFacultyId(e.target.value ? Number(e.target.value) : '')}
                  className="glass-input"
                >
                  <option value="">-- Select Faculty Coordinator --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.department || 'DSW'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Club Mission & Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe the club's objectives, focus domains, and campus vision..."
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Key Result Areas (KRAs) & Annual Directives (For Official PDF Charter)
                </label>
                <textarea
                  rows={3}
                  value={formKras}
                  onChange={e => setFormKras(e.target.value)}
                  placeholder="1. Conduct annual hackathon&#10;2. Host bi-weekly coding meetups&#10;3. Submit monthly activity logs"
                  className="glass-input"
                />
              </div>

              {/* Dynamic Role Builder */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Configure Executive Leadership Positions</span>
                    <span className="block text-[11px] text-[var(--text-muted)]">Add or delete custom roles (e.g. 5, 6, 7, 8 roles as needed)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormRoles(prev => [...prev, { role_name: 'Lead Portfolio Officer', responsibilities: '' }])}
                    className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Role
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formRoles.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--card-bg-to)] rounded-lg border border-[var(--panel-border)]">
                      <span className="text-xs font-mono font-bold text-emerald-600 w-6 text-center">{idx + 1}</span>
                      <input
                        required
                        type="text"
                        value={r.role_name}
                        onChange={e => {
                          const val = e.target.value;
                          setFormRoles(prev => {
                            const c = [...prev];
                            c[idx].role_name = val;
                            return c;
                          });
                        }}
                        placeholder="Role Name (e.g. President, Tech Lead)"
                        className="glass-input text-xs flex-1 py-1.5"
                      />
                      {formRoles.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setFormRoles(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-md"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingClub ? 'Update Club' : 'Charter Club'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MANAGE STUDENT ROSTER MODAL (FACULTY & ADMIN) */}
      {selectedClubForRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-500" /> Student Roster & Leadership Allocation
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Club: {selectedClubForRoster.title}</p>
              </div>
              <button onClick={() => setSelectedClubForRoster(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roster Mode Toggle */}
            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--panel-border)] gap-1 my-4 shrink-0">
              <button
                onClick={() => setRosterTab('executives')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  rosterTab === 'executives'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Award className="w-4 h-4" /> Executive Leadership Roles ({rosterRoles.length})
              </button>
              <button
                onClick={() => setRosterTab('members')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  rosterTab === 'members'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Users className="w-4 h-4" /> General Registered Members ({rosterMembers.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* TAB 1: EXECUTIVES */}
              {rosterTab === 'executives' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      Appoint students to defined club leadership portfolios:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddCustomExecutiveRole}
                      className="btn-secondary text-xs py-1 px-3 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Portfolio Role
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rosterRoles.map((role, idx) => (
                      <div key={idx} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-sm text-[var(--text-primary)]">{role.role_name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteExecutiveRole(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                            title="Remove Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Pick Registered Student</label>
                            <select
                              value={role.student_id || ''}
                              onChange={e => handleUpdateRoleStudent(idx, Number(e.target.value))}
                              className="glass-input text-xs"
                            >
                              <option value="">-- Choose Student --</option>
                              {studentsList.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Full Name</label>
                            <input
                              type="text"
                              value={role.student_name || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].student_name = val;
                                  return c;
                                });
                              }}
                              placeholder="Student Name"
                              className="glass-input text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Roll Number</label>
                            <input
                              type="text"
                              value={role.roll_number || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].roll_number = val;
                                  return c;
                                });
                              }}
                              placeholder="e.g. 2301201004"
                              className="glass-input text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Branch / Specialization</label>
                            <input
                              type="text"
                              value={role.branch || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].branch = val;
                                  return c;
                                });
                              }}
                              placeholder="B.Tech CSE"
                              className="glass-input text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Semester</label>
                            <input
                              type="text"
                              value={role.semester || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].semester = val;
                                  return c;
                                });
                              }}
                              placeholder="5th Sem"
                              className="glass-input text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Email</label>
                            <input
                              type="email"
                              value={role.email || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].email = val;
                                  return c;
                                });
                              }}
                              placeholder="student@geeta.edu.in"
                              className="glass-input text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Contact Phone</label>
                            <input
                              type="text"
                              value={role.phone || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setRosterRoles(prev => {
                                  const c = [...prev];
                                  c[idx].phone = val;
                                  return c;
                                });
                              }}
                              placeholder="+91 9876543210"
                              className="glass-input text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: GENERAL MEMBERS */}
              {rosterTab === 'members' && (
                <div className="space-y-4">
                  {/* Quick Add Member Form */}
                  <form onSubmit={handleAddGeneralMember} className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-3">
                    <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-500" /> Register New Club Member
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        required
                        type="text"
                        value={newMemName}
                        onChange={e => setNewMemName(e.target.value)}
                        placeholder="Full Name *"
                        className="glass-input text-xs"
                      />
                      <input
                        required
                        type="email"
                        value={newMemEmail}
                        onChange={e => setNewMemEmail(e.target.value)}
                        placeholder="Email Address *"
                        className="glass-input text-xs"
                      />
                      <input
                        type="text"
                        value={newMemRoll}
                        onChange={e => setNewMemRoll(e.target.value)}
                        placeholder="Roll Number (Optional)"
                        className="glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newMemBranch}
                        onChange={e => setNewMemBranch(e.target.value)}
                        placeholder="Branch / Course"
                        className="glass-input text-xs"
                      />
                      <input
                        type="text"
                        value={newMemSem}
                        onChange={e => setNewMemSem(e.target.value)}
                        placeholder="Semester (e.g. 3rd Sem)"
                        className="glass-input text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newMemPhone}
                          onChange={e => setNewMemPhone(e.target.value)}
                          placeholder="Contact Phone"
                          className="glass-input text-xs flex-1"
                        />
                        <button type="submit" className="btn-primary text-xs py-2 px-4 shrink-0">
                          + Add Member
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Members Table */}
                  <div className="overflow-hidden rounded-xl border border-[var(--panel-border)]">
                    <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                      <thead className="bg-[var(--card-bg-to)] text-[11px] uppercase font-bold text-[var(--text-primary)] border-b border-[var(--panel-border)]">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Student Name</th>
                          <th className="p-3">Roll Number</th>
                          <th className="p-3">Branch & Semester</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--panel-border)]">
                        {rosterMembers.length === 0 ? (
                          <tr><td colSpan={6} className="p-6 text-center text-[var(--text-muted)]">No general members registered yet. Use form above to add members.</td></tr>
                        ) : (
                          rosterMembers.map((m, idx) => (
                            <tr key={idx} className="hover:bg-emerald-500/5">
                              <td className="p-3 font-mono font-bold text-[var(--text-muted)]">{idx + 1}</td>
                              <td className="p-3 font-semibold text-[var(--text-primary)]">{m.name}</td>
                              <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{m.roll_number || 'N/A'}</td>
                              <td className="p-3">{m.branch} ({m.semester})</td>
                              <td className="p-3">{m.email} {m.phone ? `• ${m.phone}` : ''}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteMember(m.member_id)}
                                  className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                                  title="Remove Member"
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
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--panel-border)] flex justify-between items-center shrink-0">
              <span className="text-xs text-[var(--text-muted)]">
                Total Allocated: {rosterRoles.filter(r => r.student_name).length} Executives • {rosterMembers.length} Members
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedClubForRoster(null)} className="btn-secondary">Cancel</button>
                <button type="button" onClick={handleSaveRoster} className="btn-primary">Save Roster Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. OFFICIAL PRINTABLE CLUB PDF / HTML MODAL */}
      {selectedClubForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl relative my-8 overflow-hidden flex flex-col h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" /> Printable Club Charter & Official Leadership Roster
                </h3>
                <p className="text-xs text-slate-400">{selectedClubForPrint.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-primary text-xs py-1.5 px-4 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
                >
                  <Download className="w-4 h-4" /> Print / Save as PDF
                </button>
                <button onClick={() => setSelectedClubForPrint(null)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <iframe
              srcDoc={printHtmlContent || '<p style="padding: 20px;">Generating printable charter...</p>'}
              title="Official Club PDF Charter"
              className="w-full flex-1 border-none bg-white"
            />
          </div>
        </div>
      )}

      {/* 4. CLUB TASKS & PROOF SUBMISSIONS MODAL */}
      {selectedClubForTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" /> Club Tasks & Point Challenges
                </h3>
                <p className="text-xs text-[var(--text-muted)]">{selectedClubForTasks.title} • Current Score: {selectedClubForTasks.total_points} pts</p>
              </div>
              <button onClick={() => setSelectedClubForTasks(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Task Assign Action (Faculty Coordinator or Admin) */}
            {(isAdmin || (isFaculty && selectedClubForTasks.faculty_coordinator_id === user?.id)) && (
              <div className="my-4 shrink-0">
                {!isAssignTaskOpen ? (
                  <button
                    onClick={() => setIsAssignTaskOpen(true)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Assign New Task to {selectedClubForTasks.title}
                  </button>
                ) : (
                  <form onSubmit={handleCreateClubTask} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)]">Assign Direct Challenge / Mission</span>
                      <button type="button" onClick={() => setIsAssignTaskOpen(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        Close
                      </button>
                    </div>

                    <div>
                      <input
                        required
                        type="text"
                        value={taskTitle}
                        onChange={e => setTaskTitle(e.target.value)}
                        placeholder="Task Title (e.g. Conduct Web Development Bootcamp)"
                        className="glass-input text-xs"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={taskDescription}
                        onChange={e => setTaskDescription(e.target.value)}
                        placeholder="Specify deliverables, attendance requirements, and proof guidelines..."
                        className="glass-input text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Reward Points Value</label>
                        <input
                          required
                          type="number"
                          value={taskPoints}
                          onChange={e => setTaskPoints(Number(e.target.value))}
                          className="glass-input text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Due Date</label>
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={e => setTaskDueDate(e.target.value)}
                          className="glass-input text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setIsAssignTaskOpen(false)} className="btn-secondary text-xs">Cancel</button>
                      <button type="submit" className="btn-primary text-xs">Publish Club Task</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Task Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
              {clubTasks.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)]">
                  No active tasks assigned to this club yet.
                </div>
              ) : (
                clubTasks.map(t => (
                  <div key={t.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">{t.title}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.description || 'Deliverable task.'}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                        +{t.points_value} pts
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--panel-border)]">
                      <span>Status: <strong className={t.status === 'completed' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{t.status.toUpperCase()}</strong></span>
                      
                      <div className="flex items-center gap-2">
                        {isStudent && (
                          <button
                            onClick={() => setSubmittingTask(t)}
                            className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Submit Completion Proof
                          </button>
                        )}

                        {(isAdmin || isFaculty) && (
                          <button
                            onClick={() => handleOpenReviewSubmissions(t)}
                            className="btn-secondary text-xs py-1 px-3 flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-500" /> Review Submissions ({t.submissions_count})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. STUDENT SUBMIT PROOF MODAL */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Submit Task Completion Proof</h3>
                <p className="text-xs text-[var(--text-muted)]">{submittingTask.title} (+{submittingTask.points_value} pts)</p>
              </div>
              <button onClick={() => setSubmittingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTaskProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Work Summary & Completion Report *</label>
                <textarea
                  required
                  rows={4}
                  value={subText}
                  onChange={e => setSubText(e.target.value)}
                  placeholder="Detail the activities executed, attendance counts, outcomes achieved..."
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Proof Attachment Link (Google Drive / Photo URL / Document)</label>
                <input
                  type="url"
                  value={subFileUrl}
                  onChange={e => setSubFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="glass-input"
                />
              </div>

              <div className="pt-4 border-t border-[var(--panel-border)] flex justify-end gap-2">
                <button type="button" onClick={() => setSubmittingTask(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Submit to DSW
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. REVIEW SUBMISSIONS MODAL (ADMIN & FACULTY) */}
      {reviewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--panel-border)] mb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Evaluate Task Proofs</h3>
                <p className="text-xs text-[var(--text-muted)]">{reviewingTask.title} • Reward: +{reviewingTask.points_value} pts</p>
              </div>
              <button onClick={() => setReviewingTask(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {taskSubmissions.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)]">
                  No submissions submitted yet for this task.
                </div>
              ) : (
                taskSubmissions.map(sub => (
                  <div key={sub.id} className="p-4 bg-[var(--card-bg-to)] rounded-xl border border-[var(--panel-border)] space-y-3">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <div>
                        Submitted by: <strong className="text-[var(--text-primary)]">{sub.submitter_name}</strong> ({sub.submitter_roll || 'Student'})
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-600' : sub.status === 'declined' ? 'bg-rose-500/20 text-rose-600' : 'bg-amber-500/20 text-amber-600'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--panel-border)]">
                      "{sub.submission_text || 'No remarks provided.'}"
                    </p>

                    {sub.file_url && (
                      <a
                        href={sub.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-bold"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Proof Attachment
                      </a>
                    )}

                    {sub.status === 'pending' && (
                      <div className="pt-2 border-t border-[var(--panel-border)] space-y-2">
                        <input
                          type="text"
                          value={declineRemarks}
                          onChange={e => setDeclineRemarks(e.target.value)}
                          placeholder="Rejection reason (if declining)..."
                          className="glass-input text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRejectClubSubmission(sub.id)}
                            className="btn-crimson text-xs py-1.5 px-3"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                          <button
                            onClick={() => handleApproveClubSubmission(sub.id)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Award +{reviewingTask.points_value} Pts
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
