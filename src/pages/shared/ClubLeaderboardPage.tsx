import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  Medal, 
  Search, 
  Filter, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface ClubRanking {
  rank: number;
  club_id?: number;
  id?: number | string;
  name: string;
  category: string;
  faculty_id?: number | string | null;
  faculty_name?: string | null;
  total_points: number;
  tasks_completed: number;
  member_count?: number;
  total_members?: number;
  is_active?: boolean;
}

export const ClubLeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<ClubRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchRankings = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await apiRequest<ClubRanking[]>('/clubs/leaderboard/rankings', 'GET');
      if (Array.isArray(data)) {
        setRankings(data);
      } else {
        setRankings([]);
      }
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch club leaderboard rankings:', err);
      setFetchError(err.message || 'Failed to load rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const categories = ['all', 'Technical', 'Cultural', 'Sports', 'Literary', 'Social', 'Coding', 'Media'];

  const filteredRankings = rankings.filter((club) => {
    const clubName = (club?.name || '').toLowerCase();
    const facultyName = (club?.faculty_name || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    
    const matchesSearch = !query || clubName.includes(query) || facultyName.includes(query);
    const matchesCategory = selectedCategory === 'all' || 
      (club?.category && club.category.toLowerCase() === selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  const topThree = rankings.slice(0, 3);

  const getMemberCount = (c?: ClubRanking) => {
    if (!c) return 0;
    return c.member_count ?? c.total_members ?? 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-emerald-800 text-white p-6 md:p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 font-bold text-xs tracking-wider uppercase">
              <Trophy className="w-3.5 h-3.5" /> Official DSW Club Standings
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Student Club Leaderboard
            </h1>
            <p className="text-blue-100 max-w-2xl text-xs md:text-sm leading-relaxed">
              Points are awarded transparently by the Dean Student Welfare based on verified periodic task submissions, event execution, and active student participation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchRankings}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-semibold backdrop-blur-md border border-white/15 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => {
                const currentPath = window.location.pathname;
                if (currentPath.startsWith('/admin')) navigate('/admin/clubs');
                else if (currentPath.startsWith('/faculty')) navigate('/faculty/clubs');
                else navigate('/student/clubs');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 transition-all text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              <Users className="w-3.5 h-3.5" />
              Explore All Clubs
            </button>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button onClick={fetchRankings} className="underline font-bold">Try again</button>
        </div>
      )}

      {/* Top 3 Podium (when available) */}
      {!loading && topThree.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Rank 2 - Silver */}
          {topThree[1] ? (
            <div className="md:order-1 order-2 glass-panel p-5 relative flex flex-col justify-between hover:border-slate-400/40 transition-all duration-300 transform md:translate-y-3">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 flex items-center justify-center font-black text-base shadow-inner">
                  #2
                </span>
                <span className="px-2.5 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-300 dark:border-slate-700">
                  <Medal className="w-3 h-3 text-slate-400" /> Silver Tier
                </span>
              </div>
              <div className="my-4 text-center space-y-1.5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 flex items-center justify-center font-black text-xl shadow-md">
                  {(topThree[1].name || 'C').charAt(0)}
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-1">{topThree[1].name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{topThree[1].category || 'Technical'} Club</p>
                <div className="pt-1 inline-block">
                  <span className="text-2xl font-black text-[var(--text-primary)]">{topThree[1].total_points || 0}</span>
                  <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--panel-border)] text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {topThree[1].tasks_completed || 0} Tasks</div>
                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {getMemberCount(topThree[1])} Members</div>
              </div>
            </div>
          ) : (
            <div className="hidden md:block md:order-1" />
          )}

          {/* Rank 1 - Gold */}
          {topThree[0] && (
            <div className="md:order-2 order-1 glass-panel p-6 border-2 border-amber-400/60 dark:border-amber-500/50 relative flex flex-col justify-between hover:border-amber-400 transition-all duration-300 shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                <Trophy className="w-3 h-3 fill-current" /> Champion Leader
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/30">
                  #1
                </span>
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Gold Tier
                </span>
              </div>
              <div className="my-4 text-center space-y-1.5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-amber-400/20">
                  {(topThree[0].name || 'C').charAt(0)}
                </div>
                <h3 className="text-lg font-black text-[var(--text-primary)] line-clamp-1">{topThree[0].name}</h3>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{topThree[0].category || 'Technical'} Club</p>
                <div className="pt-1 inline-block">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{topThree[0].total_points || 0}</span>
                  <span className="text-xs font-bold text-[var(--text-muted)] ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--panel-border)] text-xs text-[var(--text-secondary)] font-medium">
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {topThree[0].tasks_completed || 0} Tasks</div>
                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {getMemberCount(topThree[0])} Members</div>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {topThree[2] ? (
            <div className="md:order-3 order-3 glass-panel p-5 relative flex flex-col justify-between hover:border-amber-700/40 transition-all duration-300 transform md:translate-y-4">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-amber-700/30 text-amber-900 dark:text-amber-200 flex items-center justify-center font-black text-base">
                  #3
                </span>
                <span className="px-2.5 py-0.5 bg-amber-700/15 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border border-amber-700/30">
                  <Medal className="w-3 h-3 text-amber-600" /> Bronze Tier
                </span>
              </div>
              <div className="my-4 text-center space-y-1.5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-700 to-orange-400 text-white flex items-center justify-center font-black text-xl shadow-md">
                  {(topThree[2].name || 'C').charAt(0)}
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-1">{topThree[2].name}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{topThree[2].category || 'Technical'} Club</p>
                <div className="pt-1 inline-block">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{topThree[2].total_points || 0}</span>
                  <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--panel-border)] text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {topThree[2].tasks_completed || 0} Tasks</div>
                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {getMemberCount(topThree[2])} Members</div>
              </div>
            </div>
          ) : (
            <div className="hidden md:block md:order-3" />
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search clubs by name or coordinator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[var(--card-bg-to)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--panel-border)]'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Leaderboard Rankings Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-5 border-b border-[var(--panel-border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Active Club Standings</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Live ranking based on verified task points and completed activities</p>
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {filteredRankings.length} {filteredRankings.length === 1 ? 'Club' : 'Clubs'} Listed
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-[var(--text-muted)]">Calculating club standings...</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Trophy className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
            <h4 className="text-sm font-bold text-[var(--text-primary)]">No clubs found</h4>
            <p className="text-xs text-[var(--text-muted)]">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--card-bg-to)] text-[var(--text-primary)] font-bold uppercase tracking-wider border-b border-[var(--panel-border)]">
                <tr>
                  <th className="py-3.5 px-4 font-bold w-16">Rank</th>
                  <th className="py-3.5 px-4 font-bold">Club Details</th>
                  <th className="py-3.5 px-4 font-bold">Faculty Coordinator</th>
                  <th className="py-3.5 px-4 font-bold text-center">Tasks Completed</th>
                  <th className="py-3.5 px-4 font-bold text-center">Active Members</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]">
                {filteredRankings.map((club, idx) => {
                  const rank = club.rank || idx + 1;
                  const isTopOne = rank === 1;
                  const isTopTwo = rank === 2;
                  const isTopThree = rank === 3;
                  const clubKey = club.club_id || club.id || idx;

                  return (
                    <tr
                      key={clubKey}
                      className="hover:bg-emerald-500/5 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {isTopOne ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                              1
                            </span>
                          ) : isTopTwo ? (
                            <span className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">
                              2
                            </span>
                          ) : isTopThree ? (
                            <span className="w-7 h-7 rounded-lg bg-amber-700/30 text-amber-900 dark:text-amber-200 flex items-center justify-center font-black text-xs">
                              3
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-lg bg-[var(--card-bg-to)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-xs border border-[var(--panel-border)]">
                              {rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center uppercase shrink-0">
                            {(club.name || 'CL').substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              {club.name}
                              <span className="px-1.5 py-0.5 rounded bg-[var(--card-bg-to)] text-[var(--text-muted)] text-[10px] font-semibold border border-[var(--panel-border)]">
                                {club.category || 'General'}
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">
                              ID: #{club.club_id || club.id || idx + 1}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="font-medium text-[var(--text-primary)]">
                            {club.faculty_name || 'Assigned Faculty'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {club.tasks_completed || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-medium text-xs">
                          <Users className="w-3 h-3 text-blue-500" />
                          {getMemberCount(club)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                            {club.total_points || 0}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600/80">PTS</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubLeaderboardPage;
