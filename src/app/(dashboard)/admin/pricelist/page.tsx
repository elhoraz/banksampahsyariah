'use client';

import React, { useEffect, useState, useMemo, useTransition } from 'react';
import type { WasteCategory } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import {
  updateWasteCategoryPriceAction,
  toggleWasteCategoryStatusAction,
} from '../actions';
import { getAllCategories } from '@/lib/data-actions';
import {
  Search,
  RefreshCw,
  Edit,
  Power,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Leaf,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPricelistPage() {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Semua');

  // Modal State for Changing Price
  const [editingCategory, setEditingCategory] = useState<WasteCategory | null>(null);
  const [newPriceStr, setNewPriceStr] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAllCategories().then((data) => {
      if (isMounted) {
        setCategories(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = c.name.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (selectedFilter === 'Aktif') return c.is_active;
      if (selectedFilter === 'Nonaktif') return !c.is_active;
      if (selectedFilter === 'Plastik')
        return c.name.toLowerCase().includes('plastik') || c.name.toLowerCase().includes('botol');
      if (selectedFilter === 'Kertas')
        return (
          c.name.toLowerCase().includes('kertas') ||
          c.name.toLowerCase().includes('kardus') ||
          c.name.toLowerCase().includes('buku')
        );
      if (selectedFilter === 'Logam')
        return (
          c.name.toLowerCase().includes('kaleng') ||
          c.name.toLowerCase().includes('logam') ||
          c.name.toLowerCase().includes('besi')
        );

      return true;
    });
  }, [categories, searchQuery, selectedFilter]);

  // Open Modal Handler
  const handleOpenEdit = (category: WasteCategory) => {
    setEditingCategory(category);
    setNewPriceStr(category.price_per_kg.toString());
    setErrorMessage(null);
  };

  // Close Modal
  const handleCloseModal = () => {
    setEditingCategory(null);
    setNewPriceStr('');
    setErrorMessage(null);
  };

  // Quick Adjustment Steps
  const handleAdjustPrice = (delta: number) => {
    const current = parseInt(newPriceStr, 10) || Number(editingCategory?.price_per_kg) || 0;
    const next = Math.max(100, current + delta);
    setNewPriceStr(next.toString());
  };

  // Submit New Price Action
  const handleSavePrice = () => {
    if (!editingCategory) return;
    const priceNum = parseInt(newPriceStr, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Masukkan nominal harga yang valid.');
      return;
    }

    setErrorMessage(null);

    startTransition(async () => {
      const res = await updateWasteCategoryPriceAction({
        categoryId: editingCategory.id,
        newPrice: priceNum,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Gagal mengubah harga.');
      } else {
        setSuccessToast(`Tarif ${editingCategory.name} berhasil diperbarui.`);
        handleCloseModal();
        handleRefresh();
        setTimeout(() => setSuccessToast(null), 4000);
      }
    });
  };

  // Toggle Status Handler
  const handleToggleStatus = (category: WasteCategory) => {
    startTransition(async () => {
      const res = await toggleWasteCategoryStatusAction(category.id, !category.is_active);
      if (res.success) {
        setSuccessToast(
          `Status ${category.name} diubah menjadi ${!category.is_active ? 'Aktif' : 'Nonaktif'}.`
        );
        handleRefresh();
        setTimeout(() => setSuccessToast(null), 3000);
      }
    });
  };

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-5 pb-24">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-[#064E3B] text-white shadow-xl flex items-center gap-3 text-xs font-bold border border-[#D4AF37]/50 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="card-luxury p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 hover:border-[#D4AF37] flex items-center justify-center text-stone-700 transition-colors shadow-2xs"
            title="Kembali ke Dashboard Eksekutif"
          >
            <ArrowLeft className="w-5 h-5 text-[#064E3B]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
                Katalog Nilai Komoditas
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-900 mt-1">
              Master Pricelist Komoditas Syariah
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Standar harga acuan per kilogram dan ketersediaan penampungan komoditas kampus UINSA.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="h-10 px-4 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-800 text-xs font-bold flex items-center gap-2 transition-all shrink-0 self-start sm:self-auto shadow-2xs hover:border-[#D4AF37]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#064E3B] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Status & Quick Insight Banner */}
      <div className="card-luxury p-5 flex items-center justify-between gap-4 bg-gradient-to-r from-[#064E3B]/5 via-white to-[#D4AF37]/10 border border-[#D4AF37]/30">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/40 shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif font-black text-sm sm:text-base text-stone-900 truncate">
                {activeCount} Komoditas Aktif Siap Terima
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tersinkron Seluruh Pos
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate mt-0.5">
              Pembaruan tarif baru akan otomatis diterapkan secara amanah pada penimbangan setoran berikutnya.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komoditas sampah (misal: botol PET, kardus, kaleng aluminium)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#D4AF37]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#064E3B] text-stone-900 shadow-2xs placeholder:text-stone-400"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['Semua', 'Aktif', 'Nonaktif', 'Plastik', 'Kertas', 'Logam'].map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setSelectedFilter(pill)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedFilter === pill
                  ? 'bg-[#064E3B] text-[#FAF8F5] border border-[#D4AF37]/50 shadow-xs'
                  : 'bg-white border border-[#D4AF37]/25 text-stone-600 hover:bg-[#FAF8F5] hover:border-[#D4AF37]/50'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Waste Pricelist Stream Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="card-luxury p-5 relative flex flex-col justify-between space-y-4 hover:border-[#D4AF37] transition-all hover:shadow-md"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-stone-600 text-[10px] font-bold border border-[#D4AF37]/25">
                  Komoditas Daur Ulang
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    cat.is_active
                      ? 'bg-[#064E3B]/10 text-[#064E3B] border-[#D4AF37]/30'
                      : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cat.is_active ? 'bg-emerald-500' : 'bg-stone-400'
                    }`}
                  />
                  {cat.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              {/* Category Name */}
              <h2 className="font-serif font-bold text-base text-stone-900 truncate">
                {cat.name}
              </h2>

              {/* Current Price Box */}
              <div className="mt-3 p-3 bg-[#FAF8F5] rounded-xl flex items-center justify-between border border-[#D4AF37]/25">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
                    Tarif Titipan Nasabah
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-serif font-black text-[#064E3B] tabular-nums">
                      {formatRupiah(Number(cat.price_per_kg))}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">/ kg</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold border border-[#D4AF37]/30">
                    <TrendingUp className="w-3 h-3 text-[#D4AF37]" /> Stabil
                  </span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-stone-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#064E3B]" />
                <span>Berlaku sah pada seluruh timbangan kampus</span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#D4AF37]/20">
              <button
                type="button"
                onClick={() => handleOpenEdit(cat)}
                className="h-10 px-3 bg-[#FAF8F5] hover:bg-white text-[#064E3B] border border-[#D4AF37]/35 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs hover:border-[#D4AF37]"
              >
                <Edit className="w-3.5 h-3.5 text-[#064E3B]" />
                <span>Ubah Tarif</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleStatus(cat)}
                className={`h-10 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs ${
                  cat.is_active
                    ? 'bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200'
                    : 'bg-[#064E3B] hover:bg-[#022C22] text-[#FAF8F5] border border-[#D4AF37]/40'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{cat.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sheet Modal: Update Tarif Baru */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          />

          <div className="relative z-10 w-full max-w-lg card-luxury rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/20">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold uppercase border border-[#D4AF37]/30">
                  Pembaruan Tarif Pasar
                </span>
                <h3 className="text-lg font-serif font-black text-stone-900 mt-1">
                  Penyesuaian Tarif Komoditas
                </h3>
                <p className="text-xs text-stone-500">
                  {editingCategory.name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors border border-[#D4AF37]/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 px-4 bg-[#FAF8F5] rounded-2xl flex items-center justify-between text-xs border border-[#D4AF37]/25">
              <span className="text-stone-500 font-medium">Harga Acuan Berlaku</span>
              <span className="font-bold text-[#064E3B] text-sm tabular-nums">
                {formatRupiah(Number(editingCategory.price_per_kg))} / kg
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="newPriceInput"
                className="text-xs font-bold text-stone-700 block"
              >
                Harga Baru per Kilogram (Rupiah)
              </label>
              <div className="relative flex items-center bg-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#064E3B] transition-all">
                <span className="text-lg font-bold text-[#064E3B] mr-2">Rp</span>
                <input
                  id="newPriceInput"
                  type="number"
                  inputMode="numeric"
                  value={newPriceStr}
                  onChange={(e) => setNewPriceStr(e.target.value)}
                  className="w-full bg-transparent text-2xl font-serif font-extrabold text-stone-900 focus:outline-none tabular-nums"
                />
                <span className="text-sm font-semibold text-stone-400 ml-2">/ kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Penyesuaian Cepat</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[100, 250, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAdjustPrice(val)}
                    className="h-9 rounded-xl bg-[#FAF8F5] hover:bg-white text-[#064E3B] border border-[#D4AF37]/30 font-bold text-xs transition-colors flex items-center justify-center active:scale-95 shadow-2xs"
                  >
                    + Rp {val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(-200)}
                  className="h-9 rounded-xl bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 font-bold text-xs transition-colors flex items-center justify-center active:scale-95 shadow-2xs"
                >
                  - Rp 200
                </button>
              </div>
            </div>

            <div className="p-3.5 bg-[#064E3B]/5 border border-[#D4AF37]/30 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
              <p className="text-xs text-stone-600 leading-relaxed">
                <strong className="font-bold text-[#064E3B]">
                  Prinsip Amanah &amp; Transparansi Syariah:
                </strong>{' '}
                Pembaruan tarif berlaku otomatis untuk seluruh penimbangan setoran baru mulai waktu konfirmasi disimpan.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSavePrice}
                className="w-full min-h-[48px] bg-[#064E3B] hover:bg-[#022C22] text-[#FAF8F5] rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:bg-stone-300 border border-[#D4AF37]/40"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Sahkan Perubahan Tarif</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full h-11 bg-transparent text-stone-500 hover:text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
