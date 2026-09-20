# Skema Database: Bank Sampah Syariah (BSS) UINSA

Database: PostgreSQL (Supabase)

## 1. Tipe & Role Pengguna

```sql
-- Role: 'admin' | 'petugas' | 'bendahara' | 'nasabah'
```

---

## 2. Tabel `profiles`
Menyimpan informasi identitas dan hak akses (RBAC) pengguna yang tersinkronisasi dengan `auth.users`.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 3. Tabel `waste_categories`
Master kategori sampah beserta harga dinamis per kilogram yang dikelola oleh Admin.

```sql
CREATE TABLE public.waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    price_per_kg NUMERIC NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 4. Tabel `transactions`
Header data transaksi setoran sampah oleh nasabah yang dicatat oleh petugas.

```sql
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_code VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    officer_id UUID NOT NULL REFERENCES public.profiles(id),
    total_amount NUMERIC NOT NULL DEFAULT 0,
    total_weight NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 5. Tabel `transaction_items`
Rincian item sampah dalam transaksi setoran. Bersifat *immutable*, harga disimpan saat transaksi terjadi (snapshot).

```sql
CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    waste_category_id UUID NOT NULL REFERENCES public.waste_categories(id),
    weight NUMERIC NOT NULL,
    unit VARCHAR(10) NOT NULL DEFAULT 'kg',
    price_per_unit NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL
);
```

---

## 6. Tabel `balances`
Saldo tabungan dan akumulasi total berat sampah nasabah.

```sql
CREATE TABLE public.balances (
    customer_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_balance NUMERIC NOT NULL DEFAULT 0,
    total_weight_kg NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```
