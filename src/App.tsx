/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/KPICard';
import { WorkOrderTable } from './components/WorkOrderTable';
import { AssetList } from './components/AssetList';
import { LaborList } from './components/LaborList';
import { PMList } from './components/PMList';
import { AuthView } from './components/Auth';
import { EntityFormModal } from './components/EntityFormModal';
import { supabase, subscribeToTable, isSupabaseConfigured } from './lib/supabase';
import { WorkOrder, Asset, LaborProfile, PMSchedule } from './types';
import { Session } from '@supabase/supabase-js';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Search,
  Filter,
  Plus
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [labor, setLabor] = useState<LaborProfile[]>([]);
  const [pms, setPms] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'asset' | 'work_order' | 'labor' | 'pm_schedule'>('work_order');
  const [activeEntity, setActiveEntity] = useState<any>(null);

  // Session Listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initial Fetch
  const fetchData = async () => {
    try {
      const [woRes, assetRes, laborRes, pmRes] = await Promise.all([
        supabase.from('work_orders').select('*, asset:assets(*), assignee:labor_profiles(*)').order('created_at', { ascending: false }),
        supabase.from('assets').select('*').order('name'),
        supabase.from('labor_profiles').select('*'),
        supabase.from('pm_schedules').select('*, asset:assets(*)').order('next_due_at')
      ]);

      if (woRes.data) setWorkOrders(woRes.data);
      if (assetRes.data) setAssets(assetRes.data);
      if (laborRes.data) setLabor(laborRes.data);
      if (pmRes.data) setPms(pmRes.data);

    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    
    fetchData();

    // Subscribe to Real-time Changes
    const woSub = subscribeToTable('work_orders', () => fetchData());
    const assetSub = subscribeToTable('assets', () => fetchData());
    const pmSub = subscribeToTable('pm_schedules', () => fetchData());

    return () => {
      woSub.unsubscribe();
      assetSub.unsubscribe();
      pmSub.unsubscribe();
    };
  }, [session]);

  const openModal = (type: any, entity: any = null) => {
    setModalType(type);
    setActiveEntity(entity);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    const table = modalType === 'asset' ? 'assets' : 
                  modalType === 'work_order' ? 'work_orders' : 
                  modalType === 'labor' ? 'labor_profiles' : 'pm_schedules';
    let res;
    
    // Clean data (remove joined objects)
    const payload = { ...data };
    delete payload.asset;
    delete payload.assignee;
    
    if (data.id) {
      res = await supabase.from(table).update(payload).eq('id', data.id);
    } else {
      res = await supabase.from(table).insert([payload]);
    }

    if (res.error) throw res.error;
    fetchData();
  };

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    const table = type === 'asset' ? 'assets' : 
                  type === 'work_order' ? 'work_orders' : 
                  type === 'labor' ? 'labor_profiles' : 'pm_schedules';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert(error.message);
    fetchData();
  };

  // Sync PMs via Server Action
  const handleSyncPM = async () => {
    try {
      const response = await fetch('/api/pm/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.count > 0) {
        // Real-time will handle the update
      }
    } catch (e) {
      console.error('PM Sync failed', e);
    }
  };

  // KPIs
  const activeWOs = workOrders.filter(wo => wo.status !== 'closed').length;
  const downMachines = assets.filter(a => a.status === 'down').length;
  const completedToday = workOrders.filter(wo => 
    wo.status === 'closed' && 
    wo.completed_at && 
    new Date(wo.completed_at).toDateString() === new Date().toDateString()
  ).length;

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Konfigurasi Dibutuhkan</h1>
          <p className="text-sm text-slate-500 mb-6">
            Variabel <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> dan <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> belum terdeteksi.
          </p>
          <div className="bg-slate-900 text-white p-6 rounded-xl text-left text-xs font-mono mb-6 space-y-2">
            <p className="text-blue-400 mb-2">// Langkah perbaikan:</p>
            <p>1. Tambahkan variabel di Vercel Settings</p>
            <p>2. Pastikan pakai prefix <span className="text-orange-400">VITE_</span></p>
            <p>3. <span className="text-emerald-400 font-bold">RE-DEPLOY</span> aplikasi di Vercel</p>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Honeycomb e-CMMS Setup</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeId={activeTab} onNavigate={setActiveTab} />

      <main className="flex-1 overflow-y-auto flex flex-col h-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab.replace('_', ' ')}
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Real-time Active</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSyncPM}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                title="Sync PM Schedules"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => openModal('work_order')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                + New Work Order
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              {/* KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                  label="Mean Time To Repair (MTTR)" 
                  value="4.2" 
                  unit="hours"
                  icon={Clock} 
                  trend={{ value: '12%', isUp: true }}
                />
                <KPICard 
                  label="Active Work Orders" 
                  value={activeWOs} 
                  icon={Activity} 
                  colorClass="text-rose-500"
                />
                <KPICard 
                  label="Mean Time Between Failures" 
                  value="128" 
                  unit="hours"
                  icon={Activity} 
                  trend={{ value: '4%', isUp: false }}
                  colorClass="text-amber-500"
                />
                <KPICard 
                  label="Total Assets" 
                  value={assets.length} 
                  icon={CheckCircle2} 
                  colorClass="text-emerald-500"
                />
              </div>

              {/* Main Table Row */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-700">Critical Work Orders</h2>
                    <p className="text-xs text-slate-400">Live feed from factory floor</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Search assets or issues..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                  {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin-slow" />
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Analyzing Factory State...</span>
                    </div>
                  ) : (
                    <WorkOrderTable 
                      workOrders={workOrders.filter(wo => 
                        wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        wo.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )} 
                      onEdit={(wo) => openModal('work_order', wo)}
                      onDelete={(id) => handleDelete(id, 'work_order')}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work_orders' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Work Order Management</h2>
                  <p className="text-sm text-slate-500 italic">Centralized maintenance log and task tracking</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <WorkOrderTable 
                  workOrders={workOrders} 
                  onEdit={(wo) => openModal('work_order', wo)}
                  onDelete={(id) => handleDelete(id, 'work_order')}
                />
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Asset Registry</h2>
                  <p className="text-sm text-slate-500 italic">Monitoring status of production machines</p>
                </div>
                <button 
                  onClick={() => openModal('asset')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={16} /> NEW ASSET
                </button>
              </div>
              <AssetList 
                assets={assets} 
                onEdit={(a) => openModal('asset', a)}
                onDelete={(id) => handleDelete(id, 'asset')}
              />
            </div>
          )}

          {activeTab === 'pm_schedule' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Preventive Maintenance</h2>
                  <p className="text-sm text-slate-500 italic">Scheduled routines to prevent failure</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleSyncPM}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> SYNC DUE DATE
                  </button>
                  <button 
                    onClick={() => openModal('pm_schedule')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> NEW SCHEDULE
                  </button>
                </div>
              </div>
              <PMList 
                schedules={pms} 
                onEdit={(pm) => openModal('pm_schedule', pm)}
                onDelete={(id) => handleDelete(id, 'pm_schedule')}
              />
            </div>
          )}

          {activeTab === 'labor' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Maintenance Team</h2>
                  <p className="text-sm text-slate-500 italic">Management of technician profiles and specializations</p>
                </div>
                <button 
                  onClick={() => openModal('labor')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={16} /> NEW TECHNICIAN
                </button>
              </div>
              <LaborList 
                profiles={labor} 
                onEdit={(l) => openModal('labor', l)}
                onDelete={(id) => handleDelete(id, 'labor')}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-7xl mx-auto h-full flex items-center justify-center flex-col gap-4 text-slate-300">
               <RefreshCw className="w-12 h-12 opacity-10 animate-spin-slow" />
               <p className="text-sm italic">System settings and permissions are managed by facility admin.</p>
            </div>
          )}
        </div>
      </main>

      <EntityFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        entity={activeEntity}
        onSave={handleSave}
        assets={assets}
        labor={labor}
      />
    </div>
  );
}
