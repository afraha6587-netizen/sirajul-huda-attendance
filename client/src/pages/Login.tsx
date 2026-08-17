import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, ShieldAlert, Lock, Mail, Search, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 z-10 space-y-6">
        {/* College Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-brand-600/30 mb-3">
            🎓
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            Sirajul Huda College of Science & Integrated Studies
          </h1>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Nadapuram • Jamiathul Hind Al Islamiya</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-extrabold uppercase tracking-wider border border-brand-200">
            Attendance Portal
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Email / User ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or User ID"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-brand-600 focus:bg-white focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:border-brand-600 focus:bg-white focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Public Student Search CTA Box */}
        <div className="pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center space-y-2">
            <p className="text-xs font-bold text-slate-800">Are you a student checking your attendance?</p>
            <p className="text-[11px] text-slate-500">No login required. Search using your Register Number.</p>
            <Link
              to="/portal"
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-brand-400" />
              <span>Go to Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
