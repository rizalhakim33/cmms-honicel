-- Tambahkan kolom min_stock jika belum ada
ALTER TABLE public.spareparts
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 1 NOT NULL;

-- Hapus kolom status jika sudah ada, untuk memastikan formulanya terupdate jika dibutuhkan
ALTER TABLE public.spareparts
DROP COLUMN IF EXISTS status;

-- Tambahkan kolom status yang digenerate (dihitung) otomatis berdasarkan stock dan min_stock
ALTER TABLE public.spareparts
ADD COLUMN status text GENERATED ALWAYS AS (
    CASE 
        WHEN stock <= min_stock THEN 'ORDER'
        ELSE 'AMAN'
    END
) STORED;
