import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import {
  Users, Calendar, CheckSquare, Megaphone, HelpCircle, FileText,
  MessageSquareHeart, Trophy, Activity, TrendingUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardSummary {
  total_faculty: number;
  total_students: number;
  total_events: number;
  events_breakdown: Record<string, number>;
  total_tasks: number;
  tasks_breakdown: Record<string, number>;
  total_queries: number;
  queries_breakdown: Record<string, number>;
  total_announcements: number;
  total_dynamic_forms: number;
  total_form_responses: number;
  total_feedback_forms: number;
  total_feedback_responses: number;
  total_student_points_awarded: number;
}

interface AuditLogItem {
  id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  created_at: string;
}

const COLORS = ['#0e8a6e', '#10b981', '#2dd4bf', '#f59e0b'];

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, actData] = await Promise.all([
          apiRequest<DashboardSummary>('/dashboard/summary'),
          apiRequest<AuditLogItem[]>('/dashboard/recent-activity')
        ]);
        setSummary(sumData);
        setActivity(actData);
      } catch (err) {
        console.error("Dashboard data load failure:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading administrative telemetry...
      </div>
    );
  }

  if (!summary) return null;

  const taskChartData = [
    { name: 'Pending Review', value: summary.tasks_breakdown.pending || 0 },
    { name: 'In Progress', value: summary.tasks_breakdown.in_progress || 0 },
    { name: 'Approved', value: summary.tasks_breakdown.approved || 0 },
    { name: 'Rejected', value: summary.tasks_breakdown.rejected || 0 },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 bg-gradient-to-r from-black via-[#06140d] to-black border-l-4 border-l-emerald-500">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">University Oversight Center</h2>
          <p className="text-xs text-slate-300 mt-1">Live administration status, active tasks, student engagement metrics and grievance feeds.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
          </span>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-[#0e8a6e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Staff / Faculty</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.total_faculty}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Total registered staff members</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Students</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.total_students}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">{summary.total_student_points_awarded} pts awarded all-time</p>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Active Tasks</p>
              <h3 className="text-2xl font-bold text-white mt-1">{summary.total_tasks}</h3>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-2 text-[11px] text-slate-400 mt-3">
            <span className="text-emerald-400 font-semibold">{summary.tasks_breakdown.approved || 0} approved</span>
            <span>•</span>
            <span className="text-amber-400">{summary.tasks_breakdown.pending || 0} pending</span>
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-l-crimson">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Grievances / Queries</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-1">{summary.total_queries}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
              <HelpCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex gap-2 text-[11px] text-slate-400 mt-3">
            <span className="text-rose-400 font-semibold">{summary.queries_breakdown.open || 0} open</span>
            <span>•</span>
            <span className="text-slate-400">{summary.queries_breakdown.closed || 0} closed</span>
          </div>
        </div>
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Calendar className="w-4 h-4 text-purple-400" /> Total Events
            </div>
            <h4 className="text-xl font-bold text-slate-100 mt-2">{summary.total_events}</h4>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg">
            {summary.events_breakdown.planned || 0} Planned
          </span>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <FileText className="w-4 h-4 text-sky-400" /> Public Form Responses
            </div>
            <h4 className="text-xl font-bold text-slate-100 mt-2">{summary.total_form_responses}</h4>
          </div>
          <span className="text-xs text-slate-400">Across {summary.total_dynamic_forms} forms</span>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <MessageSquareHeart className="w-4 h-4 text-pink-400" /> Feedback Submissions
            </div>
            <h4 className="text-xl font-bold text-slate-100 mt-2">{summary.total_feedback_responses}</h4>
          </div>
          <span className="text-xs text-slate-400">Across {summary.total_feedback_forms} forms</span>
        </div>
      </div>

      {/* Main Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution Donut Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-blue-400" /> Task Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#040806', borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-800 text-xs text-slate-400">
            {taskChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Recent Activity Feed */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Recent System Activity Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[300px]">
            {activity.length === 0 ? (
              <p className="text-xs text-slate-500">No activity recorded yet.</p>
            ) : (
              activity.map(act => (
                <div key={act.id} className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {act.actor_name} <span className="font-normal text-slate-400">performed</span> {act.action.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Entity: {act.entity_type}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
