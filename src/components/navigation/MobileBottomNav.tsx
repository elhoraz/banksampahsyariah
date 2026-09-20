'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scale,
  FileSpreadsheet,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { label: 'Nasabah', href: '/nasabah', icon: Wallet },
    { label: 'Petugas', href: '/petugas', icon: Scale },
    { label: 'Bendahara', href: '/bendahara', icon: FileSpreadsheet },
    { label: 'Admin', href: '/admin', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-xl border-t border-[#D4AF37]/30 pb-safe shadow-[0_-4px_20px_rgba(6,78,59,0.05)] md:hidden">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] transition-all active:scale-95 relative ${
                isActive
                  ? 'text-[#064E3B] font-bold'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#064E3B]/10 text-[#064E3B]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-[#064E3B]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[44px] text-stone-400 hover:text-rose-600 transition-all active:scale-95"
          title="Keluar"
        >
          <div className="p-1 rounded-xl">
            <LogOut className="w-5 h-5 stroke-2" />
          </div>
          <span className="text-[11px] font-medium leading-none">Keluar</span>
        </button>
      </div>
    </nav>
  );
}
