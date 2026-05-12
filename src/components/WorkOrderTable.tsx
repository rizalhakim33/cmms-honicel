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
  closed: <CheckCircle2 className="w-3 h-3" />,
};

interface Props {
  workOrders: WorkOrder[];
}

export const WorkOrderTable: React.FC<Props> = ({ workOrders }) => {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {workOrders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
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
                    ${wo.status === 'closed' ? 'text-emerald-600' : ''}
                  `}>
                    {statusIcons[wo.status]}
                    {wo.status.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {wo.title}
                    </span>
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
