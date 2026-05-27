# Panduan Penggunaan Honicel CMMS

Selamat datang di Honicel CMMS (Computerized Maintenance Management System). Aplikasi ini dirancang untuk memudahkan manajemen perawatan mesin, pelacakan suku cadang, jadwal preventive maintenance (PM), dan arus kas (Cash Flow) divisi perawatan.

## 1. Cara Login
1. Buka aplikasi Honicel CMMS.
2. Pada halaman awal, Anda akan melihat form login / autentikasi.
3. Masukkan **Username (ID)** dan **Password** Anda. (Hanya admin sistem yang dapat mendaftarkan akun baru).

> **Catatan Admin:** Pembuatan user teknisi baru sekarang sepenuhnya dipegang oleh peran **Admin**. Admin dapat menuju halaman **Labor**, lalu menekan **NEW TECHNICIAN** untuk membuat identitas login (*Username & Password*) untuk anggota baru. Anggota baru tidak perlu sign up sendiri.

## 2. Navigasi Halaman Utama (Dashboard)
Setelah login, Anda akan diarahkan ke **Dashboard**. Di halaman ini Anda dapat:
- Melihat **Ringkasan Indikator Kinerja Utama (KPI)** seperti Work Order (WO) yang aktif, mesin yang down (rusak), pekerjaan yang selesai hari ini, dan persentase mesin yang beroperasi normal.
- Melihat grafik tren penyelesaian Work Order bulanan.

## 3. Manajemen Work Order (WO)
Work Order digunakan untuk mencatat dan melacak setiap pekerjaan perawatan mesin.
- **Membuat WO Baru**: Klik tombol **+ WO** di menu pojok kanan atas atau di halaman Work Orders. Isi data seperti mesin yang bermasalah, tingkat prioritas, deskripsi masalah, dan siapa teknisi yang ditugaskan.
- **Mengisi / Update WO**: Teknisi atau Supervisor dapat membuka WO yang sudah ada untuk memperbarui status (e.g., Progress, Selesai).
- **Penggunaan Suku Cadang**: Saat menyelesaikan WO, Anda bisa mencatat nama dan jumlah suku cadang yang diganti. Hal ini akan otomatis mengurangi stok di Gudang Sparepart dan masuk ke catatan biaya perawatan.

## 4. Manajemen PM Schedule (Preventive Maintenance)
Fitur ini mengatur jadwal perawatan rutin agar mesin tidak rusak mendadak.
- Buka tab **PM Schedule**.
- Klik **NEW SCHEDULE** untuk membuat jadwal baru dengan menentukan mesin, interval (misal: tiap 30 hari), dan deskripsi perawatan dasar.
- Anda dapat menyinkronkan data PM untuk merencanakan pekerjaan masa depan.

## 5. Manajemen Aset (Mesin)
Digunakan untuk merekam seluruh data mesin yang ada di lini produksi.
- Buka tab **Assets**.
- Klik **NEW ASSET** untuk menambah mesin baru, mengisi lokasi, dan spesifikasi teknisnya.
- Update status mesin menjadi "DOWN" bila mesin rusak parah dan "OPERATIONAL" bila berjalan normal.
- **Import/Export Asset**: Memungkinkan untuk menginput mesin massal via CSV.

## 6. Suku Cadang (Spareparts)
Halaman ini berguna untuk kontrol stok komponen mesin pendaftaran harga dan riwayat.
- Buka tab **Spareparts**.
- **Katalog Suku Cadang**: Anda bisa menambah stok komponen, mengisi harga satuan (yang digunakan untuk rekap keuangan otomatis), dan estimasi umur pakai minimum.
- **Riwayat Penggunaan (Installed Parts)**: Setiap penggantian komponen di form WO akan direkam dan mengurangi stok katalog sekaligus mencatat di *Installed Parts* agar bisa ditinjau kapan komponen tersebut terakhir diganti.

## 7. Keuangan (Cash Flow)
Fitur ini khusus pelacakan biaya perawatan, agar pengeluaran divisi terkontrol secara transparan.
- Buka tab **Financial**.
- **Biaya Otomatis**: Setiap penggunaan Sparepart di WO secara otomatis akan tertulis kemari.
- **Biaya Manual**: Anda juga bisa menambah pengeluaran manual seperti Biaya Jasa / Vendor Luar atau Pengeluaran Alat Kerja harian dengan menekan **NEW RECORD**.

## 8. Labor (Teknisi)
Manajemen anggota tim perawatan. (Hanya Admin yang dapat mengubah/menambah data teknisi).
- Buka tab **Labor**.
- **NEW TECHNICIAN**: Mendaftarkan anggota baru dan mengatur hak akses spesialisasi.
- Teknisi yang terdaftar akan muncul di kolom penugasan (assignee) saat pembuatan Work Order.

***

**Panduan Tambahan: Fitur Import/Export CSV**
Setiap halaman master data (Aset, Suku Cadang, Tenaga Kerja, Finansial) menyediakan fitur unduh template CSV dan import CSV untuk percepatan data entry masal. Gunakan tombol **Template CSV** untuk melihat format yang valid sebelum mengunggah.
