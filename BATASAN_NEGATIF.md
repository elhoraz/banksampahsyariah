# Dokumen Batasan Negatif & Invarian Arsitektur (Anti-Requirements)
## Bank Sampah Syariah (BSS) UIN Sunan Ampel Surabaya v1.0

Dokumen ini mendefinisikan **Batasan Negatif (*Won't Have / Negative Boundaries*)** dan **Invarian Sistem** yang mengikat seluruh pengembang, auditor, dan asisten AI. 

Aturan dalam dokumen ini bersifat **MUTLAK & DILARANG DILANGGAR** dalam kondisi apa pun untuk mencegah *scope creep*, kerentanan keamanan, serta kerusakan integritas akuntansi syariah.

---

### 1. Batasan Negatif Fungsional & Ekosistem (MoSCoW - Won't Have)

#### BN-01: DILARANG Integrasi Timbangan Digital Otomatis / Sensor IoT
- **Aturan**: Sistem **TIDAK BOLEH** mengintegrasikan driver perangkat keras, WebSerial API, Bluetooth Low Energy (BLE), Arduino/ESP32, atau sensor timbangan otomatis.
- **Rasional**: Penimbangan sampah di pos kampus bersifat dinamis dan rawan fluktuasi alat. Petugas jaga pos timbang **wajib melakukan verifikasi fisik manual** dan memasukkan angka berat secara sadar melalui *Kalkulator Pintar*.
- **Konsekuensi Pelanggaran**: Kode driver serial akan mempersulit pemeliharaan, memicu bug koneksi browser, dan memperlambat alur antrean setoran di pos timbang.

#### BN-02: DILARANG Integrasi Payment Gateway & Dompet Digital Eksternal
- **Aturan**: Sistem **TIDAK BOLEH** mengintegrasikan API pihak ketiga seperti Midtrans, Xendit, DANA, GoPay, OVO, atau transfer bank otomatis keluar.
- **Rasional**: BSS UINSA beroperasi atas dasar prinsip syariah **Wadiah Yad Dhamanah** (Titipan Bergaransi). Saldo tabungan sampah dikelola dalam pembukuan kas internal yang diaudit oleh Bendahara. Penarikan tunai dan penyaluran infaq diselesaikan langsung secara fisik/slip resmi di loket kasir bendahara.
- **Konsekuensi Pelanggaran**: Mengubah sistem menjadi fintech komersial yang memerlukan regulasi BI/OJK dan menambah risiko kebocoran dana otomatis.

#### BN-03: DILARANG Menggunakan Kode Native Mobile (React Native, Capacitor, Cordova)
- **Aturan**: Sistem **TIDAK BOLEH** dibundel menjadi aplikasi native (APK/IPA) menggunakan Capacitor, Cordova, atau React Native.
- **Rasional**: Target perangkat adalah seluruh sivitas akademika UINSA (mahasiswa, dosen, tendik) yang mengakses via browser ponsel tanpa beban menginstal aplikasi dari app store. Standar antarmuka dicapai murni melalui **Mobile-First Responsive Web** (Tailwind CSS, viewport 390px, min touch-target 48px, dan bottom navigation).
- **Konsekuensi Pelanggaran**: Memecah basis kode, memperumit proses rilis (*deployment*), dan menurunkan kemudahan akses instan (*zero-install*).

---

### 2. Invarian Integritas Data & Keamanan (Non-Negotiable Invariants)

#### BN-04: DILARANG Membuat Fungsi Edit atau Hapus Transaksi (Append-Only Ledger)
- **Aturan**: Dilarang membuat Server Action, REST endpoint, atau tombol UI untuk menghapus (`DELETE`) atau mengubah (`UPDATE`) baris pada tabel `transactions` dan `transaction_items`.
- **Rasional**: Prinsip amanah syariah menuntut transparansi riwayat audit (*immutable audit trail*). Apabila terjadi kesalahan input berat, petugas wajib melakukan transaksi penyesuaian (*adjustment transaction*), bukan menghapus riwayat masa lalu yang merusak saldo akumulasi.

#### BN-05: DILARANG Menggunakan Dynamic Join untuk Nilai Transaksi Lampau (Snapshot Invariant - BR-008)
- **Aturan**: Subtotal transaksi lampau **DILARANG** dihitung ulang dari harga tabel `waste_categories` yang sedang aktif saat ini.
- **Rasional**: Harga per kg sampah bersifat dinamis diatur oleh Admin. Nilai transaksi yang sudah disimpan wajib bersifat final (*snapshot price* pada `transaction_items.price_per_unit`).

#### BN-06: DILARANG Memberikan Fallback Data Nasabah Lain (Data Isolation - BR-006)
- **Aturan**: Dashboard nasabah **DILARANG KERAS** menampilkan data nasabah default/sample jika sesi autentikasi pengguna tidak ditemukan atau kedaluwarsa.
- **Rasional**: Setiap nasabah hanya berhak melihat rekening wadiah miliknya sendiri. Akses tanpa sesi wajib ditolak dan dialihkan ke `/login`.

---

### 3. Matriks Kepatuhan Batasan Negatif

| Kode | Nama Batasan | Status Implementasi | Mekanisme Penegakan |
| :--- | :--- | :---: | :--- |
| **BN-01** | Tanpa Timbangan Otomatis / IoT | **TERPATUHI** | Input murni `type="number"` pada `SmartCalculator.tsx` |
| **BN-02** | Tanpa Payment Gateway Eksternal | **TERPATUHI** | Saldo dicatat di tabel `balances` internal syariah |
| **BN-03** | Murni Responsive Web (No Native) | **TERPATUHI** | Next.js App Router + Tailwind CSS viewport 390px |
| **BN-04** | Transaksi Append-Only (No Delete/Edit) | **TERPATUHI** | Tidak ada API/Action DELETE pada `transactions` |
| **BN-05** | Snapshot Harga Mutlak (BR-008) | **TERPATUHI** | Disimpan permanen di `transaction_items.price_per_unit` |
| **BN-06** | Isolasi Data Nasabah (BR-006) | **TERPATUHI** | Middleware server-side + hapus fallback mock |
