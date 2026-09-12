import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Trophy, Medal, Award, Flame, Sparkles, Plus, Search, Filter,
  Users, CheckCircle2, ChevronUp, ChevronDown, ArrowUpRight,
  Shield, History, AlertCircle, X, Calendar, UserCheck
} from 'lucide-react';

interface ClubRanking {
  rank: number;
  club_id: number;
  title: string;
  category: string;
  logo_url?: string;
  faculty_coordinator_name?: string;
  total_points: number;
  tasks_count: number;
  completed_tasks_count: number;
  student_roles_count: number;
  members_count: number;
  created_at: string;
}

export const ClubLeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin';
  const [rankings, setRankings] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Manual Award Modal state
  const [awardModalOpen, setAwardModalOpen] = useState<boolean>(false);
  const [selectedClubId, setSelectedClubId] = useState<number | ''>('');
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [pointsReason, setPointsReason] = useState<string>('');
  const [awardLoading, setAwardLoading] = useState<boolean>(false);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest<ClubRanking[]>('/clubs/leaderboard/rankings');
      setRankings(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load club rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const handleManualAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !pointsReason.trim() || pointsAmount === 0) return;

    try {
      setAwardLoading(true);
      await apiRequest('/clubs/points/manual-award', 'POST', {
        club_id: Number(selectedClubId),
        points: Number(pointsAmount),
        reason: pointsReason.trim()
      });
      setAwardModalOpen(false);
      setSelectedClubId('');
      setPointsReason('');
      setPointsAmount(50);
      await fetchRankings();
    } catch (err: any) {
      alert(err?.message || 'Failed to award points.');
    } finally {
      setAwardLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(rankings.map(r => r.category).filter(Boolean)))];

  const filteredRankings = rankings.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.faculty_coordinator_name && r.faculty_coordinator_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const top3 = rankings.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  const totalPointsAwarded = rankings.reduce((acc, r) => acc + (r.total_points || 0), 0);
  const totalCompletedTasks = rankings.reduce((acc, r) => acc + (r.completed_tasks_count || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 p-6 md:p-10 text-white shadow-xl shadow-orange-500/15 mb-8">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              University Activity League
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              DSW Club Leaderboard
            </h1>
            <p className="mt-2 text-white/90 text-sm md:text-base max-w-xl">
              Track real-time performance, task completions, and point standing of official student clubs & societies at Geeta University.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setAwardModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              Award Manual Points
            </button>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-xs font-medium text-white/80 block">Active Clubs</span>
            <span className="text-2xl font-bold">{rankings.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-xs font-medium text-white/80 block">Total Points Earned</span>
            <span className="text-2xl font-bold">{totalPointsAwarded.toLocaleString()}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-xs font-medium text-white/80 block">Tasks Completed</span>
            <span className="text-2xl font-bold">{totalCompletedTasks}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <span className="text-xs font-medium text-white/80 block">Top Club</span>
            <span className="text-xl font-bold truncate block">{first?.title || 'None'}</span>
          </div>
        </div>
      </div>

      {/* Podium for Top 3 (if exists) */}
      {top3.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Performers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto">
            {/* 2nd Place */}
            {second && (
              <div className="order-2 md:order-1 bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-300 dark:border-slate-700 shadow-md relative hover:shadow-xl transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 dark:bg-slate-700 dark:text-slate-100 font-bold px-4 py-1 rounded-full text-xs shadow flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-slate-400" />
                  RANK #2
                </div>
                <div className="text-center pt-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-600 mx-auto flex items-center justify-center text-slate-700 dark:text-slate-200 font-extrabold text-2xl shadow-inner mb-3">
                    🥈
                  </div>
                  <h3 className="font-bold text-lg truncate">{second.title}</h3>
                  <span className="inline-block text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full mt-1">
                    {second.category}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {second.total_points}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 ml-1 font-semibold">PTS</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-3 flex justify-between">
                    <span>Tasks Done: <b>{second.completed_tasks_count}</b></span>
                    <span>Members: <b>{second.members_count + second.student_roles_count}</b></span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place (Center & Taller) */}
            {first && (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-800 rounded-3xl p-8 border-2 border-amber-400 dark:border-amber-500/60 shadow-2xl relative transform md:-translate-y-4 hover:shadow-amber-500/20 transition-all">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-extrabold px-5 py-1.5 rounded-full text-xs shadow-lg flex items-center gap-1.5 uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-yellow-200" />
                  CHAMPION #1
                </div>
                <div className="text-center pt-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 mx-auto flex items-center justify-center text-white font-extrabold text-4xl shadow-xl shadow-amber-400/30 mb-3 animate-bounce">
                    👑
                  </div>
                  <h3 className="font-extrabold text-xl truncate text-slate-900 dark:text-white">{first.title}</h3>
                  <span className="inline-block text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full mt-1">
                    {first.category}
                  </span>
                  <div className="my-5">
                    <span className="text-4xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {first.total_points}
                    </span>
                    <span className="text-sm text-amber-600 dark:text-amber-400 ml-1.5 font-bold">PTS</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 border-t border-amber-200 dark:border-slate-700/60 pt-3 flex justify-between">
                    <span>Tasks Done: <b className="text-amber-600 dark:text-amber-400">{first.completed_tasks_count}</b></span>
                    <span>Coordinator: <b>{first.faculty_coordinator_name || 'Assigned'}</b></span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="order-3 md:order-3 bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-amber-700/30 dark:border-amber-700/40 shadow-md relative hover:shadow-xl transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-700/20 text-amber-800 dark:text-amber-200 font-bold px-4 py-1 rounded-full text-xs shadow flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-amber-700" />
                  RANK #3
                </div>
                <div className="text-center pt-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700/40 to-amber-800/60 dark:from-amber-900/40 dark:to-amber-800/40 mx-auto flex items-center justify-center text-amber-900 dark:text-amber-200 font-extrabold text-2xl shadow-inner mb-3">
                    🥉
                  </div>
                  <h3 className="font-bold text-lg truncate">{third.title}</h3>
                  <span className="inline-block text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 rounded-full mt-1">
                    {third.category}
                  </span>
                  <div className="my-4">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {third.total_points}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 ml-1 font-semibold">PTS</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-3 flex justify-between">
                    <span>Tasks Done: <b>{third.completed_tasks_count}</b></span>
                    <span>Members: <b>{third.members_count + third.student_roles_count}</b></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Search club or faculty..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Calculating live rankings...</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-slate-700 dark:text-slate-300 mx-auto mb-2" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">No clubs found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6 text-center w-20">Rank</th>
                  <th className="py-4 px-6">Club & Category</th>
                  <th className="py-4 px-6">Faculty Coordinator</th>
                  <th className="py-4 px-6 text-center">Council & Members</th>
                  <th className="py-4 px-6 text-center">Tasks Completed</th>
                  <th className="py-4 px-6 text-right">Total Score</th>
                  {isAdmin && <th className="py-4 px-6 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredRankings.map((club) => {
                  return (
                    <tr
                      key={club.club_id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors ${
                        club.rank === 1
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 font-medium'
                          : ''
                      }`}
                    >
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-extrabold text-sm ${
                            club.rank === 1
                              ? 'bg-amber-400 text-slate-900 shadow-md'
                              : club.rank === 2
                              ? 'bg-slate-300 text-slate-800'
                              : club.rank === 3
                              ? 'bg-amber-700/40 text-amber-900 dark:text-amber-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {club.rank}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {club.title}
                          {club.rank === 1 && <span className="text-amber-500">👑</span>}
                        </div>
                        <span className="inline-block text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md mt-0.5">
                          {club.category}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {club.faculty_coordinator_name || 'Not assigned'}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <Users className="w-3.5 h-3.5" />
                          <span>{club.student_roles_count} Officers • {club.members_count} Members</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {club.completed_tasks_count} / {club.tasks_count}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                          {club.total_points}
                          <span className="text-xs font-normal text-slate-700 dark:text-slate-300 ml-1">pts</span>
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => {
                              setSelectedClubId(club.club_id);
                              setAwardModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Points
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Award Points Modal */}
      {awardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Award Activity Points
              </h3>
              <button
                onClick={() => setAwardModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAward} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Select Club
                </label>
                <select
                  value={selectedClubId}
                  onChange={e => setSelectedClubId(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Choose Club --</option>
                  {rankings.map(c => (
                    <option key={c.club_id} value={c.club_id}>
                      {c.title} (Current: {c.total_points} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Points to Add / Deduct
                </label>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={e => setPointsAmount(Number(e.target.value))}
                  required
                  step="5"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 block">
                  Positive value adds points; negative value deducts points.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Event / Award Note
                </label>
                <textarea
                  value={pointsReason}
                  onChange={e => setPointsReason(e.target.value)}
                  placeholder="e.g., Won 1st Prize in State Tech Fest, Annual Sports Day bonus..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAwardModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={awardLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {awardLoading ? 'Awarding...' : 'Award Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubLeaderboardPage;
