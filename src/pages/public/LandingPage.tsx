import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { 
  Trophy, Flame, Sparkles, Calendar, ArrowRight, Shield, 
  Briefcase, GraduationCap, Star, Award, CheckCircle2, Music, Activity
} from 'lucide-react';

interface EventItem {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  venue: string;
}

interface StudentRank {
  student_id: number;
  name: string;
  course_branch: string;
  total_points: number;
  rank: number;
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [topStudents, setTopStudents] = useState<StudentRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLandingData() {
      try {
        const [eventsData, rankingsData] = await Promise.all([
          apiRequest<EventItem[]>('/events'),
          apiRequest<StudentRank[]>('/leaderboard/students/rankings')
        ]);
        setEvents(eventsData.slice(0, 3));
        setTopStudents(rankingsData.slice(0, 3));
      } catch (e) {
        console.error("Error loading public landing data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadLandingData();
  }, []);

  return (
    <div className="min-h-screen bg-[#040806] text-white font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Floating Glass Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#040806]/85 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0e8a6e] via-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30 border border-white/20">
            GU
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight font-display text-white">GEETA UNIVERSITY</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Dean of Student Welfare (DSW)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Sign In to Portal
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0e8a6e]/25 via-emerald-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-400" /> Official DSW Student Welfare & Activity Portal
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white font-display">
            Empowering Campus Life, <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
              Sports, Culture & Excellence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium">
            Centralized hub for Geeta University students and faculty. Track task duties, sign up for mega fests, compete in leaderboard challenges, and view live campus announcements.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button onClick={() => navigate('/login')} className="btn-primary text-base px-8 py-3">
              Explore User Portal
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#events" className="btn-secondary text-base px-8 py-3">
              Upcoming Events & Fests
            </a>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid (Star Nights, Sports, Events) */}
      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white font-display">Campus Vibrancy & Highlights</h2>
          <p className="text-xs text-slate-300">Discover the pulse of student activities at Geeta University</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Star Nights */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Celebrity Star Nights</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Unforgettable cultural symposiums, musical concerts, and DJ nights featuring renowned artists and guest keynotes.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              Annual Technophilia Fest <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 2: Sports Tournaments */}
          <div className="glass-card p-6 relative overflow-hidden group border-teal-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-teal-500/15 text-teal-400 mb-4 flex items-center justify-center border border-teal-500/30">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sports Meet & Leagues</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Inter-departmental cricket, football, athletics, and indoor games championships with live leaderboard scoring.
            </p>
            <span className="text-xs font-semibold text-teal-300 flex items-center gap-1">
              Geeta Sports Cup 2026 <Trophy className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Card 3: Leaderboard Challenges */}
          <div className="glass-card p-6 relative overflow-hidden group border-emerald-500/30">
            <div className="p-3 w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 mb-4 flex items-center justify-center border border-emerald-500/30">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gamified Leaderboards</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Participate in social welfare initiatives, blood donation drives, and academic publishing to earn university reward points.
            </p>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              Real-time Student Ranks <Star className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Events Grid Section */}
      <section id="events" className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-display">Featured DSW Events</h2>
            <p className="text-xs text-slate-300 mt-1">Official university events managed via DSW Portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events.map((ev) => (
              <div key={ev.id} className="glass-card p-6 space-y-3 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/30">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-300 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" /> {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : 'Upcoming'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{ev.title}</h3>
                <p className="text-xs text-slate-300 line-clamp-2">{ev.description}</p>
                <div className="pt-2 text-xs text-slate-200 font-medium">📍 {ev.venue}</div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-slate-400 text-sm">No upcoming public events loaded.</div>
          )}
        </div>
      </section>

      {/* Student Hall of Fame Leaderboard Preview */}
      <section className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white font-display flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-emerald-400" /> Student Hall of Fame
          </h2>
          <p className="text-xs text-slate-300">Top ranking student coordinators on the Geeta University Leaderboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {topStudents.map((stu) => (
            <div key={stu.student_id} className="glass-panel p-6 text-center space-y-3 relative overflow-hidden border border-emerald-500/30">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0e8a6e] to-emerald-400 mx-auto flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-500/20">
                #{stu.rank}
              </div>
              <h4 className="font-bold text-base text-white">{stu.name}</h4>
              <p className="text-xs text-slate-300">{stu.course_branch}</p>
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                ⭐ {stu.total_points} Reward Points
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-8 px-6 text-center text-xs text-slate-400 space-y-2">
        <p className="font-medium text-slate-300">Geeta University — Dean of Student Welfare (DSW) Portal</p>
        <p className="text-slate-500">Built for seamless campus administration, event coordination, and gamified student welfare.</p>
      </footer>
    </div>
  );
};
