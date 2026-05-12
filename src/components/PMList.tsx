import React from 'react';
import { PMSchedule } from '../types';
import { Calendar, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  schedules: PMSchedule[];
  onEdit?: (pm: PMSchedule) => void;
  onDelete?: (id: string) => void;
}

export const PMList: React.FC<Props> = ({ schedules, onEdit, onDelete }) => {
  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No preventive maintenance schedules defined.
        </div>
      ) : (
        schedules.map((pm) => {
          const isOverdue = new Date(pm.next_due_at) < new Date();
          
          return (
            <div key={pm.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between group transition-all ${isOverdue ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 hover:border-blue-300'}`}>
              <div className="flex gap-4 items-center">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border ${isOverdue ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <Calendar size={20} />
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {pm.title}
                    {isOverdue && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      {pm.asset?.name || 'Asset ID: ' + pm.asset_id.slice(0, 5)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <RefreshCw size={10} /> Every {pm.frequency_days} Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Next Maintenance</p>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold ${isOverdue ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-900 text-white border-slate-800'}`}>
                    <Clock size={12} />
                    {new Date(pm.next_due_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit?.(pm)} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer uppercase">Edit</button>
                  <button onClick={() => onDelete?.(pm.id)} className="text-xs font-bold text-rose-600 hover:underline cursor-pointer uppercase">Delete</button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
