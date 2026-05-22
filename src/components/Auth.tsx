import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Lock, Mail, ChevronRight, AlertCircle, Factory, CheckCircle2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
        } else {
          if (data.session) {
            setSuccess('Registration successful! Logging you in...');
          } else {
            setSuccess('Registration successful! Standard user profile generated. Please sign in now.');
            setIsSignUp(false);
          }
          setLoading(false);
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authentication.');
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
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Factory size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">eCMMS</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Honicel Indonesia Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {isSignUp 
              ? 'Register a new account to join the Honicel maintenance portal.' 
              : 'Please enter your credentials to access the facility dashboard.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@honicel.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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

            {success && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 text-xs font-medium"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg mt-6 flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignUp ? 'Creating Account...' : 'Verifying Access...') 
                : (isSignUp ? 'Sign Up for Account' : 'Sign In to Portal')}
              {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col gap-4 text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {isSignUp 
                  ? 'Already have an account? Sign In' 
                  : 'Don\'t have an account? Sign Up'}
              </button>
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
