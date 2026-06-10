import React, { useState } from 'react';
import { PMSchedule } from '../types';
import { Calendar, Clock, RefreshCw, AlertTriangle, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';

interface Props {
  schedules: PMSchedule[];
  onEdit?: (pm: PMSchedule) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode?: 'grid' | 'list';
}

export const PMList: React.FC<Props> = ({ schedules, onEdit, onDelete, onBulkDelete, viewMode = 'list' }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === schedules.length && schedules.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(schedules.map(item => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const bulkActionHeader = selectedIds.size > 0 && onBulkDelete ? (
    <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">{selectedIds.size} items selected</span>
        <button 
          onClick={() => setSelectedIds(new Set())}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Clear
        </button>
      </div>
      <button 
        onClick={() => {
          onBulkDelete(Array.from(selectedIds));
          setSelectedIds(new Set());
        }}
        className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
      >
        <Trash2 className="w-4 h-4" /> DELETE SELECTED
      </button>
    </div>
  ) : null;

  const selectAllCheckbox = schedules.length > 0 && onBulkDelete ? (
    <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <input 
        type="checkbox"
        checked={selectedIds.size === schedules.length}
        onChange={toggleSelectAll}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        id="selectAllPMs"
      />
      <label htmlFor="selectAllPMs" className="text-xs font-bold text-slate-600 uppercase cursor-pointer">
        Select All
      </label>
    </div>
  ) : null;


  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col">
        {bulkActionHeader || selectAllCheckbox}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No preventive maintenance schedules defined.
            </div>
          ) : (
            schedules.map((pm) => {
              const isOverdue = new Date(pm.next_due_at) < new Date();
              return (
                <div key={pm.id} className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col group transition-all relative ${isOverdue ? 'border-rose-200' : 'border-slate-200 hover:border-blue-300'} ${selectedIds.has(pm.id) ? 'ring-1 ring-blue-500' : ''}`}>
                  <div className="absolute top-4 right-4 z-10 hidden group-hover:block data-[selected=true]:block" data-selected={selectedIds.has(pm.id)}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(pm.id)}
                      onChange={() => toggleSelect(pm.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex justify-between items-start mb-4 pr-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${isOverdue ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <Calendar size={18} />
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                      {isOverdue ? 'Overdue' : 'Scheduled'}
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors">
                    {pm.title}
                  </h3>
                  
                  <div className="space-y-2 mb-4 flex-1">
                     <div className="text-xs text-slate-600 flex items-center gap-2">
                       <span className="font-bold">Asset:</span> 
                       <span className="truncate">{pm.asset?.name || pm.asset_id.slice(0,8)}</span>
                     </div>
                     <div className="text-xs text-slate-600 flex items-center gap-2">
                       <span className="font-bold">Freq:</span> 
                       <span className="flex items-center gap-1"><RefreshCw size={12}/> Every {pm.frequency_days} Days</span>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 font-mono text-xs font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
                      <Clock size={12} />
                      {new Date(pm.next_due_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onEdit?.(pm)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {onDelete && (
                        <button onClick={() => onDelete(pm.id)} className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bulkActionHeader || selectAllCheckbox}
      {schedules.length === 0 ? (
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No preventive maintenance schedules defined.
        </div>
      ) : (
        schedules.map((pm) => {
          const isOverdue = new Date(pm.next_due_at) < new Date();
          
          return (
            <div key={pm.id} className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all relative ${isOverdue ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200 hover:border-blue-300'} ${selectedIds.has(pm.id) ? 'ring-1 ring-blue-500 bg-blue-50/50' : ''}`}>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <input 
                    type="checkbox"
                    checked={selectedIds.has(pm.id)}
                    onChange={() => toggleSelect(pm.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 checked:opacity-100 z-10"
                  />
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0 ${isOverdue ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <Calendar size={20} />
                  </div>
                </div>
                
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 truncate">
                    {pm.title}
                    {isOverdue && <AlertTriangle size={14} className="text-rose-500 animate-pulse" />}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded uppercase whitespace-nowrap">
                      {pm.asset?.name || 'Asset ID: ' + pm.asset_id.slice(0, 5)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <RefreshCw size={10} /> Every {pm.frequency_days} Days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Next Maintenance</p>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold whitespace-nowrap ${isOverdue ? 'bg-rose-600 text-white border-rose-700' : 'bg-slate-900 text-white border-slate-800'}`}>
                    <Clock size={12} />
                    {new Date(pm.next_due_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex sm:flex-col gap-2">
                  <button onClick={() => onEdit?.(pm)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {onDelete && (
                    <button onClick={() => onDelete(pm.id)} className="p-1.5 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
