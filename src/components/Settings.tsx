import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Key, AlertTriangle, RefreshCw, CheckCircle2, Save } from 'lucide-react';
import { Session } from '@supabase/supabase-js';

interface SettingsProps {
  userProfile: any;
  session: Session;
  onRefreshData?: () => void;
}

export const SettingsTab: React.FC<SettingsProps> = ({ userProfile, session, onRefreshData }) => {
  const isAdmin = userProfile?.role === 'admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const email = username ? (username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '')}@honicel.local`) : undefined;
      
      const updateData: any = {};
      if (email) updateData.email = email;
      if (password) updateData.password = password;

      if (Object.keys(updateData).length === 0) {
        throw new Error("Mohon isi username atau password yang ingin diubah.");
      }

      // Update auth user
      const { error: updateError } = await supabase.auth.updateUser(updateData);
      
      if (updateError) throw updateError;
      
      setSuccess("Kredensial login berhasil diperbarui.");
      setPassword('');
      setUsername('');
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui kredensial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Akun</h1>
          <p className="text-slate-500 mt-1">Kelola preferensi dan kredensial login</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle size={18} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Credentials Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Ubah Kredensial</h2>
              <p className="text-xs text-slate-500">Perbarui username atau password login Anda.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Username Baru</label>
              <input 
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Password Baru</label>
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || (!username && !password)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              <span>Simpan Perubahan</span>
            </button>
          </form>
        </div>

        {/* Admin Dashboard info */}
        {isAdmin && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-6">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">System Information</h2>
                <p className="text-xs text-slate-500">Administrator Panel</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Role</p>
                <p className="font-bold text-slate-800">Administrator</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment</p>
                <p className="font-bold text-slate-800">Production</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Email</p>
                <p className="font-mono text-xs font-bold text-slate-600 mt-1">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

