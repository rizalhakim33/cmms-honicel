import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sparepart, InstalledSparepart, Asset } from '../types';
import { CSVImportExport } from './CSVImportExport';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Settings, 
  Wrench, 
  Clock, 
  TrendingUp, 
  Package, 
  Gauge,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  assets: Asset[];
}

export const SparepartsManager: React.FC<Props> = ({ assets }) => {
  const [spareparts, setSpareparts] = useState<Sparepart[]>([]);
  const [installedParts, setInstalledParts] = useState<InstalledSparepart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and tabs
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'installed'>('inventory');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Fields
  const [name, setName] = useState('');
  const [stock, setStock] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [lifetimeHours, setLifetimeHours] = useState<number>(2000);

  const fetchSparepartsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch warehouse spareparts
      const { data: spData, error: spError } = await supabase
        .from('spareparts')
        .select('*')
        .order('name');
      
      if (spError) throw spError;
      if (spData) setSpareparts(spData);

      // Fetch installed spareparts with joined asset name
      const { data: instData, error: instError } = await supabase
        .from('installed_spareparts')
        .select('*, asset:assets(*)');
      
      if (instError) throw instError;
      if (instData) setInstalledParts(instData);

    } catch (err: any) {
      console.error("Error loading spare parts info:", err);
      setError(err?.message || 'Gagal terhubung ke database Supabase. Menggunakan state lokal.');
      
      // Fallback local persistence if Supabase fails or isn't migrated
      const fallbackInventory = localStorage.getItem('honicel_spareparts');
      const fallbackInstalled = localStorage.getItem('honicel_installed_spareparts');
      if (fallbackInventory) setSpareparts(JSON.parse(fallbackInventory));
      if (fallbackInstalled) setInstalledParts(JSON.parse(fallbackInstalled));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSparepartsData();
  }, []);

  const handleImportSpareparts = async (newSp: any[]) => {
    try {
      // Deduplicate items by name to prevent "ON CONFLICT DO UPDATE command cannot affect row a second time"
      const uniqueSpMap = new Map<string, any>();
      newSp.forEach(item => {
        const key = item.name.trim().toLowerCase();
        if (uniqueSpMap.has(key)) {
          const existing = uniqueSpMap.get(key);
          uniqueSpMap.set(key, {
            ...item,
            name: existing.name, // Keep original casing
            stock: existing.stock + (item.stock || 0)
          });
        } else {
          uniqueSpMap.set(key, item);
        }
      });

      const withoutIds = Array.from(uniqueSpMap.values()).map(item => ({
        name: item.name,
        stock: item.stock || 0,
        price: item.price || 0,
        estimated_lifetime_hours: item.estimated_lifetime_hours || 2000
      }));

      const { error } = await supabase.from('spareparts').upsert(withoutIds, { onConflict: 'name' });
      if (error) {
        throw new Error(error.message || "Gagal memasukkan data massal ke database.");
      }

      await fetchSparepartsData();
    } catch (err: any) {
      console.error("Database Bulk Sparepart insert failed:", err);
      throw err;
    }
  };

  const handleOpenCreate = () => {
    setFormType('create');
    setSelectedId(null);
    setName('');
    setStock(10);
    setPrice(150000);
    setLifetimeHours(2000);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sp: Sparepart) => {
    setFormType('edit');
    setSelectedId(sp.id);
    setName(sp.name);
    setStock(sp.stock);
    setPrice(sp.price);
    setLifetimeHours(sp.estimated_lifetime_hours);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  };

  const handleSaveSparepart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Nama sparepart wajib diisi!');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        stock: Math.max(0, stock),
        price: Math.max(0, price),
        estimated_lifetime_hours: Math.max(1, lifetimeHours),
        updated_at: new Date().toISOString()
      };

      if (formType === 'create') {
        const { error: insError } = await supabase
          .from('spareparts')
          .insert([payload]);
        if (insError) throw insError;
        setSuccess('Suku cadang baru berhasil disimpan ke gudang.');
      } else {
        const { error: updError } = await supabase
          .from('spareparts')
          .update(payload)
          .eq('id', selectedId);
        if (updError) throw updError;
        setSuccess('Data suku cadang berhasil diperbarui.');
      }

      setIsFormOpen(false);
      fetchSparepartsData();
    } catch (err: any) {
      console.error("Failed to save sparepart to Supabase:", err);
      
      // Store locally if firebase/Supabase errors
      const fallbackList = [...spareparts];
      if (formType === 'create') {
        const localSp: Sparepart = {
          id: crypto.randomUUID(),
          name: name.trim(),
          stock: Math.max(0, stock),
          price: Math.max(0, price),
          estimated_lifetime_hours: Math.max(1, lifetimeHours),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        fallbackList.push(localSp);
      } else {
        const idx = fallbackList.findIndex(x => x.id === selectedId);
        if (idx !== -1) {
          fallbackList[idx] = {
            ...fallbackList[idx],
            name: name.trim(),
            stock: Math.max(0, stock),
            price: Math.max(0, price),
            estimated_lifetime_hours: Math.max(1, lifetimeHours),
            updated_at: new Date().toISOString()
          };
        }
      }
      setSpareparts(fallbackList);
      localStorage.setItem('honicel_spareparts', JSON.stringify(fallbackList));
      setSuccess('Data disimpan secara lokal di browser karena kendala database.');
      setIsFormOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, spName: string) => {
    if (!confirm(`Hapus sparepart "${spName}" dari sistem?`)) return;
    
    try {
      setLoading(true);
      const { error: delError } = await supabase
        .from('spareparts')
        .delete()
        .eq('id', id);
      
      if (delError) throw delError;
      setSuccess('Suku cadang dihapus.');
      fetchSparepartsData();
    } catch (err: any) {
      console.error("Supabase delete failed:", err);
      const filtered = spareparts.filter(x => x.id !== id);
      setSpareparts(filtered);
      localStorage.setItem('honicel_spareparts', JSON.stringify(filtered));
      setSuccess('Item dihapus secara lokal.');
    } finally {
      setLoading(false);
    }
  };

  // Lifetime Health Calculator (assume 12 hrs/day runtime)
  const calculateLifetimeHealth = (installedAt: string, estimatedLifetime: number) => {
    const start = new Date(installedAt);
    const diffTime = Math.max(0, Date.now() - start.getTime());
    const elapsedDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Industrial Standard factor: 12 machine operating hours per day
    const machineHoursPerDay = 12;
    const accumulatedHours = Math.round(elapsedDays * machineHoursPerDay); 
    const remainingHours = Math.max(0, estimatedLifetime - accumulatedHours);
    const healthPercent = Math.max(0, Math.min(100, Math.round((remainingHours / estimatedLifetime) * 100)));

    return {
      accumulated: accumulatedHours,
      remaining: remainingHours,
      health: healthPercent
    };
  };

  const filteredSpareparts = spareparts.filter(sp => 
    sp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstalled = installedParts.filter(ip => 
    ip.sparepart_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ip.asset?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatter helper
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Control Card with Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Suku Cadang (Sparepart Registry)</h2>
          <p className="text-sm text-slate-500 italic">Inventory, warehouse storage and asset lifetime estimation</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CSVImportExport
            data={spareparts}
            fileName="honicel_spareparts"
            fields={['name', 'stock', 'price', 'estimated_lifetime_hours']}
            humanHeaders={['Nama Suku Cadang', 'Stok Warehouse', 'Harga Premium', 'Masa Pakai']}
            type="sparepart"
            onImport={handleImportSpareparts}
          />
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border border-blue-500 shrink-0"
          >
            <Plus size={16} /> REGISTER NEW SPAREPART
          </button>
        </div>
      </div>

      {/* Tab Selectors & Search Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setActiveSubTab('inventory')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'inventory' 
                ? 'bg-white text-slate-850 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={14} className="inline mr-1.5" /> Warehouse Stock
          </button>
          <button 
            onClick={() => setActiveSubTab('installed')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSubTab === 'installed' 
                ? 'bg-white text-slate-850 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gauge size={14} className="inline mr-1.5" /> Installed Lifetime Tracking
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari sparepart atau mesin..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
            <span className="text-xs font-mono text-slate-400 lowercase uppercase">Loading catalogs...</span>
          </div>
        ) : activeSubTab === 'inventory' ? (
          /* Inventory Table */
          <div className="overflow-x-auto">
            {filteredSpareparts.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <Package className="mx-auto w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Tidak Ada Sparepart</p>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci Anda atau daftarkan baru.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[11px] tracking-wider text-slate-400 uppercase">
                    <th className="px-6 py-3.5">Nama Suku Cadang</th>
                    <th className="px-6 py-3.5">Jumlah Stok (Warehouse)</th>
                    <th className="px-6 py-3.5">Harga Standard</th>
                    <th className="px-6 py-3.5">Estimasi Lifetime</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {filteredSpareparts.map((sp) => (
                    <tr key={sp.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-6 py-4 font-bold text-slate-800">{sp.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          sp.stock === 0 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : sp.stock < 5 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {sp.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{formatRupiah(sp.price)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 border-none">
                        <Clock size={14} className="inline mr-1 text-slate-400" /> {sp.estimated_lifetime_hours} hrs
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(sp)}
                            className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(sp.id, sp.name)}
                            className="p-1 px-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* Lifetime Tracking */
          <div className="p-6">
            {filteredInstalled.length === 0 ? (
              <div className="text-center p-12 text-slate-400">
                <Wrench className="mx-auto w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Belum Ada Sparepart Terpasang</p>
                <p className="text-xs">Selesaikan Work Order berisi detail penggantian untuk memantau umur suku cadang di sini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredInstalled.map((ip) => {
                  const { accumulated, remaining, health } = calculateLifetimeHealth(ip.installed_at, ip.estimated_lifetime_hours);
                  return (
                    <div 
                      key={ip.id} 
                      className="border border-slate-200 bg-slate-50/50 p-5 rounded-xl flex flex-col justify-between hover:shadow-md transition-all h-full"
                    >
                      <div>
                        {/* Title and Badge */}
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                              Installed Part
                            </span>
                            <h3 className="text-base font-bold text-slate-800 mt-1">{ip.sparepart_name}</h3>
                          </div>
                          
                          <div className="text-right">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              health >= 75 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : health >= 35 
                                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                            }`}>
                              {health}% Healthy
                            </span>
                          </div>
                        </div>

                        {/* Machine assignment and Date */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-4 text-slate-500 bg-white p-3 rounded-lg border border-slate-100">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Machine/Asset</span>
                            <span className="font-semibold text-slate-700">{ip.asset?.name || 'Unknown Asset'}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Installation Date</span>
                            <span className="font-semibold text-slate-700">{new Date(ip.installed_at).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="space-y-1 text-xs mb-3">
                          <div className="flex justify-between items-center text-[11px] font-medium">
                            <span className="text-slate-400">Lifetime Hours: {ip.estimated_lifetime_hours} hrs</span>
                            <span className="font-mono text-slate-700">{accumulated} hrs used</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                health >= 75 ? 'bg-emerald-500' : health >= 35 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${health}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Estimated remaining life:</span>
                        <span className={`font-bold flex items-center gap-1 ${
                          health < 35 ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {health < 35 && <AlertTriangle size={12} />}
                          {remaining} hours
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input Dialog Modal for Inventory additions */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800 capitalize">
                {formType === 'create' ? 'Daftarkan' : 'Perbarui'} Suku Cadang (Sparepart)
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSparepart} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Nama Suku Cadang *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Belt Conveyor K14, Bearing NSK 6204"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jumlah Stok di Gudang</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Harga Suku Cadang (IDR)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Estimasi Masa Pakai (Jam/Hours) *</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={lifetimeHours}
                  onChange={(e) => setLifetimeHours(parseInt(e.target.value) || 2000)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Standard conveyor belts are ~3000 hrs, heavy motors are ~5000 hrs.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Simpan Suku Cadang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
