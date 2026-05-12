import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isUp: boolean;
  };
  colorClass?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, unit, icon: Icon, trend, colorClass = "text-orange-500" }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-2 group hover:border-slate-300 transition-all"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{label}</span>
        <Icon className={`w-4 h-4 ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`} />
      </div>
      
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800 tracking-tight">{value}</span>
          {unit && <span className="text-sm font-normal text-slate-500">{unit}</span>}
        </div>
        
        {trend && (
          <span className={`text-xs font-bold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend.isUp ? '↓' : '↑'} {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
};
