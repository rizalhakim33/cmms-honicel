import React from 'react';
import { Asset } from '../types';
import { Factory, MapPin, Cpu, CheckCircle2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useSort } from '../hooks/useSort';

interface Props {
  assets: Asset[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export const AssetList: React.FC<Props> = ({ assets, onEdit, onDelete, viewMode = 'grid' }) => {
  const { sortedItems, sortField, sortDirection, handleSort } = useSort(assets, 'name', 'asc');

  const SortIcon = ({ field }: { field: keyof Asset }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5">Asset <SortIcon field="name" /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                 <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('location')}>
                 <div className="flex items-center gap-1.5">Location <SortIcon field="location" /></div>
              </th>
              <th className="px-6 py-4">Specs</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  No assets registered in database.
                </td>
              </tr>
            ) : (
              sortedItems.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                        <Factory size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{asset.name}</h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{asset.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      asset.status === 'operational' ? 'bg-emerald-50 text-emerald-600' : 
                      asset.status === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{asset.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-mono truncate block max-w-[200px]">
                      {JSON.stringify(asset.technical_specs).slice(0, 30)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit?.(asset)} className="text-blue-600 text-[10px] font-bold uppercase hover:underline">Edit</button>
                      <button onClick={() => onDelete?.(asset.id)} className="text-rose-600 text-[10px] font-bold uppercase hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedItems.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No assets registered in database.
        </div>
      ) : (
        sortedItems.map((asset) => (
          <div key={asset.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-500 transition-all flex flex-col">
            <div className="p-5 border-b border-slate-50 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Factory size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{asset.name}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{asset.category}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                asset.status === 'operational' ? 'bg-emerald-50 text-emerald-600' : 
                asset.status === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {asset.status}
              </div>
            </div>
            
            <div className="p-5 space-y-3 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                <span>{asset.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Cpu size={14} className="text-slate-400" />
                <span className="truncate">Specs: {JSON.stringify(asset.technical_specs).slice(0, 30)}...</span>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 flex justify-between items-center text-[10px]">
              <div className="flex gap-4">
                <button onClick={() => onEdit?.(asset)} className="text-blue-600 font-bold hover:underline cursor-pointer uppercase">Edit</button>
                <button onClick={() => onDelete?.(asset.id)} className="text-rose-600 font-bold hover:underline cursor-pointer uppercase">Delete</button>
              </div>
              <span className="text-slate-400">ID: {asset.id.slice(0, 8)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
