import React from 'react';
import { WorkOrder, WOPriority, WOStatus } from '../types';
import { Circle, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';

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
  viewMode?: 'grid' | 'list';
}

export const WorkOrderTable: React.FC<Props> = ({ workOrders, onEdit, onDelete, viewMode = 'list' }) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
        {workOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No active work orders found.
          </div>
        ) : (
          workOrders.map((wo) => (
            <div key={wo.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-500 transition-all flex flex-col group relative">
              <div className="flex justify-between items-start mb-4">
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
                    <button onClick={() => onEdit?.(wo)} className="text-blue-600 text-[10px] font-bold uppercase hover:underline">Edit</button>
                    {onDelete && <button onClick={() => onDelete(wo.id)} className="text-rose-600 text-[10px] font-bold uppercase hover:underline">Delete</button>}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Work Order</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Asset</th>
            <th className="px-6 py-4">Assignee</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {workOrders.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                No active work orders found.
              </td>
            </tr>
          ) : (
            workOrders.map((wo) => (
              <tr 
                key={wo.id} 
                className="group hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider
                    ${wo.status === 'open' ? 'text-blue-600' : ''}
                    ${wo.status === 'in_progress' ? 'text-amber-600' : ''}
                    ${wo.status === 'completed' ? 'text-emerald-600' : ''}
                  `}>
                    {statusIcons[wo.status]}
                    {wo.status.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {wo.title}
                      </span>
                      {wo.pm_id && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          PM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">#{wo.id.slice(0, 8)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[wo.priority]}`}>
                    {wo.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-700 font-bold">{wo.asset?.name || 'Unassigned'}</span>
                    <span className="text-[10px] text-slate-400">{wo.asset?.location}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                      <User className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="text-xs text-slate-600 font-medium">{wo.assignee?.full_name || 'TBA'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                  {new Date(wo.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit?.(wo)} className="p-1 px-2 text-[10px] font-bold uppercase text-slate-600 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap">Edit</button>
                    <button onClick={() => onDelete?.(wo.id)} className="p-1 px-2 text-[10px] font-bold uppercase text-slate-600 hover:text-rose-600 transition-colors cursor-pointer whitespace-nowrap">Delete</button>
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
