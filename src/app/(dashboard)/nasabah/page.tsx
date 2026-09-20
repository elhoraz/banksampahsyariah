'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Balance, Transaction, WasteCategory } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { soundManager } from '@/lib/audio';
import {
  Scale,
  Receipt,
  HeartHandshake,
  Truck,
  Tag,
  BookOpen,
  Leaf,
  ShieldCheck,
  Clock,
  Printer,
  Eye,
  EyeOff,
  Sparkles,
  X,
  QrCode,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle2,
  TreePine,
  Download,
  User,
  LogOut,
} from 'lucide-react';
import { getNasabahData } from '@/lib/data-actions';
import { useRouter } from 'next/navigation';

export default function NasabahDashboardPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  // Navigation Tab State (Stitch Screen 7 & 2)
  const [activeTab, setActiveTab] = useState<'beranda' | 'riwayat' | 'profil'>('beranda');

  // Customer Data States
  const [customer, setCustomer] = useState<Profile | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI Interactive States
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [realtimeToast, setRealtimeToast] = useState<{
    message: string;
    amount: number;
    time: string;
  } | null>(null);

  // Modals
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<Transaction | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isInfaqModalOpen, setIsInfaqModalOpen] = useState(false);
  const [isJemputModalOpen, setIsJemputModalOpen] = useState(false);
  const [isKatalogModalOpen, setIsKatalogModalOpen] = useState(false);
  const [isPanduanModalOpen, setIsPanduanModalOpen] = useState(false);

  // Riwayat Tab Filters
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    let balanceChannel: ReturnType<typeof supabase.channel> | null = null;
    let txChannel: ReturnType<typeof supabase.channel> | null = null;

    async function loadData() {
      try {
        const res = await getNasabahData();

        if (!res.authenticated || !res.profile) {
          router.push('/login');
          return;
        }

        const currentProfile = res.profile;

        if (isMounted) {
          setCustomer(currentProfile);
          setBalance(res.balance || null);
          setTransactions(res.transactions || []);
          setCategories(res.categories || []);
          setIsLoading(false);
        }

        // Supabase Realtime Channels
        const balChannelName = `customer-balance-${currentProfile.id}-${Math.random().toString(36).slice(2, 8)}`;
        const txChannelName = `customer-tx-${currentProfile.id}-${Math.random().toString(36).slice(2, 8)}`;

        balanceChannel = supabase
          .channel(balChannelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'balances',
              filter: `customer_id=eq.${currentProfile.id}`,
            },
            (payload) => {
              if (payload.new && isMounted) {
                setBalance(payload.new as Balance);
                soundManager.playSuccessChime();
              }
            }
          )
          .subscribe();

        txChannel = supabase
          .channel(txChannelName)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'transactions',
              filter: `customer_id=eq.${currentProfile.id}`,
            },
            (payload) => {
              if (payload.new && isMounted) {
                const newTx = payload.new as Transaction;
                setTransactions((prev) => [newTx, ...prev]);
                soundManager.playRealtimePop();
                setRealtimeToast({
                  message: `Setoran baru ${newTx.invoice_code} berhasil disahkan pos timbang!`,
                  amount: Number(newTx.total_amount),
                  time: new Date().toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                });
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to load nasabah dashboard:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      if (balanceChannel) supabase.removeChannel(balanceChannel);
      if (txChannel) supabase.removeChannel(txChannel);
    };
  }, [supabase, router]);

  // Calculations for Eco-Impact & Gold Conversion
  const currentBalAmount = Number(balance?.current_balance || 0);
  const totalWeightKg = Number(balance?.total_weight_kg || 0);
  const co2eSaved = (totalWeightKg * 1.2).toFixed(1);
  const treeEquiv = Math.max(1, Math.round(totalWeightKg * 1.25));
  // Estimated Gold (assuming ~Rp 1.300.000 / gr)
  const estimatedGoldGram = (currentBalAmount / 1300000).toFixed(2);
  const progressPercent = Math.min(100, Math.round((totalWeightKg / 50) * 100));

  // Filtered transactions for Riwayat tab
  const filteredTransactions = transactions.filter((t) => {
    const q = historySearch.toLowerCase().trim();
    const matchSearch = !q || t.invoice_code.toLowerCase().includes(q);
    return matchSearch;
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse pb-24 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-64 bg-emerald-800/20 rounded-3xl" />
          <div className="lg:col-span-5 h-64 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 max-w-6xl mx-auto">
      {/* Realtime Toast Banner */}
      {realtimeToast && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 rounded-3xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-200 animate-spin" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {realtimeToast.message}
              </div>
              <div className="text-[11px] text-emerald-100 font-medium">
                +{formatRupiah(realtimeToast.amount)} • Masuk ke Saldo Wadiah ({realtimeToast.time})
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRealtimeToast(null)}
            className="p-1.5 rounded-xl hover:bg-white/20 text-emerald-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Welcome Header & Campus Post Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-[#D4AF37]/30 shadow-[0_4px_24px_rgba(6,78,59,0.04)]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#064E3B] tracking-tight">
              Assalamu&apos;alaikum, {customer?.full_name || 'Nasabah BSS'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[11px] font-bold border border-[#D4AF37]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#064E3B]" />
              Akad Wadiah Yad Dhamanah Sah
            </span>
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-2 flex-wrap">
            <span>NIM / Identitas: <strong className="text-stone-800 font-mono">{customer?.username || '08219401'}</strong></span>
            <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
            <span>No. Rekening Prioritas: <strong className="text-[#064E3B] font-mono font-bold">BSS-{customer?.username?.toUpperCase() || '082194'}</strong></span>
            <span className="w-1 h-1 rounded-full bg-[#D4AF37]" />
            <span className="text-[#064E3B] font-semibold">Sivitas Akademika UINSA</span>
          </div>
        </div>

        {/* Live Campus Drop-off Operational Status */}
        <div className="flex items-center gap-3 bg-[#FAF8F5] border border-[#D4AF37]/30 px-4 py-2.5 rounded-2xl self-start md:self-auto shrink-0 shadow-2xs">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#064E3B]"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
              Meja Layanan Utama
            </span>
            <span className="text-xs font-bold text-stone-800">
              Buka s/d 16:00 WIB • Gd. Twin Towers A
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs: Beranda | Riwayat Transaksi | Profil & Akad */}
      <div className="flex items-center gap-2 bg-stone-200/50 p-1.5 rounded-2xl w-fit border border-stone-200/40">
        {[
          { id: 'beranda', label: 'Beranda & Rekening', icon: Scale },
          { id: 'riwayat', label: `Buku Mutasi (${transactions.length})`, icon: Receipt },
          { id: 'profil', label: 'Sertifikat & Akad Syariah', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-white text-[#064E3B] shadow-sm border border-[#D4AF37]/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#064E3B]' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: BERANDA & RINGKASAN NASABAH
      ========================================================================= */}
      {activeTab === 'beranda' && (
        <div className="space-y-6">
          {/* Primary Metric Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Highlight Card 1: Kartu Wadiah Prioritas (7 Cols) */}
            <div className="lg:col-span-7 card-luxury-emerald rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between border border-[#D4AF37]/40 min-h-[310px]">
              {/* Gold foil glow accents */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#D4AF37]/15 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Simulated EMV Smart Chip */}
                    <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-[#FCE999] via-[#D4AF37] to-[#996D19] border border-[#FFE082]/70 shadow-inner flex items-center justify-center relative overflow-hidden shrink-0">
                      <div className="absolute inset-x-1 top-2 bottom-2 border-y border-black/25" />
                      <div className="w-3 h-full border-x border-black/25" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#D4AF37] block">
                        Rekening Wadiah Prioritas
                      </span>
                      <span className="text-[10px] text-emerald-200/80">
                        Bank Sampah Syariah UINSA
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-black/25 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/40 flex items-center gap-1 backdrop-blur-md">
                    <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                    Bebas Riba &amp; Halal
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-4">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white tabular-nums">
                    {isBalanceHidden ? '••••••••' : formatRupiah(currentBalAmount)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-200 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    <span>Emas: ~{estimatedGoldGram} gr</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                    className="p-1.5 rounded-lg text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors"
                    title={isBalanceHidden ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
                  >
                    {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs text-emerald-200/80 font-mono">
                  No. Rekening: BSS-{customer?.username?.toUpperCase() || '082194'} • DSN-MUI No. 01/2000
                </p>
              </div>

              {/* Action Buttons inside Card */}
              <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 bg-black/25 p-3.5 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-[#FCE999] via-[#D4AF37] to-[#C5A059] text-[#064E3B] font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-105 active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Rekening Koran</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="h-9 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-[#D4AF37]/40 transition-all active:scale-95"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>QR Nasabah</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsInfaqModalOpen(true)}
                    className="text-[#D4AF37] hover:text-amber-200 flex items-center gap-1.5 transition-colors"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    <span>Infaq &amp; Zakat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Highlight Card 2: Kontribusi Daur Ulang & Eco Ranger Level (5 Cols) */}
            <div className="lg:col-span-5 card-luxury rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/30 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold border border-[#064E3B]/20">
                      <Leaf className="w-4 h-4 text-[#064E3B]" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-700 block">
                        Daur Ulang Terkumpul
                      </span>
                      <span className="text-[10px] text-stone-400">Total akumulasi penimbangan</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                    Tahun Akademik Berjalan
                  </span>
                </div>

                <div className="flex items-baseline gap-2 my-3">
                  <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight tabular-nums">
                    {formatWeight(totalWeightKg)}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">Terkonversi Berkah</span>
                </div>

                {/* Environmental Impact Metrics */}
                <div className="grid grid-cols-2 gap-2.5 mt-4">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border border-emerald-200/80 flex items-center gap-2.5">
                    <TreePine className="w-5 h-5 text-[#064E3B] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-stone-500">Emisi Terselamatkan</div>
                      <div className="text-xs sm:text-sm font-black text-[#064E3B] tabular-nums">
                        ~{co2eSaved} kg CO₂
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-amber-100/50 border border-[#D4AF37]/40 flex items-center gap-2.5">
                    <TreePine className="w-5 h-5 text-[#C5A059] shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-stone-500">Ekuivalen Bibit</div>
                      <div className="text-xs sm:text-sm font-black text-amber-900 tabular-nums">
                        {treeEquiv} Pohon
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eco Ranger Tier Progress */}
              <div className="mt-5 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-stone-900">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Eco-Sanctuary Ranger UINSA</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-semibold">
                    {progressPercent}% ke Pejuang Berkah (50 kg)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden p-0.5 border border-stone-200/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#064E3B] to-[#D4AF37] rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Interactive Quick Action Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setIsJemputModalOpen(true);
              }}
              className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/25 shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all text-left flex items-center gap-3 group active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-[#064E3B]/20">
                <Truck className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900">Jemput Sampah</div>
                <div className="text-[10px] text-stone-400">Layanan Jemput Pos</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setIsKatalogModalOpen(true);
              }}
              className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/25 shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all text-left flex items-center gap-3 group active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 text-[#C5A059] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-[#D4AF37]/30">
                <Tag className="w-5 h-5 text-[#C5A059]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900">Katalog Tarif</div>
                <div className="text-[10px] text-stone-400">Harga Resmi / kg</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setIsInfaqModalOpen(true);
              }}
              className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/25 shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all text-left flex items-center gap-3 group active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-[#064E3B]/20">
                <HeartHandshake className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900">Zakat &amp; Infaq</div>
                <div className="text-[10px] text-stone-400">Penyaluran Berkah</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setIsPanduanModalOpen(true);
              }}
              className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/25 shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all text-left flex items-center gap-3 group active:scale-98"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-amber-600/20">
                <BookOpen className="w-5 h-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-stone-900">Panduan 3R</div>
                <div className="text-[10px] text-stone-400">Pilah Berkah UINSA</div>
              </div>
            </button>
          </div>

          {/* Middle Grid: Riwayat Setoran Terakhir (7 Cols) & Ticker Harga Pasar (5 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Riwayat Setoran Terakhir (7 Cols) */}
            <div className="lg:col-span-7 card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#064E3B]" />
                    Riwayat Penimbangan Terakhir
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    5 transaksi setoran terverifikasi akad Wadiah
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('riwayat')}
                  className="text-xs font-bold text-[#064E3B] hover:text-[#022C22] flex items-center gap-1"
                >
                  <span>Buku Mutasi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-stone-700">Belum Ada Setoran</div>
                  <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                    Bawa sampah anorganik Anda ke Meja Layanan Pos Timbang kampus untuk mulai menabung.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5] p-2 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#064E3B]/20">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-stone-900 truncate font-mono">
                            {tx.invoice_code}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {new Date(tx.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right shrink-0">
                        <div>
                          <div className="font-black text-[#064E3B] tabular-nums">
                            +{formatRupiah(Number(tx.total_amount))}
                          </div>
                          <div className="text-[10px] text-stone-400 tabular-nums">
                            {formatWeight(Number(tx.total_weight))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#064E3B]/10 text-stone-700 hover:text-[#064E3B] text-[11px] font-bold border border-stone-200 hover:border-[#D4AF37]/50 transition-all active:scale-95"
                        >
                          Slip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Harga Pasar Terkini Ticker (5 Cols) */}
            <div className="lg:col-span-5 card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#C5A059]" />
                    Tarif Komoditas Syariah
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Tarif resmi per kg komoditas BSS UINSA
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                  Resmi Aktif
                </span>
              </div>

              <div className="space-y-2">
                {categories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/20 flex items-center justify-between text-xs hover:border-[#D4AF37]/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-stone-900 truncate">
                        {cat.name}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {'SMP-' + cat.id.slice(0, 4).toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-[#064E3B] tabular-nums">
                        {formatRupiah(Number(cat.price_per_kg))}
                      </div>
                      <span className="text-[10px] text-stone-400">/ kilogram</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edukasi Konversi Emas Syariah & Wakaf */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#FAF8F5] to-emerald-500/10 border border-[#D4AF37]/40 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
                <div className="text-[11px] text-stone-700 leading-relaxed">
                  <strong className="text-amber-900">Program Berkah Emas:</strong> Tabungan wadiah Anda dapat dikonversi ke saldo tabungan emas batangan fisik syariah atau disalurkan ke program wakaf kampus.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RIWAYAT LENGKAP TRANSAKSI
      ========================================================================= */}
      {activeTab === 'riwayat' && (
        <div className="card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Buku Mutasi Tabungan Wadiah
              </h2>
              <p className="text-xs text-stone-400">
                Riwayat lengkap penimbangan sampah dan penerimaan titipan dana syariah.
              </p>
            </div>

            {/* Search Invoice */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari kode transaksi..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Tidak ada transaksi yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-stone-500 font-bold uppercase text-[10px] border-y border-[#D4AF37]/20">
                  <tr>
                    <th className="py-3.5 px-4">Invoice &amp; Tanggal</th>
                    <th className="py-3.5 px-4 text-right">Berat Terpilah</th>
                    <th className="py-3.5 px-4 text-right">Nilai Tabungan</th>
                    <th className="py-3.5 px-4 text-center">Akad Status</th>
                    <th className="py-3.5 px-4 text-center">Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-stone-900">{tx.invoice_code}</div>
                        <div className="text-[11px] text-stone-400">
                          {new Date(tx.created_at).toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-stone-800 tabular-nums">
                        {formatWeight(Number(tx.total_weight))}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-[#064E3B] tabular-nums">
                        +{formatRupiah(Number(tx.total_amount))}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
                          <CheckCircle2 className="w-3 h-3 text-[#064E3B]" /> Sah Wadiah
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTxForReceipt(tx)}
                          className="px-3 py-1 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#F7F2E7] font-bold text-[11px] shadow-xs active:scale-95 transition-all border border-[#D4AF37]/30"
                        >
                          Buka Slip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PROFIL & SERTIFIKAT AKAD WADIAH
      ========================================================================= */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identitas Sivitas */}
          <div className="card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D4AF37] font-black text-lg flex items-center justify-center border border-[#D4AF37]/40 shadow-sm">
                {customer?.full_name?.charAt(0) || 'N'}
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">
                  {customer?.full_name}
                </h3>
                <p className="text-xs text-stone-400">@{customer?.username}</p>
              </div>
            </div>

            <div className="divide-y divide-stone-100 text-xs pt-2">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-400">Nomor Rekening:</span>
                <span className="font-mono font-bold text-[#064E3B]">
                  BSS-{customer?.username?.toUpperCase() || '082194'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-400">Peran Sistem:</span>
                <span className="capitalize font-bold text-[#064E3B]">Nasabah Wadiah Prioritas</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-400">Afiliasi:</span>
                <span className="font-bold text-stone-900">UIN Sunan Ampel Surabaya</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-400">Nomor Telepon/WA:</span>
                <span className="font-bold text-stone-900">{customer?.phone_number || '-'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="w-full py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-2 transition-all mt-4"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>

          {/* Sertifikat Digital Akad Wadiah Yad Dhamanah */}
          <div className="card-luxury-emerald text-white rounded-3xl p-6 shadow-xl border border-[#D4AF37]/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Sertifikat Akad Syariah
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/25 text-[#D4AF37] font-bold border border-[#D4AF37]/40">
                DSN-MUI No. 01/2000
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-sm font-bold text-white">
                Akad Wadiah Yad Dhamanah (Titipan Bergaransi)
              </div>
              <p className="text-[11px] text-emerald-100/90 leading-relaxed font-serif italic">
                &ldquo;Dana hasil penimbangan sampah nasabah diakui sebagai titipan murni (Wadiah) yang dijamin penuh keamanannya oleh Bank Sampah Syariah UINSA tanpa potongan administrasi riba.&rdquo;
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-emerald-300/70 block">Tanggal Registrasi:</span>
                <span className="font-bold">
                  {customer?.created_at
                    ? new Date(customer.created_at).toLocaleDateString('id-ID')
                    : 'Terdaftar Resmi'}
                </span>
              </div>
              <div>
                <span className="text-emerald-300/70 block">Status Jaminan:</span>
                <span className="font-bold text-emerald-400">100% Tergaransi</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS INTERAKTIF
      ========================================================================= */}

      {/* 1. Modal QR Code Nasabah */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#D4AF37]/20">
              <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider">Identitas Digital Nasabah</span>
              <button type="button" onClick={() => setIsQrModalOpen(false)}>
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-[#D4AF37]/30 inline-block mx-auto shadow-inner">
              <QrCode className="w-40 h-40 text-[#064E3B] mx-auto" />
            </div>
            <div>
              <div className="font-black text-sm text-stone-900">{customer?.full_name}</div>
              <div className="font-mono text-xs text-[#064E3B] font-bold">
                BSS-{customer?.username?.toUpperCase() || '082194'}
              </div>
            </div>
            <p className="text-[11px] text-stone-500">
              Tunjukkan QR Code ini kepada Petugas Meja Layanan Penimbangan untuk verifikasi setoran langsung.
            </p>
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#F7F2E7] font-bold text-xs border border-[#D4AF37]/40 transition-all active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 2. Modal Jemput Sampah */}
      {isJemputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#064E3B]" />
                <span className="text-sm font-bold text-[#064E3B]">Permohonan Jemput Sampah</span>
              </div>
              <button type="button" onClick={() => setIsJemputModalOpen(false)}>
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Layanan penjemputan sampah anorganik terpilah untuk fakultas, prodi, ormawa, dan unit kerja UINSA (Minimal bobot 10 kg).
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700">Lokasi Penjemputan Kampus</label>
                <input
                  type="text"
                  placeholder="Contoh: Gd. FST Lt. 3 / Sekretariat HIMA"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>
              <div>
                <label className="font-bold text-stone-700">Estimasi Bobot Sampah (kg)</label>
                <input
                  type="number"
                  placeholder="Minimal 10 kg"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('Permohonan penjemputan berhasil dikirim ke armada BSS UINSA!');
                setIsJemputModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#F7F2E7] font-bold text-xs border border-[#D4AF37]/40 transition-all active:scale-95"
            >
              Kirim Permohonan
            </button>
          </div>
        </div>
      )}

      {/* 3. Modal Zakat / Infaq */}
      {isInfaqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-[#C5A059]" />
                <span className="text-sm font-bold text-stone-900">Salurkan Infaq Tabungan</span>
              </div>
              <button type="button" onClick={() => setIsInfaqModalOpen(false)}>
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-[#D4AF37]/30 text-xs text-[#064E3B]">
              Saldo tabungan wadiah tersedia: <strong>{formatRupiah(currentBalAmount)}</strong>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-bold text-stone-700">Pilih Program Penyaluran Berkah:</label>
              <div className="grid grid-cols-2 gap-2">
                {['Wakaf Sumur Kampus', 'Infaq Dhuafa Sivitas', 'Beasiswa Lingkungan', 'Sedekah Pohon Kampus'].map((prog) => (
                  <button
                    key={prog}
                    type="button"
                    className="p-2.5 rounded-xl border border-stone-200 bg-white text-left font-semibold text-xs hover:border-[#D4AF37] hover:bg-[#FAF8F5] transition-all"
                  >
                    {prog}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                alert('Penyaluran infaq berhasil disahkan melalui kasir bendahara syariah!');
                setIsInfaqModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#022C22] hover:brightness-110 text-[#F7F2E7] font-bold text-xs border border-[#D4AF37]/40 transition-all active:scale-95"
            >
              Konfirmasi Penyaluran Berkah
            </button>
          </div>
        </div>
      )}

      {/* 4. Modal Katalog Harga */}
      {isKatalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#C5A059]" />
                <span className="text-sm font-bold text-stone-900">Katalog Tarif Komoditas Terkini</span>
              </div>
              <button type="button" onClick={() => setIsKatalogModalOpen(false)}>
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-white border border-[#D4AF37]/20 flex justify-between text-xs items-center shadow-2xs">
                  <div>
                    <div className="font-bold text-stone-900">{c.name}</div>
                    <span className="text-[10px] text-stone-400 font-mono">{'SMP-' + c.id.slice(0, 4).toUpperCase()}</span>
                  </div>
                  <div className="font-black text-[#064E3B] text-sm tabular-nums">
                    {formatRupiah(Number(c.price_per_kg))}/kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Panduan 3R */}
      {isPanduanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/40 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#C5A059]" />
                <span className="text-sm font-bold text-stone-900">Panduan 3R BSS UINSA</span>
              </div>
              <button type="button" onClick={() => setIsPanduanModalOpen(false)}>
                <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
              <p><strong>1. Bersihkan:</strong> Pastikan botol plastik atau gelas dicuci dari sisa cairan agar tidak menimbulkan najis/bau.</p>
              <p><strong>2. Pipihkan:</strong> Remas botol atau lipat kardus untuk menghemat ruang penyimpanan di meja penimbangan.</p>
              <p><strong>3. Pilah per Kategori:</strong> Pisahkan antara plastik bening, kardus, kaleng, dan kertas arsip sebelum dibawa ke pos.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPanduanModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#064E3B] text-white font-bold text-xs border border-[#D4AF37]/40 transition-all active:scale-95"
            >
              Paham &amp; Tutup
            </button>
          </div>
        </div>
      )}

      {/* 6. Digital Slip / Receipt Modal */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl shadow-2xl border border-[#D4AF37]/40 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-white/70">
              <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                Bukti Setoran Wadiah Digital
              </span>
              <button
                type="button"
                onClick={() => setSelectedTxForReceipt(null)}
                className="w-7 h-7 rounded-full hover:bg-stone-200/60 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-[#D4AF37]/40">
                <div className="font-black text-sm text-[#064E3B]">
                  BANK SAMPAH SYARIAH
                </div>
                <div className="text-[10px] text-stone-500">
                  UIN SUNAN AMPEL SURABAYA
                </div>
                <div className="text-[10px] text-[#C5A059] font-bold">
                  AKAD WADIAH YAD DHAMANAH
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-400">Invoice:</span>
                  <span className="font-bold text-stone-900">
                    {selectedTxForReceipt.invoice_code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Tanggal:</span>
                  <span className="text-stone-700">
                    {new Date(selectedTxForReceipt.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Nasabah:</span>
                  <span className="font-bold text-stone-900">
                    {customer?.full_name}
                  </span>
                </div>
              </div>

              <div className="py-2 border-t border-b border-dashed border-[#D4AF37]/40 space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>Total Berat:</span>
                  <span>{formatWeight(Number(selectedTxForReceipt.total_weight))}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#064E3B]">
                  <span>Total Tabungan:</span>
                  <span>{formatRupiah(Number(selectedTxForReceipt.total_amount))}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-stone-400 pt-1 leading-relaxed italic">
                &ldquo;Setiap butir sampah yang terkelola adalah amal jariyah bagi kelestarian bumi.&rdquo;
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxForReceipt(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-white font-bold text-xs flex items-center justify-center transition-all border border-[#D4AF37]/30"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
