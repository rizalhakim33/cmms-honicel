-- Tambahkan kolom min_stock dengan nilai default 1
ALTER TABLE public.spareparts
ADD COLUMN min_stock integer DEFAULT 1 NOT NULL;

-- Tambahkan kolom status yang digenerate (dihitung) otomatis berdasarkan stock dan min_stock
ALTER TABLE public.spareparts
ADD COLUMN status text GENERATED ALWAYS AS (
    CASE 
        WHEN stock < min_stock THEN 'ORDER'
        ELSE 'AMAN'
    END
) STORED;
