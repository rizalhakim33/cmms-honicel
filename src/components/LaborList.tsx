import React, { useState, useEffect } from 'react';
import { LaborProfile } from '../types';
import { User, Shield, Briefcase, Mail, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, CheckSquare, Square } from 'lucide-react';
import { useSort } from '../hooks/useSort';
import { Pagination } from './Pagination';

interface Props {
  profiles: LaborProfile[];
  onEdit?: (labor: LaborProfile) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  viewMode?: 'grid' | 'list';
  itemsPerPage?: number;
}

export const LaborList: React.FC<Props> = ({ profiles, onEdit, onDelete, onBulkDelete, viewMode = 'list', itemsPerPage = 20 }) => {
  const { sortedItems, sortField, sortDirection, handleSort } = useSort(profiles, 'full_name', 'asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedItems.length, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map(item => item.id)));
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

  const SortIcon = ({ field }: { field: keyof LaborProfile }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
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

  const selectAllCheckbox = paginatedItems.length > 0 && onBulkDelete ? (
    <div className="flex items-center gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <input 
        type="checkbox"
        checked={selectedIds.size === paginatedItems.length}
        onChange={toggleSelectAll}
        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        id="selectAllLabor"
      />
      <label htmlFor="selectAllLabor" className="text-xs font-bold text-slate-600 uppercase cursor-pointer">
        Select All
      </label>
    </div>
  ) : null;


  if (viewMode === 'grid') {
    return (
      <div className="flex flex-col">
        {bulkActionHeader || selectAllCheckbox}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {paginatedItems.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No active labor profiles found.
            </div>
          ) : (
            paginatedItems.map((person) => (
              <div key={person.id} className={`bg-white rounded-xl border ${selectedIds.has(person.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} p-5 shadow-sm hover:border-blue-500 transition-all flex flex-col group relative`}>
                <div className="absolute top-4 right-4 z-10 hidden group-hover:block data-[selected=true]:block" data-selected={selectedIds.has(person.id)}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(person.id)}
                    onChange={() => toggleSelect(person.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                    {person.full_name.charAt(0)}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{person.full_name}</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight mb-4">{person.id.slice(0, 8)}</p>
                
                <div className="space-y-3 flex-1 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Briefcase size={14} className="text-slate-400" />
                    <span className="capitalize">{person.specialization}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Shield size={14} className="text-slate-400" />
                    <span className="capitalize">{person.role}</span>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => onEdit?.(person)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                  {onDelete && <button onClick={() => onDelete(person.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={sortedItems.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
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
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="w-12 px-6 py-4">
                <input 
                  type="checkbox"
                  checked={paginatedItems.length > 0 && selectedIds.size === paginatedItems.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('full_name')}>
                <div className="flex items-center gap-1.5">Technician <SortIcon field="full_name" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('specialization')}>
                <div className="flex items-center gap-1.5">Specialization <SortIcon field="specialization" /></div>
              </th>
              <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-1.5">System Role <SortIcon field="role" /></div>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  No active labor profiles found.
                </td>
              </tr>
            ) : (
              paginatedItems.map((person) => (
                <tr key={person.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(person.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-6 py-4 w-12">
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(person.id)}
                      onChange={() => toggleSelect(person.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4">
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
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium whitespace-nowrap">
                      <Briefcase size={14} className="text-slate-400" />
                      <span className="capitalize">{person.specialization}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium whitespace-nowrap">
                      <Shield size={14} className="text-slate-400" />
                      <span className="capitalize">{person.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onEdit?.(person)} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {onDelete && (
                        <button onClick={() => onDelete(person.id)} className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Delete">
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sortedItems.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
