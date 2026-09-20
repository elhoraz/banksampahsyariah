'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { createClient } from '@/lib/supabase/client';
import { loginAction, logoutAction } from '@/app/(auth)/login/actions';
import type { Profile } from '@/types/database';
import {
  Recycle,
  LogOut,
  Wallet,
  Scale,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  UserCheck,
  Building,
  Shield,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile && isMounted) {
            setCurrentProfile(profile);
          } else if (isMounted) {
            setCurrentProfile({
              id: user.id,
              full_name: (user.user_metadata?.full_name as string) || 'Pengguna BSS',
              username: user.email?.split('@')[0] || 'pengguna',
              phone_number: null,
              role: (user.user_metadata?.role as Profile['role']) || 'nasabah',
              created_at: user.created_at,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load user in layout:', err);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [supabase, pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      try {
        await logoutAction();
      } catch {}
    } finally {
      window.location.replace('/login');
    }
  };

  const navLinks = [
    { label: 'Nasabah', href: '/nasabah', icon: Wallet },
    { label: 'Petugas Timbang', href: '/petugas', icon: Scale },
    { label: 'Bendahara', href: '/bendahara', icon: FileSpreadsheet },
    { label: 'Admin BSS', href: '/admin', icon: Settings },
  ];

  // Quick switch between roles for demo/testing purposes
  const demoRoles = [
    {
      label: 'Nasabah',
      role: 'nasabah',
      email: 'nasabah@bss.uinsa.ac.id',
      href: '/nasabah',
      desc: 'Siti Nasabah (Saldo Wadiah)',
      icon: Shield,
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      label: 'Petugas Pos',
      role: 'petugas',
      email: 'petugas@bss.uinsa.ac.id',
      href: '/petugas',
      desc: 'Ahmad Petugas (Pos Timbang Kampus A)',
      icon: UserCheck,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Bendahara',
      role: 'bendahara',
      email: 'bendahara@bss.uinsa.ac.id',
      href: '/bendahara',
      desc: 'Hj. Siti Fatimah, S.E. (Audit & Kas)',
      icon: Building,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      label: 'Administrator',
      role: 'admin',
      email: 'admin@bss.uinsa.ac.id',
      href: '/admin',
      desc: 'Dr. H. Admin BSS (Pricelist & Akun)',
      icon: ShieldAlert,
      color: 'bg-amber-100 text-amber-800',
    },
  ];

  const handleQuickSwitch = async (email: string, targetHref: string) => {
    setIsSwitchingRole(email);
    setIsRoleDropdownOpen(false);
    try {
      await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });
      try {
        const res = await loginAction(email, 'password123');
        const target = res.success && res.role ? `/${res.role}` : targetHref;
        window.location.replace(target);
      } catch {
        window.location.replace(targetHref);
      }
    } catch {
      window.location.replace(targetHref);
    } finally {
      setIsSwitchingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-xs pt-safe">
        <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between gap-3">
          {/* Logo & Brand Title */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md shadow-emerald-950/20 border-2 border-[#D4AF37]/60 p-0.5 bg-amber-50 shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Bank Sampah Syariah UIN Sunan Ampel"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-sm sm:text-base text-[#064E3B] tracking-tight leading-tight flex items-center gap-1.5">
                <span>BSS UIN Sunan Ampel</span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded-full bg-[#F5EFE0] border border-[#D4AF37]/40 text-[#78581A] text-[9px] font-bold uppercase tracking-wider">
                  Akad Wadiah
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
                <span className="text-[#064E3B] font-semibold">Wadiah Vault</span>
                <span className="text-stone-300">•</span>
                <span>Kampus A &amp; B</span>
              </div>
            </div>
          </Link>

          {/* Center: Live Sync Realtime Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBF8F0] border border-[#D4AF37]/40 text-[11px] font-semibold text-[#78581A] shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B58D3C]"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold">Layanan Terverifikasi Syariah</span>
          </div>

          {/* Right Section: Desktop Navigation & Quick Role Switcher */}
          <div className="flex items-center gap-2">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[#064E3B] text-[#F9F6EE] shadow-xs border border-amber-300/30'
                        : 'text-stone-600 hover:text-[#064E3B] hover:bg-stone-100/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-[#D4AF37]/50 bg-[#FBF8F0] hover:bg-[#F5EFE0] text-[#78581A] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                title="Ganti Peran Cepat (Simulasi Uji Coba)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B58D3C]" />
                <span className="hidden sm:inline">Uji Peran:</span>
                <span className="capitalize font-extrabold text-[#064E3B]">
                  {currentProfile?.role || 'Pilih'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#78581A]" />
              </button>

              {/* Dropdown Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 card-luxury rounded-2xl shadow-xl border border-[#D4AF37]/35 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Ganti Akun Demo Seketika
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#F5EFE0] text-[#78581A] border border-[#D4AF37]/30 text-[9px] font-bold">
                      1-Click
                    </span>
                  </div>

                  <div className="py-1 space-y-1">
                    {demoRoles.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = currentProfile?.role === item.role;
                      return (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => handleQuickSwitch(item.email, item.href)}
                          className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-colors text-xs ${
                            isCurrent
                              ? 'bg-[#FBF8F0] border border-[#D4AF37]/50 text-[#064E3B] font-bold'
                              : 'hover:bg-stone-50 text-stone-700 font-medium'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{item.label}</span>
                              {isSwitchingRole === item.email ? (
                                <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                              ) : isCurrent ? (
                                <span className="text-[9px] text-emerald-700 uppercase font-black">
                                  Aktif
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-1.5 px-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button on Desktop */}
            <button
              type="button"
              onClick={handleLogout}
              className="hidden md:flex p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar dari sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
}
