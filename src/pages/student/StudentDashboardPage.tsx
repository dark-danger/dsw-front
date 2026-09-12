import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Trophy, Award, Sparkles, GraduationCap, HelpCircle } from 'lucide-react';

interface StudentRanking {
  student_id: number;
  name: string;
  roll_number?: string;
  total_points: number;
  rank: number;
}

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [myRank, setMyRank] = useState<StudentRanking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const rankings = await apiRequest<StudentRanking[]>('/leaderboard/students/rankings');
        const found = rankings.find(r => r.student_id === user.id);
        if (found) setMyRank(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome, {user?.name}!</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Roll No: {user?.roll_number} • Course: {user?.course_branch} ({user?.year})</p>
        </div>

        {myRank && (
          <div className="flex items-center gap-4 bg-[var(--card-bg-to)] p-3 rounded-2xl border border-[var(--panel-border)] shrink-0">
            <div className="text-center px-2">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Leaderboard Rank</div>
              <div className="text-xl font-black text-amber-500">#{myRank.rank}</div>
            </div>
            <div className="h-8 w-px bg-[var(--panel-border)]" />
            <div className="text-center px-2">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Total Points</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{myRank.total_points} pts</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/student/leaderboard-tasks" className="glass-card p-6 flex items-center justify-between group hover:border-emerald-500/50">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
              <Sparkles className="w-5 h-5" /> Participate in Student Challenges
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Complete volunteer duties & event tasks to earn points for the university leaderboard.</p>
          </div>
        </Link>

        <Link to="/student/queries" className="glass-card p-6 flex items-center justify-between group hover:border-teal-500/50">
          <div>
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-base">
              <HelpCircle className="w-5 h-5" /> Raise DSW Query or Grievance
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Directly contact the Dean of Student Welfare office for assistance or inquiry.</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

