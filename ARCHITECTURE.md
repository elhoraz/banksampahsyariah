# Arsitektur Proyek: Bank Sampah Syariah (BSS) UINSA
Framework: Next.js (App Router, TypeScript, Tailwind CSS)

## Struktur Folder Utama
```text
bss-uinsa/
├── AI_RULES.md
├── PROJECT_CONTEXT.md
├── DESIGN.md
├── DATABASE_SCHEMA.md
├── ARCHITECTURE.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx           # Layar login universal 4 role
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             # Shell navigasi (Bottom nav mobile / Sidebar desktop)
│   │   │   ├── nasabah/
│   │   │   │   ├── page.tsx           # Kartu saldo & riwayat setoran
│   │   │   │   └── riwayat/page.tsx   # Mutasi lengkap & cetak web
│   │   │   ├── petugas/
│   │   │   │   ├── page.tsx           # Form Kalkulator Pintar & timbang setoran
│   │   │   │   └── riwayat/page.tsx   # Log setoran hari ini
│   │   │   ├── bendahara/
│   │   │   │   └── page.tsx           # Tabel rekapitulasi & ekspor CSV/Excel
│   │   │   └── admin/
│   │   │       ├── page.tsx           # Ringkasan master & metrik sistem
│   │   │       ├── pricelist/page.tsx # Kelola harga sampah per kg
│   │   │       └── users/page.tsx     # Manajemen akun petugas & nasabah
│   │   ├── api/
│   │   │   └── export-report/route.ts # Endpoint generate file Excel/CSV
│   │   ├── globals.css                # Konfigurasi Tailwind dasar
│   │   └── layout.tsx                 # Root layout & font Plus Jakarta Sans
│   ├── components/
│   │   ├── ui/                        # Komponen atom: Button, Input, Card, Modal
│   │   ├── navigation/
│   │   │   ├── MobileBottomNav.tsx    # Tab bar bawah khusus tampilan HP
│   │   │   └── DesktopSidebar.tsx     # Sidebar kiri untuk layar PC/Laptop
│   │   └── modules/
│   │       ├── petugas/SmartCalc.tsx  # Logika reactive input berat & subtotal
│   │       └── nasabah/BalanceCard.tsx# Kartu saldo tabungan
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Supabase browser client
│   │   │   └── server.ts              # Supabase server actions / SSR
│   │   └── utils.ts                   # Format mata uang Rupiah & desimal berat
│   └── types/
│       └── database.ts                # TypeScript definition dari skema Supabase