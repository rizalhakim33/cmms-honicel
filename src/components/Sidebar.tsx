import React from 'react';
import { 
  LayoutDashboard, 
  Wrench, 
  Factory, 
  CalendarClock, 
  Users, 
  Settings, 
  LogOut 
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'work_orders', label: 'Work Orders', icon: Wrench },
  { id: 'assets', label: 'Assets', icon: Factory },
  { id: 'pm_schedule', label: 'PM Schedule', icon: CalendarClock },
  { id: 'labor', label: 'Labor Profiles', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<{ activeId: string; onNavigate: (id: string) => void }> = ({ activeId, onNavigate }) => {
  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col shrink-0 transition-all">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
          H
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-tight">e-CMMS <span className="text-blue-400">v2.0</span></h1>
          <p className="text-[10px] uppercase tracking-widest opacity-50">Industrial Portal</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg cursor-pointer group
              ${activeId === item.id ? 'text-white bg-slate-800' : 'hover:bg-slate-800 hover:text-white'}
            `}
          >
            <item.icon className={`w-5 h-5 ${activeId === item.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
