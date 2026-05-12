import React from 'react';
import { Asset } from '../types';
import { Factory, MapPin, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  assets: Asset[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (id: string) => void;
}

export const AssetList: React.FC<Props> = ({ assets, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No assets registered in database.
        </div>
      ) : (
        assets.map((asset) => (
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
