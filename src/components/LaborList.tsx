import React from 'react';
import { LaborProfile } from '../types';
import { User, Shield, Briefcase, Mail, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSort } from '../hooks/useSort';

interface Props {
  profiles: LaborProfile[];
  onEdit?: (labor: LaborProfile) => void;
  onDelete?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export const LaborList: React.FC<Props> = ({ profiles, onEdit, onDelete, viewMode = 'list' }) => {
  const { sortedItems, sortField, sortDirection, handleSort } = useSort(profiles, 'full_name', 'asc');

  const SortIcon = ({ field }: { field: keyof LaborProfile }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No active labor profiles found.
          </div>
        ) : (
          sortedItems.map((person) => (
            <div key={person.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-blue-500 transition-all flex flex-col group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                  {person.full_name.charAt(0)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEdit?.(person)} className="p-1 px-2 text-[10px] font-bold uppercase text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer">Edit</button>
                  <button onClick={() => onDelete?.(person.id)} className="p-1 px-2 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer">Delete</button>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{person.full_name}</h3>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight mb-4">{person.id.slice(0, 8)}</p>
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Briefcase size={14} className="text-slate-400" />
                  <span className="capitalize">{person.specialization}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Shield size={14} className="text-slate-400" />
                  <span className="capitalize">{person.role}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('full_name')}>
              <div className="flex items-center gap-1.5">Technician <SortIcon field="full_name" /></div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('specialization')}>
              <div className="flex items-center gap-1.5">Specialization <SortIcon field="specialization" /></div>
            </th>
            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
              <div className="flex items-center gap-1.5">System Role <SortIcon field="role" /></div>
            </th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {sortedItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                No active labor profiles found.
              </td>
            </tr>
          ) : (
            sortedItems.map((person) => (
              <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                      {person.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{person.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight">{person.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium whitespace-nowrap">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="capitalize">{person.specialization}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium whitespace-nowrap">
                    <Shield size={14} className="text-slate-400" />
                    <span className="capitalize">{person.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit?.(person)} className="p-1 px-2 text-[10px] font-bold uppercase text-slate-600 hover:text-blue-600 transition-colors cursor-pointer">Edit</button>
                    <button onClick={() => onDelete?.(person.id)} className="p-1 px-2 text-[10px] font-bold uppercase text-slate-600 hover:text-rose-600 transition-colors cursor-pointer">Delete</button>
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
