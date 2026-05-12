import React from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Wrench, 
  Factory, 
  CalendarClock, 
  Users, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'work_orders', label: 'Work Orders', icon: Wrench },
  { id: 'assets', label: 'Assets', icon: Factory },
  { id: 'pm_schedule', label: 'PM Schedule', icon: CalendarClock },
  { id: 'labor', label: 'Labor Profiles', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeId, onNavigate, isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 z-50 transition-transform duration-300 transform
        lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
              H
            </div>
            <div>
              <h1 className="text-white font-bold text-sm tracking-tight">e-CMMS <span className="text-blue-400">v2.0</span></h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50">Industrial Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
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
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
