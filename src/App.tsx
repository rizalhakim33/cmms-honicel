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
import { CSVImportExport } from './components/CSVImportExport';
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
  Plus,
  Menu,
  FileText
} from 'lucide-react';
import { exportWorkOrdersToPDF } from './lib/pdfExport';
import { SparepartsManager } from './components/SparepartsManager';
import { CashFlowManager } from './components/CashFlowManager';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<LaborProfile | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [labor, setLabor] = useState<LaborProfile[]>([]);
  const [pms, setPms] = useState<PMSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('');

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
      setLoading(true);
      const isTechnician = userProfile?.role === 'technician';
      
      let woQuery = supabase.from('work_orders').select('*, asset:assets(*), assignee:assignee_id(*)');
      
      if (isTechnician) {
        woQuery = woQuery.eq('assignee_id', userProfile.id);
      }
      
      const [woRes, assetRes, laborRes, pmRes] = await Promise.all([
        woQuery.order('created_at', { ascending: false }),
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

  const fetchUserProfile = async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from('labor_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (data) {
      setUserProfile(data);
    } else if (!error) {
      // Auto-create profile for first-time login
      const { data: newData, error: createError } = await supabase
        .from('labor_profiles')
        .insert([{
          id: userId,
          full_name: email?.split('@')[0] || 'New User',
          role: 'admin', // Defaulting to admin for the developer's ease, should be 'technician' in real prod
          specialization: 'general'
        }])
        .select()
        .single();
      
      if (newData) setUserProfile(newData);
      if (createError) console.error("Error creating profile:", createError);
    } else {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    
    fetchUserProfile(session.user.id, session.user.email || undefined);
  }, [session, isSupabaseConfigured]);

  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    if (!userProfile) return; // Wait for role check
    
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

    // Handle completed work order automatic inventory deductions & accounting logs
    if (modalType === 'work_order' && payload.status === 'completed' && payload.replaced_sparepart_name && payload.replaced_sparepart_name.trim()) {
      try {
        const spName = payload.replaced_sparepart_name.trim();
        const qty = payload.replaced_sparepart_qty || 1;
        let price = 150000;
        let estLifetime = 2000;

        const { data: matchedSp } = await supabase
          .from('spareparts')
          .select('*')
          .ilike('name', spName)
          .maybeSingle();

        if (matchedSp) {
          price = matchedSp.price;
          estLifetime = matchedSp.estimated_lifetime_hours;
          
          await supabase
            .from('spareparts')
            .update({ stock: Math.max(0, matchedSp.stock - qty) })
            .eq('id', matchedSp.id);
        } else {
          await supabase
            .from('spareparts')
            .insert([{
              name: spName,
              stock: 0,
              price: price,
              estimated_lifetime_hours: estLifetime
            }]);
        }

        await supabase
          .from('installed_spareparts')
          .insert([{
            asset_id: payload.asset_id,
            work_order_id: payload.id || null,
            sparepart_name: spName,
            quantity: qty,
            installed_at: new Date().toISOString(),
            estimated_lifetime_hours: estLifetime
          }]);

        const targetAsset = assets.find(a => a.id === payload.asset_id);
        const assetName = targetAsset ? targetAsset.name : 'Mesin';
        await supabase
          .from('cash_flows')
          .insert([{
            type: 'sparepart',
            title: `Replace ${spName} on ${assetName}`,
            amount: price * qty,
            date: new Date().toISOString().split('T')[0],
            reference_id: payload.id || null
          }]);

      } catch (err) {
        console.warn("Table auto actions failed (maybe SQL tables aren't created yet or offline):", err);
        const localSp = localStorage.getItem('honicel_spareparts');
        const fallbackSp = localSp ? JSON.parse(localSp) : [];
        const matched = fallbackSp.find((x: any) => x.name.toLowerCase() === payload.replaced_sparepart_name.trim().toLowerCase());
        
        let price = 150000;
        let estLifetime = 2000;
        if (matched) {
          price = matched.price;
          estLifetime = matched.estimated_lifetime_hours;
          matched.stock = Math.max(0, matched.stock - (payload.replaced_sparepart_qty || 1));
          localStorage.setItem('honicel_spareparts', JSON.stringify(fallbackSp));
        } else {
          fallbackSp.push({
            id: crypto.randomUUID(),
            name: payload.replaced_sparepart_name.trim(),
            stock: 0,
            price: price,
            estimated_lifetime_hours: estLifetime,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          localStorage.setItem('honicel_spareparts', JSON.stringify(fallbackSp));
        }

        const localInst = localStorage.getItem('honicel_installed_spareparts');
        const fallbackInst = localInst ? JSON.parse(localInst) : [];
        fallbackInst.push({
          id: crypto.randomUUID(),
          asset_id: payload.asset_id,
          work_order_id: payload.id || null,
          sparepart_name: payload.replaced_sparepart_name.trim(),
          quantity: payload.replaced_sparepart_qty || 1,
          installed_at: new Date().toISOString(),
          estimated_lifetime_hours: estLifetime
        });
        localStorage.setItem('honicel_installed_spareparts', JSON.stringify(fallbackInst));

        const localCash = localStorage.getItem('honicel_cashflows');
        const fallbackCash = localCash ? JSON.parse(localCash) : [];
        fallbackCash.unshift({
          id: crypto.randomUUID(),
          type: 'sparepart',
          title: `Autonomous Expense: ${payload.replaced_sparepart_name} on Machine`,
          amount: price * (payload.replaced_sparepart_qty || 1),
          date: new Date().toISOString().split('T')[0],
          reference_id: payload.id || null,
          created_at: new Date().toISOString()
        });
        localStorage.setItem('honicel_cashflows', JSON.stringify(fallbackCash));
      }
    }

    fetchData();
  };

  const handleImportAssets = async (newAssets: any[]) => {
    try {
      const withIds = newAssets.map(item => ({
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category || 'other',
        location: item.location,
        status: item.status || 'operational',
        technical_specs: item.technical_specs || {},
        qr_code_data: item.qr_code_data || `HONICEL-${item.name.toUpperCase().replace(/\s+/g, '-')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('assets').insert(withIds);
      if (error) {
        throw new Error(error.message || "Gagal mengimpor Aset ke database");
      }
      
      await fetchData();
    } catch (err: any) {
      console.error("Database Bulk Asset Insert failing:", err);
      throw err;
    }
  };

  const handleImportLabor = async (newLabor: any[]) => {
    try {
      const withIds = newLabor.map(item => ({
        id: crypto.randomUUID(),
        full_name: item.full_name,
        specialization: item.specialization || 'general',
        role: item.role || 'technician',
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('labor_profiles').insert(withIds);
      if (error) {
        throw new Error(error.message || "Gagal mengimpor Profil Teknisi ke database");
      }

      await fetchData();
    } catch (err: any) {
      console.error("Database Bulk Labor Insert failing:", err);
      throw err;
    }
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

  // Sync PMs via Client-side Logic
  const handleSyncPM = async () => {
    try {
      setLoading(true);
      // Fetch all PM schedules that are due
      const today = new Date().toISOString();
      const { data: duePMs, error: fetchError } = await supabase
        .from('pm_schedules')
        .select('*')
        .lte('next_due_at', today);

      if (fetchError) throw fetchError;

      if (duePMs && duePMs.length > 0) {
        // For each due PM, create a Work Order
        const newWOs = duePMs.map(pm => ({
          asset_id: pm.asset_id,
          pm_id: pm.id,
          title: `PM: ${pm.title}`,
          description: pm.description || 'Preventive Maintenance Task',
          priority: 'high',
          status: 'open'
        }));

        const { error: woError } = await supabase.from('work_orders').insert(newWOs);
        if (woError) throw woError;

        // Update PM schedules with next due date
        for (const pm of duePMs) {
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + pm.frequency_days);
          
          await supabase.from('pm_schedules')
            .update({ 
              last_performed_at: today,
              next_due_at: nextDate.toISOString() 
            })
            .eq('id', pm.id);
        }
        
        alert(`Successfully synced ${duePMs.length} preventive maintenance tasks.`);
      } else {
        alert('No pending PM tasks due today.');
      }
      
      fetchData();
    } catch (e: any) {
      console.error('PM Sync failed', e);
      alert('PM Sync failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered list combining machine and date ranges
  const getFilteredWorkOrders = () => {
    let filtered = [...workOrders];

    // Selected Asset/Machine Filter
    if (selectedAssetFilter) {
      filtered = filtered.filter(wo => wo.asset_id === selectedAssetFilter);
    }

    // Date Range Filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(wo => new Date(wo.created_at) >= start);
    }
    
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(wo => new Date(wo.created_at) <= end);
    }

    return filtered;
  };

  // Filtered Export with formal header parameters
  const handleExportFilteredPDF = () => {
    const filtered = getFilteredWorkOrders();
    const assetName = assets.find(a => a.id === selectedAssetFilter)?.name || undefined;
    exportWorkOrdersToPDF(filtered, {
      assetName,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined
    });
  };

  const isSupervisor = userProfile?.role === 'admin' || userProfile?.role === 'supervisor';

  const activeWOs = workOrders.filter(wo => wo.status !== 'completed').length;
  const downMachines = assets.filter(a => a.status === 'down').length;
  const completedToday = workOrders.filter(wo => 
    wo.status === 'completed' && 
    wo.completed_at && 
    new Date(wo.completed_at).toDateString() === new Date().toDateString()
  ).length;

  // --- START DYNAMIC DASHBOARD METRICS ---
  // 1. Mean Time To Repair (MTTR) calculation based on actual completed Work Orders
  const completedWOs = workOrders.filter(wo => wo.status === 'completed');
  let dynamicMTTR = 4.2; // default standard reference if none exist yet
  let mttrTrendValue = "0%";
  let mttrTrendUp = true;
  
  if (completedWOs.length > 0) {
    const totalHours = completedWOs.reduce((acc, wo) => {
      const start = new Date(wo.started_at || wo.created_at).getTime();
      const end = new Date(wo.completed_at || wo.updated_at).getTime();
      const diffHrs = Math.max(0.1, (end - start) / (1000 * 60 * 60)); // at least 0.1 hr
      return acc + diffHrs;
    }, 0);
    dynamicMTTR = parseFloat((totalHours / completedWOs.length).toFixed(1));
    
    // Compare trend: check WOs completed in last 7 days vs previous
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentWOs = completedWOs.filter(wo => new Date(wo.completed_at || wo.updated_at) >= sevenDaysAgo);
    const olderWOs = completedWOs.filter(wo => new Date(wo.completed_at || wo.updated_at) < sevenDaysAgo);
    
    if (recentWOs.length > 0 && olderWOs.length > 0) {
      const recentAvg = recentWOs.reduce((acc, wo) => acc + Math.max(0.1, (new Date(wo.completed_at || wo.updated_at).getTime() - new Date(wo.started_at || wo.created_at).getTime()) / (1000 * 60 * 60)), 0) / recentWOs.length;
      const olderAvg = olderWOs.reduce((acc, wo) => acc + Math.max(0.1, (new Date(wo.completed_at || wo.updated_at).getTime() - new Date(wo.started_at || wo.created_at).getTime()) / (1000 * 60 * 60)), 0) / olderWOs.length;
      
      const pctDiff = ((recentAvg - olderAvg) / olderAvg) * 100;
      mttrTrendValue = `${Math.abs(Math.round(pctDiff))}%`;
      mttrTrendUp = pctDiff < 0; // Negative difference in MTTR is positive/good (speed got faster)!
    } else {
      mttrTrendValue = `${completedWOs.length} total`;
      mttrTrendUp = true;
    }
  }

  // 2. Mean Time Between Failures (MTBF)
  // Number of failures = high or urgent priority work orders (representing breakdowns)
  const highUrgentWOs = workOrders.filter(wo => wo.priority === 'high' || wo.priority === 'urgent');
  const failureCount = highUrgentWOs.length;
  
  // Assume a standard 30-day operating interval (720 hours) for monitored machinery
  const runningAssetCount = assets.filter(a => a.status === 'operational').length;
  const totalMonitoredHours = (runningAssetCount || assets.length || 1) * 30 * 24;
  
  let dynamicMTBF = 128; // default standard if none
  let mtbfTrendValue = "Standard";
  let mtbfTrendUp = true;
  
  if (assets.length > 0) {
    if (failureCount > 0) {
      dynamicMTBF = Math.max(1, Math.round(totalMonitoredHours / failureCount));
      mtbfTrendValue = `${failureCount} issues`;
      mtbfTrendUp = false; // More failures mean MTBF decreases (bad)
    } else {
      dynamicMTBF = totalMonitoredHours;
      mtbfTrendValue = "0 breakdowns";
      mtbfTrendUp = true; // Perfect reliability
    }
  }

  // 3. Asset Heath Breakdown
  const operationalAssets = assets.filter(a => a.status === 'operational').length;
  const maintenanceAssets = assets.filter(a => a.status === 'under_maintenance').length;
  const downAssets = assets.filter(a => a.status === 'down').length;

  // 4. Work Order Statuses Breakdown
  const openWOs = workOrders.filter(wo => wo.status === 'open').length;
  const inProgressWOs = workOrders.filter(wo => wo.status === 'in_progress').length;
  const pendingWOs = workOrders.filter(wo => wo.status === 'pending').length;
  const completedWOsCount = workOrders.filter(wo => wo.status === 'completed').length;

  // 5. PM Metrics Breakdown
  const totalPMCount = pms.length;
  const upcomingPMCount = pms.filter(pm => {
    const due = new Date(pm.next_due_at).getTime();
    const now = Date.now();
    return due > now && due <= now + (14 * 24 * 60 * 60 * 1000); // within next 14 days
  }).length;
  const overduePMCount = pms.filter(pm => new Date(pm.next_due_at).getTime() < Date.now()).length;
  // --- END DYNAMIC DASHBOARD METRICS ---

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
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar 
        activeId={activeTab} 
        onNavigate={setActiveTab} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={userProfile?.role}
      />

      <main className="flex-1 overflow-y-auto flex flex-col h-full w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 capitalize whitespace-nowrap">
              {activeTab.replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Real-time Active</span>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {isSupervisor && (
                <button 
                  onClick={handleSyncPM}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                  title="Sync PM Schedules"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => exportWorkOrdersToPDF(workOrders)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                title="Export Work Orders to PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button 
                onClick={() => openModal('work_order')}
                className="bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                + <span className="hidden xs:inline">New Work Order</span><span className="xs:hidden">WO</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
              {/* KPI Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                  label="Mean Time To Repair (MTTR)" 
                  value={dynamicMTTR} 
                  unit="hours"
                  icon={Clock} 
                  trend={{ value: mttrTrendValue, isUp: mttrTrendUp }}
                  colorClass="text-blue-500"
                />
                <KPICard 
                  label="Active Work Orders" 
                  value={activeWOs} 
                  icon={Activity} 
                  colorClass="text-amber-500"
                />
                <KPICard 
                  label="Mean Time Between Failures (MTBF)" 
                  value={dynamicMTBF} 
                  unit="hours"
                  icon={Activity} 
                  trend={{ value: mtbfTrendValue, isUp: mtbfTrendUp }}
                  colorClass="text-rose-500"
                />
                <KPICard 
                  label="Total Assets" 
                  value={assets.length} 
                  icon={CheckCircle2} 
                  colorClass="text-emerald-500"
                />
              </div>

              {/* Fleet, Schedule & Backlog Summary Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Asset Fleet Health */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Asset Fleet Availability</h3>
                    <div className="space-y-4">
                      {/* Operational */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
                          </span>
                          <span className="font-mono font-bold text-slate-800">{operationalAssets} / {assets.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${assets.length > 0 ? (operationalAssets/assets.length)*100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Under Maintenance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Under Maintenance
                          </span>
                          <span className="font-mono font-bold text-slate-800">{maintenanceAssets} / {assets.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${assets.length > 0 ? (maintenanceAssets/assets.length)*100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Down */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-550 animate-pulse" /> Down / Broken
                          </span>
                          <span className="font-mono font-bold text-slate-800">{downAssets} / {assets.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${assets.length > 0 ? (downAssets/assets.length)*100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 leading-relaxed italic">
                    Health ratio: {assets.length > 0 ? Math.round((operationalAssets/assets.length)*100) : 0}% of machines are functioning normally.
                  </p>
                </div>

                {/* 2. Tasks Backlog Distribution */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Work Order Backlog</h3>
                    <div className="space-y-4">
                      {/* Completed */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                          </span>
                          <span className="font-mono font-bold text-slate-800">{completedWOsCount} / {workOrders.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${workOrders.length > 0 ? (completedWOsCount/workOrders.length)*100 : 0}%` }} />
                        </div>
                      </div>

                      {/* In Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
                          </span>
                          <span className="font-mono font-bold text-slate-800">{inProgressWOs} / {workOrders.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${workOrders.length > 0 ? (inProgressWOs/workOrders.length)*100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Open / Pending */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400" /> Open & Pending
                          </span>
                          <span className="font-mono font-bold text-slate-800">{(openWOs + pendingWOs)} / {workOrders.length}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-slate-400 h-full rounded-full" style={{ width: `${workOrders.length > 0 ? ((openWOs+pendingWOs)/workOrders.length)*100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 leading-relaxed italic">
                    Backlog ratio: {workOrders.length > 0 ? Math.round(((openWOs+pendingWOs+inProgressWOs)/workOrders.length)*100) : 0}% active tasks unresolved.
                  </p>
                </div>

                {/* 3. PM Schedules Tracking */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">PM Schedule Compliance</h3>
                    <div className="space-y-4">
                      {/* Total routine schedules */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600">Active Routines Registered</span>
                          <span className="font-mono text-indigo-600 font-bold">{totalPMCount} schedules</span>
                        </div>
                        <div className="w-full bg-indigo-50 h-1.5 rounded-full" />
                      </div>

                      {/* Due soon (14 days) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Due Within 14 Days
                          </span>
                          <span className="font-mono font-bold text-slate-800">{upcomingPMCount} schedules</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalPMCount > 0 ? (upcomingPMCount/totalPMCount)*100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Overdue */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-550 animate-pulse" /> Overdue Routines
                          </span>
                          <span className="font-mono text-rose-600 font-bold">{overduePMCount} schedules</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalPMCount > 0 ? (overduePMCount/totalPMCount)*100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100 leading-relaxed italic">
                    Overdue ratio: {totalPMCount > 0 ? Math.round((overduePMCount/totalPMCount)*100) : 0}% schedules require prompt inspection.
                  </p>
                </div>
              </div>

              {/* Main Table Row */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-slate-700">Critical Work Orders</h2>
                    <p className="text-xs text-slate-400">Live feed from factory floor</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Search assets or issues..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
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
                      workOrders={workOrders
                        .filter(wo => 
                          wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wo.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .sort((a, b) => {
                          if (a.status === 'completed' && b.status !== 'completed') return 1;
                          if (a.status !== 'completed' && b.status === 'completed') return -1;
                          
                          const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
                          const aWeight = priorityWeight[a.priority] || 0;
                          const bWeight = priorityWeight[b.priority] || 0;
                          return bWeight - aWeight;
                        })
                      } 
                      onEdit={(wo) => openModal('work_order', wo)}
                      onDelete={isSupervisor ? (id) => handleDelete(id, 'work_order') : undefined}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'work_orders' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Work Order Management</h2>
                  <p className="text-sm text-slate-500 italic">Centralized maintenance log and task tracking</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                  {/* Dropdown Mesin/Asset Filter */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mesin:</span>
                    <select
                      value={selectedAssetFilter}
                      onChange={e => setSelectedAssetFilter(e.target.value)}
                      className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-slate-705 font-bold outline-none"
                    >
                      <option value="">Semua Mesin</option>
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker Range Filter */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">From:</span>
                    <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">To:</span>
                    <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                    />
                    {(dateRange.start || dateRange.end || selectedAssetFilter) && (
                      <button 
                        onClick={() => {
                          setDateRange({ start: '', end: '' });
                          setSelectedAssetFilter('');
                        }}
                        className="ml-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Clear Filters"
                      >
                        <AlertCircle size={14} />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={handleExportFilteredPDF}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-200"
                  >
                    <FileText size={16} /> EXPORT PDF
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <WorkOrderTable 
                  workOrders={getFilteredWorkOrders()} 
                  onEdit={(wo) => openModal('work_order', wo)}
                  onDelete={isSupervisor ? (id) => handleDelete(id, 'work_order') : undefined}
                />
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Asset Registry</h2>
                  <p className="text-sm text-slate-500 italic">Monitoring status of production machines</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <CSVImportExport
                    data={assets}
                    fileName="honicel_assets"
                    fields={['name', 'category', 'location', 'status']}
                    humanHeaders={['Nama', 'Kategori', 'Lokasi', 'Status']}
                    type="asset"
                    onImport={handleImportAssets}
                  />
                  {isSupervisor && (
                    <button 
                      onClick={() => openModal('asset')}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={16} /> NEW ASSET
                    </button>
                  )}
                </div>
              </div>
              <AssetList 
                assets={assets} 
                onEdit={isSupervisor ? (a) => openModal('asset', a) : undefined}
                onDelete={isSupervisor ? (id) => handleDelete(id, 'asset') : undefined}
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
                onEdit={isSupervisor ? (pm) => openModal('pm_schedule', pm) : undefined}
                onDelete={isSupervisor ? (id) => handleDelete(id, 'pm_schedule') : undefined}
              />
            </div>
          )}

          {activeTab === 'spare_parts' && (
            <SparepartsManager assets={assets} />
          )}

          {activeTab === 'cash_flow' && (
            <CashFlowManager />
          )}

          {activeTab === 'labor' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Maintenance Team</h2>
                  <p className="text-sm text-slate-500 italic">Management of technician profiles and specializations</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <CSVImportExport
                    data={labor}
                    fileName="honicel_labor_profiles"
                    fields={['full_name', 'specialization', 'role']}
                    humanHeaders={['Nama Lengkap', 'Spesialisasi', 'Peran Sistem']}
                    type="labor"
                    onImport={handleImportLabor}
                  />
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => openModal('labor')}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={16} /> NEW TECHNICIAN
                    </button>
                  )}
                </div>
              </div>
              <LaborList 
                profiles={labor} 
                onEdit={userProfile?.role === 'admin' ? (l) => openModal('labor', l) : undefined}
                onDelete={userProfile?.role === 'admin' ? (id) => handleDelete(id, 'labor') : undefined}
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
