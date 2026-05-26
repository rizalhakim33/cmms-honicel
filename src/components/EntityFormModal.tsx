import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Asset, WorkOrder, LaborProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

type EntityType = 'asset' | 'work_order' | 'labor' | 'pm_schedule';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: EntityType;
  entity?: any; // The entity being edited
  onSave: (data: any) => Promise<void>;
  assets?: Asset[]; // For WO dropdown
  labor?: LaborProfile[]; // For WO dropdown
}

export const EntityFormModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  type, 
  entity, 
  onSave,
  assets = [],
  labor = []
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Autocomplete suggestions states
  const [dbSpareparts, setDbSpareparts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data } = await supabase.from('spareparts').select('*').order('name');
        if (data && data.length > 0) {
          setDbSpareparts(data);
        } else {
          setDbSpareparts([]); // Empty it
        }
      } catch (err) {
        console.error("Failed to load spareparts catalog:", err);
      }
    };
    if (isOpen) {
      fetchCatalog();
    }
  }, [isOpen]);

  useEffect(() => {
    if (entity) {
      setFormData(entity);
    } else {
      setFormData({});
    }
    setError(null);
  }, [entity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 capitalize">
                {entity ? 'Edit' : 'New'} {type.replace('_', ' ')}
              </h2>
              <p className="text-xs text-slate-400">Please fill in the required fields below.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600 text-xs font-medium">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {type === 'asset' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Asset Name</label>
                  <input 
                    required
                    value={formData.name || ''}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. CNC Machine A1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Category</label>
                    <select 
                      required
                      value={formData.category || 'other'}
                      onChange={e => handleChange('category', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="cutter">Cutter</option>
                      <option value="glue_spreader">Glue Spreader</option>
                      <option value="conveyor">Conveyor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Location</label>
                    <input 
                      required
                      value={formData.location || ''}
                      onChange={e => handleChange('location', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="e.g. Floor 1, Sector B"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
                  <select 
                    value={formData.status || 'operational'}
                    onChange={e => handleChange('status', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="operational">Operational</option>
                    <option value="down">Down</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </>
            )}

            {type === 'work_order' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Title</label>
                  <input 
                    required
                    value={formData.title || ''}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. Replace Bearing"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Description</label>
                  <textarea 
                    value={formData.description || ''}
                    onChange={e => handleChange('description', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24"
                    placeholder="Details about the task..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Asset</label>
                    <select 
                      required
                      value={formData.asset_id || ''}
                      onChange={e => handleChange('asset_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select Asset</option>
                      {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Assignee</label>
                    <select 
                      value={formData.assignee_id || ''}
                      onChange={e => handleChange('assignee_id', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="">Unassigned</option>
                      {labor.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Priority</label>
                    <select 
                      value={formData.priority || 'medium'}
                      onChange={e => handleChange('priority', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Status</label>
                    <select 
                      value={formData.status || 'open'}
                      onChange={e => handleChange('status', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Replaced spare part input tracking */}
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Suku Cadang / Spare Part Diganti (Opsional)
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 relative">
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Nama Spare Part</label>
                      <input 
                        type="text"
                        value={formData.replaced_sparepart_name || ''}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                        onChange={e => handleChange('replaced_sparepart_name', e.target.value)}
                        placeholder="e.g. Belt Conveyor, NSK Bearing"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550"
                      />
                      {showSuggestions && (formData.replaced_sparepart_name || '').trim() !== '' && (
                        (() => {
                          const queryText = (formData.replaced_sparepart_name || '').toLowerCase();
                          const matches = dbSpareparts.filter(sp =>
                            sp.name.toLowerCase().includes(queryText) &&
                            sp.name.toLowerCase() !== queryText
                          ).slice(0, 5);

                          if (matches.length > 0) {
                            return (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-50">
                                {matches.map(sp => (
                                  <button
                                    key={sp.id}
                                    type="button"
                                    onClick={() => {
                                      handleChange('replaced_sparepart_name', sp.name);
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center cursor-pointer font-medium"
                                  >
                                    <span className="font-bold text-slate-800">{sp.name}</span>
                                    <span className="font-mono text-[9px] text-slate-400">
                                      Stok: {sp.stock} | Rp {sp.price.toLocaleString('id-ID')}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Jumlah</label>
                      <input 
                        type="number"
                        min="1"
                        value={formData.replaced_sparepart_qty || 1}
                        onChange={e => handleChange('replaced_sparepart_qty', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-550 text-center"
                      />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Stok suku cadang gudang otomatis berkurang dan dicatat pada pengeluaran finansial jika status WO 'Completed'.
                  </p>
                </div>
              </>
            )}

            {type === 'labor' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    required
                    value={formData.full_name || ''}
                    onChange={e => handleChange('full_name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="Technician Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Specialization</label>
                  <input 
                    required
                    value={formData.specialization || ''}
                    onChange={e => handleChange('specialization', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. Electrical, Mechanical"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">System Role</label>
                  <select 
                    value={formData.role || 'technician'}
                    onChange={e => handleChange('role', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="technician">Technician</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}

            {type === 'pm_schedule' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Schedule Title</label>
                  <input 
                    required
                    value={formData.title || ''}
                    onChange={e => handleChange('title', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="e.g. Monthly Inspection"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Asset</label>
                  <select 
                    required
                    value={formData.asset_id || ''}
                    onChange={e => handleChange('asset_id', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="">Select Asset</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Frequency (Days)</label>
                    <input 
                      type="number"
                      required
                      value={formData.frequency_days || 30}
                      onChange={e => handleChange('frequency_days', parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Next Due Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.next_due_at?.split('T')[0] || ''}
                      onChange={e => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          if (!isNaN(date.getTime())) {
                            handleChange('next_due_at', date.toISOString());
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </form>

          <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Record'}
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
