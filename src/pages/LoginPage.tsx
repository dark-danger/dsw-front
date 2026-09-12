import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { ArrowRight, Lock, Mail, Sparkles, ArrowLeft, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('student@geeta.edu.in');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      login(data.access_token, data.refresh_token, data.user);

      // Auto-redirect based on authenticated user's role
      if (data.user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-center items-center bg-[#040806] px-4 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-gradient-to-tr from-[#0e8a6e]/25 via-emerald-600/15 to-transparent rounded-full blur-[140px] pointer-events-none" />

      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 btn-secondary text-xs py-2 px-4 flex items-center gap-2 z-20"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-md glass-panel p-8 relative z-10 shadow-2xl border border-white/10 space-y-6">
        
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-black/80 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-lg mb-1">
            <LogIn className="w-7 h-7 text-emerald-400" />
          </div>
          <span className="inline-block px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Geeta University DSW Portal
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">Login Here</h2>
          <p className="text-xs text-slate-300 font-medium">Enter your credentials to access your DSW workstation</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@geeta.edu.in"
                className="glass-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center py-2.5 mt-2 text-sm font-bold"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 text-center space-y-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Geeta University — Dean of Student Welfare
          </div>
        </div>
      </div>
    </div>
  );
};
