'use client';

import React from 'react';
import { Trash2, ShoppingBag, Package } from 'lucide-react';
import type { WasteCategory } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';

export interface DepositDraftItem {
  id: string; // temporary client UUID
  category: WasteCategory;
  weight: number;
  subtotal: number;
}

interface DepositSummaryListProps {
  items: DepositDraftItem[];
  onRemoveItem: (id: string) => void;
}

export function DepositSummaryList({
  items,
  onRemoveItem,
}: DepositSummaryListProps) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="card-luxury rounded-3xl p-8 border border-dashed border-[#D4AF37]/40 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#064E3B]/10 text-[#064E3B] mx-auto flex items-center justify-center mb-2.5 border border-[#064E3B]/20">
          <ShoppingBag className="w-5 h-5 text-[#064E3B]" />
        </div>
        <h3 className="text-sm font-bold text-stone-800">
          Daftar Timbangan Masih Kosong
        </h3>
        <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
          Gunakan Kalkulator Pintar di atas untuk menimbang dan menambahkan komoditas sampah nasabah.
        </p>
      </div>
    );
  }

  return (
    <div className="card-luxury rounded-3xl p-5 border border-[#D4AF37]/30 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <Package className="w-4 h-4 text-[#064E3B]" />
          <h3 className="text-sm font-black text-stone-900">
            Daftar Setoran Wadiah ({items.length} komoditas)
          </h3>
        </div>
      </div>

      {/* Daftar Item Setoran */}
      <div className="space-y-2 max-h-72 overflow-y-auto divide-y divide-stone-100">
        {items.map((item) => (
          <div
            key={item.id}
            className="pt-2.5 pb-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] p-2 rounded-2xl transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-bold text-stone-900 truncate">
                {item.category.name}
              </div>
              <div className="text-xs text-stone-500 tabular-nums">
                {formatWeight(item.weight)} × {formatRupiah(Number(item.category.price_per_kg))}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-black text-[#064E3B] tabular-nums">
                {formatRupiah(item.subtotal)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="w-8 h-8 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center active:scale-[0.95] transition-all"
                title="Hapus item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Akumulasi Total */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between card-luxury-emerald text-white p-4 rounded-2xl border border-[#D4AF37]/40 shadow-xs text-xs">
        <div>
          <span className="text-emerald-200/80">Total Berat:</span>{' '}
          <span className="font-black text-white tabular-nums text-sm">
            {formatWeight(Math.round(totalWeight * 100) / 100)}
          </span>
        </div>
        <div>
          <span className="text-[#D4AF37]">Total Tabungan:</span>{' '}
          <span className="font-black text-white text-base tabular-nums">
            {formatRupiah(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
