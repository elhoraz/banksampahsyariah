'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaction, Profile } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Search,
  Scale,
  DollarSign,
  Receipt,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  X,
  AlertCircle,
  FileCheck,
  Clock,
  ArrowUpRight,
  PieChart,
  Sparkles,
  Building2,
  Printer,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';
import { getBendaharaData } from '@/lib/data-actions';
import { useToast } from '@/context/ToastContext';

interface ExtendedTransaction extends Transaction {
  customer?: Profile;
  officer?: Profile;
}

interface CategoryAggregation {
  id: string;
  name: string;
  weight: number;
  amount: number;
  percentage: number;
  color: string;
}

const CATEGORY_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
];

export default function BendaharaPage() {
  const { toast } = useToast();
  const [supabase] = useState(() => createClient());

  // Tab State: 'rekap' | 'jurnal' | 'rekonsiliasi'
  const [activeTab, setActiveTab] = useState<'rekap' | 'jurnal' | 'rekonsiliasi'>('rekap');

  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryAggregation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | 'this_month'>('all');

  // Reconciliation State
  const [physicalCashStr, setPhysicalCashStr] = useState('');
  const [reconNotes, setReconNotes] = useState(
    'Seluruh slip transaksi pos timbang terverifikasi fisik sesuai amanah syariah Wadiah Yad Dhamanah.'
  );
  const [isSubmittingRecon, setIsSubmittingRecon] = useState(false);
  const [reconSuccessAlert, setReconSuccessAlert] = useState<string | null>(null);
  const [reconciliationHistory, setReconciliationHistory] = useState<
    {
      id: string;
      time: string;
      totalTx: number;
      amount: number;
      weight: number;
      difference: number;
      status: string;
      notes: string;
    }[]
  >([
    {
      id: 'RC-001',
      time: 'Hari ini, 07:30 WIB (Sesi Pembukaan)',
      totalTx: 0,
      amount: 0,
      weight: 0,
      difference: 0,
      status: 'Tertib & Seimbang',
      notes: 'Saldo awal loket terverifikasi sesuai pembukuan kas bank.',
    },
  ]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let txChannel: ReturnType<typeof supabase.channel> | null = null;

    async function loadData() {
      try {
        const data = await getBendaharaData();
        const coloredBreakdown = (data.categoryBreakdown || []).map((c, i) => ({
          ...c,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }));

        if (isMounted) {
          setTransactions(data.transactions || []);
          setCategoryBreakdown(coloredBreakdown);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading bendahara transactions:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    // Realtime Subscription: Listen to new transactions across all campus scales
    const channelName = `bendahara-live-txs-${Math.random().toString(36).slice(2, 8)}`;
    txChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          if (payload.new && isMounted) {
            const newTx = payload.new as Transaction;
            const { data: custProf } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newTx.customer_id)
              .maybeSingle();

            const { data: offProf } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newTx.officer_id)
              .maybeSingle();

            const enriched: ExtendedTransaction = {
              ...newTx,
              customer: custProf || undefined,
              officer: offProf || undefined,
            };

            setTransactions((prev) => [enriched, ...prev]);
            soundManager.playRealtimePop();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (txChannel) supabase.removeChannel(txChannel);
    };
  }, [supabase, refreshTrigger]);

  const handleRefresh = () => {
    soundManager.playClickTone();
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Filtered transactions based on date range & search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Date Filter
      if (dateFilter !== 'all') {
        const txDate = new Date(tx.created_at);
        const now = new Date();

        if (dateFilter === '7d') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate < sevenDaysAgo) return false;
        } else if (dateFilter === '30d') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (txDate < thirtyDaysAgo) return false;
        } else if (dateFilter === 'this_month') {
          if (
            txDate.getMonth() !== now.getMonth() ||
            txDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        }
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const invoiceMatch = tx.invoice_code.toLowerCase().includes(q);
        const customerMatch = tx.customer?.full_name.toLowerCase().includes(q);
        const usernameMatch = tx.customer?.username.toLowerCase().includes(q);
        if (!invoiceMatch && !customerMatch && !usernameMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, dateFilter, searchQuery]);

  // Financial Metrics
  const totalDana = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + Number(t.total_amount), 0);
  }, [filteredTransactions]);

  const totalBerat = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + Number(t.total_weight), 0);
  }, [filteredTransactions]);

  const countTx = filteredTransactions.length;
  const avgTx = countTx > 0 ? Math.round(totalDana / countTx) : 0;

  // Reconciliation calculation
  const parsedPhysicalCash = Number(physicalCashStr) || 0;
  const cashDifference = parsedPhysicalCash - totalDana;

  // Export to CSV Functionality (UTF-8 BOM)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.warning('Tidak ada data transaksi untuk diekspor pada filter ini.', 'Data Transaksi Kosong');
      return;
    }

    const headers = [
      'No. Invoice',
      'Tanggal',
      'Waktu',
      'Nama Nasabah',
      'Username Nasabah',
      'Petugas Jaga',
      'Total Berat (kg)',
      'Total Nominal (Rp)',
    ];

    const rows = filteredTransactions.map((t) => {
      const d = new Date(t.created_at);
      const dateStr = d.toISOString().slice(0, 10);
      const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      return [
        `"${t.invoice_code}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${t.customer?.full_name || '-'}"`,
        `"${t.customer?.username || '-'}"`,
        `"${t.officer?.full_name || '-'}"`,
        t.total_weight,
        t.total_amount,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Rekapitulasi_BSS_UINSA_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Berhasil mengekspor ${filteredTransactions.length} transaksi ke file CSV.`, 'Unduhan Berhasil');
  };

  // Submit Reconciliation Action
  const handleSubmitReconciliation = () => {
    setIsSubmittingRecon(true);
    setTimeout(() => {
      soundManager.playSuccessChime();
      const newEntry = {
        id: `RC-${Date.now().toString().slice(-4)}`,
        time: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          day: 'numeric',
          month: 'short',
        }),
        totalTx: countTx,
        amount: totalDana,
        weight: Math.round(totalBerat * 100) / 100,
        difference: cashDifference,
        status: cashDifference === 0 ? 'Tertib & Seimbang' : 'Penyesuaian Fisik',
        notes: reconNotes || 'Rekonsiliasi kas disahkan tanpa catatan khusus.',
      };

      setReconciliationHistory((prev) => [newEntry, ...prev]);
      setReconSuccessAlert(
        `Rekonsiliasi Kas Batch #${newEntry.id} Berhasil Disahkan Sesuai Prinsip Wadiah Yad Dhamanah.`
      );
      setIsSubmittingRecon(false);
    }, 600);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header Halaman Utama */}
      <div className="card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
                Dewan Pengawas &amp; Perbendaharaan Syariah
              </span>
              <span className="text-xs text-stone-400 font-medium">• Buku Besar Wadiah UINSA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#064E3B] tracking-tight flex items-center gap-2 mt-1">
              Audit Pembukuan &amp; Perbendaharaan Syariah
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-stone-500">
              Pengawasan likuiditas tabungan sampah syariah, audit jurnal mutasi, dan rekonsiliasi kas meja layanan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="h-10 px-3.5 rounded-xl border border-[#D4AF37]/30 bg-[#FAF8F5] hover:bg-[#064E3B]/10 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#064E3B]' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-10 px-4 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-[#064E3B] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4 text-[#C5A059]" />
              <span className="hidden sm:inline">Ekspor Jurnal CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Rekapitulasi Arus Kas | Jurnal Transaksi | Rekonsiliasi Kas */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              soundManager.playClickTone();
              setActiveTab('rekap');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'rekap'
                ? 'bg-[#064E3B] text-white shadow-sm border border-[#D4AF37]/40'
                : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Rekapitulasi Likuiditas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClickTone();
              setActiveTab('jurnal');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'jurnal'
                ? 'bg-[#064E3B] text-white shadow-sm border border-[#D4AF37]/40'
                : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Buku Jurnal Syariah</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
              {filteredTransactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClickTone();
              setActiveTab('rekonsiliasi');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'rekonsiliasi'
                ? 'bg-[#064E3B] text-white shadow-sm border border-[#D4AF37]/40'
                : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rekonsiliasi Kas Wadiah</span>
          </button>
        </div>
      </div>

      {/* Alert Status Rekonsiliasi Sukses */}
      {reconSuccessAlert && (
        <div className="card-luxury p-4 rounded-2xl border border-[#D4AF37]/40 bg-[#FAF8F5] text-[#064E3B] flex items-center justify-between gap-3 animate-in fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#064E3B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-stone-900">
                {reconSuccessAlert}
              </div>
              <div className="text-[11px] text-[#064E3B] font-semibold">
                Akad Wadiah Yad Dhamanah Terpenuhi • Buku Besar Kas Sinkron 100%
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReconSuccessAlert(null)}
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: REKAPITULASI ARUS KAS & VISUAL KOMPOSISI */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* 4 Financial Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Total Titipan Masuk
                </span>
                <DollarSign className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div className="text-2xl font-black text-[#064E3B] tabular-nums">
                {formatRupiah(totalDana)}
              </div>
              <p className="text-[10px] text-stone-400">Kewajiban tabungan wadiah</p>
            </div>

            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Volume Dikelola
                </span>
                <Scale className="w-4 h-4 text-[#064E3B]" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {formatWeight(Math.round(totalBerat * 100) / 100)}
              </div>
              <p className="text-[10px] text-stone-400">Total komoditas terakumulasi</p>
            </div>

            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Sesi Mutasi
                </span>
                <Receipt className="w-4 h-4 text-[#064E3B]" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {countTx}
              </div>
              <p className="text-[10px] text-stone-400">Setoran nasabah tervalidasi</p>
            </div>

            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Rata-Rata Setoran
                </span>
                <TrendingUp className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {formatRupiah(avgTx)}
              </div>
              <p className="text-[10px] text-stone-400">Per sesi penimbangan</p>
            </div>
          </div>

          {/* Grid: Komposisi Perputaran Kas & Status Kas Loket Harian */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Visual Category Composition Breakdown */}
            <div className="card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-stone-900">
                    Komposisi Tabungan per Komoditas
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Proporsi alokasi tabungan wadiah berdasarkan komoditas
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                  Audit Syariah Aktif
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Belum ada data rincian komoditas tercatat.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {categoryBreakdown.map((item) => (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                          <span className="font-bold text-stone-800">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-[11px] tabular-nums">
                            {formatWeight(item.weight)}
                          </span>
                          <span className="font-black text-[#064E3B] tabular-nums">
                            {formatRupiah(item.amount)}
                          </span>
                          <span className="text-stone-500 font-bold text-[11px]">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                      {/* Visual Progress Bar */}
                      <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Tutup Buku Loket Harian & Syariah Governance */}
            <div className="card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h2 className="text-sm font-black text-stone-900">
                      Status Meja Layanan Operasional
                    </h2>
                    <p className="text-[11px] text-stone-400">
                      Sinkronisasi transaksi pos timbang hari ini
                    </p>
                  </div>
                  <Building2 className="w-4 h-4 text-[#064E3B]" />
                </div>

                <div className="space-y-3 pt-3">
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/20 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-900">Meja Layanan Kampus A</div>
                      <div className="text-[11px] text-stone-400">Shift Pagi • Petugas Aktif</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                      Siap Rekonsiliasi
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-900">Meja Layanan Kampus B</div>
                      <div className="text-[11px] text-stone-400">Shift Siang • Standby</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold">
                      Sinkron Terkini
                    </span>
                  </div>
                </div>
              </div>

              {/* Syariah Box */}
              <div className="card-luxury-emerald p-4 rounded-2xl text-white border border-[#D4AF37]/40 space-y-1.5 mt-2 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37]">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  Kepatuhan Akad Wadiah Yad Dhamanah:
                </div>
                <p className="text-[11px] text-emerald-100/90 leading-relaxed font-serif italic">
                  &ldquo;Tabungan nasabah merupakan titipan bergaransi pemeliharaan penuh (yad dhamanah). Dana saldo nasabah dijamin likuid 100% dan siap dicairkan atau dikonversi ke tabungan emas fisik syariah sewaktu-waktu tanpa potongan riba.&rdquo;
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClickTone();
                      setActiveTab('rekonsiliasi');
                    }}
                    className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    Buka Formulir Rekonsiliasi Kas Batch <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JURNAL TRANSAKSI AUDIT */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          {/* Search & Date Filters */}
          <div className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/30 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. invoice, nama nasabah, atau username..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B] text-stone-900 shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <div className="flex items-center gap-1 text-stone-400 text-xs mr-1 shrink-0 font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-[11px]">Rentang:</span>
              </div>
              {[
                { id: 'all', label: 'Semua' },
                { id: '7d', label: '7 Hari' },
                { id: '30d', label: '30 Hari' },
                { id: 'this_month', label: 'Bulan Ini' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDateFilter(tab.id as typeof dateFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    dateFilter === tab.id
                      ? 'bg-[#064E3B] text-white shadow-2xs border border-[#D4AF37]/40'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-3 animate-pulse">
                <div className="h-6 bg-stone-200 rounded w-1/4" />
                <div className="h-10 bg-stone-100 rounded" />
                <div className="h-10 bg-stone-100 rounded" />
                <div className="h-10 bg-stone-100 rounded" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-10 text-center space-y-1">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto" />
                <div className="text-sm font-bold text-stone-700">
                  Tidak Ada Transaksi Ditemukan
                </div>
                <p className="text-xs text-stone-400">
                  Ubah kata kunci pencarian atau sesuaikan rentang tanggal filter.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#D4AF37]/20 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Invoice</th>
                        <th className="py-3.5 px-4">Tanggal &amp; Waktu</th>
                        <th className="py-3.5 px-4">Nasabah</th>
                        <th className="py-3.5 px-4">Petugas</th>
                        <th className="py-3.5 px-4 text-right">Berat</th>
                        <th className="py-3.5 px-4 text-right">Nominal</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {tx.invoice_code}
                          </td>
                          <td className="py-3 px-4 text-stone-500">
                            {new Date(tx.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">
                              {tx.customer?.full_name || 'Nasabah BSS'}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              @{tx.customer?.username || 'nasabah'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {tx.officer?.full_name || 'Petugas Jaga'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-stone-900 tabular-nums">
                            {formatWeight(Number(tx.total_weight))}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#064E3B] tabular-nums">
                            {formatRupiah(Number(tx.total_amount))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
                              <CheckCircle2 className="w-3 h-3 text-[#064E3B]" /> Sah Wadiah
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-stone-100">
                  {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black text-stone-900">
                          {tx.invoice_code}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
                          Sah Wadiah
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-stone-900">
                            {tx.customer?.full_name || 'Nasabah'}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            Petugas: {tx.officer?.full_name || 'Petugas Jaga'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-[#064E3B] tabular-nums">
                            {formatRupiah(Number(tx.total_amount))}
                          </div>
                          <div className="text-[11px] text-stone-500 font-bold tabular-nums">
                            {formatWeight(Number(tx.total_weight))}
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-50">
                        {new Date(tx.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REKONSILIASI KAS BATCH & TUTUP BUKU */}
      {activeTab === 'rekonsiliasi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Input Form Rekonsiliasi Kas */}
            <div className="lg:col-span-2 card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#064E3B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-bold shadow-2xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-stone-900">
                      Formulir Rekonsiliasi Kas Meja Layanan
                    </h2>
                    <p className="text-[11px] text-stone-400">
                      Pencocokan fisik kas setoran terhadap buku besar sistem
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                  Akad Wadiah
                </span>
              </div>

              {/* Snapshot Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#D4AF37]/20">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total Transaksi</div>
                  <div className="text-lg font-black text-stone-900 tabular-nums">{countTx}</div>
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#D4AF37]/20">
                  <div className="text-[10px] text-stone-400 font-bold uppercase">Total Komoditas</div>
                  <div className="text-lg font-black text-stone-900 tabular-nums">
                    {formatWeight(Math.round(totalBerat * 100) / 100)}
                  </div>
                </div>
                <div className="bg-[#064E3B]/10 p-3.5 rounded-2xl border border-[#064E3B]/30">
                  <div className="text-[10px] text-[#064E3B] font-bold uppercase">Buku Besar Sistem</div>
                  <div className="text-sm sm:text-base font-black text-[#064E3B] tabular-nums truncate">
                    {formatRupiah(totalDana)}
                  </div>
                </div>
              </div>

              {/* Physical Cash Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                  <span>Nominal Hitungan Kas Fisik Meja Layanan (Rp):</span>
                  <button
                    type="button"
                    onClick={() => setPhysicalCashStr(totalDana.toString())}
                    className="text-[11px] text-[#064E3B] hover:text-[#022C22] font-bold underline"
                  >
                    Samakan dengan Sistem ({formatRupiah(totalDana)})
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={physicalCashStr}
                    onChange={(e) => setPhysicalCashStr(e.target.value)}
                    placeholder="Masukkan hasil hitung fisik uang kas..."
                    className="w-full pl-10 pr-4 py-3 text-sm font-bold rounded-2xl border border-[#D4AF37]/30 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                  />
                </div>
              </div>

              {/* Balance / Discrepancy Indicator */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                  cashDifference === 0
                    ? 'card-luxury-emerald text-white border border-[#D4AF37]/40 shadow-xs'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cashDifference === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  )}
                  <div>
                    <div className="font-black text-sm">
                      {cashDifference === 0
                        ? 'Kondisi Kas Seimbang & Tertib (Rp 0)'
                        : `Terdapat Selisih: ${formatRupiah(cashDifference)}`}
                    </div>
                    <div className="text-[11px] opacity-90 leading-relaxed mt-0.5">
                      {cashDifference === 0
                        ? 'Fisik kas loket cocok 100% dengan transaksi yang tercatat di database.'
                        : 'Harap periksa kembali slip transaksi pos sebelum menandatangani berita acara.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Catatan Berita Acara Rekonsiliasi:
                </label>
                <textarea
                  rows={3}
                  value={reconNotes}
                  onChange={(e) => setReconNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-2xl border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={isSubmittingRecon}
                onClick={handleSubmitReconciliation}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#022C22] hover:brightness-110 disabled:bg-stone-300 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all border border-[#D4AF37]/40"
              >
                {isSubmittingRecon ? (
                  <span>Memproses Pengesahan...</span>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Sahkan Rekonsiliasi Kas Batch &amp; Tutup Buku</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: History Log Rekonsiliasi */}
            <div className="card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-3 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#064E3B]" />
                  <h3 className="text-xs font-bold text-stone-900">
                    Riwayat Pengesahan Batch
                  </h3>
                </div>
                <span className="text-[10px] text-stone-400 font-mono">
                  {reconciliationHistory.length} Arsip
                </span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 flex-1">
                {reconciliationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-stone-900">{item.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">{item.time}</div>
                    <div className="flex justify-between font-bold pt-1 border-t border-stone-200/60">
                      <span className="text-stone-500">Total Nilai:</span>
                      <span className="font-black text-[#064E3B]">{formatRupiah(item.amount)}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 line-clamp-2 italic">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2.5 rounded-xl border border-[#D4AF37]/30 bg-white hover:bg-[#FAF8F5] text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#064E3B]" />
                  <span>Cetak Arsip Rekonsiliasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
