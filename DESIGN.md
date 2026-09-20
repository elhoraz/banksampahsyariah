# Design System & UI Specs: BSS UINSA Mobile-First

## 1. Standar Layar & Interaksi Ponsel
- Target Viewport: 390px (Mobile portrait utama), scalable ke desktop (1440px).
- Min Touch-Target: 48px x 48px untuk tombol dan kolom input.
- Input Berat: Wajib memakai atribut `type="number"` dan `inputmode="decimal"`.

## 2. Token Warna (Tailwind CSS)
- Primary Brand: `bg-emerald-700` (#15803D) untuk header, kartu saldo, dan tombol utama.
- Primary Hover: `bg-emerald-800` (#166534).
- Soft Accent: `bg-emerald-50` (#ECFDF5) untuk highlight saldo dan kartu aktif.
- Surface/Background: `bg-slate-50` (#F8FAFC) untuk canvas, `bg-white` untuk kartu.
- Typography: `text-slate-900` (Judul), `text-slate-600` (Body), `text-slate-400` (Label kecil).
- Destructive: `bg-red-600` (#DC2626) untuk tombol batal/hapus.

## 3. Tata Letak Responsif
- Mobile (< 768px):
  - 1 kolom vertikal.
  - Tampilkan `MobileBottomNav` di bagian bawah layar.
  - Beri `padding-bottom: 80px` pada container form agar tombol tidak tertutup tab bar.
- Desktop (>= 768px):
  - Sembunyikan `MobileBottomNav`, aktifkan `DesktopSidebar` di sebelah kiri.
  - Halaman petugas berubah menjadi 2 kolom (Kiri: form input, Kanan: struk setoran).