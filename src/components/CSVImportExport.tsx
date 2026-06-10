import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  data: any[];
  fileName: string;
  fields: string[];
  humanHeaders: string[];
  type: 'asset' | 'labor' | 'sparepart' | 'cash_flow' | 'work_order';
  onImport: (newData: any[]) => Promise<void>;
}

export const CSVImportExport: React.FC<Props> = ({
  data,
  fileName,
  fields,
  humanHeaders,
  type,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper dynamic template downloads
  const getCSVTemplate = () => {
    let headersLine = fields.join(',');
    let demoRow = '';
    if (type === 'asset') {
      demoRow = 'Mesin Glue Spreader B2,MCH-001,glue_spreader,Sektor A Blok 4,operational,';
    } else if (type === 'labor') {
      demoRow = 'Supriadi Hermawan,Mechanical Senior,technician';
    } else if (type === 'sparepart') {
      demoRow = 'Bearing NSK 6204 ZZ,25,145000,3000';
    } else if (type === 'work_order') {
      demoRow = 'Pemeriksaan Rutin,Inspection,open,medium,d290f1ee-6c54-4b01-90e6-d701748f0851,b560f1ea-1c51-4122-9011-e121748f0111,,';
    }
    return `${headersLine}\n${demoRow}`;
  };

  // 1. Export CSV Handler
  const handleExport = () => {
    try {
      const csvRows = [];
      // Add Headers
      csvRows.push(fields.join(','));

      // If data is empty, export template, otherwise export actual database content
      const sourceData = data.length > 0 ? data : [];
      sourceData.forEach(row => {
        const values = fields.map(field => {
          let val = row[field];
          if (val === undefined || val === null) {
            val = '';
          }
          // Escape quotes and commas
          let stringVal = String(val).replace(/"/g, '""');
          if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
            stringVal = `"${stringVal}"`;
          }
          return stringVal;
        });
        csvRows.push(values.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Berhasil mengunduh dokumen ${fileName}.csv`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(`Gagal melakukan export: ${err.message}`);
      setTimeout(() => setError(null), 4000);
    }
  };

  // 2. Import CSV Handler with strict constraints validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    setLoading(true);
    setError(null);
    setSuccess(null);

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File kosong atau rusak');

        // Parse lines
        const rawLines = text.split(/\r?\n/);
        if (rawLines.length < 2) {
          throw new Error('File CSV harus memuat baris header dan minimal satu baris data!');
        }

        // Validate Header Matching
        const headerCols = rawLines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Ensure all required fields exist
        const missingFields = fields.filter(f => !headerCols.includes(f.toLowerCase()));
        if (missingFields.length > 0) {
          throw new Error(`Kolom header di CSV tidak sesuai. Kurang kolom: [${missingFields.join(', ')}]. Harap gunakan format template export.`);
        }

        const parsedRecords: any[] = [];

        // Validate Rows & check database constraints
        for (let i = 1; i < rawLines.length; i++) {
          const rawLine = rawLines[i].trim();
          if (!rawLine) continue; // Skip blank lines

          // Simple CSV Split balancing quotes
          const cols: string[] = [];
          let currentField = '';
          let inQuotes = false;
          for (let c = 0; c < rawLine.length; c++) {
            const char = rawLine[c];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cols.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          cols.push(currentField.trim());

          // Map columns to record based on headers
          const record: any = {};
          headerCols.forEach((head, idx) => {
            if (head && idx < cols.length) {
              let value: any = cols[idx];
              // strip surrounding quotes if clean
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              if (value.trim() === '') value = null;
              record[head] = value;
            }
          });

          // Check strict constraints (Row Index i+1 for error context)
          const rowNum = i + 1;

          if (type === 'asset') {
            if (!record.name) throw new Error(`Baris ke-${rowNum}: Nama Asset tidak boleh kosong (NOT NULL)!`);
            if (!record.category) record.category = 'other';
            if (!record.location) throw new Error(`Baris ke-${rowNum}: Lokasi Asset wajib diisi!`);
            
            const validStatus = ['operational', 'down', 'maintenance'];
            const checkedStatus = record.status?.toLowerCase();
            if (record.status && !validStatus.includes(checkedStatus)) {
              throw new Error(`Baris ke-${rowNum}: Status asset harus salah satu dari: operational, down, atau maintenance!`);
            }
            record.status = checkedStatus || 'operational';
            // Default technical specs
            record.technical_specs = { importedFromCSV: true, category: record.category };
            record.qr_code_data = record.qr_code_data || `HONICEL-${record.asset_code ? String(record.asset_code).toUpperCase().replace(/\s+/g, '-') : (record.name || '').toUpperCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }

          else if (type === 'labor') {
            if (!record.full_name) throw new Error(`Baris ke-${rowNum}: Nama Teknisi tidak boleh kosong!`);
            if (!record.specialization) record.specialization = 'umum';
            
            const validRoles = ['technician', 'supervisor', 'admin'];
            const checkedRole = record.role?.toLowerCase() || 'technician';
            if (!validRoles.includes(checkedRole)) {
              throw new Error(`Baris ke-${rowNum}: Peran sistem harus salah satu dari: technician, supervisor, atau admin!`);
            }
            record.role = checkedRole;
          }

          else if (type === 'sparepart') {
            if (!record.name) throw new Error(`Baris ke-${rowNum}: Nama Sparepart tidak boleh kosong!`);
            
            const stockStr = (record.stock || '0').toString().replace(/[^0-9]/g, '');
            const stockNum = parseInt(stockStr || '0');
            if (isNaN(stockNum) || stockNum < 0) {
              throw new Error(`Baris ke-${rowNum}: Jumlah stok "${record.stock}" harus berupa angka bulat >= 0 (CHECK stock >= 0)!`);
            }
            record.stock = stockNum;

            const priceStr = (record.price || '0').toString().replace(/[^0-9]/g, '');
            const priceNum = parseInt(priceStr || '0');
            if (isNaN(priceNum) || priceNum < 0) {
               throw new Error(`Baris ke-${rowNum}: Harga "${record.price}" harus berupa angka riil >= 0!`);
            }
            record.price = priceNum;

            const lifetimeStr = (record.estimated_lifetime_hours || '2000').toString().replace(/[^0-9]/g, '');
            const lifetimeNum = parseInt(lifetimeStr || '2000');
            if (isNaN(lifetimeNum) || lifetimeNum <= 0) {
              throw new Error(`Baris ke-${rowNum}: Estimasi lifetime "${record.estimated_lifetime_hours}" harus berupa angka bulat > 0!`);
            }
            record.estimated_lifetime_hours = lifetimeNum;
          }

          else if (type === 'cash_flow') {
            const validTypes = ['sparepart', 'operational', 'tool'];
            const checkedType = record.type?.toLowerCase();
            if (!checkedType || !validTypes.includes(checkedType)) {
              throw new Error(`Baris ke-${rowNum}: Tipe finansial harus "sparepart", "operational", atau "tool"!`);
            }
            record.type = checkedType;

            if (!record.title) throw new Error(`Baris ke-${rowNum}: Keterangan transaksi wajib diisi!`);
            
            const amountNum = parseInt(record.amount);
            if (isNaN(amountNum) || amountNum <= 0) {
              throw new Error(`Baris ke-${rowNum}: Nominal pengeluaran "${record.amount}" harus berupa angka > 0!`);
            }
            record.amount = amountNum;

            // Date fallback
            const dateStr = record.date || new Date().toISOString().split('T')[0];
            record.date = dateStr;
          } else if (type === 'work_order') {
            if (!record.title) throw new Error(`Baris ke-${rowNum}: Judul Work Order tidak boleh kosong!`);
            
            const validRepairTypes = ['Repair', 'Setting', 'Kalibrasi', 'Inspection'];
            if (record.repair_type && !validRepairTypes.includes(record.repair_type)) {
              throw new Error(`Baris ke-${rowNum}: Tipe Perbaikan harus salah satu dari: Repair, Setting, Kalibrasi, Inspection!`);
            }

            const validStatus = ['open', 'in_progress', 'completed'];
            if (record.status && !validStatus.includes(record.status.toLowerCase())) {
              throw new Error(`Baris ke-${rowNum}: Status harus "open", "in_progress", atau "completed"!`);
            }
            record.status = record.status?.toLowerCase() || 'open';

            const validPriority = ['low', 'medium', 'high', 'critical'];
            if (record.priority && !validPriority.includes(record.priority.toLowerCase())) {
              throw new Error(`Baris ke-${rowNum}: Prioritas harus "low", "medium", "high", atau "critical"!`);
            }
            record.priority = record.priority?.toLowerCase() || 'medium';
            
            // Generate UUID if not provided but we need ids for mapping...
            // the database handles UUID generation if omitted from insert
            
            if (!record.asset_id) delete record.asset_id;
            if (!record.assignee_id) delete record.assignee_id;
            if (!record.created_at) delete record.created_at;
          }

          parsedRecords.push(record);
        }

        if (parsedRecords.length === 0) {
          throw new Error('Tidak ada baris data yang valid ditemukan untuk diimpor.');
        }

        // Trigger secure bulk insert in database (or trigger client rollback on exception)
        await onImport(parsedRecords);

        setSuccess(`Berhasil mengimpor ${parsedRecords.length} baris data secara massal.`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        console.error("CSV Import Transaction Failed:", err);
        setError(err.message || 'Gagal memproses file CSV.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setError('Kesalahan sewaktu membaca file dari komputer.');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  // Helper template downloader button
  const downloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const template = getCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {/* Export Action Button */}
        <button
          onClick={handleExport}
          title={`Unduh seluruh data ${fileName}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>

        {/* Import Action Trigger Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title={`Unggah & validasi dokumen CSV ${fileName}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          <Upload size={13} />
          <span>{loading ? 'Mengimpor...' : 'Import CSV'}</span>
        </button>

        {/* Input file reference */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />

        {/* Micro helper to download pristine template file */}
        <button
          onClick={downloadTemplate}
          className="text-[10px] text-blue-600 hover:underline flex items-center bg-transparent border-none cursor-pointer p-0 font-medium whitespace-nowrap"
          title="Unduh template isian formal"
        >
          (Template CSV)
        </button>
      </div>

      {/* Floating feedback errors / notices */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2 text-rose-700 text-[11px] font-medium animate-in fade-in max-w-sm">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="leading-normal">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2 text-emerald-700 text-[11px] font-semibold animate-in fade-in max-w-sm">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <span className="leading-normal">{success}</span>
        </div>
      )}
    </div>
  );
};
