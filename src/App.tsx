/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KPICard } from './components/KPICard';
import { WorkOrderTable } from './components/WorkOrderTable';
import { supabase, subscribeToTable } from './lib/supabase';
import { WorkOrder, Asset } from './types';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: woData } = await supabase
          .from('work_orders')
          .select('*, asset:assets(*), assignee:labor_profiles(*)')
          .order('created_at', { ascending: false });
        
        const { data: assetData } = await supabase.from('assets').select('*');

        if (woData) setWorkOrders(woData);
        if (assetData) setAssets(assetData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to Real-time Changes
    const woSub = subscribeToTable('work_orders', (payload) => {
      console.log('WO Change:', payload);
      // Re-fetch or update state optimistically
      fetchData(); 
    });

    const assetSub = subscribeToTable('assets', () => fetchData());

    return () => {
      woSub.unsubscribe();
      assetSub.unsubscribe();
    };
  }, []);

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
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
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
                    <WorkOrderTable workOrders={workOrders} />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && (
            <div className="max-w-7xl mx-auto h-full flex items-center justify-center flex-col gap-4 text-slate-300">
               <RefreshCw className="w-12 h-12 opacity-10 animate-spin-slow" />
               <p className="text-sm italic">Module for "{activeTab.replace('_', ' ')}" is currently in staging.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
