import React from 'react';
import { LaborProfile } from '../types';
import { User, Shield, Briefcase, Mail } from 'lucide-react';

interface Props {
  profiles: LaborProfile[];
  onEdit?: (labor: LaborProfile) => void;
  onDelete?: (id: string) => void;
}

export const LaborList: React.FC<Props> = ({ profiles, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th className="px-6 py-4">Technician</th>
            <th className="px-6 py-4">Specialization</th>
            <th className="px-6 py-4">System Role</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {profiles.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                No active labor profiles found.
              </td>
            </tr>
          ) : (
            profiles.map((person) => (
              <tr key={person.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      {person.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{person.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tight">{person.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="capitalize">{person.specialization}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Shield size={14} className="text-slate-400" />
                    <span className="capitalize">{person.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
