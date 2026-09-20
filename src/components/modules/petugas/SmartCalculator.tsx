'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Scale, Plus, RotateCcw } from 'lucide-react';
import type { WasteCategory } from '@/types/database';
import { formatRupiah } from '@/lib/utils';

interface SmartCalculatorProps {
  categories: WasteCategory[];
  onAddItem: (item: { category: WasteCategory; weight: number; subtotal: number }) => void;
  isCustomerSelected: boolean;
}

export function SmartCalculator({
  categories,
  onAddItem,
  isCustomerSelected,
}: SmartCalculatorProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [unit, setUnit] = useState<'kg' | 'gram'>('kg');
  const [weightStr, setWeightStr] = useState<string>('');
  const weightInputRef = useRef<HTMLInputElement>(null);

  // Derive active category from selected ID or default to first category
  const activeCategoryId = selectedId || categories[0]?.id || '';

  // Focus input whenever customer is selected or category changes
  useEffect(() => {
    if (isCustomerSelected && weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, [isCustomerSelected, activeCategoryId]);

  const selectedCategory = categories.find((c) => c.id === activeCategoryId);
  const currentPrice = selectedCategory ? Number(selectedCategory.price_per_kg) : 0;
  
  const rawInputWeight = parseFloat(weightStr) || 0;
  // Normalized weight in kg for calculations & database storage
  const effectiveWeightKg = unit === 'gram' 
    ? Math.round((rawInputWeight / 1000) * 1000) / 1000 
    : rawInputWeight;

  const subtotal = Math.round(effectiveWeightKg * currentPrice);

  const handleUnitToggle = (newUnit: 'kg' | 'gram') => {
    if (newUnit === unit) return;
    const current = parseFloat(weightStr);
    if (!isNaN(current) && current > 0) {
      if (newUnit === 'gram') {
        // kg to gram
        setWeightStr(Math.round(current * 1000).toString());
      } else {
        // gram to kg
        setWeightStr((Math.round((current / 1000) * 100) / 100).toString());
      }
    }
    setUnit(newUnit);
    weightInputRef.current?.focus();
  };

  const handleAddWeight = (increment: number) => {
    const current = parseFloat(weightStr) || 0;
    const next = unit === 'gram'
      ? Math.round(current + increment)
      : Math.round((current + increment) * 100) / 100;
    setWeightStr(next.toString());
  };

  const handleResetWeight = () => {
    setWeightStr('');
    weightInputRef.current?.focus();
  };

  const handleAddItemToDeposit = () => {
    if (!selectedCategory || effectiveWeightKg <= 0) return;

    onAddItem({
      category: selectedCategory,
      weight: effectiveWeightKg,
      subtotal,
    });

    // Reset weight for next item
    setWeightStr('');
    weightInputRef.current?.focus();
  };

  return (
    <div className="card-luxury rounded-3xl p-5 border border-[#D4AF37]/30 shadow-xs space-y-5">
      {/* Header Kalkulator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/40 shadow-2xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-stone-900">
              Langkah 2: Penimbangan Presisi &amp; Takasir Syariah
            </h2>
            <p className="text-xs text-stone-500">
              Pilih jenis komoditas sampah dan masukkan bobot timbangan digital
            </p>
          </div>
        </div>
      </div>

      {/* Grid Pilihan Kategori Sampah */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-700">
          Komoditas Sampah Terpilah
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {categories.map((cat) => {
            const isSelected = cat.id === activeCategoryId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex flex-col justify-between min-h-[76px] ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#064E3B]/10 text-stone-900 ring-2 ring-[#064E3B]/25 shadow-sm'
                    : 'border-[#D4AF37]/20 bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 text-stone-700 hover:border-[#D4AF37]/50'
                }`}
              >
                <div className="text-xs font-bold line-clamp-2">
                  {cat.name}
                </div>
                <div className="text-xs font-black text-[#064E3B] mt-1 tabular-nums">
                  {formatRupiah(Number(cat.price_per_kg))}
                  <span className="text-[10px] font-normal text-stone-500"> /kg</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Berat, Satuan (Kg/Gram), & Quick Chips */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <label htmlFor="weight-input" className="text-xs font-bold text-stone-700">
              Berat Timbangan
            </label>
            {/* Unit Selector Toggle (FR-CALC-004) */}
            <div className="inline-flex p-0.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleUnitToggle('kg')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  unit === 'kg'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Kg
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('gram')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  unit === 'gram'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Gram
              </button>
            </div>
          </div>

          {rawInputWeight > 0 && (
            <button
              type="button"
              onClick={handleResetWeight}
              className="text-xs text-stone-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="relative">
          <input
            id="weight-input"
            ref={weightInputRef}
            type="number"
            inputMode="decimal"
            step={unit === 'gram' ? '1' : '0.01'}
            min="0"
            placeholder={unit === 'gram' ? '0' : '0.00'}
            value={weightStr}
            onChange={(e) => setWeightStr(e.target.value)}
            disabled={!isCustomerSelected}
            className={`w-full px-4 py-3.5 text-2xl font-black rounded-2xl border tabular-nums transition-all focus:outline-none focus:ring-2 focus:ring-[#064E3B] ${
              !isCustomerSelected
                ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-[#FAF8F5] border-[#D4AF37]/30 text-stone-900 focus:bg-white shadow-inner'
            }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
            {unit === 'gram' ? 'gram' : 'kg'}
          </span>
        </div>

        {/* Quick Chips Penambah Berat */}
        <div className="flex items-center gap-2 pt-0.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-stone-400 shrink-0 font-medium">Pintasan:</span>
          {unit === 'kg'
            ? [0.5, 1, 2, 5].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={!isCustomerSelected}
                  onClick={() => handleAddWeight(amt)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FAF8F5] hover:bg-[#064E3B]/10 text-stone-700 hover:text-[#064E3B] border border-stone-200 hover:border-[#D4AF37]/50 active:scale-[0.96] transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                >
                  +{amt} kg
                </button>
              ))
            : [100, 250, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={!isCustomerSelected}
                  onClick={() => handleAddWeight(amt)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FAF8F5] hover:bg-[#064E3B]/10 text-stone-700 hover:text-[#064E3B] border border-stone-200 hover:border-[#D4AF37]/50 active:scale-[0.96] transition-all disabled:opacity-50 disabled:pointer-events-none shrink-0"
                >
                  +{amt} g
                </button>
              ))}
        </div>
      </div>

      {/* Tampilan Reaktif Subtotal Kalkulasi Rupiah */}
      <div className="p-4 rounded-2xl card-luxury-emerald text-white border border-[#D4AF37]/40 flex items-center justify-between shadow-md">
        <div>
          <div className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
            Subtotal Takasir Wadiah
          </div>
          <div className="text-xs text-emerald-100/90 mt-0.5">
            {unit === 'gram' ? (
              <span>
                {rawInputWeight} g ({effectiveWeightKg} kg) × {formatRupiah(currentPrice)}/kg
              </span>
            ) : (
              <span>
                {effectiveWeightKg} kg × {formatRupiah(currentPrice)}/kg
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-black text-white tabular-nums">
            {formatRupiah(subtotal)}
          </div>
        </div>
      </div>

      {/* Tombol Tambahkan ke Daftar Setoran */}
      <button
        type="button"
        disabled={!isCustomerSelected || effectiveWeightKg <= 0}
        onClick={handleAddItemToDeposit}
        className="w-full min-h-[48px] py-3 px-4 bg-[#064E3B] hover:bg-[#022C22] disabled:bg-stone-200 text-[#F7F2E7] disabled:text-stone-400 font-bold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-[#D4AF37]/40"
      >
        <Plus className="w-4 h-4 text-[#D4AF37]" />
        Tambahkan ke Daftar Setoran
      </button>
    </div>
  );
}
