import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdminAuth } from '../lib/supabase';
import { Shield, Key, AlertTriangle, RefreshCw, CheckCircle2, Save, Trash2, UserX } from 'lucide-react';
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
  
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchDeletionRequests();
    }
  }, [isAdmin]);

  const fetchDeletionRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('labor_profiles')
        .select('*')
        .eq('deletion_requested', true);
      if (error) throw error;
      setDeletionRequests(data || []);
    } catch (err) {
      console.error("Failed to fetch deletion requests", err);
    }
  };

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

  const handleRequestDeletion = async () => {
    if (!confirm("Apakah Anda yakin ingin mengajukan penghapusan akun? Admin harus menyetujui permintaan ini.")) return;
    clearMessages();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('labor_profiles')
        .update({ deletion_requested: true })
        .eq('id', userProfile.id);
      
      if (error) throw error;
      setSuccess("Permintaan penghapusan akun telah dikirim ke Admin.");
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || "Gagal mengajukan penghapusan akun.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeletion = async (id: string, name: string) => {
    if (!confirm(`Hapus akun ${name} secara permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const { error: authErr } = await supabaseAdminAuth.auth.admin.deleteUser(id);
      if (authErr) {
        console.warn("Gagal menghapus Auth. Menghapus profile saja.", authErr);
      }
      
      const { error: dbErr } = await supabase.from('labor_profiles').delete().eq('id', id);
      if (dbErr) throw dbErr;
      
      fetchDeletionRequests();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert("Gagal menyetujui penghapusan: " + err.message);
    }
  };

  const handleRejectDeletion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('labor_profiles')
        .update({ deletion_requested: false })
        .eq('id', id);
        
      if (error) throw error;
      fetchDeletionRequests();
    } catch (err: any) {
      alert("Gagal menolak permintaan: " + err.message);
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

        {/* Account Deletion Request Card */}
        {!isAdmin && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Hapus Akun</h2>
                <p className="text-xs text-slate-500">Ajukan permohonan penghapusan akun ke Admin.</p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 mb-6">
              Penghapusan akun bersifat permanen. Semua data histori kerja Anda akan tetap ada, namun nama pengguna Anda akan disembunyikan dan Anda tidak akan bisa login lagi ke dalam sistem.
            </div>

            <button 
              onClick={handleRequestDeletion}
              disabled={loading || userProfile?.deletion_requested}
              className="w-full bg-white border border-red-200 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {userProfile?.deletion_requested ? 'Menunggu Persetujuan Admin' : 'Ajukan Hapus Akun'}
            </button>
          </div>
        )}

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

       {/* Admin Review Requests Section */}
       {isAdmin && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserX className="w-5 h-5 text-slate-400" />
              Permohonan Hapus Akun
              {deletionRequests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  {deletionRequests.length} Pending
                </span>
              )}
            </h2>
            <button onClick={fetchDeletionRequests} className="p-1 text-slate-400 hover:text-slate-600">
               <RefreshCw size={16} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400">ID / Name</th>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400">Role</th>
                  <th className="px-6 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deletionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400 italic">
                      Tidak ada permohonan hapus akun saat ini.
                    </td>
                  </tr>
                ) : (
                  deletionRequests.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">{user.full_name}</td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-wider font-bold text-slate-500">{user.role}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleRejectDeletion(user.id)}
                          className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-100"
                        >
                          Tolak
                        </button>
                        <button 
                          onClick={() => handleApproveDeletion(user.id, user.full_name)}
                          className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100"
                        >
                          Approve Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
       )}

    </div>
  );
};

