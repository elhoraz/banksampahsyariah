'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, WasteCategory, Balance } from '@/types/database';
import { CustomerSelector } from '@/components/modules/petugas/CustomerSelector';
import { SmartCalculator } from '@/components/modules/petugas/SmartCalculator';
import {
  DepositSummaryList,
  type DepositDraftItem,
} from '@/components/modules/petugas/DepositSummaryList';
import { saveTransactionAction } from './actions';
import { getPetugasData, getCustomerBalance } from '@/lib/data-actions';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { soundManager } from '@/lib/audio';
import {
  AlertCircle,
  Loader2,
  Receipt,
  Sparkles,
  ArrowRight,
  Printer,
  X,
  Share2,
  Plus,
  Clock,
  CheckCircle2,
  Scale,
  DollarSign,
  Users,
  Search,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
} from 'lucide-react';

interface CompletedReceipt {
  invoiceCode: string;
  customerName: string;
  customerUsername: string;
  officerName: string;
  date: string;
  items: {
    name: string;
    weight: number;
    pricePerKg: number;
    subtotal: number;
  }[];
  totalWeight: number;
  totalAmount: number;
  newBalance: number;
}

interface ShiftTransaction {
  id: string;
  invoiceCode: string;
  customerName: string;
  customerUsername: string;
  officerName: string;
  totalWeight: number;
  totalAmount: number;
  createdAt: string;
}

export default function PetugasPage() {
  const [supabase] = useState(() => createClient());

  // Tab State: 'kasir' | 'shift'
  const [activeTab, setActiveTab] = useState<'kasir' | 'shift'>('kasir');

  // Data states
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [customerBalance, setCustomerBalance] = useState<Balance | null>(null);
  const [currentOfficer, setCurrentOfficer] = useState<Profile | null>(null);

  // Draft items in the current weighing session
  const [depositItems, setDepositItems] = useState<DepositDraftItem[]>([]);

  // Shift Transactions List
  const [shiftTransactions, setShiftTransactions] = useState<ShiftTransaction[]>([]);
  const [shiftSearchQuery, setShiftSearchQuery] = useState('');
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);

  // UI States (Loading, Error, Success)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<CompletedReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // 1. Fetch active categories, customers, current officer profile, and today's shift txs
  useEffect(() => {
    let isMounted = true;

    // Realtime Subscriptions with unique channel IDs to prevent post-subscribe callback errors
    const catChannelName = `realtime-waste-cat-${Math.random().toString(36).slice(2, 8)}`;
    const txChannelName = `realtime-petugas-shift-${Math.random().toString(36).slice(2, 8)}`;

    const catChannel = supabase
      .channel(catChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'waste_categories' },
        async () => {
          const { data: refreshed } = await supabase
            .from('waste_categories')
            .select('*')
            .eq('is_active', true)
            .order('name');
          if (refreshed && isMounted) {
            setCategories(refreshed);
          }
        }
      )
      .subscribe();

    const txChannel = supabase
      .channel(txChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async (payload) => {
          if (payload.new && isMounted) {
            const newTx = payload.new as {
              id: string;
              invoice_code: string;
              customer_id: string;
              total_weight: number;
              total_amount: number;
              created_at: string;
            };

            const { data: cData } = await supabase
              .from('profiles')
              .select('full_name, username')
              .eq('id', newTx.customer_id)
              .maybeSingle();

            const formatted: ShiftTransaction = {
              id: newTx.id,
              invoiceCode: newTx.invoice_code,
              customerName: cData?.full_name || 'Nasabah BSS',
              customerUsername: cData?.username || 'nasabah',
              officerName: 'Petugas Jaga Pos',
              totalWeight: Number(newTx.total_weight),
              totalAmount: Number(newTx.total_amount),
              createdAt: newTx.created_at,
            };

            setShiftTransactions((prev) => {
              if (prev.some((p) => p.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
          }
        }
      )
      .subscribe();

    async function loadData() {
      setIsLoadingInitial(true);
      setErrorMessage(null);

      try {
        const data = await getPetugasData();
        if (isMounted) {
          if (data.currentOfficer) setCurrentOfficer(data.currentOfficer);
          setCategories(data.categories || []);
          setCustomers(data.customers || []);
          setShiftTransactions(data.shiftTransactions || []);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat data awal.';
        if (isMounted) setErrorMessage(msg);
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      supabase.removeChannel(catChannel);
      supabase.removeChannel(txChannel);
    };
  }, [supabase]);

  // Handle customer selection and load their balance
  const handleSelectCustomer = async (customer: Profile | null) => {
    setSelectedCustomer(customer);
    if (!customer) {
      setCustomerBalance(null);
      return;
    }

    const data = await getCustomerBalance(customer.id);
    setCustomerBalance(data || null);
  };

  // Handler adding item to deposit draft
  const handleAddItem = (item: {
    category: WasteCategory;
    weight: number;
    subtotal: number;
  }) => {
    soundManager.playClickTone();
    const newItem: DepositDraftItem = {
      id: crypto.randomUUID(),
      category: item.category,
      weight: item.weight,
      subtotal: item.subtotal,
    };
    setDepositItems((prev) => [...prev, newItem]);
  };

  // Handler removing item
  const handleRemoveItem = (id: string) => {
    soundManager.playClickTone();
    setDepositItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Total accumulation for sticky bar
  const totalWeight = depositItems.reduce((acc, curr) => acc + curr.weight, 0);
  const totalAmount = depositItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Handler submitting the transaction to Server Action
  const handleSubmitDeposit = () => {
    if (!selectedCustomer) {
      setErrorMessage('Pilih nasabah terlebih dahulu.');
      return;
    }

    if (depositItems.length === 0) {
      setErrorMessage('Daftar setoran sampah masih kosong.');
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const itemsPayload = depositItems.map((item) => ({
        wasteCategoryId: item.category.id,
        weight: item.weight,
      }));

      const result = await saveTransactionAction({
        customerId: selectedCustomer.id,
        officerId: currentOfficer?.id,
        items: itemsPayload,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Gagal menyimpan transaksi.');
      } else {
        // Success audio feedback
        soundManager.playSuccessChime();

        const curBal = Number(customerBalance?.current_balance || 0);
        const curWeight = Number(customerBalance?.total_weight_kg || 0);
        const finalTxAmount = result.totalAmount || totalAmount;
        const finalTxWeight = result.totalWeight || totalWeight;

        // Optimistically update customer balance
        if (customerBalance) {
          setCustomerBalance({
            ...customerBalance,
            current_balance: curBal + finalTxAmount,
            total_weight_kg: Math.round((curWeight + finalTxWeight) * 100) / 100,
          });
        }

        // Optimistically prepend to shift transactions
        const newShiftItem: ShiftTransaction = {
          id: crypto.randomUUID(),
          invoiceCode: result.invoiceCode || 'BSS-XXXX',
          customerName: selectedCustomer.full_name,
          customerUsername: selectedCustomer.username,
          officerName: currentOfficer?.full_name || 'Petugas Jaga Pos Timbang',
          totalWeight: finalTxWeight,
          totalAmount: finalTxAmount,
          createdAt: new Date().toISOString(),
        };

        setShiftTransactions((prev) => {
          if (prev.some((p) => p.invoiceCode === newShiftItem.invoiceCode)) return prev;
          return [newShiftItem, ...prev];
        });

        // Populate receipt data
        const generatedReceipt: CompletedReceipt = {
          invoiceCode: result.invoiceCode || 'BSS-XXXX',
          customerName: selectedCustomer.full_name,
          customerUsername: selectedCustomer.username,
          officerName: currentOfficer?.full_name || 'Petugas Jaga Pos Timbang',
          date: new Date().toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          items: depositItems.map((it) => ({
            name: it.category.name,
            weight: it.weight,
            pricePerKg: Number(it.category.price_per_kg),
            subtotal: it.subtotal,
          })),
          totalWeight: finalTxWeight,
          totalAmount: finalTxAmount,
          newBalance: curBal + finalTxAmount,
        };

        setReceiptData(generatedReceipt);

        // Open digital receipt modal immediately
        setIsReceiptModalOpen(true);

        // Reset draft inputs
        setDepositItems([]);
      }
    });
  };

  // Handler starting a new deposit session
  const handleResetForNext = () => {
    setIsReceiptModalOpen(false);
    setReceiptData(null);
    setDepositItems([]);
    setSelectedCustomer(null);
    setCustomerBalance(null);
    setErrorMessage(null);
  };

  // Shift Aggregations
  const shiftTotalDana = useMemo(() => {
    return shiftTransactions.reduce((acc, t) => acc + t.totalAmount, 0);
  }, [shiftTransactions]);

  const shiftTotalBerat = useMemo(() => {
    return shiftTransactions.reduce((acc, t) => acc + t.totalWeight, 0);
  }, [shiftTransactions]);

  const filteredShiftTxs = useMemo(() => {
    if (!shiftSearchQuery.trim()) return shiftTransactions;
    const q = shiftSearchQuery.toLowerCase();
    return shiftTransactions.filter(
      (t) =>
        t.invoiceCode.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerUsername.toLowerCase().includes(q)
    );
  }, [shiftTransactions, shiftSearchQuery]);

  // 1. Loading Skeleton State
  if (isLoadingInitial) {
    return (
      <div className="space-y-4 animate-pulse pb-24 max-w-4xl mx-auto">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-10 bg-slate-100 rounded-xl" />
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-12 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pb-32 max-w-4xl mx-auto">
      {/* Header Info Operasional Pos & Status Shift */}
      <div className="card-luxury p-6 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
                Layanan Penimbangan Pagi (08:00 - 15:00 WIB)
              </span>
              <span className="text-xs text-stone-400 font-medium">• Meja Layanan Kampus A</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#064E3B] tracking-tight flex items-center gap-2 mt-1">
              Meja Layanan Penimbangan Syariah
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-stone-500">
              {currentOfficer ? `Petugas Layanan: ${currentOfficer.full_name}` : 'Petugas Meja Layanan'} • Akad Wadiah Yad Dhamanah
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF8F5] text-[#064E3B] text-xs font-bold border border-[#D4AF37]/40 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#064E3B] animate-pulse" />
              Tera Timbangan Digital Terverifikasi
            </span>
          </div>
        </div>

        {/* Tab Switcher: Loket Timbang Syariah vs Buku Layanan Harian */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => {
              soundManager.playClickTone();
              setActiveTab('kasir');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'kasir'
                ? 'bg-[#064E3B] text-white shadow-sm border border-[#D4AF37]/40'
                : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Loket Timbang Syariah</span>
            {depositItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-stone-900 text-[10px] font-black">
                {depositItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundManager.playClickTone();
              setActiveTab('shift');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'shift'
                ? 'bg-[#064E3B] text-white shadow-sm border border-[#D4AF37]/40'
                : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Buku Layanan Harian</span>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold">
              {shiftTransactions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Error Alert State */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-bold">Pemberitahuan Sistem: </span>
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 font-bold ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: KASIR SETORAN POS */}
      {activeTab === 'kasir' && (
        <>
          {/* Grid: Selector & Calculator */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Customer Selector & Step 3 Draft Items */}
            <div className="space-y-4">
              <CustomerSelector
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={handleSelectCustomer}
                customerBalance={customerBalance}
              />

              {/* Step 3: Draft Items Summary */}
              <DepositSummaryList
                items={depositItems}
                onRemoveItem={handleRemoveItem}
              />
            </div>

            {/* Step 2: Smart Calculator Component */}
            <div>
              <SmartCalculator
                categories={categories}
                onAddItem={handleAddItem}
                isCustomerSelected={Boolean(selectedCustomer)}
              />
            </div>
          </div>

          {/* Sticky Bottom Bar for Submission */}
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#D4AF37]/30 p-3 sm:p-4 shadow-2xl">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center shrink-0 font-bold shadow-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                    Total Titipan Wadiah ({depositItems.length} Komoditas)
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base sm:text-lg font-black text-[#064E3B] tabular-nums">
                      {formatRupiah(totalAmount)}
                    </span>
                    <span className="text-xs text-stone-500 font-bold tabular-nums">
                      • {formatWeight(totalWeight)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedCustomer || depositItems.length === 0 || isPending}
                onClick={handleSubmitDeposit}
                className="px-5 sm:px-7 py-3 rounded-2xl bg-gradient-to-r from-[#064E3B] to-[#022C22] hover:brightness-110 disabled:bg-stone-200 text-[#F7F2E7] disabled:text-stone-400 font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all shrink-0 border border-[#D4AF37]/40"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengesahkan...</span>
                  </>
                ) : (
                  <>
                    <span>Sahkan Setoran Wadiah</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: RIWAYAT BUKU LAYANAN HARIAN */}
      {activeTab === 'shift' && (
        <div className="space-y-4">
          {/* Shift Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Total Tabungan Layanan
                </span>
                <DollarSign className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div className="text-2xl font-black text-[#064E3B] tabular-nums">
                {formatRupiah(shiftTotalDana)}
              </div>
              <p className="text-[10px] text-stone-400">Total titipan wadiah disahkan hari ini</p>
            </div>

            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Volume Ditimbang
                </span>
                <Scale className="w-4 h-4 text-[#064E3B]" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {formatWeight(Math.round(shiftTotalBerat * 100) / 100)}
              </div>
              <p className="text-[10px] text-stone-400">Komoditas terpilah masuk hari ini</p>
            </div>

            <div className="card-luxury p-5 rounded-3xl border border-[#D4AF37]/30 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-stone-400">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Nasabah Dilayani
                </span>
                <Users className="w-4 h-4 text-[#064E3B]" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {shiftTransactions.length} Transaksi
              </div>
              <p className="text-[10px] text-stone-400">Slip mutasi resmi disahkan</p>
            </div>
          </div>

          {/* Action Header & Search */}
          <div className="card-luxury p-4 rounded-3xl border border-[#D4AF37]/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={shiftSearchQuery}
                onChange={(e) => setShiftSearchQuery(e.target.value)}
                placeholder="Cari kode transaksi atau nama nasabah hari ini..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B] text-stone-900 shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                soundManager.playClickTone();
                setIsZReportModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#F7F2E7] text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95 shrink-0 border border-[#D4AF37]/30"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
              <span>Cetak Berita Acara Layanan (Z-Report)</span>
            </button>
          </div>

          {/* Shift Transactions List */}
          <div className="card-luxury rounded-3xl border border-[#D4AF37]/30 shadow-xs overflow-hidden">
            {filteredShiftTxs.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400 space-y-2">
                <Layers className="w-8 h-8 text-stone-300 mx-auto" />
                <div className="font-bold text-stone-600">Belum Ada Transaksi Pada Sesi Layanan Ini</div>
                <p className="text-[11px]">Buka tab Loket Timbang Syariah untuk mulai melayani nasabah.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredShiftTxs.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] flex items-center justify-center font-bold text-xs shrink-0 border border-[#064E3B]/20">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-stone-900">
                            {tx.invoiceCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                            Sah Wadiah
                          </span>
                        </div>
                        <div className="text-xs text-stone-700 font-bold truncate mt-0.5">
                          {tx.customerName}{' '}
                          <span className="text-[11px] text-stone-400 font-normal">
                            (@{tx.customerUsername})
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Pukul{' '}
                          {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          WIB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-black text-[#064E3B] tabular-nums">
                          +{formatRupiah(tx.totalAmount)}
                        </div>
                        <div className="text-[11px] text-stone-500 font-bold tabular-nums">
                          {formatWeight(tx.totalWeight)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundManager.playClickTone();
                          setReceiptData({
                            invoiceCode: tx.invoiceCode,
                            customerName: tx.customerName,
                            customerUsername: tx.customerUsername,
                            officerName: currentOfficer?.full_name || 'Petugas Meja Layanan',
                            date: new Date(tx.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                            items: [
                              {
                                name: 'Komoditas Daur Ulang Terpilah',
                                weight: tx.totalWeight,
                                pricePerKg: Math.round(tx.totalAmount / (tx.totalWeight || 1)),
                                subtotal: tx.totalAmount,
                              },
                            ],
                            totalWeight: tx.totalWeight,
                            totalAmount: tx.totalAmount,
                            newBalance: tx.totalAmount,
                          });
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/30 bg-white hover:bg-[#FAF8F5] text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#064E3B]" />
                        <span>Cetak Ulang</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Digital Thermal Receipt Modal (BSS E-Receipt) */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-sm rounded-3xl shadow-2xl border border-[#D4AF37]/40 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="p-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-white/70">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#064E3B] animate-pulse" />
                <span className="text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                  Bukti Setoran Wadiah Digital Resmi
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetForNext}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip Styled Content */}
            <div className="p-6 space-y-4 overflow-y-auto font-mono text-xs text-stone-800">
              {/* Slip Header */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-[#D4AF37]/40">
                <div className="font-black text-sm text-[#064E3B] tracking-wider">
                  BANK SAMPAH SYARIAH (BSS)
                </div>
                <div className="text-[10px] text-stone-500">
                  UIN SUNAN AMPEL SURABAYA
                </div>
                <div className="text-[10px] text-[#C5A059] font-bold">
                  AKAD WADIAH YAD DHAMANAH • DSN-MUI NO. 01/2000
                </div>
                <div className="text-[9px] text-stone-400 font-sans">
                  Jl. Ahmad Yani No. 117, Wonocolo, Surabaya
                </div>
              </div>

              {/* Barcode Simulator */}
              <div className="text-center py-1 space-y-1">
                <div className="font-mono text-xs tracking-widest font-extrabold text-stone-900">
                  {receiptData.invoiceCode}
                </div>
                <div className="flex justify-center items-center gap-0.5 h-7">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 1, 3, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-[#064E3B] h-full"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Metadata Info */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">Waktu:</span>
                  <span>{receiptData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Nasabah:</span>
                  <span className="font-bold text-stone-900">
                    {receiptData.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Akun:</span>
                  <span>@{receiptData.customerUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Petugas:</span>
                  <span>{receiptData.officerName}</span>
                </div>
              </div>

              {/* Items Line by Line Table */}
              <div className="border-t-2 border-b-2 border-dashed border-[#D4AF37]/40 py-2.5 space-y-2">
                <div className="text-[10px] uppercase font-bold text-stone-400 pb-1">
                  Rincian Komoditas
                </div>
                {receiptData.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-stone-900 truncate">
                      {item.name}
                    </div>
                    <div className="flex justify-between text-stone-600 text-[11px]">
                      <span>
                        {formatWeight(item.weight)} × {formatRupiah(item.pricePerKg)}
                      </span>
                      <span className="font-bold text-stone-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Totals */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-stone-600 text-xs">
                  <span>Total Berat:</span>
                  <span className="font-bold text-stone-900">
                    {formatWeight(receiptData.totalWeight)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-[#064E3B]">
                  <span>Total Setoran:</span>
                  <span>{formatRupiah(receiptData.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-stone-200">
                  <span className="text-stone-500">Saldo Akhir Wadiah:</span>
                  <span className="font-bold text-stone-900">
                    {formatRupiah(receiptData.newBalance)}
                  </span>
                </div>
              </div>

              {/* Thermal Tear Footer Quote */}
              <div className="text-center text-[10px] text-stone-400 pt-2 border-t border-dashed border-[#D4AF37]/30 leading-relaxed font-sans">
                &ldquo;Barangsiapa memelihara kelestarian bumi, ia menjaga amanah Allah.&rdquo;
                <div className="font-bold text-[#064E3B] mt-1">
                  Terima kasih telah menabung di BSS UINSA
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2 font-sans">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-3 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = `*BUKTI SETORAN WADIAH BSS UINSA*\nNo: ${receiptData.invoiceCode}\nNasabah: ${receiptData.customerName}\nTotal Berat: ${formatWeight(receiptData.totalWeight)}\nTotal Tabungan: ${formatRupiah(receiptData.totalAmount)}\nSaldo Baru: ${formatRupiah(receiptData.newBalance)}\n\n_Semoga menjadi berkah dan amal jariyah kelestarian bumi._`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs border border-[#D4AF37]/30"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Kirim WA</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#022C22] hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 border border-[#D4AF37]/40"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Selesai / Timbang Nasabah Baru</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Berita Acara Shift (Z-Report) */}
      {isZReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-md rounded-3xl shadow-2xl border border-[#D4AF37]/40 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-[#D4AF37]/20 flex items-center justify-between bg-white/70">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#064E3B]" />
                <span className="text-xs font-bold text-stone-800">
                  Berita Acara Rekapitulasi Layanan (Z-Report)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsZReportModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs font-mono">
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-[#D4AF37]/40">
                <div className="font-black text-sm text-[#064E3B]">BERITA ACARA TUTUP BUKU LAYANAN</div>
                <div className="text-[10px] text-stone-500">BANK SAMPAH SYARIAH UINSA</div>
                <div className="text-[9px] text-stone-400">
                  Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-stone-400">Petugas Layanan:</span>
                  <span className="font-bold text-stone-900">
                    {currentOfficer?.full_name || 'Petugas Meja Layanan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Lokasi Layanan:</span>
                  <span>Meja Layanan Utama Kampus A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Sesi Penimbangan:</span>
                  <span className="font-bold text-stone-900">{shiftTransactions.length} Transaksi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Total Komoditas:</span>
                  <span className="font-bold text-stone-900">
                    {formatWeight(Math.round(shiftTotalBerat * 100) / 100)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-stone-200">
                  <span className="font-bold text-stone-900">Total Nilai Tabungan:</span>
                  <span className="font-black text-[#064E3B]">{formatRupiah(shiftTotalDana)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/30 text-[11px] font-sans text-stone-700 space-y-1 shadow-2xs">
                <div className="font-bold flex items-center gap-1.5 text-[#064E3B]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#064E3B]" />
                  Pernyataan Amanah Syariah:
                </div>
                <p className="leading-relaxed">
                  Seluruh fisik sampah telah ditimbang secara adil &amp; presisi, serta saldo wadiah telah terkreditasi secara otomatis ke rekening nasabah sesuai ketentuan DSN-MUI.
                </p>
              </div>

              <div className="pt-2 font-sans grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-[#064E3B]" />
                  <span>Cetak Rekap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZReportModalOpen(false)}
                  className="py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-white font-bold text-xs transition-all border border-[#D4AF37]/30"
                >
                  Tutup Laporan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
