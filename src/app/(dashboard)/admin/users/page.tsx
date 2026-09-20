'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Balance, UserRole } from '@/types/database';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { createUserAction } from './actions';
import { getAllUsers } from '@/lib/data-actions';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  RefreshCw,
  Phone,
  Wallet,
  Scale,
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  UserCheck,
  Building,
} from 'lucide-react';

interface ExtendedProfile extends Profile {
  balance?: Balance | null;
}

export default function AdminUsersPage() {
  const [supabase] = useState(() => createClient());

  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    role: 'nasabah' as UserRole,
    password: '',
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const extended = await getAllUsers();
        if (isMounted) {
          setUsers(extended);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [supabase, refreshTrigger]);

  const handleRefreshUsers = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole =
        selectedRoleFilter === 'all' ? true : u.role === selectedRoleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.phone_number && u.phone_number.includes(q));

      return matchRole && matchSearch;
    });
  }, [users, selectedRoleFilter, searchQuery]);

  // Count by role
  const counts = useMemo(() => {
    return {
      all: users.length,
      nasabah: users.filter((u) => u.role === 'nasabah').length,
      petugas: users.filter((u) => u.role === 'petugas').length,
      bendahara: users.filter((u) => u.role === 'bendahara').length,
      admin: users.filter((u) => u.role === 'admin').length,
    };
  }, [users]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await createUserAction({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        role: formData.role,
        password: formData.password || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal menambahkan pengguna.');
        return;
      }

      setFormSuccess(`Akun ${formData.fullName} (${formData.role}) berhasil didaftarkan!`);
      // Reset form
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phoneNumber: '',
        role: 'nasabah',
        password: '',
      });

      // Reload users list
      handleRefreshUsers();

      // Close modal after brief timeout
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#927318] border border-[#D4AF37]/40">
            <ShieldAlert className="w-3 h-3 text-[#927318]" /> Administrator
          </span>
        );
      case 'bendahara':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
            <Building className="w-3 h-3 text-[#064E3B]" /> Bendahara Syariah
          </span>
        );
      case 'petugas':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
            <UserCheck className="w-3 h-3 text-[#064E3B]" /> Petugas Layanan
          </span>
        );
      case 'nasabah':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#064E3B]/10 text-[#064E3B] border border-[#D4AF37]/30">
            <Shield className="w-3 h-3 text-[#064E3B]" /> Nasabah Wadiah
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="card-luxury p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#064E3B] font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard Eksekutif
            </Link>
            <span className="text-stone-300">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
              Otoritas Pengguna
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight flex items-center gap-2">
            Manajemen Akun Sivitas &amp; Pengguna
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Daftar nasabah sivitas akademika, petugas layanan timbang, bendahara, dan administrator sistem perbankan syariah UINSA.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefreshUsers}
            disabled={isLoading}
            className="h-10 px-4 rounded-xl border border-[#D4AF37]/40 bg-white hover:bg-[#FAF8F5] text-stone-800 text-xs font-bold flex items-center gap-2 transition-all shadow-2xs hover:border-[#D4AF37]"
            title="Segarkan data pengguna"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#064E3B] ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setIsModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#FAF8F5] text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] border border-[#D4AF37]/40"
          >
            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-luxury p-5 space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pengguna, username (@), atau nomor kontak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Semua Akun', count: counts.all },
            { id: 'nasabah', label: 'Nasabah Wadiah', count: counts.nasabah },
            { id: 'petugas', label: 'Petugas Layanan', count: counts.petugas },
            { id: 'bendahara', label: 'Bendahara Syariah', count: counts.bendahara },
            { id: 'admin', label: 'Administrator', count: counts.admin },
          ].map((tab) => {
            const isActive = selectedRoleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#064E3B] text-[#FAF8F5] border-[#D4AF37]/50 shadow-xs'
                    : 'bg-[#FAF8F5] hover:bg-white text-stone-600 border-[#D4AF37]/25 hover:border-[#D4AF37]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Cards / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="card-luxury p-5 animate-pulse flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-stone-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-stone-200 rounded w-1/2" />
                <div className="h-3 bg-stone-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card-luxury p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D4AF37]/30 text-stone-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 text-[#064E3B]" />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-800">
            Tidak ada pengguna ditemukan
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ditemukan akun yang cocok dengan kata kunci "${searchQuery}".`
              : 'Belum ada akun untuk filter ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="card-luxury p-5 hover:border-[#D4AF37] transition-all hover:shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#064E3B] text-[#D4AF37] font-serif font-black text-sm flex items-center justify-center shrink-0 border border-[#D4AF37]/40 shadow-xs">
                    {getInitials(user.full_name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-stone-900 truncate">
                      {user.full_name}
                    </h3>
                    <div className="text-xs text-stone-500 font-mono truncate">
                      @{user.username}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">{getRoleBadge(user.role)}</div>
              </div>

              {/* Specific info: Balance & Weight for Nasabah */}
              {user.role === 'nasabah' && user.balance && (
                <div className="grid grid-cols-2 gap-2.5 bg-[#FAF8F5] p-3 rounded-2xl border border-[#D4AF37]/25 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-[#064E3B]" /> Titipan Wadiah
                    </div>
                    <div className="font-serif font-black text-[#064E3B] tabular-nums text-sm">
                      {formatRupiah(Number(user.balance.current_balance))}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-stone-500 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-[#D4AF37]" /> Total Terkelola
                    </div>
                    <div className="font-serif font-black text-stone-800 tabular-nums text-sm">
                      {formatWeight(Number(user.balance.total_weight_kg))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Meta info */}
              <div className="pt-2.5 border-t border-[#D4AF37]/15 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-1 truncate">
                  {user.phone_number ? (
                    <span className="flex items-center gap-1 text-stone-700 font-medium">
                      <Phone className="w-3 h-3 text-[#064E3B]" />
                      {user.phone_number}
                    </span>
                  ) : (
                    <span className="text-stone-400 italic">Tanpa kontak HP</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  <span>
                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Pengguna Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="card-luxury w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-6 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#FAF8F5]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#064E3B] text-[#D4AF37] flex items-center justify-center font-bold border border-[#D4AF37]/40 shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">
                    Tambah Pengguna Baru
                  </h2>
                  <p className="text-[11px] text-stone-500">
                    Daftarkan akun sivitas akademika atau penetapan petugas BSS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-colors border border-[#D4AF37]/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-[#064E3B]/10 border border-[#D4AF37]/40 text-[#064E3B] text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#064E3B]" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  Peran Akun (Role) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'nasabah', label: 'Nasabah' },
                    { id: 'petugas', label: 'Petugas' },
                    { id: 'bendahara', label: 'Bendahara' },
                    { id: 'admin', label: 'Admin' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.id as UserRole })}
                      className={`py-2.5 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        formData.role === r.id
                          ? 'border-[#D4AF37] bg-[#064E3B] text-[#FAF8F5] shadow-2xs'
                          : 'border-[#D4AF37]/25 text-stone-600 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Fikri"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-all bg-white shadow-2xs"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: mfikri (huruf kecil tanpa spasi)"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] font-mono transition-all bg-white shadow-2xs"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Email Akun <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: mfikri@bss.uinsa.ac.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-all bg-white shadow-2xs"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Nomor WhatsApp / Kontak (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 08123456789"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-all bg-white shadow-2xs"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">
                  Password Akun
                </label>
                <input
                  type="password"
                  placeholder="Default: password123 (jika dikosongkan)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D4AF37]/30 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B] transition-all bg-white shadow-2xs"
                />
                <p className="text-[10px] text-stone-400">
                  Minimal 6 karakter. Jika dikosongkan akan otomatis disetel ke{' '}
                  <code className="font-mono text-stone-700 font-bold">password123</code>.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-stone-600 hover:bg-[#FAF8F5] text-xs font-bold transition-all shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#064E3B] hover:bg-[#022C22] text-[#FAF8F5] text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 border border-[#D4AF37]/40"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Daftarkan Pengguna</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
