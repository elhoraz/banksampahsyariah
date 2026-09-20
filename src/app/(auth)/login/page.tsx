'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { loginAction, quickLoginAction } from './actions';
import {
  Recycle,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { soundManager } from '@/lib/audio';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Demo accounts for instant testing
  const demoAccounts = [
    {
      role: 'Nasabah',
      email: 'nasabah@bss.uinsa.ac.id',
      pass: 'password123',
      color: 'bg-[#FBF8F0] hover:bg-[#F5EFE0] text-[#78581A] border-[#D4AF37]/40',
      label: 'Nasabah',
      sub: 'Budi Santoso',
    },
    {
      role: 'Petugas',
      email: 'petugas@bss.uinsa.ac.id',
      pass: 'password123',
      color: 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-900 border-emerald-300/60',
      label: 'Petugas Pos',
      sub: 'Ahmad Pos A',
    },
    {
      role: 'Bendahara',
      email: 'bendahara@bss.uinsa.ac.id',
      pass: 'password123',
      color: 'bg-stone-50 hover:bg-stone-100 text-stone-900 border-stone-300',
      label: 'Bendahara',
      sub: 'Hj. Siti Fatimah',
    },
    {
      role: 'Admin',
      email: 'admin@bss.uinsa.ac.id',
      pass: 'password123',
      color: 'bg-[#F7F2E7] hover:bg-[#EFE8D6] text-[#614512] border-[#C5A059]/50',
      label: 'Admin BSS',
      sub: 'Dr. H. Admin',
    },
  ];

  // 1-Click Direct Demo Login
  const handleQuickLogin = async (roleName: string) => {
    soundManager.playClickTone();
    setLoadingRole(roleName);
    setErrorMessage(null);

    const targetRole = roleName.toLowerCase();
    try {
      const supabase = createClient();
      const roleEmails: Record<string, string> = {
        nasabah: 'nasabah@bss.uinsa.ac.id',
        petugas: 'petugas@bss.uinsa.ac.id',
        bendahara: 'bendahara@bss.uinsa.ac.id',
        admin: 'admin@bss.uinsa.ac.id',
      };
      const cleanEmail = roleEmails[targetRole] || `${targetRole}@bss.uinsa.ac.id`;

      // 1. Sign in with browser client to establish session & set browser cookies directly
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: 'password123',
      });

      if (signInError) {
        throw signInError;
      }

      // 2. Non-blocking server action synchronization for server-side cookies
      try {
        await quickLoginAction(targetRole);
      } catch (actionErr) {
        console.warn('Server action fallback (non-blocking):', actionErr);
      }

      soundManager.playSuccessChime();
      let quickDest = `/${targetRole}`;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const red = params.get('redirect');
        if (red && red.startsWith(`/${targetRole}`)) {
          quickDest = red;
        }
      }
      // Top-level navigation ensures fresh browser cookies are sent directly to middleware
      window.location.replace(quickDest);
    } catch (err: unknown) {
      console.error('Quick login error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kendala saat login.');
      setLoadingRole(null);
    }
  };

  // Normal Form Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }

    soundManager.playClickTone();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const cleanEmail = email.trim().toLowerCase();

      // 1. Authenticate with browser client directly
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (signInError) {
        setErrorMessage(
          signInError.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak sesuai.'
            : signInError.message
        );
        setIsLoading(false);
        return;
      }

      // 2. Determine target role
      let userRole = (data.user?.user_metadata?.role as string) || '';

      // 3. Non-blocking server action synchronization
      try {
        const res = await loginAction(cleanEmail, password);
        if (res.success && res.role) {
          userRole = res.role;
        }
      } catch (actionErr) {
        console.warn('Server action fallback (non-blocking):', actionErr);
      }

      if (!userRole && data.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        if (prof?.role) {
          userRole = prof.role;
        }
      }

      const targetRole = userRole || 'nasabah';
      soundManager.playSuccessChime();

      let formDest = `/${targetRole}`;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const red = params.get('redirect');
        if (red && red.startsWith(`/${targetRole}`)) {
          formDest = red;
        }
      }
      // Top-level navigation ensures fresh browser cookies are sent directly to middleware
      window.location.replace(formDest);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal terhubung ke server.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center items-center p-4 selection:bg-[#E8DCBE] selection:text-[#064E3B] relative overflow-hidden">
      {/* Warm Ambient Halos */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto shadow-xl shadow-emerald-950/20 border-2 border-[#D4AF37]/60 p-0.5 bg-amber-50">
            <Image
              src="/logo.png"
              alt="Logo Bank Sampah Syariah UIN Sunan Ampel"
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Bank Sampah Syariah
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              UIN Sunan Ampel Surabaya • Portal Layanan
            </p>
          </div>
        </div>

        {/* Card Form */}
        <div className="card-luxury rounded-3xl p-6 sm:p-8 space-y-5 border border-[#D4AF37]/30 shadow-xl shadow-emerald-950/5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">
                Masuk ke Rekening
              </h2>
              <span className="text-[10px] font-bold text-[#78581A] px-2 py-0.5 rounded-full bg-[#F7F2E7] border border-[#D4AF37]/30">
                Wadiah Vault
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Gunakan kredensial resmi terdaftar untuk mengakses layanan.
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
              >
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@bss.uinsa.ac.id"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all text-stone-900 shadow-2xs"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wider"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:border-[#C5A059] transition-all text-stone-900 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!loadingRole}
              className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-[#064E3B] to-[#0A5D46] hover:from-[#053F30] hover:to-[#084D3A] disabled:bg-stone-200 text-[#F9F6EE] disabled:text-stone-400 font-bold text-sm shadow-md shadow-emerald-950/15 border border-amber-300/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Layanan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-3 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-700">
                <Sparkles className="w-3.5 h-3.5 text-[#B58D3C]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Uji Coba Cepat (1-Klik Masuk):
                </span>
              </div>
              <span className="text-[10px] text-stone-400 font-medium">Tanpa input password</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const isCurrentLoading = loadingRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={isLoading || !!loadingRole}
                    onClick={() => handleQuickLogin(acc.role)}
                    className={`min-h-[52px] py-2.5 px-3 text-xs font-bold rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 shadow-2xs cursor-pointer touch-manipulation select-none ${acc.color}`}
                  >
                    <div>
                      <div className="font-extrabold">{acc.label}</div>
                      <div className="text-[10px] opacity-75 font-normal">{acc.sub}</div>
                    </div>
                    {isCurrentLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sharia Trust Footer */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-stone-400">
            © 2026 Bank Sampah Syariah UIN Sunan Ampel Surabaya
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium">
            <ShieldCheck className="w-3 h-3 text-[#B58D3C]" />
            <span>Akad Wadiah Yad Dhamanah • Bebas Biaya Administrasi Riba</span>
          </div>
        </div>
      </div>
    </main>
  );
}
