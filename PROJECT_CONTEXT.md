# Context Proyek: Bank Sampah Syariah (BSS) UINSA

## 1. Core Stack & Architecture
- Framework: Next.js (App Router, TypeScript)
- Styling: Tailwind CSS
- Database & Auth: Supabase (PostgreSQL + Supabase Auth)
- Icons: Lucide React
- Design Approach: Mobile-First Responsive Web App (Viewport 390px, touch target minimal 48px)

## 2. Role-Based Access Control (RBAC)
Sistem memiliki 4 role utama dengan hak akses ketat:
- Admin: Mengelola data master (kategori sampah, pricelist per kg, data petugas/pengguna).
- Petugas Jaga: Mencatat transaksi setoran sampah dan menggunakan Kalkulator Pintar di pos timbang.
- Bendahara: Melihat rekapitulasi data transaksi dan mengekspor laporan (Excel/CSV).
- Nasabah: Melihat saldo tabungan, total berat sampah yang disetor, dan riwayat mutasi pribadi.

## 3. Strict Business Rules
- BR-01: Harga sampah per kg bersifat dinamis diatur oleh Admin. Namun perubahan harga hanya berlaku untuk transaksi baru dan DILARANG mengubah nominal transaksi historis yang sudah tersimpan.
- BR-02: Nilai subtotal transaksi wajib dihitung dan disimpan langsung per baris transaksi (immutable).
- BR-03: Nasabah hanya boleh melihat data transaksi dan saldo miliknya sendiri.
- BR-04: Kalkulator Pintar milik Petugas harus menghitung nominal secara otomatis dan reaktif begitu jenis sampah dipilih dan berat dimasukkan (tanpa klik tombol hitung manual).

## 4. UI/UX Rules
- Primary Color: Eco Emerald Green (#15803D), latar Slate-50 (#F8FAFC), card putih rounded-2xl.
- Input berat sampah wajib menggunakan `inputmode="decimal"` agar memicu keypad angka di layar HP.
- Tampilan mobile mengutamakan bottom navigation bar untuk dashboard, serta tombol aksi mengambang (floating button) di area bawah agar mudah dijangkau jempol.