-- ==============================================================================
-- BANK SAMPAH SYARIAH (BSS) UIN SUNAN AMPEL SURABAYA
-- Skrip Kebijakan Keamanan Row Level Security (RLS) & Integritas Data Syariah
-- ==============================================================================
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Pastikan RLS aktif pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- Bersihkan policy lama jika ada agar tidak duplikasi
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow anyone to read active waste categories" ON public.waste_categories;
DROP POLICY IF EXISTS "Allow authenticated admin to manage categories" ON public.waste_categories;
DROP POLICY IF EXISTS "Allow users to view permitted transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow petugas and admin to insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow users to view permitted transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow petugas and admin to insert transaction items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow users to view permitted balances" ON public.balances;
DROP POLICY IF EXISTS "Allow staff to manage balances" ON public.balances;

-- ==============================================================================
-- 2. TABEL PROFILES (RBAC & Identitas)
-- ==============================================================================
-- Semua pengguna terautentikasi dapat membaca profil (untuk identitas, pencarian nasabah di POS timbang)
CREATE POLICY "Allow authenticated users to read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Pengguna hanya dapat memperbarui profil miliknya sendiri
CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- ==============================================================================
-- 3. TABEL WASTE_CATEGORIES (Master Pricelist Sampah)
-- ==============================================================================
-- Semua pengguna (publik/anon dan terautentikasi) dapat membaca kategori aktif & tarif
CREATE POLICY "Allow anyone to read active waste categories"
ON public.waste_categories FOR SELECT
TO authenticated, anon
USING (true);

-- Hanya Admin yang berhak menambah atau mengubah tarif per kg
CREATE POLICY "Allow authenticated admin to manage categories"
ON public.waste_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ==============================================================================
-- 4. TABEL TRANSACTIONS (Append-Only Ledger - BN-04 & BN-06)
-- ==============================================================================
-- Nasabah hanya dapat melihat transaksinya sendiri (BR-03 & BN-06).
-- Petugas, Bendahara, dan Admin dapat melihat seluruh rekapitulasi transaksi.
CREATE POLICY "Allow users to view permitted transactions"
ON public.transactions FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas', 'bendahara')
  )
);

-- Petugas dan Admin berhak mencatat transaksi baru
CREATE POLICY "Allow petugas and admin to insert transactions"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas')
  )
);

-- CATATAN INVARIAN (BN-04):
-- TIDAK ADA POLICY UPDATE atau DELETE pada tabel transactions.
-- Riwayat pembukuan kas syariah bersifat abadi dan tidak boleh diubah/dihapus.

-- ==============================================================================
-- 5. TABEL TRANSACTION_ITEMS (Snapshot Harga Mutlak - BN-05 & BR-02)
-- ==============================================================================
-- Pengguna hanya dapat melihat rincian item jika berhak melihat transaksi induknya
CREATE POLICY "Allow users to view permitted transaction items"
ON public.transaction_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE transactions.id = transaction_items.transaction_id
    AND (
      transactions.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas', 'bendahara')
      )
    )
  )
);

-- Petugas dan Admin berhak menambahkan item ke transaksi
CREATE POLICY "Allow petugas and admin to insert transaction items"
ON public.transaction_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas')
  )
);

-- ==============================================================================
-- 6. TABEL BALANCES (Saldo Tabungan Wadiah Yad Dhamanah)
-- ==============================================================================
-- Nasabah hanya dapat membaca saldo miliknya sendiri. Petugas/Bendahara/Admin dapat membaca saldo.
CREATE POLICY "Allow users to view permitted balances"
ON public.balances FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas', 'bendahara')
  )
);

-- Petugas dan Bendahara/Admin berhak memperbarui saldo setoran
CREATE POLICY "Allow staff to manage balances"
ON public.balances FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'petugas', 'bendahara')
  )
);

-- ==============================================================================
-- SELESAI: Skema RLS BSS UINSA Siap Digunakan Secara Penuh
-- ==============================================================================
