'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Scale,
  FileSpreadsheet,
  Settings,
  Wallet,
  Sparkles,
  Recycle,
  TreePine,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { soundManager } from '@/lib/audio';

export default function HomePage() {
  const [selectedKg, setSelectedKg] = useState<number>(5);
  const [selectedType, setSelectedType] = useState<{ name: string; price: number; co2PerKg: number }>({
    name: 'Botol Plastik PET Bening',
    price: 3500,
    co2PerKg: 1.5,
  });

  const estimatedRupiah = selectedKg * selectedType.price;
  const estimatedCo2 = (selectedKg * selectedType.co2PerKg).toFixed(1);

  const wasteTypes = [
    { name: 'Botol Plastik PET Bening', price: 3500, co2PerKg: 1.5 },
    { name: 'Kardus Bersih / Box', price: 2500, co2PerKg: 1.2 },
    { name: 'Kaleng Aluminium Minuman', price: 12000, co2PerKg: 4.2 },
    { name: 'Kertas HVS / Buku Bekas', price: 1800, co2PerKg: 0.9 },
  ];

  const roles = [
    {
      title: 'Nasabah Syariah',
      role: 'nasabah',
      desc: 'Pemantauan saldo tabungan Wadiah Yad Dhamanah, sertifikat dampak lingkungan, dan mutasi saldo berkah.',
      href: '/nasabah',
      icon: Wallet,
      tag: 'Mahasiswa & Tendik',
      accentColor: 'from-emerald-800 to-emerald-950',
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
    },
    {
      title: 'Layanan Penimbangan',
      role: 'petugas',
      desc: 'Penimbangan presisi, kalkulator reaktif otomatis, dan penerbitan nota digital transaksi pos kampus.',
      href: '/petugas',
      icon: Scale,
      tag: 'Petugas Jaga Pos',
      accentColor: 'from-emerald-900 to-teal-950',
      badgeColor: 'bg-amber-50 text-amber-900 border-amber-200/80',
    },
    {
      title: 'Pembukuan Bendahara',
      role: 'bendahara',
      desc: 'Rekapitulasi arus kas fisik, pengesahan rekonsiliasi tutup buku, dan ekspor laporan keuangan syariah terverifikasi.',
      href: '/bendahara',
      icon: FileSpreadsheet,
      tag: 'Otoritas Keuangan',
      accentColor: 'from-amber-900 to-stone-900',
      badgeColor: 'bg-stone-100 text-stone-900 border-stone-300',
    },
    {
      title: 'Pusat Kendali Admin',
      role: 'admin',
      desc: 'Penetapan tarif pasar dinamis, manajemen akun pengguna, dan ringkasan eksekutif tata kelola bank sampah.',
      href: '/admin',
      icon: Settings,
      tag: 'Pimpinan & Auditor',
      accentColor: 'from-emerald-950 to-stone-900',
      badgeColor: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#141C18] flex flex-col justify-between selection:bg-[#E8DCBE] selection:text-[#064E3B] relative overflow-hidden">
      {/* Subtle Warm Luxury Ambient Halos */}
      <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] bg-amber-100/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[36rem] h-[36rem] bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-20 max-w-6xl mx-auto w-full px-4 sm:px-8 py-5 flex items-center justify-between border-b border-amber-900/5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full overflow-hidden shadow-md shadow-emerald-950/20 border-2 border-[#D4AF37]/60 bg-amber-50 p-0.5 shrink-0 hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt="Logo Bank Sampah Syariah UIN Sunan Ampel"
              width={44}
              height={44}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg tracking-tight text-[#064E3B] flex items-center gap-2">
              <span>BSS UIN Sunan Ampel</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#F5EFE0] border border-[#D4AF37]/40 text-[#78581A] text-[10px] font-bold tracking-wider uppercase">
                Akad Wadiah
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Eco-Campus Movement • Surabaya
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
          >
            Masuk Portal
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#0B5E47] hover:from-[#053F30] hover:to-[#084D3A] text-[#F7F1E1] text-xs font-bold shadow-sm shadow-emerald-950/20 border border-amber-400/30 transition-all active:scale-98"
          >
            <span>Layanan Prioritas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-8 pt-10 sm:pt-16 pb-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {/* Sharia Heritage Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F7F2E7] border border-[#D4AF37]/35 text-[#78581A] text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#B58D3C]" />
            <span>Prinsip Syariah Wadiah Yad Dhamanah &amp; Zero-Waste Campus</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-[1.15]">
            Kemuliaan Lingkungan,{' '}
            <span className="gold-gradient-text">Keberkahan Tabungan</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Inisiatif perbankan sampah syariah terpadu UIN Sunan Ampel Surabaya. Mengonversi ikhtiar memilah sampah menjadi saldo tabungan wadiah yang amanah, transparan, dan berdampak nyata bagi kelestarian alam.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
            <Link
              href="/login"
              onClick={() => soundManager.playClickTone()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#064E3B] via-[#095642] to-[#043E2F] text-[#F9F6EE] font-bold shadow-md shadow-emerald-950/20 border border-amber-300/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Akses Portal Layanan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#simulasi"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200/90 font-bold shadow-2xs transition-all"
            >
              Simulasi Nilai Tabungan
            </a>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 sm:mt-16">
          <div className="card-luxury p-5 rounded-3xl space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#F7F2E7] text-[#78581A] flex items-center justify-center border border-[#D4AF37]/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900">Amanah &amp; Bebas Riba</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pencatatan saldo berbasis akad Wadiah Yad Dhamanah. Tabungan nasabah terjamin utuh dan dapat ditarik tunai sewaktu-waktu.
            </p>
          </div>

          <div className="card-luxury p-5 rounded-3xl space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900">Kalkulator Pintar Presisi</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Pos timbang berstandar tinggi. Subtotal nilai sampah terhitung otomatis secara reaktif dengan harga pasar terkini.
            </p>
          </div>

          <div className="card-luxury p-5 rounded-3xl space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-stone-900">Sertifikat Dampak Karbon</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Setiap gram sampah yang disetor berkontribusi langsung menurunkan emisi CO₂ kampus dan tercatat dalam buku portofolio hijau.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Luxury Eco & Wealth Estimator */}
      <section id="simulasi" className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="card-luxury p-6 sm:p-10 rounded-3xl border border-[#D4AF37]/30 shadow-lg shadow-emerald-950/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#F7F2E7] border border-[#D4AF37]/40 text-[#78581A] text-[11px] font-bold uppercase tracking-wider">
                  Kalkulator Estimasi Hijau
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2 tracking-tight">
                  Hitung Nilai Manfaat Setoran Anda
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Pilih komoditas sampah terpilah dan tentukan perkiraan berat untuk mengestimasi saldo wadiah yang Anda peroleh.
                </p>
              </div>

              {/* Commodity Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Pilih Jenis Komoditas
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {wasteTypes.map((type) => {
                    const isSelected = selectedType.name === type.name;
                    return (
                      <button
                        key={type.name}
                        type="button"
                        onClick={() => {
                          soundManager.playClickTone();
                          setSelectedType(type);
                        }}
                        className={`p-3 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#FBF8F0] border-[#C5A059] text-[#064E3B] ring-2 ring-[#D4AF37]/30 font-bold shadow-xs'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="truncate">{type.name}</span>
                        <span className="text-[11px] text-[#B58D3C] font-semibold mt-1">
                          {formatRupiah(type.price)} /kg
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider Berat */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="range-weight" className="font-bold text-stone-700 uppercase tracking-wider">
                    Perkiraan Berat Setoran
                  </label>
                  <span className="text-base font-extrabold text-[#064E3B] font-mono">
                    {selectedKg} kg
                  </span>
                </div>
                <input
                  id="range-weight"
                  type="range"
                  min="1"
                  max="50"
                  value={selectedKg}
                  onChange={(e) => setSelectedKg(Number(e.target.value))}
                  className="w-full h-2.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#064E3B]"
                />
                <div className="flex justify-between text-[11px] text-stone-400 font-mono">
                  <span>1 kg</span>
                  <span>25 kg</span>
                  <span>50 kg</span>
                </div>
              </div>
            </div>

            {/* Right: Output Luxury Card */}
            <div className="lg:col-span-5">
              <div className="card-luxury-emerald p-6 sm:p-8 rounded-3xl text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                      Proyeksi Tabungan
                    </span>
                    <h4 className="text-xs text-emerald-200">Wadiah Yad Dhamanah</h4>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-amber-300/30 flex items-center justify-center text-[#D4AF37]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-emerald-200/80 font-medium">Estimasi Saldo Diterima:</div>
                  <div className="text-3xl sm:text-4xl font-black text-[#F9F6EE] tracking-tight font-mono">
                    {formatRupiah(estimatedRupiah)}
                  </div>
                  <div className="text-[11px] text-[#D4AF37] font-semibold pt-1">
                    Nilai riil tersimpan utuh di rekening syariah
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
                    <TreePine className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">
                      {estimatedCo2} kg Emisi CO₂ Ditekan
                    </div>
                    <div className="text-[10px] text-emerald-200/70">
                      Berdasarkan standar kalkulasi daur ulang sirkular
                    </div>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B58D3C] hover:from-[#C5A059] hover:to-[#9A7327] text-stone-950 font-extrabold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span>Mulai Buka Tabungan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Access Section */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-8 py-12">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#78581A]">
            Ekosistem Terintegrasi
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Pintu Akses Layanan Syariah
          </h2>
          <p className="text-xs text-stone-500">
            Pilih portal peran Anda untuk masuk dan menjalankan amanah operasional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.role}
                href={item.href}
                className="card-luxury p-5 rounded-3xl hover:scale-[1.02] hover:shadow-md transition-all flex flex-col justify-between group border border-[#D4AF37]/20"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#043327] text-[#D4AF37] flex items-center justify-center border border-amber-300/30 shadow-2xs group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                      {item.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-stone-900 text-sm group-hover:text-[#064E3B] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#064E3B]">
                  <span>Akses Masuk</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Elegant Footer */}
      <footer className="relative z-10 border-t border-amber-900/10 bg-white/70 backdrop-blur-md py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]/60 shadow-xs shrink-0 bg-amber-50 p-0.5">
              <Image
                src="/logo.png"
                alt="Logo BSS UINSA"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span>
              Bank Sampah Syariah • Universitas Islam Negeri Sunan Ampel Surabaya
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-medium text-stone-600">
            <span>Akad Wadiah Yad Dhamanah</span>
            <span className="text-stone-300">•</span>
            <span>Kampus A (A. Yani) &amp; Kampus B (Gunung Anyar)</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
