import React, { useState } from 'react';
import { Asset } from '../types';
import { Factory, MapPin, Cpu, CheckCircle2, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { useSort } from '../hooks/useSort';

interface Props {
  assets: Asset[];
  onEdit?: (asset: Asset) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode?: 'grid' | 'list';
}

export const AssetList: React.FC<Props> = ({ assets, onEdit, onDelete, onBulkDelete, viewMode = 'grid' }) => {
  const topLevelAssets = assets.filter(a => !a.parent_id);
  const { sortedItems, sortField, sortDirection, handleSort } = useSort(topLevelAssets, 'name', 'asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectAll = () => {
    if (selectedIds.size === assets.length && assets.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(assets.map(item => item.id)));
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

  const SortIcon = ({ field }: { field: keyof Asset }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  const getChildren = (parentId: string) => {
    return assets.filter(a => a.parent_id === parentId);
  };

  const renderGridItem = (asset: Asset, isChild = false) => (
    <div key={asset.id} className={`bg-white rounded-xl border ${isChild ? 'border-dashed border-slate-300 ml-8' : 'border-slate-200'} shadow-sm overflow-hidden group hover:border-blue-500 transition-all flex flex-col relative ${selectedIds.has(asset.id) ? 'ring-1 ring-blue-500' : ''}`}>
      <div className="absolute top-4 right-4 z-10 hidden group-hover:block data-[selected=true]:block" data-selected={selectedIds.has(asset.id)}>
        <input 
          type="checkbox" 
          checked={selectedIds.has(asset.id)}
          onChange={() => toggleSelect(asset.id)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
      <div className="p-5 border-b border-slate-50 flex justify-between items-start pr-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            <Factory size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              {asset.name} 
              {isChild && <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-slate-500 font-bold">Sub Asset</span>}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest font-bold">
              {asset.asset_code ? `${asset.asset_code} • ` : ''}{(asset.category || 'other').toUpperCase()}
            </p>
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
        <span className="text-slate-400 font-mono">ID: {asset.id.slice(0, 8)}</span>
        <div className="flex gap-2">
          <button onClick={() => onEdit?.(asset)} className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          {onDelete && (
            <button onClick={() => onDelete(asset.id)} className="p-1.5 hover:bg-white rounded text-slate-500 hover:text-rose-600 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderListItem = (asset: Asset, isChild = false) => (
    <tr key={asset.id} className={`hover:bg-slate-50 transition-colors group ${isChild ? 'bg-slate-50/50' : ''} ${selectedIds.has(asset.id) ? 'bg-blue-50/50' : ''}`}>
      <td className="px-6 py-4 w-12 relative">
        <div className={isChild ? 'pl-8' : ''}>
          <input 
            type="checkbox"
            checked={selectedIds.has(asset.id)}
            onChange={() => toggleSelect(asset.id)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={`flex items-center gap-3 ${isChild ? 'pl-8 relative' : ''}`}>
          {isChild && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 border-b-2 border-l-2 border-slate-300 h-8 -mt-4 rounded-bl-lg" />}
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
            <Factory size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-2">
              {asset.name}
              {asset.asset_code && <span className="font-mono text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{asset.asset_code}</span>}
              {isChild && <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-slate-500 font-bold">Sub</span>}
            </h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{asset.category}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          asset.status === 'operational' ? 'bg-emerald-50 text-emerald-600' : 
          asset.status === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {asset.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MapPin size={14} className="text-slate-400" />
          <span>{asset.location}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-slate-500 font-mono truncate block max-w-[200px]">
          {JSON.stringify(asset.technical_specs).slice(0, 30)}...
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-1">
          <button onClick={() => onEdit?.(asset)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          {onDelete && (
            <button onClick={() => onDelete(asset.id)} className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const bulkActionHeader = selectedIds.size > 0 && onBulkDelete ? (
    <div className="mb-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-between z-20 relative">
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
  ) : null;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto relative">
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
        <table className="w-full text-left min-w-[800px]">
          <thead className="sticky top-0 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 z-10">
            <tr>
              <th className="w-12 px-6 py-4">
                <input 
                  type="checkbox"
                  checked={assets.length > 0 && selectedIds.size === assets.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1.5">Asset <SortIcon field="name" /></div>
              </th>
              <th className="w-24 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                 <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
              </th>
              <th className="w-32 px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('location')}>
                 <div className="flex items-center gap-1.5">Location <SortIcon field="location" /></div>
              </th>
              <th className="w-48 px-4 py-3">Specs</th>
              <th className="w-20 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  No assets registered in database.
                </td>
              </tr>
            ) : (
              sortedItems.map((asset) => (
                <React.Fragment key={asset.id}>
                  {renderListItem(asset)}
                  {getChildren(asset.id).map(child => renderListItem(child, true))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {bulkActionHeader}
      {sortedItems.length === 0 ? (
        <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          No assets registered in database.
        </div>
      ) : (
        sortedItems.map((asset) => (
          <div key={asset.id} className="flex flex-col gap-4">
            {renderGridItem(asset)}
            {getChildren(asset.id).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {getChildren(asset.id).map(child => renderGridItem(child, true))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
