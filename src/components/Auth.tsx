import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Lock, Mail, ChevronRight, AlertCircle, Factory, CheckCircle2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const loginEmail = username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '')}@honicel.local`;
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) {
        setError(authError.message === 'Invalid login credentials' ? 'Kombinasi username dan password salah.' : authError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan tidak terduga pada sistem autentikasi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.svg" alt="Honicel Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">eCMMS</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Honicel Indonesia Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Please enter your credentials to access the facility dashboard.
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Username / Email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold bg-slate-200 text-[10px] px-1.5 py-0.5 rounded uppercase">ID</div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau email@honicel.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-6 flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying Access...' : 'Sign In to Portal'}
              {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-4 text-center">
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>Security Level: Enterprise</span>
                <a href="#" className="font-bold text-slate-500 hover:underline">Support Protocol</a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed bottom-6 text-slate-400 text-[10px] font-medium tracking-widest uppercase opacity-60 text-center px-4">
        &copy; 2026 Honicel Indonesia Industrial Group • All Systems Monitored
      </div>
    </div>
  );
};
