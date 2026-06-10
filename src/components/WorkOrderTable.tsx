import React, { useState } from 'react';
import { WorkOrder, WOPriority, WOStatus } from '../types';
import { Circle, Clock, CheckCircle2, AlertTriangle, User, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { useSort } from '../hooks/useSort';

const priorityColors: Record<WOPriority, string> = {
  low: 'border-blue-100 text-blue-700 bg-blue-100',
  medium: 'border-amber-100 text-amber-700 bg-amber-100',
  high: 'border-rose-100 text-rose-700 bg-rose-100',
  urgent: 'border-rose-600 text-white bg-rose-600 animate-pulse',
};

const statusIcons: Record<WOStatus, React.ReactNode> = {
  open: <Circle className="w-3 h-3" />,
  in_progress: <Clock className="w-3 h-3 animate-spin-slow" />,
  pending: <AlertTriangle className="w-3 h-3" />,
  completed: <CheckCircle2 className="w-3 h-3" />,
};

interface Props {
  workOrders: WorkOrder[];
  onEdit?: (wo: WorkOrder) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode?: 'grid' | 'list';
}

export const WorkOrderTable: React.FC<Props> = ({ workOrders, onEdit, onDelete, onBulkDelete, viewMode = 'list' }) => {
  const { sortedItems, sortField, sortDirection, handleSort } = useSort(workOrders, 'created_at', 'desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedItems.length && sortedItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(item => item.id)));
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

  const SortIcon = ({ field }: { field: keyof WorkOrder }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  if (viewMode === 'grid') {
    return (
      <div className="p-6 bg-slate-50">
        {selectedIds.size > 0 && onBulkDelete && (
          <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">{selectedIds.size} items selected</span>
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
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No active work orders found.
            </div>
          ) : (
            sortedItems.map((wo) => (
              <div key={wo.id} className={`bg-white border ${selectedIds.has(wo.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} rounded-xl p-5 shadow-sm hover:border-blue-500 transition-all flex flex-col group relative`}>
                <div className="absolute top-4 right-4 z-10 hidden group-hover:block data-[selected=true]:block" data-selected={selectedIds.has(wo.id)}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(wo.id)}
                    onChange={() => toggleSelect(wo.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between items-start mb-4 pr-6">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${wo.status === 'open' ? 'text-blue-700 bg-blue-50' : ''}
                    ${wo.status === 'in_progress' ? 'text-amber-700 bg-amber-50' : ''}
                    ${wo.status === 'completed' ? 'text-emerald-700 bg-emerald-50' : ''}
                  `}>
                    {statusIcons[wo.status]}
                    {wo.status.replace('_', ' ')}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[wo.priority]}`}>
                    {wo.priority}
                  </span>
                </div>
                <div className="mb-4 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{wo.title}</h3>
                    {wo.pm_id && (
                      <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                        PM
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400">#{wo.id.slice(0, 8)}</p>
                  
                  <div className="mt-4 space-y-2">
                    {wo.repair_type && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-bold w-16">Type:</span> 
                        <span className="truncate bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">{wo.repair_type}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold w-16">Asset:</span> 
                      <span className="truncate">{wo.asset?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-bold w-16">Assignee:</span>
                      <span className="truncate">{wo.assignee?.full_name || 'TBA'}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                   <span className="text-[10px] text-slate-400 font-mono">{new Date(wo.created_at).toLocaleDateString()}</span>
                   <div className="flex gap-2">
                      <button onClick={() => onEdit?.(wo)} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {onDelete && (
                        <button onClick={() => onDelete(wo.id)} className="p-1 hover:bg-rose-50 rounded text-slate-500 hover:text-rose-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto relative">
      {selectedIds.size > 0 && onBulkDelete && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-blue-50/95 backdrop-blur border-b border-blue-100 flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-800">{selectedIds.size} items selected</span>
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
            className="flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" /> DELETE SELECTED
          </button>
        </div>
      )}
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 z-10">
          <tr>
            <th className="w-12 px-4 py-3">
              <input 
                type="checkbox"
                checked={sortedItems.length > 0 && selectedIds.size === sortedItems.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </th>
            <th className="w-24 px-2 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
              <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
            </th>
            <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('title')}>
              <div className="flex items-center gap-1.5">Work Order <SortIcon field="title" /></div>
            </th>
            <th className="w-20 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('priority')}>
              <div className="flex items-center gap-1.5">Priority <SortIcon field="priority" /></div>
            </th>
            <th className="w-24 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('repair_type')}>
              <div className="flex items-center gap-1.5">Type <SortIcon field={'repair_type' as any} /></div>
            </th>
            <th className="w-32 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('asset_id')}>
              <div className="flex items-center gap-1.5">Asset <SortIcon field="asset_id" /></div>
            </th>
            <th className="w-32 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('assignee_id')}>
              <div className="flex items-center gap-1.5">Assignee <SortIcon field="assignee_id" /></div>
            </th>
            <th className="w-24 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('created_at')}>
              <div className="flex items-center gap-1.5">Created <SortIcon field="created_at" /></div>
            </th>
            <th className="w-16 px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sortedItems.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-sm italic">
                No active work orders found.
              </td>
            </tr>
          ) : (
            sortedItems.map((wo) => (
              <tr 
                key={wo.id} 
                className={`group hover:bg-slate-50 transition-colors ${selectedIds.has(wo.id) ? 'bg-blue-50/50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input 
                    type="checkbox"
                    checked={selectedIds.has(wo.id)}
                    onChange={() => toggleSelect(wo.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-2 py-3">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider
                    ${wo.status === 'open' ? 'text-blue-600' : ''}
                    ${wo.status === 'in_progress' ? 'text-amber-600' : ''}
                    ${wo.status === 'completed' ? 'text-emerald-600' : ''}
                  `}>
                    {statusIcons[wo.status]}
                    {wo.status.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {wo.title}
                      </span>
                      {wo.pm_id && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                          PM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">#{wo.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${priorityColors[wo.priority]}`}>
                    {wo.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {wo.repair_type ? (
                     <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold text-[10px] uppercase tracking-wider truncate block w-full">{wo.repair_type}</span>
                  ) : (
                     <span className="text-slate-300 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col max-w-[120px]">
                    <span className="text-xs text-slate-700 font-bold truncate">{wo.asset?.name || 'Unassigned'}</span>
                    <span className="text-[10px] text-slate-400 truncate">{wo.asset?.location}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 max-w-[120px]">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 shrink-0">
                      <User className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium truncate">{wo.assignee?.full_name || 'TBA'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[11px] font-mono text-slate-400">
                  {new Date(wo.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => onEdit?.(wo)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button onClick={() => onDelete(wo.id)} className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
