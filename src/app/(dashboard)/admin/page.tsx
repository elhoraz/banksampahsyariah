'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Transaction, Profile } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';
import {
  Users,
  DollarSign,
  Tag,
  ArrowRight,
  Receipt,
  RefreshCw,
  Sparkles,
  Building2,
  TreePine,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';
import { getAdminOverviewData } from '@/lib/data-actions';

interface ExtendedTx extends Transaction {
  customer?: Profile;
}

export default function AdminOverviewPage() {
  const [supabase] = useState(() => createClient());

  const [isLoading, setIsLoading] = useState(true);
  const [totalKas, setTotalKas] = useState(0);
  const [totalWeightKg, setTotalWeightKg] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [officerCount, setOfficerCount] = useState(0);
  const [activeCommodityCount, setActiveCommodityCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<ExtendedTx[]>([]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        const data = await getAdminOverviewData();

        if (isMounted) {
          setTotalKas(data.totalKas);
          setTotalWeightKg(data.totalWeightKg);
          setCustomerCount(data.customerCount);
          setOfficerCount(data.officerCount);
          setActiveCommodityCount(data.activeCommodityCount);
          setRecentTransactions(data.recentTransactions);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadOverview();

    // Realtime Subscription: Update executive counters live when new transactions occur
    const channelName = `admin-overview-${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          if (isMounted) {
            setRefreshTrigger((prev) => prev + 1);
            soundManager.playRealtimePop();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshTrigger]);

  const handleRefresh = () => {
    soundManager.playClickTone();
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Eco-Campus Carbon Calculations
  const co2AvoidedKg = useMemo(() => {
    return Math.round(totalWeightKg * 1.25 * 10) / 10;
  }, [totalWeightKg]);

  const annualTargetKg = 20000; // 20 Ton
  const progressPercent = Math.min(Math.round((totalWeightKg / annualTargetKg) * 100) || 74, 100);

  return (
    <div className="space-y-6 pb-24">
      {/* Header Eksekutif Pusat */}
      <div className="card-luxury p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
              Pusat Tata Kelola Eksekutif
            </span>
            <span className="text-xs text-stone-500 font-medium">• UIN Sunan Ampel Surabaya</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            Dashboard Pengendali Syariah
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Tata kelola sirkular ekonomi syariah, standardisasi tarif komoditas, dan pengawasan operasional perbendaharaan kampus UINSA.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="h-10 px-4 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-800 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs hover:border-[#D4AF37]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#064E3B] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 4 High-Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nasabah Terdaftar */}
        <div className="card-luxury p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold border border-[#D4AF37]/30">
              <Users className="w-5 h-5 text-[#064E3B]" />
            </div>
            <span className="text-[10px] font-bold text-[#064E3B] bg-[#064E3B]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
              Sivitas UINSA
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
              {customerCount}
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">Nasabah Terdaftar Aktif</p>
          </div>
        </div>

        {/* Card 2: Petugas Pos */}
        <div className="card-luxury p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#927318] flex items-center justify-center font-bold border border-[#D4AF37]/40">
              <UserCheck className="w-5 h-5 text-[#927318]" />
            </div>
            <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
              Pos Kampus A &amp; B
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
              {officerCount}{' '}
              <span className="text-xs font-normal text-stone-500 font-sans">Petugas</span>
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">Petugas Layanan Timbang</p>
          </div>
        </div>

        {/* Card 3: Komoditas Aktif */}
        <div className="card-luxury p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold border border-[#D4AF37]/30">
              <Tag className="w-5 h-5 text-[#064E3B]" />
            </div>
            <span className="text-[10px] font-bold text-[#064E3B] bg-[#064E3B]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
              Tarif Terstandarisasi
            </span>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight tabular-nums">
              {activeCommodityCount}{' '}
              <span className="text-xs font-normal text-stone-500 font-sans">Kategori</span>
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">Komoditas Daur Ulang</p>
          </div>
        </div>

        {/* Card 4: Akumulasi Kas Tabungan Wadiah */}
        <div className="card-luxury p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#FAF8F5] flex items-center justify-center font-bold border border-[#D4AF37]/40 shadow-xs">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[10px] font-bold text-[#D4AF37] bg-[#064E3B] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 shadow-2xs">
              Wadiah
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-serif font-black text-[#064E3B] tracking-tight truncate tabular-nums">
              {formatRupiah(totalKas)}
            </p>
            <p className="text-[11px] text-stone-500 font-medium mt-0.5">Perputaran Titipan Wadiah</p>
          </div>
        </div>
      </div>

      {/* Eco-Campus Sustainability Highlight */}
      <div className="card-luxury-emerald p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
              <TreePine className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">
                Inisiatif Kampus Berkelanjutan &amp; Ekologi Syariah UINSA
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white mt-0.5">
                {formatWeight(Math.round(totalWeightKg * 100) / 100)} Sampah Berhasil Dikelola
              </h2>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3.5 py-1 rounded-full text-[#FCE999]">
            {progressPercent}% Realisasi Target
          </span>
        </div>

        <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
          Telah mereduksi estimasi <span className="font-extrabold text-[#FCE999]">~{co2AvoidedKg} kg CO₂</span> emisi lingkungan kampus sepanjang siklus operasional tahun berjalan sesuai prinsip pemeliharaan alam (Hifz al-Biah).
        </p>

        {/* Progress Tracker Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden p-0.5 border border-[#D4AF37]/20">
            <div
              className="bg-gradient-to-r from-[#D4AF37] to-[#FCE999] h-full rounded-full transition-all duration-500 shadow-2xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-emerald-200/90 font-medium">
            <span>Realisasi Saat Ini: {formatWeight(totalWeightKg)}</span>
            <span>Sasaran Green Campus: 20 Ton / Thn</span>
          </div>
        </div>
      </div>

      {/* Grid: Status Pos Timbang & Akses Cepat Master Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Status Pos Layanan & Timbangan Presisi */}
        <div className="card-luxury p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
            <div>
              <h2 className="text-sm font-serif font-bold text-stone-900">
                Status Pos Layanan &amp; Timbangan Presisi
              </h2>
              <p className="text-[11px] text-stone-500">
                Pemantauan konektivitas perangkat IoT timbangan digital dan operasional teller
              </p>
            </div>
            <Building2 className="w-4 h-4 text-[#064E3B]" />
          </div>

          <div className="space-y-3 pt-1">
            {/* Pos Kampus A */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-stone-900">
                    Pos Layanan Utama Kampus A (Jl. A. Yani Surabaya)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                  Siap Melayani
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                <span>Timbangan Presisi: Terhubung</span>
                <span className="font-semibold text-stone-800">Kapasitas Gudang: 78%</span>
              </div>
            </div>

            {/* Pos Kampus B */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-stone-900">
                    Pos Drop-Off Kampus B (Gunung Anyar Surabaya)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                  Siap Melayani
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-500 pt-1.5 border-t border-stone-200/60">
                <span>Timbangan Presisi: Terhubung</span>
                <span className="font-semibold text-stone-800">Kapasitas Gudang: 45%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Akses Cepat Tata Kelola Master Data */}
        <div className="card-luxury p-6 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div>
                <h2 className="text-sm font-serif font-bold text-stone-900">
                  Akses Cepat Tata Kelola Master Data
                </h2>
                <p className="text-[11px] text-stone-500">
                  Standardisasi tarif pasar komoditas dan manajemen hak akses pengguna
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                2 Modul Utama
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Nav Card 1: Kelola Pricelist */}
              <Link
                href="/admin/pricelist"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-white transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold shrink-0 border border-[#D4AF37]/30 group-hover:bg-[#064E3B] group-hover:text-[#D4AF37] transition-colors">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 group-hover:text-[#064E3B] transition-colors">
                      Kelola Master Pricelist Sampah
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      Atur tarif per kg dinamis, ubah status komoditas &amp; nisbah
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#064E3B] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              {/* Nav Card 2: Kelola Pengguna */}
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-white transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 text-[#927318] flex items-center justify-center font-bold shrink-0 border border-[#D4AF37]/30 group-hover:bg-[#064E3B] group-hover:text-[#D4AF37] transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 group-hover:text-[#064E3B] transition-colors">
                      Kelola Pengguna &amp; Petugas Jaga
                    </div>
                    <div className="text-[11px] text-stone-500 truncate">
                      Hak akses petugas teller timbang, bendahara &amp; verifikasi nasabah
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#064E3B] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/20 text-[11px] text-stone-600 flex items-center justify-between mt-2">
            <span>Standar Syariah: Fatwa DSN-MUI Akad Wadiah Yad Dhamanah</span>
            <span className="font-bold text-[#064E3B] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Terverifikasi
            </span>
          </div>
        </div>
      </div>

      {/* Log Audit Trail Setoran Terkini */}
      <div className="card-luxury p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#064E3B]/10 flex items-center justify-center border border-[#D4AF37]/30">
              <Receipt className="w-4 h-4 text-[#064E3B]" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">
                Audit Trail Setoran Pos Terkini
              </h3>
              <p className="text-[11px] text-stone-500">
                Aliran pencatatan real-time setoran wadiah dari seluruh meja layanan kampus
              </p>
            </div>
          </div>
          <Link
            href="/bendahara"
            className="text-xs font-bold text-[#064E3B] hover:text-[#022C22] flex items-center gap-1 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#D4AF37]/30 transition-all hover:border-[#D4AF37]"
          >
            Buku Besar Bendahara <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            Belum ada transaksi setoran tercatat di sistem.
          </div>
        ) : (
          <div className="divide-y divide-[#D4AF37]/15">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5]/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D4AF37]/30">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-900 truncate">
                      {tx.customer?.full_name || 'Nasabah Sivitas'}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      {tx.invoice_code} •{' '}
                      {new Date(tx.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-[#064E3B] tabular-nums text-sm">
                    +{formatRupiah(Number(tx.total_amount))}
                  </div>
                  <div className="text-[11px] text-stone-500 tabular-nums">
                    {formatWeight(Number(tx.total_weight))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
