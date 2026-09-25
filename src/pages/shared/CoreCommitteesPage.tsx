import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth, User } from '../../context/AuthContext';
import { ImproveEnglishButton } from '../../components/common/ImproveEnglishButton';
import {
  Users, Plus, Trash2, Calendar, User as UserIcon, MapPin,
  Clock, Printer, Download, Eye, X, CheckCircle2, Shield, Sparkles, Award, Star,
  Key, Lock, Mail, Phone, GraduationCap, AlertCircle, Check, Info, ChevronRight,
  UserPlus, FileText, CheckSquare, Trophy, Medal, MessageSquare, Send,
  Upload, FileCheck, ArrowUpRight, ArrowLeft, RefreshCw, Filter, Search,
  Flame, Briefcase, ChevronDown, ListChecks, HelpCircle
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
  points?: number;
}

interface CoreCommitteeData {
  id: number;
  title: string;
  category: string;
  event_id?: number | null;
  event_title?: string | null;
  event_date?: string | null;
  faculty_id?: number | null;
  faculty_name?: string | null;
  faculty_email?: string | null;
  faculty_phone?: string | null;
  president_id?: number | null;
  president_name?: string | null;
  president_email?: string | null;
  description?: string | null;
  student_roles: StudentRoleData[];
  total_points: number;
  tasks_count: number;
  pending_tasks_count: number;
  reports_count: number;
  is_active: boolean;
  created_by: number;
  creator_name?: string | null;
  created_at: string;
}

interface CommitteeTaskData {
  id: number;
  committee_id: number;
  committee_title?: string | null;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  assignee_name?: string | null;
  assignee_roll?: string | null;
  assigned_by: number;
  assigner_name?: string | null;
  points_reward: number;
  priority: string;
  start_date?: string | null;
  due_date?: string | null;
  status: string;
  submission_text?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  submitted_by?: number | null;
  submitter_name?: string | null;
  submitted_at?: string | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  review_remarks?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

interface CommitteeReportData {
  id: number;
  committee_id: number;
  committee_title?: string | null;
  title: string;
  report_type: string;
  report_date: string;
  venue?: string | null;
  attendees_count: number;
  summary: string;
  achievements?: string | null;
  challenges?: string | null;
  next_steps?: string | null;
  document_url?: string | null;
  photos: string[];
  submitted_by: number;
  submitter_name?: string | null;
  status: string;
  faculty_remarks?: string | null;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

interface LeaderboardEntry {
  student_id?: number | null;
  student_name: string;
  student_roll_no?: string | null;
  department?: string | null;
  role_name: string;
  is_president: boolean;
  total_points: number;
  tasks_completed: number;
  reports_submitted: number;
  rank: number;
}

interface MemberFormRow {
  id: string;
  role_name: string;
  student_name: string;
  student_roll_no: string;
  department: string;
  semester: string;
  email: string;
  phone: string;
  password?: string;
  is_president?: boolean;
  responsibilities: string;
}

const COMMITTEE_CATEGORIES = [
  "All",
  "Discipline",
  "Cultural",
  "Technical",
  "Logistics",
  "Media & PR",
  "Hospitality",
  "Sports",
  "General"
];

const COMMON_ROLE_SUGGESTIONS = [
  "President / Student Convenor",
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
  "Executive Member",
  "Volunteer Coordinator"
];

export const CoreCommitteesPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const isFaculty = user?.role === 'faculty';
  const isStudent = user?.role === 'student';

  const [committees, setCommittees] = useState<CoreCommitteeData[]>([]);
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [studentsList, setStudentsList] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Workspace View State (when a committee card is clicked)
  const [activeCommittee, setActiveCommittee] = useState<CoreCommitteeData | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'members' | 'tasks' | 'reports' | 'leaderboard'>('members');

  // Committee Sub-data inside Workspace
  const [committeeTasks, setCommitteeTasks] = useState<CommitteeTaskData[]>([]);
  const [committeeReports, setCommitteeReports] = useState<CommitteeReportData[]>([]);
  const [committeeLeaderboard, setCommitteeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isSubmitTaskModalOpen, setIsSubmitTaskModalOpen] = useState(false);
  const [isReviewTaskModalOpen, setIsReviewTaskModalOpen] = useState(false);
  const [isSubmitReportModalOpen, setIsSubmitReportModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedCommitteeForPrint, setSelectedCommitteeForPrint] = useState<CoreCommitteeData | null>(null);

  // Selected Items for Actions
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<CommitteeTaskData | null>(null);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<CommitteeTaskData | null>(null);

  // Create / Edit Committee Form State
  const [commTitle, setCommTitle] = useState('');
  const [commCategory, setCommCategory] = useState('Discipline');
  const [commEventId, setCommEventId] = useState<number | ''>('');
  const [commEventDate, setCommEventDate] = useState('');
  const [commFacultyId, setCommFacultyId] = useState<number | ''>('');
  const [commDescription, setCommDescription] = useState('');

  // President (OPTIONAL)
  const [enablePresident, setEnablePresident] = useState(false);
  const [presRoleTitle, setPresRoleTitle] = useState('President / Student Convenor');
  const [presName, setPresName] = useState('');
  const [presRoll, setPresRoll] = useState('');
  const [presDept, setPresDept] = useState('Computer Science & Engineering');
  const [presSemester, setPresSemester] = useState('6th Sem');
  const [presEmail, setPresEmail] = useState('');
  const [presPhone, setPresPhone] = useState('');
  const [presPassword, setPresPassword] = useState('Geeta@123');
  const [presResponsibilities, setPresResponsibilities] = useState('Overall committee team coordination and operational management.');

  // Student Members List
  const [memberRows, setMemberRows] = useState<MemberFormRow[]>([
    {
      id: 'mem_1',
      role_name: 'Vice President / Co-Convenor',
      student_name: '',
      student_roll_no: '',
      department: 'Computer Science & Engineering',
      semester: '6th Sem',
      email: '',
      phone: '',
      password: 'Geeta@123',
      responsibilities: 'Assist in coordination, team management and task execution.'
    },
    {
      id: 'mem_2',
      role_name: 'Media & PR Head',
      student_name: '',
      student_roll_no: '',
      department: 'Management & Commerce',
      semester: '4th Sem',
      email: '',
      phone: '',
      password: 'Geeta@123',
      responsibilities: 'Oversee promotions, photography and campus outreach.'
    }
  ]);

  // Task Assignment Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<number | ''>('');
  const [newTaskPoints, setNewTaskPoints] = useState(20);
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Task Submission Form State
  const [taskProofText, setTaskProofText] = useState('');
  const [taskProofUrl, setTaskProofUrl] = useState('');
  const [taskProofFileName, setTaskProofFileName] = useState('');

  // Task Review Form State
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'declined'>('approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewPoints, setReviewPoints] = useState<number>(20);

  // Report Submission Form State
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('daily_log');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportVenue, setReportVenue] = useState('');
  const [reportAttendees, setReportAttendees] = useState(0);
  const [reportSummary, setReportSummary] = useState('');
  const [reportAchievements, setReportAchievements] = useState('');
  const [reportChallenges, setReportChallenges] = useState('');
  const [reportNextSteps, setReportNextSteps] = useState('');
  const [reportDocUrl, setReportDocUrl] = useState('');

  // Single Member Add Form State
  const [singleMemberRole, setSingleMemberRole] = useState('Executive Member');
  const [singleMemberName, setSingleMemberName] = useState('');
  const [singleMemberRoll, setSingleMemberRoll] = useState('');
  const [singleMemberDept, setSingleMemberDept] = useState('Computer Science & Engineering');
  const [singleMemberSem, setSingleMemberSem] = useState('6th Sem');
  const [singleMemberEmail, setSingleMemberEmail] = useState('');
  const [singleMemberPhone, setSingleMemberPhone] = useState('');
  const [singleMemberPassword, setSingleMemberPassword] = useState('Geeta@123');
  const [singleMemberResp, setSingleMemberResp] = useState('');

  // Form Submitting indicator
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const fetchCommitteesData = async () => {
    setLoading(true);
    try {
      const [cData, evData, facData, stuData] = await Promise.all([
        apiRequest<CoreCommitteeData[]>('/committees'),
        apiRequest<EventItem[]>('/events').catch(() => []),
        apiRequest<User[]>('/users/faculty').catch(() => []),
        apiRequest<StudentItem[]>('/users/students').catch(() => [])
      ]);
      setCommittees(cData || []);
      setEventsList(evData || []);
      setFacultyList(facData || []);
      setStudentsList(stuData || []);
    } catch (err: any) {
      console.error('Failed to load committees data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommitteesData();
  }, []);

  // Fetch sub-data for open workspace
  const fetchWorkspaceData = async (commId: number) => {
    setWorkspaceLoading(true);
    try {
      const [tasks, reports, lb, updatedComm] = await Promise.all([
        apiRequest<CommitteeTaskData[]>(`/committees/${commId}/tasks`).catch(() => []),
        apiRequest<CommitteeReportData[]>(`/committees/${commId}/reports`).catch(() => []),
        apiRequest<LeaderboardEntry[]>(`/committees/${commId}/leaderboard`).catch(() => []),
        apiRequest<CoreCommitteeData>(`/committees/${commId}`).catch(() => null)
      ]);
      setCommitteeTasks(tasks || []);
      setCommitteeReports(reports || []);
      setCommitteeLeaderboard(lb || []);
      if (updatedComm) {
        setActiveCommittee(updatedComm);
      }
    } catch (err) {
      console.error('Failed to fetch workspace details:', err);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleOpenWorkspace = (comm: CoreCommitteeData) => {
    setActiveCommittee(comm);
    setWorkspaceTab('members');
    fetchWorkspaceData(comm.id);
  };

  const handleCloseWorkspace = () => {
    setActiveCommittee(null);
    fetchCommitteesData();
  };

  // Helper: check if current user is manager (super_admin or allotted faculty)
  const isManagerOfActive = Boolean(
    isAdmin || (isFaculty && activeCommittee?.faculty_id === user?.id)
  );

  // Helper: check if current user is member of active committee
  const isMemberOfActive = Boolean(
    isManagerOfActive ||
    activeCommittee?.president_id === user?.id ||
    activeCommittee?.student_roles?.some(r => r.student_id === user?.id || r.email?.toLowerCase() === user?.email?.toLowerCase())
  );

  // Filtered committees list
  const filteredCommittees = committees.filter(c => {
    const matchCategory = selectedCategory === 'All' || c.category?.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchCategory;
    const matchSearch =
      c.title?.toLowerCase().includes(q) ||
      c.faculty_name?.toLowerCase().includes(q) ||
      c.president_name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  // Calculate high-level stats
  const totalCommitteesCount = committees.length;
  const totalMembersCount = committees.reduce((acc, c) => acc + (c.student_roles?.length || 0), 0);
  const totalTasksCount = committees.reduce((acc, c) => acc + (c.tasks_count || 0), 0);
  const totalPointsSum = committees.reduce((acc, c) => acc + (c.total_points || 0), 0);

  // -------------------------------------------------------------------------
  // CREATE / EDIT COMMITTEE HANDLERS
  // -------------------------------------------------------------------------

  const openCreateModal = () => {
    setCommTitle('');
    setCommCategory('Discipline');
    setCommEventId('');
    setCommEventDate('');
    setCommFacultyId(facultyList.length > 0 ? facultyList[0].id : '');
    setCommDescription('');
    setEnablePresident(false);
    setPresName('');
    setPresRoll('');
    setPresDept('Computer Science & Engineering');
    setPresSemester('6th Sem');
    setPresEmail('');
    setPresPhone('');
    setPresPassword('Geeta@123');
    setPresResponsibilities('Overall committee leadership and coordination.');
    setMemberRows([
      {
        id: 'mem_1',
        role_name: 'Vice President / Co-Convenor',
        student_name: '',
        student_roll_no: '',
        department: 'Computer Science & Engineering',
        semester: '6th Sem',
        email: '',
        phone: '',
        password: 'Geeta@123',
        responsibilities: 'Assist in coordination, team management and task execution.'
      }
    ]);
    setIsCreateModalOpen(true);
  };

  const handleAddMemberRow = () => {
    setMemberRows(prev => [
      ...prev,
      {
        id: `mem_${Date.now()}`,
        role_name: 'Executive Member',
        student_name: '',
        student_roll_no: '',
        department: 'Computer Science & Engineering',
        semester: '6th Sem',
        email: '',
        phone: '',
        password: 'Geeta@123',
        responsibilities: 'Assist in committee activities and ground operations.'
      }
    ]);
  };

  const handleRemoveMemberRow = (id: string) => {
    setMemberRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateMemberRow = (id: string, field: keyof MemberFormRow, value: string) => {
    setMemberRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commTitle.trim()) {
      alert('Please enter a Committee Title');
      return;
    }

    setSubmitting(true);
    try {
      const studentRolesPayload = [];

      // 1. If President is enabled and filled, add president role
      if (enablePresident && presName.trim()) {
        studentRolesPayload.push({
          role_name: presRoleTitle || 'President / Student Convenor',
          student_name: presName.trim(),
          student_roll_no: presRoll.trim() || undefined,
          department: presDept,
          semester: presSemester,
          email: presEmail.trim() || undefined,
          phone: presPhone.trim() || undefined,
          password: presPassword.trim() || 'Geeta@123',
          is_president: true,
          responsibilities: presResponsibilities
        });
      }

      // 2. Add other member rows
      for (const row of memberRows) {
        if (row.student_name.trim()) {
          studentRolesPayload.push({
            role_name: row.role_name,
            student_name: row.student_name.trim(),
            student_roll_no: row.student_roll_no.trim() || undefined,
            department: row.department,
            semester: row.semester,
            email: row.email.trim() || undefined,
            phone: row.phone.trim() || undefined,
            password: row.password?.trim() || 'Geeta@123',
            is_president: false,
            responsibilities: row.responsibilities
          });
        }
      }

      const payload = {
        title: commTitle.trim(),
        category: commCategory,
        event_id: commEventId || null,
        event_date: commEventDate || null,
        faculty_id: commFacultyId || null,
        description: commDescription.trim() || null,
        student_roles: studentRolesPayload
      };

      const newComm = await apiRequest<CoreCommitteeData>('/committees', 'POST', payload);
      showSuccess(`Core Committee "${newComm.title}" created successfully!`);
      setIsCreateModalOpen(false);
      fetchCommitteesData();
    } catch (err: any) {
      alert(`Error creating committee: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // TASK ASSIGNMENT HANDLERS
  // -------------------------------------------------------------------------

  const openAssignTaskModal = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignedTo('');
    setNewTaskPoints(20);
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setIsAssignTaskModalOpen(true);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee || !newTaskTitle.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        assigned_to: newTaskAssignedTo || null,
        points_reward: Number(newTaskPoints) || 20,
        priority: newTaskPriority,
        due_date: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : null
      };

      await apiRequest(`/committees/${activeCommittee.id}/tasks`, 'POST', payload);
      showSuccess(`Task "${newTaskTitle}" assigned successfully!`);
      setIsAssignTaskModalOpen(false);
      fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error assigning task: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // TASK SUBMISSION HANDLERS
  // -------------------------------------------------------------------------

  const openSubmitTaskModal = (task: CommitteeTaskData) => {
    setSelectedTaskForSubmit(task);
    setTaskProofText(task.submission_text || '');
    setTaskProofUrl(task.file_url || '');
    setTaskProofFileName(task.file_name || '');
    setIsSubmitTaskModalOpen(true);
  };

  const handleSubmitTaskProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmit || !taskProofText.trim()) {
      alert('Please provide a summary of the completed work.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        submission_text: taskProofText.trim(),
        file_url: taskProofUrl.trim() || null,
        file_name: taskProofFileName.trim() || (taskProofUrl ? 'Proof_Attachment.pdf' : null)
      };

      await apiRequest(`/committees/tasks/${selectedTaskForSubmit.id}/submit`, 'POST', payload);
      showSuccess('Task proof submitted successfully for verification!');
      setIsSubmitTaskModalOpen(false);
      if (activeCommittee) fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error submitting proof: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // TASK REVIEW HANDLERS (APPROVE & AWARD POINTS)
  // -------------------------------------------------------------------------

  const openReviewTaskModal = (task: CommitteeTaskData) => {
    setSelectedTaskForReview(task);
    setReviewStatus('approved');
    setReviewRemarks('');
    setReviewPoints(task.points_reward || 20);
    setIsReviewTaskModalOpen(true);
  };

  const handleReviewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForReview) return;

    setSubmitting(true);
    try {
      const payload = {
        status: reviewStatus,
        review_remarks: reviewRemarks.trim() || null,
        points_awarded: reviewStatus === 'approved' ? Number(reviewPoints) : 0
      };

      await apiRequest(`/committees/tasks/${selectedTaskForReview.id}/review`, 'POST', payload);
      showSuccess(reviewStatus === 'approved' ? `Task approved! +${reviewPoints} points awarded.` : 'Task declined with feedback.');
      setIsReviewTaskModalOpen(false);
      if (activeCommittee) fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error reviewing task: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // REPORT / DAILY DPR SUBMISSION HANDLERS
  // -------------------------------------------------------------------------

  const openSubmitReportModal = () => {
    setReportTitle('');
    setReportType('daily_log');
    setReportDate(new Date().toISOString().split('T')[0]);
    setReportVenue('');
    setReportAttendees(0);
    setReportSummary('');
    setReportAchievements('');
    setReportChallenges('');
    setReportNextSteps('');
    setReportDocUrl('');
    setIsSubmitReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee || !reportTitle.trim() || !reportSummary.trim()) {
      alert('Please fill out the report title and executive summary.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: reportTitle.trim(),
        report_type: reportType,
        report_date: reportDate,
        venue: reportVenue.trim() || null,
        attendees_count: Number(reportAttendees) || 0,
        summary: reportSummary.trim(),
        achievements: reportAchievements.trim() || null,
        challenges: reportChallenges.trim() || null,
        next_steps: reportNextSteps.trim() || null,
        document_url: reportDocUrl.trim() || null,
        photos: []
      };

      await apiRequest(`/committees/${activeCommittee.id}/reports`, 'POST', payload);
      showSuccess('Committee report submitted successfully!');
      setIsSubmitReportModalOpen(false);
      fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error submitting report: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // ADD SINGLE MEMBER HANDLER
  // -------------------------------------------------------------------------

  const openAddMemberModal = () => {
    setSingleMemberRole('Executive Member');
    setSingleMemberName('');
    setSingleMemberRoll('');
    setSingleMemberDept('Computer Science & Engineering');
    setSingleMemberSem('6th Sem');
    setSingleMemberEmail('');
    setSingleMemberPhone('');
    setSingleMemberPassword('Geeta@123');
    setSingleMemberResp('');
    setIsAddMemberModalOpen(true);
  };

  const handleAddSingleMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommittee || !singleMemberName.trim()) {
      alert('Please enter member name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        role_name: singleMemberRole,
        student_name: singleMemberName.trim(),
        student_roll_no: singleMemberRoll.trim() || undefined,
        department: singleMemberDept,
        semester: singleMemberSem,
        email: singleMemberEmail.trim() || undefined,
        phone: singleMemberPhone.trim() || undefined,
        password: singleMemberPassword.trim() || 'Geeta@123',
        responsibilities: singleMemberResp.trim() || undefined,
        is_president: singleMemberRole.toLowerCase().includes('president')
      };

      await apiRequest(`/committees/${activeCommittee.id}/members`, 'POST', payload);
      showSuccess(`Added "${singleMemberName}" to committee with active portal login!`);
      setIsAddMemberModalOpen(false);
      fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error adding member: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (studentId: number, memberName: string) => {
    if (!activeCommittee) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this committee?`)) return;

    try {
      await apiRequest(`/committees/${activeCommittee.id}/members/${studentId}`, 'DELETE');
      showSuccess(`Removed ${memberName} from committee.`);
      fetchWorkspaceData(activeCommittee.id);
    } catch (err: any) {
      alert(`Error removing member: ${err.message || err}`);
    }
  };

  const handleDeleteCommittee = async (c: CoreCommitteeData) => {
    if (!confirm(`Are you sure you want to permanently delete the committee "${c.title}"? All associated tasks and reports will be deleted.`)) return;

    try {
      await apiRequest(`/committees/${c.id}`, 'DELETE');
      showSuccess(`Committee "${c.title}" deleted.`);
      if (activeCommittee?.id === c.id) {
        setActiveCommittee(null);
      }
      fetchCommitteesData();
    } catch (err: any) {
      alert(`Error deleting committee: ${err.message || err}`);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER: WORKSPACE VIEW (WHEN A COMMITTEE IS SELECTED)
  // -------------------------------------------------------------------------

  if (activeCommittee) {
    return (
      <div className="space-y-6 pb-20 animate-fadeIn">
        {/* Workspace Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 sm:p-6 border border-[var(--panel-border)] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-teal-500/15 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 z-10">
            <button
              onClick={handleCloseWorkspace}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 mb-1 hover:border-emerald-500/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to All Committees
            </button>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/30">
                {activeCommittee.category || 'General'}
              </span>
              {activeCommittee.event_title && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {activeCommittee.event_title}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> {activeCommittee.total_points} Total Points
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight font-display">
              {activeCommittee.title}
            </h1>
            {activeCommittee.description && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
                {activeCommittee.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
            <button
              onClick={() => setSelectedCommitteeForPrint(activeCommittee)}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
              title="Print official appointment order"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Print Order
            </button>
            {isManagerOfActive && (
              <>
                <button
                  onClick={openAddMemberModal}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-teal-400" /> Add Member
                </button>
                <button
                  onClick={openAssignTaskModal}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" /> Assign Task
                </button>
              </>
            )}
            {isMemberOfActive && (
              <button
                onClick={openSubmitReportModal}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md"
              >
                <FileText className="w-4 h-4" /> Submit Report / DPR
              </button>
            )}
          </div>
        </div>

        {/* Success Toast */}
        {actionSuccessMsg && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Key Leaders Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faculty Coordinator Card */}
          <div className="glass-panel p-4 sm:p-5 border border-emerald-500/20 rounded-2xl flex items-start gap-4 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0 shadow-inner">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-block">
                Faculty Coordinator (Allotted by Admin)
              </span>
              <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                {activeCommittee.faculty_name || 'Not Allotted'}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                {activeCommittee.faculty_email && (
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-emerald-400" /> {activeCommittee.faculty_email}</span>
                )}
                {activeCommittee.faculty_phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-emerald-400" /> {activeCommittee.faculty_phone}</span>
                )}
              </div>
            </div>
          </div>

          {/* President Card (Optional) */}
          <div className="glass-panel p-4 sm:p-5 border border-teal-500/20 rounded-2xl flex items-start gap-4 bg-gradient-to-br from-teal-500/5 to-transparent">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xl shrink-0 shadow-inner">
              <Award className="w-6 h-6 text-teal-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20 inline-block">
                  President / Student Convenor {activeCommittee.president_name ? '' : '(Optional)'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] truncate">
                {activeCommittee.president_name || 'Not Appointed (Optional)'}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                {activeCommittee.president_email ? (
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-teal-400" /> {activeCommittee.president_email}</span>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)] italic">Committee functions smoothly under Faculty Coordinator & Team</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Tabs Navigation */}
        <div className="flex border-b border-[var(--panel-border)] gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setWorkspaceTab('members')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'members'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" /> Member Directory ({activeCommittee.student_roles?.length || 0})
          </button>
          <button
            onClick={() => setWorkspaceTab('tasks')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'tasks'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CheckSquare className="w-4 h-4" /> Tasks & Assignments ({committeeTasks.length})
          </button>
          <button
            onClick={() => setWorkspaceTab('reports')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'reports'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FileText className="w-4 h-4" /> Activity Reports & DPR ({committeeReports.length})
          </button>
          <button
            onClick={() => setWorkspaceTab('leaderboard')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              workspaceTab === 'leaderboard'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" /> Leaderboard & Points
          </button>
        </div>

        {/* Tab 1: Member Directory */}
        {workspaceTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Committee Members & Student Leadership
              </h2>
              {isManagerOfActive && (
                <button
                  onClick={openAddMemberModal}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Student Member
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCommittee.student_roles?.map((role, idx) => (
                <div
                  key={idx}
                  className={`glass-panel p-4 sm:p-5 border rounded-2xl relative transition-all duration-200 hover:shadow-lg ${
                    role.is_president
                      ? 'border-teal-500/40 bg-teal-500/5'
                      : 'border-[var(--panel-border)] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      role.is_president
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {role.role_name}
                    </span>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {role.points || 0} pts
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                    {role.student_name}
                  </h4>

                  <div className="space-y-1 text-xs text-[var(--text-secondary)] mb-3">
                    {role.student_roll_no && (
                      <div className="flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
                        <GraduationCap className="w-3.5 h-3.5" /> Roll: {role.student_roll_no}
                      </div>
                    )}
                    {role.department && (
                      <div className="flex items-center gap-1 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {role.department} {role.semester ? `(${role.semester})` : ''}
                      </div>
                    )}
                    {role.email && (
                      <div className="flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" /> {role.email}
                      </div>
                    )}
                    {role.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {role.phone}
                      </div>
                    )}
                  </div>

                  {role.responsibilities && (
                    <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-[11px] text-[var(--text-secondary)] italic leading-relaxed mb-3">
                      "{role.responsibilities}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)] text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Login Active
                    </span>
                    {isManagerOfActive && role.student_id && (
                      <button
                        onClick={() => handleRemoveMember(role.student_id!, role.student_name)}
                        className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Tasks & Assignments */}
        {workspaceTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" /> Committee Task Board
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Faculty and Admin assign tasks to committee members; students submit proofs to earn points.
                </p>
              </div>
              {isManagerOfActive && (
                <button
                  onClick={openAssignTaskModal}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Assign New Task
                </button>
              )}
            </div>

            {committeeTasks.length === 0 ? (
              <div className="glass-panel p-10 text-center border border-[var(--panel-border)] rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Committee Tasks Assigned Yet</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Faculty coordinators and Admin can assign operational and event tasks to members to mobilize the committee.
                </p>
                {isManagerOfActive && (
                  <button onClick={openAssignTaskModal} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2">
                    <Plus className="w-4 h-4" /> Assign First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {committeeTasks.map(task => {
                  const isAssignedToMe = task.assigned_to === user?.id;
                  const isAssignedToAll = !task.assigned_to;
                  const canSubmit = isStudent && (isAssignedToMe || isAssignedToAll);

                  return (
                    <div
                      key={task.id}
                      className="glass-panel p-5 border border-[var(--panel-border)] hover:border-emerald-500/30 rounded-2xl space-y-3 relative transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                              task.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : task.status === 'submitted'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : task.status === 'declined'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              task.priority === 'urgent' ? 'bg-rose-500/15 text-rose-400' : 'bg-neutral-800 text-neutral-300'
                            }`}>
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-[var(--text-primary)]">
                            {task.title}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> +{task.points_reward} pts
                          </span>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)] bg-black/20 p-2.5 rounded-xl border border-[var(--panel-border)]">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Assigned To:</span>
                          <span className="font-semibold text-[var(--text-primary)]">
                            {task.assignee_name ? task.assignee_name : 'All Committee Members'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Assigned By:</span>
                          <span className="font-semibold text-[var(--text-primary)]">{task.assigner_name || 'Coordinator'}</span>
                        </div>
                      </div>

                      {/* Submitted Proof Section */}
                      {task.status !== 'pending' && task.submission_text && (
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 text-xs">
                          <span className="text-[10px] uppercase font-extrabold text-emerald-400 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Submitted by {task.submitter_name || 'Member'}:
                          </span>
                          <p className="text-[var(--text-secondary)] italic">"{task.submission_text}"</p>
                          {task.file_url && (
                            <a
                              href={task.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-semibold underline text-[11px]"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> View Attached Proof ({task.file_name || 'Document'})
                            </a>
                          )}
                          {task.review_remarks && (
                            <div className="pt-1.5 border-t border-emerald-500/20 text-[11px] text-[var(--text-muted)]">
                              <strong>Reviewer Remark:</strong> {task.review_remarks}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--panel-border)]">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : 'No deadline'}
                        </span>
                        <div className="flex items-center gap-2">
                          {canSubmit && (task.status === 'pending' || task.status === 'declined') && (
                            <button
                              onClick={() => openSubmitTaskModal(task)}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" /> Submit Proof
                            </button>
                          )}
                          {isManagerOfActive && task.status === 'submitted' && (
                            <button
                              onClick={() => openReviewTaskModal(task)}
                              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-md"
                            >
                              <FileCheck className="w-3.5 h-3.5" /> Review & Award Points
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Activity Reports & Daily DPR */}
        {workspaceTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" /> Activity Reports & Daily Work Logs (DPR)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Track all meeting minutes, on-ground inspections, daily work logs, and event summaries submitted by members.
                </p>
              </div>
              {isMemberOfActive && (
                <button
                  onClick={openSubmitReportModal}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start bg-gradient-to-r from-teal-600 to-emerald-600 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Submit Report / DPR
                </button>
              )}
            </div>

            {committeeReports.length === 0 ? (
              <div className="glass-panel p-10 text-center border border-[var(--panel-border)] rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">No Reports Submitted Yet</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Committee members can submit daily work logs (DPR) and activity reports with AI English improvement support.
                </p>
                {isMemberOfActive && (
                  <button onClick={openSubmitReportModal} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2">
                    <Plus className="w-4 h-4" /> Submit First Report
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {committeeReports.map(rep => (
                  <div
                    key={rep.id}
                    className="glass-panel p-5 border border-[var(--panel-border)] hover:border-teal-500/30 rounded-2xl space-y-3.5 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/30">
                            {rep.report_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-400" /> {rep.report_date}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[var(--text-primary)]">
                          {rep.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">
                          Submitted by: <strong className="text-[var(--text-primary)]">{rep.submitter_name}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/20 border border-[var(--panel-border)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
                      <div>
                        <strong className="text-[var(--text-primary)] block text-[11px] uppercase tracking-wider mb-0.5">Executive Summary:</strong>
                        <p>{rep.summary}</p>
                      </div>
                      {rep.achievements && (
                        <div className="pt-2 border-t border-[var(--panel-border)]">
                          <strong className="text-emerald-400 block text-[11px] uppercase tracking-wider mb-0.5">Achievements:</strong>
                          <p>{rep.achievements}</p>
                        </div>
                      )}
                      {rep.challenges && (
                        <div className="pt-2 border-t border-[var(--panel-border)]">
                          <strong className="text-amber-400 block text-[11px] uppercase tracking-wider mb-0.5">Challenges:</strong>
                          <p>{rep.challenges}</p>
                        </div>
                      )}
                      {rep.next_steps && (
                        <div className="pt-2 border-t border-[var(--panel-border)]">
                          <strong className="text-teal-400 block text-[11px] uppercase tracking-wider mb-0.5">Next Steps:</strong>
                          <p>{rep.next_steps}</p>
                        </div>
                      )}
                    </div>

                    {rep.document_url && (
                      <a
                        href={rep.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-bold underline"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Open Attached Document / Drive Proof
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Committee Leaderboard */}
        {workspaceTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Committee Member Performance Leaderboard
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Points awarded for completed tasks and verified reports contribute directly to member standing.
                </p>
              </div>
              <button
                onClick={() => fetchWorkspaceData(activeCommittee.id)}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Ranks
              </button>
            </div>

            {/* Top 3 Podium */}
            {committeeLeaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 pb-2 max-w-2xl mx-auto items-end">
                {/* 2nd Place */}
                <div className="glass-panel p-4 text-center border border-slate-400/30 rounded-2xl bg-gradient-to-t from-slate-500/10 to-transparent space-y-2 order-1">
                  <div className="w-12 h-12 rounded-full bg-slate-300/20 border border-slate-300/40 text-slate-300 mx-auto flex items-center justify-center font-black text-xl shadow-lg">
                    🥈
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {committeeLeaderboard[1].student_name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{committeeLeaderboard[1].role_name}</div>
                  <div className="text-sm font-black text-slate-200">{committeeLeaderboard[1].total_points} pts</div>
                </div>

                {/* 1st Place (Gold) */}
                <div className="glass-panel p-5 text-center border border-amber-500/40 rounded-2xl bg-gradient-to-t from-amber-500/15 to-transparent space-y-2.5 order-2 -translate-y-2 shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-amber-500/25 border-2 border-amber-400 text-amber-300 mx-auto flex items-center justify-center font-black text-2xl shadow-xl shadow-amber-500/20">
                    🥇
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 inline-block">
                    TOP PERFORMER
                  </span>
                  <div className="text-sm font-black text-[var(--text-primary)] truncate">
                    {committeeLeaderboard[0].student_name}
                  </div>
                  <div className="text-[11px] text-amber-200 font-semibold truncate">{committeeLeaderboard[0].role_name}</div>
                  <div className="text-lg font-black text-amber-400">{committeeLeaderboard[0].total_points} pts</div>
                </div>

                {/* 3rd Place */}
                <div className="glass-panel p-4 text-center border border-amber-700/30 rounded-2xl bg-gradient-to-t from-amber-800/10 to-transparent space-y-2 order-3">
                  <div className="w-12 h-12 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-600 mx-auto flex items-center justify-center font-black text-xl shadow-lg">
                    🥉
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {committeeLeaderboard[2].student_name}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate">{committeeLeaderboard[2].role_name}</div>
                  <div className="text-sm font-black text-amber-600">{committeeLeaderboard[2].total_points} pts</div>
                </div>
              </div>
            )}

            {/* Complete Leaderboard Table */}
            <div className="glass-panel border border-[var(--panel-border)] rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/30 border-b border-[var(--panel-border)] text-[var(--text-secondary)] uppercase text-[10px] tracking-wider font-extrabold">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4 text-center">Tasks Completed</th>
                      <th className="py-3 px-4 text-center">Reports Filed</th>
                      <th className="py-3 px-4 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--panel-border)] text-[var(--text-primary)]">
                    {committeeLeaderboard.map((entry, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-emerald-500/5 transition-colors ${
                          entry.student_id === user?.id ? 'bg-emerald-500/10 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-black">
                          <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                            entry.rank === 1 ? 'bg-amber-500/20 text-amber-400 font-extrabold' :
                            entry.rank === 2 ? 'bg-slate-300/20 text-slate-300' :
                            entry.rank === 3 ? 'bg-amber-800/20 text-amber-600' : 'text-[var(--text-muted)]'
                          }`}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold">{entry.student_name}</div>
                          {entry.student_roll_no && (
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{entry.student_roll_no}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {entry.role_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {entry.department || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-400">
                          {entry.tasks_completed}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-teal-400">
                          {entry.reports_submitted}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-sm text-amber-400">
                          {entry.total_points} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 2: ASSIGN TASK (ADMIN & FACULTY) */}
        {/* --------------------------------------------------------------------- */}
        {isAssignTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-lg p-5 sm:p-7 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Committee Task Assignment
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Assign Task in {activeCommittee.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAssignTaskModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Stage Logistics & Microphone Setup"
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">
                      Task Description & Instructions
                    </label>
                    <ImproveEnglishButton
                      text={newTaskDescription}
                      onImproved={setNewTaskDescription}
                      context="Task instructions"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    placeholder="Detailed instructions for the committee member..."
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Assign To
                    </label>
                    <select
                      value={newTaskAssignedTo}
                      onChange={e => setNewTaskAssignedTo(Number(e.target.value) || '')}
                      className="glass-input text-xs py-2"
                    >
                      <option value="" className="bg-neutral-900 text-white">-- Open to All Members --</option>
                      {activeCommittee.student_roles?.map((m, idx) => m.student_id ? (
                        <option key={idx} value={m.student_id} className="bg-neutral-900 text-white">
                          {m.student_name} ({m.role_name})
                        </option>
                      ) : null)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Reward Points
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={newTaskPoints}
                      onChange={e => setNewTaskPoints(Number(e.target.value))}
                      className="glass-input text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Priority
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={e => setNewTaskPriority(e.target.value)}
                      className="glass-input text-xs py-2"
                    >
                      <option value="low" className="bg-neutral-900 text-white">Low</option>
                      <option value="medium" className="bg-neutral-900 text-white">Medium</option>
                      <option value="high" className="bg-neutral-900 text-white">High</option>
                      <option value="urgent" className="bg-neutral-900 text-white">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="glass-input text-xs py-2"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--panel-border)]">
                  <button
                    type="button"
                    onClick={() => setIsAssignTaskModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                  >
                    {submitting ? 'Assigning...' : 'Assign Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 3: SUBMIT TASK PROOF (STUDENT) */}
        {/* --------------------------------------------------------------------- */}
        {isSubmitTaskModalOpen && selectedTaskForSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-lg p-5 sm:p-7 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                    Submit Proof of Work
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                    {selectedTaskForSubmit.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsSubmitTaskModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitTaskProof} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">
                      Work Summary & Output Description *
                    </label>
                    <ImproveEnglishButton
                      text={taskProofText}
                      onImproved={setTaskProofText}
                      context="Task completion summary"
                    />
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={taskProofText}
                    onChange={e => setTaskProofText(e.target.value)}
                    placeholder="Detail what tasks you performed, numbers achieved, or on-ground outcomes..."
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Attachment Link (Google Drive / Document / Photo URL)
                  </label>
                  <input
                    type="url"
                    value={taskProofUrl}
                    onChange={e => setTaskProofUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    File / Document Name
                  </label>
                  <input
                    type="text"
                    value={taskProofFileName}
                    onChange={e => setTaskProofFileName(e.target.value)}
                    placeholder="e.g. Gate2_Inspection_Log.pdf"
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--panel-border)]">
                  <button
                    type="button"
                    onClick={() => setIsSubmitTaskModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 4: REVIEW TASK & AWARD POINTS (FACULTY & ADMIN) */}
        {/* --------------------------------------------------------------------- */}
        {isReviewTaskModalOpen && selectedTaskForReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-lg p-5 sm:p-7 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    Verify Proof & Award Points
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                    {selectedTaskForReview.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsReviewTaskModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submission preview */}
              <div className="p-3.5 rounded-xl bg-black/30 border border-[var(--panel-border)] space-y-2 text-xs">
                <div className="text-[11px] font-bold text-emerald-400">
                  Submitted by: {selectedTaskForReview.submitter_name}
                </div>
                <p className="text-[var(--text-secondary)] italic">
                  "{selectedTaskForReview.submission_text}"
                </p>
                {selectedTaskForReview.file_url && (
                  <a
                    href={selectedTaskForReview.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-teal-400 underline font-semibold text-[11px]"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> View Attached Proof File
                  </a>
                )}
              </div>

              <form onSubmit={handleReviewTask} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Decision *
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={e => setReviewStatus(e.target.value as any)}
                      className="glass-input text-xs py-2"
                    >
                      <option value="approved" className="bg-neutral-900 text-white">Approve & Award Points</option>
                      <option value="declined" className="bg-neutral-900 text-white">Decline / Request Changes</option>
                    </select>
                  </div>

                  {reviewStatus === 'approved' && (
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                        Points to Award
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={150}
                        value={reviewPoints}
                        onChange={e => setReviewPoints(Number(e.target.value))}
                        className="glass-input text-xs py-2 font-bold text-amber-400"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Feedback / Review Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={reviewRemarks}
                    onChange={e => setReviewRemarks(e.target.value)}
                    placeholder="Appreciation remarks or specific corrections needed..."
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--panel-border)]">
                  <button
                    type="button"
                    onClick={() => setIsReviewTaskModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                  >
                    {submitting ? 'Recording...' : reviewStatus === 'approved' ? 'Approve & Credit Points' : 'Decline Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 5: SUBMIT ACTIVITY REPORT / DAILY DPR */}
        {/* --------------------------------------------------------------------- */}
        {isSubmitReportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-8 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-5 animate-scaleUp my-auto">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                    Committee Documentation
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    Submit Activity Report / Daily DPR
                  </h3>
                </div>
                <button
                  onClick={() => setIsSubmitReportModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Report Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={reportTitle}
                      onChange={e => setReportTitle(e.target.value)}
                      placeholder="e.g. Daily Vigilance & Discipline Log - 25 Sept"
                      className="glass-input text-xs sm:text-sm py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Report Type *
                    </label>
                    <select
                      value={reportType}
                      onChange={e => setReportType(e.target.value)}
                      className="glass-input text-xs py-2"
                    >
                      <option value="daily_log" className="bg-neutral-900 text-white">Daily Work Log (DPR)</option>
                      <option value="activity_report" className="bg-neutral-900 text-white">Activity / Event Report</option>
                      <option value="meeting_minutes" className="bg-neutral-900 text-white">Meeting Minutes</option>
                      <option value="inspection_log" className="bg-neutral-900 text-white">Inspection / Duty Log</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Report Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={reportDate}
                      onChange={e => setReportDate(e.target.value)}
                      className="glass-input text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Venue / Location
                    </label>
                    <input
                      type="text"
                      value={reportVenue}
                      onChange={e => setReportVenue(e.target.value)}
                      placeholder="e.g. Auditorium / Block C"
                      className="glass-input text-xs py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                      Attendees / Beneficiaries Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={reportAttendees}
                      onChange={e => setReportAttendees(Number(e.target.value))}
                      className="glass-input text-xs py-2"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">
                      Executive Summary / Daily Work Log *
                    </label>
                    <ImproveEnglishButton
                      text={reportSummary}
                      onImproved={setReportSummary}
                      context="Committee report executive summary"
                    />
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={reportSummary}
                    onChange={e => setReportSummary(e.target.value)}
                    placeholder="Summary of actions taken, protocols followed, and results..."
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[var(--text-secondary)]">Key Achievements</label>
                      <ImproveEnglishButton text={reportAchievements} onImproved={setReportAchievements} context="Achievements" />
                    </div>
                    <textarea
                      rows={2}
                      value={reportAchievements}
                      onChange={e => setReportAchievements(e.target.value)}
                      placeholder="Key successes..."
                      className="glass-input text-xs py-1.5"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[var(--text-secondary)]">Challenges / Issues</label>
                      <ImproveEnglishButton text={reportChallenges} onImproved={setReportChallenges} context="Challenges" />
                    </div>
                    <textarea
                      rows={2}
                      value={reportChallenges}
                      onChange={e => setReportChallenges(e.target.value)}
                      placeholder="Challenges faced..."
                      className="glass-input text-xs py-1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Document / Photo Proof Link (Google Drive / Cloud URL)
                  </label>
                  <input
                    type="url"
                    value={reportDocUrl}
                    onChange={e => setReportDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--panel-border)]">
                  <button
                    type="button"
                    onClick={() => setIsSubmitReportModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 6: ADD SINGLE MEMBER (FACULTY / ADMIN) */}
        {/* --------------------------------------------------------------------- */}
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="glass-panel w-full max-w-lg p-5 sm:p-7 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                    Appoint Student Member
                  </span>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    Add Member to {activeCommittee.title}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSingleMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Designation / Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={singleMemberRole}
                    onChange={e => setSingleMemberRole(e.target.value)}
                    placeholder="e.g. Media Lead / Secretary"
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={singleMemberName}
                      onChange={e => setSingleMemberName(e.target.value)}
                      placeholder="Full Name"
                      className="glass-input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={singleMemberRoll}
                      onChange={e => setSingleMemberRoll(e.target.value)}
                      placeholder="GU2026..."
                      className="glass-input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Email (Login ID)</label>
                    <input
                      type="email"
                      value={singleMemberEmail}
                      onChange={e => setSingleMemberEmail(e.target.value)}
                      placeholder="student@geeta.edu.in"
                      className="glass-input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Initial Password</label>
                    <input
                      type="text"
                      value={singleMemberPassword}
                      onChange={e => setSingleMemberPassword(e.target.value)}
                      className="glass-input text-xs py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Department</label>
                    <input
                      type="text"
                      value={singleMemberDept}
                      onChange={e => setSingleMemberDept(e.target.value)}
                      className="glass-input text-xs py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Phone</label>
                    <input
                      type="text"
                      value={singleMemberPhone}
                      onChange={e => setSingleMemberPhone(e.target.value)}
                      placeholder="+91..."
                      className="glass-input text-xs py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">Responsibilities</label>
                  <textarea
                    rows={2}
                    value={singleMemberResp}
                    onChange={e => setSingleMemberResp(e.target.value)}
                    placeholder="Key tasks and scope assigned to this member..."
                    className="glass-input text-xs py-2"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--panel-border)]">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="btn-secondary text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                  >
                    {submitting ? 'Adding...' : 'Appoint Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODAL 7: PRINTABLE OFFICIAL NOTIFICATION ORDER (IN WORKSPACE) */}
        {/* --------------------------------------------------------------------- */}
        {selectedCommitteeForPrint && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-white text-black w-full max-w-3xl p-6 sm:p-10 rounded-2xl shadow-2xl space-y-6 my-auto max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none">
              {/* Header / Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                    GU
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                      Geeta University
                    </h2>
                    <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                      Office of Dean of Student Welfare (DSW)
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-slate-600">
                  <div>Ref: GU/DSW/CC/{selectedCommitteeForPrint.id}</div>
                  <div>Date: {selectedCommitteeForPrint.event_date || new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Subject */}
              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest bg-slate-100 text-slate-900 px-3 py-1 rounded-full border border-slate-300">
                  OFFICE NOTIFICATION ORDER
                </span>
                <h3 className="text-base font-extrabold text-slate-900 underline pt-1">
                  Constitution of {selectedCommitteeForPrint.title}
                </h3>
              </div>

              {/* Body */}
              <div className="text-xs text-slate-800 leading-relaxed space-y-3">
                <p>
                  As approved by the competent authority of Geeta University, the <strong>{selectedCommitteeForPrint.title}</strong> is hereby constituted under the Dean of Student Welfare (DSW) framework to ensure smooth execution, coordination, and university discipline.
                </p>

                {/* Faculty In-charge */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Faculty Coordinator / Mentor</div>
                  <div className="text-sm font-bold text-slate-900">{selectedCommitteeForPrint.faculty_name || 'Designated Faculty Member'}</div>
                </div>

                {/* President */}
                {selectedCommitteeForPrint.president_name && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">President / Student Convenor</div>
                    <div className="text-sm font-bold text-slate-900">{selectedCommitteeForPrint.president_name}</div>
                  </div>
                )}

                {/* Members Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                    Appointed Student Executive Members:
                  </h4>
                  <table className="w-full border border-slate-300 text-[11px] text-left">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-300">S.No</th>
                        <th className="p-2 border-r border-slate-300">Designation</th>
                        <th className="p-2 border-r border-slate-300">Student Name</th>
                        <th className="p-2 border-r border-slate-300">Roll Number</th>
                        <th className="p-2">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedCommitteeForPrint.student_roles?.map((role, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 font-semibold">{role.role_name}</td>
                          <td className="p-2 border-r border-slate-300">{role.student_name}</td>
                          <td className="p-2 border-r border-slate-300 font-mono">{role.student_roll_no || 'N/A'}</td>
                          <td className="p-2">{role.department || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-center justify-between text-xs font-bold text-slate-800">
                <div>
                  <div>Faculty In-Charge</div>
                  <div className="text-[10px] text-slate-500 font-normal">Geeta University</div>
                </div>
                <div className="text-right">
                  <div>Dr. Rekha Narang</div>
                  <div className="text-[10px] text-slate-500 font-normal">Dean of Student Welfare (DSW)</div>
                </div>
              </div>

              {/* Print Controls */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
                <button
                  type="button"
                  onClick={() => setSelectedCommitteeForPrint(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: COMMITTEES DIRECTORY / LIST VIEW
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border border-[var(--panel-border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/15 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              DSW Governance & Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight font-display">
            Core Committees Portal
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl">
            Official standing committees allocated by Admin to Faculty Coordinators. Committee members manage tasks, submit activity reports, and compete on the performance leaderboard.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 z-10 shrink-0">
            <button
              onClick={openCreateModal}
              className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <Plus className="w-4 h-4" /> Create Core Committee
            </button>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 border border-[var(--panel-border)] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--text-primary)]">{totalCommitteesCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Active Committees</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[var(--panel-border)] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--text-primary)]">{totalMembersCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Student Members</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[var(--panel-border)] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--text-primary)]">{totalTasksCount}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Allocated Tasks</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[var(--panel-border)] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[var(--text-primary)]">{totalPointsSum}</div>
            <div className="text-[11px] text-[var(--text-muted)] font-medium">Total Work Points</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass-panel p-3.5 border border-[var(--panel-border)] rounded-2xl">
        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {COMMITTEE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search committees, coordinator..."
            className="glass-input pl-9 text-xs py-1.5 w-full"
          />
        </div>
      </div>

      {/* Committees Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Loading Core Committees...</p>
        </div>
      ) : filteredCommittees.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-[var(--panel-border)] rounded-2xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Core Committees Found</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No committees match your active filters. Try clearing search query.'
              : 'Admin can create standing committees and allot them to faculty coordinators.'}
          </p>
          {isAdmin && (
            <button onClick={openCreateModal} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2">
              <Plus className="w-4 h-4" /> Create First Committee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCommittees.map(comm => (
            <div
              key={comm.id}
              className="glass-panel p-5 sm:p-6 border border-[var(--panel-border)] hover:border-emerald-500/40 rounded-2xl space-y-4 relative transition-all duration-200 hover:shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/15 text-teal-400 border border-teal-500/30">
                    {comm.category || 'General'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {comm.total_points || 0} pts
                  </span>
                </div>

                {/* Title & Event */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors leading-snug">
                    {comm.title}
                  </h3>
                  {comm.event_title && (
                    <div className="text-xs text-emerald-400/90 font-medium flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> {comm.event_title}
                    </div>
                  )}
                </div>

                {comm.description && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {comm.description}
                  </p>
                )}

                {/* Coordinator & President Mini Cards */}
                <div className="space-y-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] flex items-center gap-2.5 text-xs">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Faculty Coordinator:</span>
                      <span className="font-bold text-[var(--text-primary)] truncate block">{comm.faculty_name || 'Not Allotted'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/20 border border-[var(--panel-border)] flex items-center gap-2.5 text-xs">
                    <Award className="w-4 h-4 text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">President (Optional):</span>
                      <span className="font-bold text-[var(--text-primary)] truncate block">
                        {comm.president_name ? comm.president_name : <span className="text-[var(--text-muted)] font-normal italic">Open / Not Appointed</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Member Avatars & Counts */}
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <Users className="w-4 h-4 text-teal-400" /> {comm.student_roles?.length || 0} Members
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                    <CheckSquare className="w-4 h-4 text-blue-400" /> {comm.tasks_count || 0} Tasks
                  </span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-4 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenWorkspace(comm)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 flex-1 justify-center shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Workspace
                </button>
                <button
                  onClick={() => setSelectedCommitteeForPrint(comm)}
                  className="p-2 rounded-xl border border-[var(--panel-border)] hover:border-emerald-500/30 text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
                  title="Print Official Order"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteCommittee(comm)}
                    className="p-2 rounded-xl border border-[var(--panel-border)] hover:border-rose-500/30 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                    title="Delete Committee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: CREATE CORE COMMITTEE (ADMIN) */}
      {/* --------------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-8 rounded-3xl border border-[var(--panel-border)] shadow-2xl space-y-6 animate-scaleUp my-auto">
            <div className="flex items-center justify-between border-b border-[var(--panel-border)] pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  New Official Committee
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                  Create Core Committee
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCommittee} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Committee Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={commTitle}
                    onChange={e => setCommTitle(e.target.value)}
                    placeholder="e.g. DSW Central Discipline & Student Welfare Committee"
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Category *
                  </label>
                  <select
                    value={commCategory}
                    onChange={e => setCommCategory(e.target.value)}
                    className="glass-input text-xs sm:text-sm py-2"
                  >
                    {COMMITTEE_CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} className="bg-neutral-900 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Allot Faculty Coordinator *
                  </label>
                  <select
                    value={commFacultyId}
                    onChange={e => setCommFacultyId(Number(e.target.value) || '')}
                    className="glass-input text-xs sm:text-sm py-2"
                  >
                    <option value="" className="bg-neutral-900 text-white">-- Select Faculty Coordinator --</option>
                    {facultyList.map(fac => (
                      <option key={fac.id} value={fac.id} className="bg-neutral-900 text-white">
                        {fac.name} ({fac.department || 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Linked Event (Optional)
                  </label>
                  <select
                    value={commEventId}
                    onChange={e => {
                      const id = Number(e.target.value) || '';
                      setCommEventId(id);
                      if (id) {
                        const ev = eventsList.find(x => x.id === id);
                        if (ev?.start_date) setCommEventDate(ev.start_date.split('T')[0]);
                      }
                    }}
                    className="glass-input text-xs sm:text-sm py-2"
                  >
                    <option value="" className="bg-neutral-900 text-white">-- Standalone Standing Committee (No Event) --</option>
                    {eventsList.map(ev => (
                      <option key={ev.id} value={ev.id} className="bg-neutral-900 text-white">
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1">
                    Effective / Start Date
                  </label>
                  <input
                    type="date"
                    value={commEventDate}
                    onChange={e => setCommEventDate(e.target.value)}
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)]">
                      Description & Core Objectives
                    </label>
                    <ImproveEnglishButton
                      text={commDescription}
                      onImproved={setCommDescription}
                      context="Core committee description"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={commDescription}
                    onChange={e => setCommDescription(e.target.value)}
                    placeholder="Key responsibilities, scope, and mandate for this committee..."
                    className="glass-input text-xs sm:text-sm py-2"
                  />
                </div>
              </div>

              {/* President Section (OPTIONAL) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">President / Student Convenor</h4>
                      <span className="text-[11px] text-teal-400/90 font-medium">President is optional — enable only if appointed</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePresident}
                      onChange={e => setEnablePresident(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                {enablePresident && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-500/20 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">President Name *</label>
                      <input
                        type="text"
                        required={enablePresident}
                        value={presName}
                        onChange={e => setPresName(e.target.value)}
                        placeholder="e.g. Aryan Sharma"
                        className="glass-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={presRoll}
                        onChange={e => setPresRoll(e.target.value)}
                        placeholder="GU2026..."
                        className="glass-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Email (Login ID) *</label>
                      <input
                        type="email"
                        required={enablePresident}
                        value={presEmail}
                        onChange={e => setPresEmail(e.target.value)}
                        placeholder="president@geeta.edu.in"
                        className="glass-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Initial Password *</label>
                      <input
                        type="text"
                        value={presPassword}
                        onChange={e => setPresPassword(e.target.value)}
                        className="glass-input text-xs py-1.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Department</label>
                      <input
                        type="text"
                        value={presDept}
                        onChange={e => setPresDept(e.target.value)}
                        className="glass-input text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">Phone</label>
                      <input
                        type="text"
                        value={presPhone}
                        onChange={e => setPresPhone(e.target.value)}
                        placeholder="+91..."
                        className="glass-input text-xs py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Student Members Repeater */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" /> Student Committee Members
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMemberRow}
                    className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Member Row
                  </button>
                </div>

                <div className="space-y-3">
                  {memberRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="p-3.5 rounded-2xl bg-black/20 border border-[var(--panel-border)] space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-400">
                          Member #{idx + 1}
                        </span>
                        {memberRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberRow(row.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Role Title</label>
                          <input
                            type="text"
                            value={row.role_name}
                            onChange={e => handleUpdateMemberRow(row.id, 'role_name', e.target.value)}
                            placeholder="e.g. Media Lead"
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Student Name</label>
                          <input
                            type="text"
                            value={row.student_name}
                            onChange={e => handleUpdateMemberRow(row.id, 'student_name', e.target.value)}
                            placeholder="Student Name"
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Email / Login</label>
                          <input
                            type="email"
                            value={row.email}
                            onChange={e => handleUpdateMemberRow(row.id, 'email', e.target.value)}
                            placeholder="student@geeta.edu.in"
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Roll No</label>
                          <input
                            type="text"
                            value={row.student_roll_no}
                            onChange={e => handleUpdateMemberRow(row.id, 'student_roll_no', e.target.value)}
                            placeholder="GU2026..."
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Department</label>
                          <input
                            type="text"
                            value={row.department}
                            onChange={e => handleUpdateMemberRow(row.id, 'department', e.target.value)}
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Phone</label>
                          <input
                            type="text"
                            value={row.phone}
                            onChange={e => handleUpdateMemberRow(row.id, 'phone', e.target.value)}
                            placeholder="+91..."
                            className="glass-input text-xs py-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--panel-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  {submitting ? 'Creating Committee...' : 'Create & Allot Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 7: PRINTABLE OFFICIAL NOTIFICATION ORDER */}
      {/* --------------------------------------------------------------------- */}
      {selectedCommitteeForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white text-black w-full max-w-3xl p-6 sm:p-10 rounded-2xl shadow-2xl space-y-6 my-auto max-h-[95vh] overflow-y-auto print:p-0 print:shadow-none">
            {/* Header / Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                  GU
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    Geeta University
                  </h2>
                  <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                    Office of Dean of Student Welfare (DSW)
                  </p>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-600">
                <div>Ref: GU/DSW/CC/{selectedCommitteeForPrint.id}</div>
                <div>Date: {selectedCommitteeForPrint.event_date || new Date().toISOString().split('T')[0]}</div>
              </div>
            </div>

            {/* Subject */}
            <div className="text-center space-y-1">
              <span className="text-[10px] uppercase font-black tracking-widest bg-slate-100 text-slate-900 px-3 py-1 rounded-full border border-slate-300">
                OFFICE NOTIFICATION ORDER
              </span>
              <h3 className="text-base font-extrabold text-slate-900 underline pt-1">
                Constitution of {selectedCommitteeForPrint.title}
              </h3>
            </div>

            {/* Body */}
            <div className="text-xs text-slate-800 leading-relaxed space-y-3">
              <p>
                As approved by the competent authority of Geeta University, the <strong>{selectedCommitteeForPrint.title}</strong> is hereby constituted under the Dean of Student Welfare (DSW) framework to ensure smooth execution, coordination, and university discipline.
              </p>

              {/* Faculty In-charge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Faculty Coordinator / Mentor</div>
                <div className="text-sm font-bold text-slate-900">{selectedCommitteeForPrint.faculty_name || 'Designated Faculty Member'}</div>
              </div>

              {/* President */}
              {selectedCommitteeForPrint.president_name && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">President / Student Convenor</div>
                  <div className="text-sm font-bold text-slate-900">{selectedCommitteeForPrint.president_name}</div>
                </div>
              )}

              {/* Members Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Appointed Student Executive Members:
                </h4>
                <table className="w-full border border-slate-300 text-[11px] text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2 border-r border-slate-300">S.No</th>
                      <th className="p-2 border-r border-slate-300">Designation</th>
                      <th className="p-2 border-r border-slate-300">Student Name</th>
                      <th className="p-2 border-r border-slate-300">Roll Number</th>
                      <th className="p-2">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedCommitteeForPrint.student_roles?.map((role, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-semibold">{role.role_name}</td>
                        <td className="p-2 border-r border-slate-300">{role.student_name}</td>
                        <td className="p-2 border-r border-slate-300 font-mono">{role.student_roll_no || 'N/A'}</td>
                        <td className="p-2">{role.department || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex items-center justify-between text-xs font-bold text-slate-800">
              <div>
                <div>Faculty In-Charge</div>
                <div className="text-[10px] text-slate-500 font-normal">Geeta University</div>
              </div>
              <div className="text-right">
                <div>Dr. Rekha Narang</div>
                <div className="text-[10px] text-slate-500 font-normal">Dean of Student Welfare (DSW)</div>
              </div>
            </div>

            {/* Print Controls */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedCommitteeForPrint(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4" /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
