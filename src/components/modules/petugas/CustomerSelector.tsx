'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Wallet } from 'lucide-react';
import type { Profile, Balance } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';

interface CustomerSelectorProps {
  customers: Profile[];
  selectedCustomer: Profile | null;
  onSelectCustomer: (customer: Profile | null) => void;
  customerBalance?: Balance | null;
  isLoading?: boolean;
}

export function CustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  customerBalance,
  isLoading = false,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(query) ||
        c.username.toLowerCase().includes(query) ||
        (c.phone_number && c.phone_number.includes(query))
    );
  }, [customers, searchQuery]);

  // If a customer is already selected, display the customer card
  if (selectedCustomer) {
    return (
      <div className="card-luxury rounded-3xl p-5 border border-[#D4AF37]/40 shadow-sm transition-all">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
              {selectedCustomer.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-stone-900 truncate text-sm">
                  {selectedCustomer.full_name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
                  Nasabah Prioritas
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate">
                @{selectedCustomer.username} {selectedCustomer.phone_number ? `• ${selectedCustomer.phone_number}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectCustomer(null);
              setIsOpen(true);
            }}
            className="shrink-0 px-3.5 py-1.5 text-xs font-bold text-[#064E3B] hover:text-[#022C22] bg-[#FAF8F5] hover:bg-[#064E3B]/10 rounded-xl border border-[#D4AF37]/40 active:scale-95 transition-all"
          >
            Ganti Nasabah
          </button>
        </div>

        {/* Info Saldo Terkini */}
        <div className="mt-3.5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <Wallet className="w-4 h-4 text-[#C5A059]" />
            <span>Saldo Wadiah:</span>
            <span className="font-black text-[#064E3B] tabular-nums">
              {customerBalance ? formatRupiah(Number(customerBalance.current_balance)) : 'Rp 0'}
            </span>
          </div>
          <div className="text-stone-500">
            Total Setor:{' '}
            <span className="font-bold text-stone-800 tabular-nums">
              {customerBalance ? formatWeight(Number(customerBalance.total_weight_kg)) : '0 kg'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-luxury rounded-3xl p-5 border border-[#D4AF37]/30 shadow-xs relative">
      <label
        htmlFor="customer-search-input"
        className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2"
      >
        Langkah 1: Identifikasi Nasabah Wadiah
      </label>

      {/* Input Pencarian */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          id="customer-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari nama, NIM, atau nomor HP nasabah..."
          className="w-full pl-10 pr-10 py-3 text-sm bg-[#FAF8F5] border border-[#D4AF37]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064E3B] focus:bg-white transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown Hasil Pencarian */}
      {isOpen && (
        <div className="mt-2 border border-[#D4AF37]/30 rounded-2xl bg-white shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-stone-100 z-20">
          {isLoading ? (
            <div className="p-4 space-y-2">
              <div className="h-4 bg-stone-200 animate-pulse rounded w-3/4" />
              <div className="h-3 bg-stone-100 animate-pulse rounded w-1/2" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500">
              Tidak ada nasabah ditemukan dengan kata kunci &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => {
                  onSelectCustomer(customer);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
                className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-[#FAF8F5] active:bg-[#064E3B]/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center font-bold text-xs shrink-0 border border-[#D4AF37]/30">
                    {customer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-stone-900">
                      {customer.full_name}
                    </div>
                    <div className="text-xs text-stone-500">
                      @{customer.username} {customer.phone_number ? `• ${customer.phone_number}` : ''}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#064E3B] font-bold flex items-center gap-1">
                  Pilih
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
