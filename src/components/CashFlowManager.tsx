import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CashFlow } from '../types';
import { CSVImportExport } from './CSVImportExport';
import { useSort } from '../hooks/useSort';
import { Pagination } from './Pagination';
import { 
  Plus, 
  TrendingDown, 
  Search, 
  Calendar, 
  FileText, 
  Tag, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  ArrowDownCircle,
  HelpCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2
} from 'lucide-react';

interface CashFlowManagerProps {
  viewMode?: 'grid' | 'list';
}

export const CashFlowManager: React.FC<CashFlowManagerProps> = ({ viewMode = 'list' }) => {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters and Forms
  const [typeFilter, setTypeFilter] = useState<'all' | 'sparepart' | 'operational'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'sparepart' | 'operational'>('operational');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchCashFlows = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('cash_flows')
        .select('*')
        .order('date', { ascending: false });

      if (fetchErr) throw fetchErr;
      if (data) setCashFlows(data);

    } catch (err: any) {
      console.error("Supabase Cashflow load error:", err);
      setError(err?.message || 'Database Supabase tidak terjangkau. Menggunakan penyimpanan browser lokal.');
      
      const localCash = localStorage.getItem('honicel_cashflows');
      if (localCash) setCashFlows(JSON.parse(localCash));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlows();
  }, []);

  const handleImportCashFlow = async (newCf: any[]) => {
    try {
      const withIds = newCf.map(item => ({
        id: crypto.randomUUID(),
        type: item.type,
        title: item.title,
        amount: item.amount,
        date: item.date,
        reference_id: null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase.from('cash_flows').insert(withIds);
      if (error) {
        throw new Error(error.message || "Gagal memasukkan data massal ke database.");
      }

      await fetchCashFlows();
    } catch (err: any) {
      console.error("Database Bulk Cash flow insertion failing:", err);
      throw err;
    }
  };

  const handleCreateCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!title.trim() || amount <= 0) {
      setError('Harap mengisi keterangan pengeluaran dan jumlah biaya yang valid (> 0)!');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        type: type,
        title: title.trim(),
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0]
      };

      const { error: insErr } = await supabase
        .from('cash_flows')
        .insert([payload]);

      if (insErr) throw insErr;

      setSuccess('Pengeluaran operasional berhasil dicatat.');
      setIsFormOpen(false);
      setTitle('');
      setAmount(0);
      fetchCashFlows();
    } catch (err: any) {
      console.error("Local cashflow storage fallback:", err);
      const fallbackList = [...cashFlows];
      const localItem: CashFlow = {
        id: crypto.randomUUID(),
        type: type,
        title: title.trim(),
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        reference_id: null,
        created_at: new Date().toISOString()
      };
      
      fallbackList.unshift(localItem);
      setCashFlows(fallbackList);
      localStorage.setItem('honicel_cashflows', JSON.stringify(fallbackList));
      setSuccess('Pengeluaran disimpan secara lokal di browser akibat kendala database.');
      setIsFormOpen(false);
      setTitle('');
      setAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, detail: string) => {
    if (!confirm(`Hapus catatan transaksi "${detail}"?`)) return;

    try {
      setLoading(true);
      const { error: delErr } = await supabase
        .from('cash_flows')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      setSuccess('Transaksi berhasil dihapus.');
      setSelectedRows(new Set());
      fetchCashFlows();
    } catch (err: any) {
      console.error("Delete failed, falling back locally:", err);
      const filtered = cashFlows.filter(x => x.id !== id);
      setCashFlows(filtered);
      localStorage.setItem('honicel_cashflows', JSON.stringify(filtered));
      setSuccess('Transaksi dihapus secara lokal.');
      setSelectedRows(new Set());
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Hapus ${selectedRows.size} pengeluaran terpilih?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('cash_flows')
        .delete()
        .in('id', Array.from(selectedRows));
        
      if (error) throw error;
      setSuccess(`${selectedRows.size} pengeluaran dihapus.`);
      setSelectedRows(new Set());
      fetchCashFlows();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      const filtered = cashFlows.filter(x => !selectedRows.has(x.id));
      setCashFlows(filtered);
      localStorage.setItem('honicel_cashflows', JSON.stringify(filtered));
      setSuccess('Item terpilih dihapus secara lokal.');
      setSelectedRows(new Set());
      setLoading(false);
    }
  };

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, currentItems: CashFlow[]) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedRows);
      currentItems.forEach(item => newSelected.add(item.id));
      setSelectedRows(newSelected);
    } else {
      const newSelected = new Set(selectedRows);
      currentItems.forEach(item => newSelected.delete(item.id));
      setSelectedRows(newSelected);
    }
  };

  const filteredCashFlows = cashFlows.filter(cf => {
    if (typeFilter !== 'all' && cf.type !== typeFilter) return false;
    return true;
  });

  // Calculate Monthly Totals for Charting & KPI
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const { sortedItems, sortField, sortDirection, handleSort } = useSort(filteredCashFlows, 'date', 'desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [sortedItems.length, sortField, sortDirection, typeFilter]);

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ field }: { field: keyof CashFlow }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  // KPI Calculations
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalAllTime = cashFlows.reduce((acc, c) => acc + Number(c.amount), 0);
  
  const currentMonthTotal = cashFlows
    .filter(cf => {
      const d = new Date(cf.date);
      return d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    })
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const sparepartTotal = cashFlows
    .filter(cf => cf.type === 'sparepart')
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const operationalTotal = cashFlows
    .filter(cf => cf.type === 'operational')
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const toolTotal = cashFlows
    .filter(cf => cf.type === 'tool')
    .reduce((acc, c) => acc + Number(c.amount), 0);

  // Group by Month names for SVG graph visualization
  const getMonthlyChartData = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    const groups: { [key: string]: number } = {};

    // Initialize recent 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      groups[key] = 0;
    }

    // Populate actual payments
    cashFlows.forEach(cf => {
      const d = new Date(cf.date);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (groups[key] !== undefined) {
        groups[key] += Number(cf.amount);
      }
    });

    return Object.entries(groups).map(([name, total]) => ({ name, total }));
  };

  const chartData = getMonthlyChartData();
  const maxVal = Math.max(...chartData.map(d => d.total), 100000);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Top Banner Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Arus Kas Perawatan (Maintenance Cash Flow)</h2>
          <p className="text-sm text-slate-500 italic">Financial tracking of machine replacement costs and contractor log</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CSVImportExport
            data={cashFlows}
            fileName="honicel_cash_flows"
            fields={['type', 'title', 'amount', 'date']}
            humanHeaders={['Tipe Transaksi', 'Keterangan Pengeluaran', 'Biaya Nominal', 'Tanggal Transaksi']}
            type="cash_flow"
            onImport={handleImportCashFlow}
          />
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-705 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus size={16} /> ADD INTERNAL/OPERATIONAL COST
          </button>
        </div>
      </div>

      {/* Mini Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-lg font-bold text-slate-800">{formatRupiah(totalAllTime)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ArrowDownCircle size={20} />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bulan Ini</span>
            <span className="text-lg font-bold text-slate-800 text-indigo-600">{formatRupiah(currentMonthTotal)}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center gap-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suku Cadang</span>
          <span className="text-base font-bold text-slate-800 truncate">{formatRupiah(sparepartTotal)}</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center gap-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jasa & Vendor</span>
          <span className="text-base font-bold text-slate-800 truncate">{formatRupiah(operationalTotal)}</span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center gap-1">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alat Kerja</span>
          <span className="text-base font-bold text-slate-800 truncate">{formatRupiah(toolTotal)}</span>
        </div>
      </div>

      {/* Spend Chart Panel - Pure Clean SVG representation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-2">
          <TrendingDown className="text-rose-500" size={18} /> Tren Biaya Perawatan Pabrik (Terakhir 6 Bulan)
        </h3>
        
        <div className="w-full h-64 flex flex-col justify-between pt-4">
          <div className="flex-1 flex items-end justify-between gap-3 md:gap-8 px-6 border-b border-slate-100">
            {chartData.map((data, idx) => {
              const heightPercent = maxVal > 0 ? (data.total / maxVal) * 80 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 text-[10px] bg-slate-900 text-white font-mono rounded px-2 py-1 shadow-md pointer-events-none transition-all z-10 whitespace-nowrap">
                    {formatRupiah(data.total)}
                  </div>
                  {/* Colored column */}
                  <div 
                    className="w-full bg-slate-100 group-hover:bg-blue-600 hover:shadow-lg transition-all rounded-t-lg relative"
                    style={{ height: `${Math.max(5, heightPercent)}%` }}
                  >
                    {data.total > 0 && (
                      <div className="absolute inset-x-0 top-0 h-1.5 bg-blue-400 rounded-t-lg group-hover:bg-blue-300" />
                    )}
                  </div>
                  {/* Short Title */}
                  <span className="mt-3 block text-[10px] font-bold text-slate-400 border-none uppercase tracking-wider whitespace-nowrap">
                    {data.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-3">
            <span>&copy; Honicel ID maintenance spending analysis engine</span>
            <span className="font-mono">Skala Maksimum: {formatRupiah(maxVal)}</span>
          </div>
        </div>
      </div>

      {/* Registry and Table Logs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Riwayat Transaksi Pengeluaran</h3>
            <p className="text-xs text-slate-400">Total {filteredCashFlows.length} transaksi audit {selectedRows.size > 0 && `• ${selectedRows.size} selected`}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedRows.size > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border border-rose-100"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1">
                <Filter size={12} /> Tipe:
              </span>
              <select 
                value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
            >
              <option value="all">Semua Tipe</option>
              <option value="sparepart">Suku Cadang / Material</option>
              <option value="operational">Jasa / Vendor Luar</option>
              <option value="tool">Operasional & Alat Kerja</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto p-0">
          {filteredCashFlows.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <HelpCircle className="mx-auto w-10 h-10 text-slate-300 mb-2 animate-bounce" />
              <p className="text-sm font-semibold">Belum Ada Pengeluaran</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan sparepart di Work Order atau klik tambah pengeluaran operasional.</p>
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-[11px] tracking-wider text-slate-400 uppercase">
                  <th className="px-6 py-3.5 w-10">
                    <input 
                      type="checkbox"
                      checked={paginatedItems.length > 0 && paginatedItems.every(x => selectedRows.has(x.id))}
                      onChange={(e) => toggleSelectAll(e, paginatedItems)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                     <div className="flex items-center gap-1.5">Tanggal <SortIcon field="date" /></div>
                  </th>
                  <th className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1.5">Tipe <SortIcon field="type" /></div>
                  </th>
                  <th className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1.5">Keterangan Pengeluaran <SortIcon field="title" /></div>
                  </th>
                  <th className="px-6 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1.5">Nominal Biaya <SortIcon field="amount" /></div>
                  </th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {paginatedItems.map((cf) => (
                  <tr key={cf.id} className={`hover:bg-slate-50/50 transition-all ${selectedRows.has(cf.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox"
                        checked={selectedRows.has(cf.id)}
                        onChange={() => toggleSelectRow(cf.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                      {new Date(cf.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                        cf.type === 'sparepart' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : cf.type === 'operational'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {cf.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{cf.title}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{formatRupiah(cf.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(cf.id, cf.title)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
              {paginatedItems.map((cf) => (
                <div key={cf.id} className={`bg-white rounded-xl border p-5 shadow-sm hover:border-blue-500 transition-all flex flex-col group relative ${selectedRows.has(cf.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                  <div className="absolute top-4 right-4 z-10">
                    <input 
                      type="checkbox"
                      checked={selectedRows.has(cf.id)}
                      onChange={() => toggleSelectRow(cf.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shadow-sm w-4 h-4"
                    />
                  </div>
                  <div className="flex justify-between items-start mb-3 pr-8">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${
                      cf.type === 'sparepart' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : cf.type === 'operational'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-purple-50 text-purple-600 border border-purple-100'
                    }`}>
                      {cf.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(cf.date).toLocaleDateString('id-ID', { year: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-2 group-hover:text-blue-600 transition-colors">{cf.title}</h3>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900">{formatRupiah(cf.amount)}</span>
                    <button 
                      onClick={() => handleDelete(cf.id, cf.title)}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline uppercase cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {filteredCashFlows.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sortedItems.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>

      {/* Manual Cost modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Catat Biaya Pemeliharaan Manual / Eksternal
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCashFlow} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tipe Pengeluaran</label>
                <select 
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="operational">Jasa / Vendor Luar</option>
                  <option value="sparepart">Pembelian Suku Cadang / Material</option>
                  <option value="tool">Operasional & Alat Kerja</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Keterangan Tambahan *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Pembelian oli motor listrik 5L, Service AC Ruang Servo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Biaya (IDR) *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 font-mono text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Tanggal Transaksi</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Tambah Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
