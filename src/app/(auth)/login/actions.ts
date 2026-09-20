'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface LoginResult {
  success: boolean;
  role?: string;
  error?: string;
}

export async function loginAction(
  email: string,
  password?: string
): Promise<LoginResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password || 'password123';

    if (!cleanEmail) {
      return { success: false, error: 'Email wajib diisi.' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error || !data.user) {
      const msg =
        error?.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak sesuai.'
          : error?.message || 'Gagal masuk ke sistem.';
      return { success: false, error: msg };
    }

    // Role lookup: 1) from user_metadata, 2) from profiles via service_role
    let role = data.user.user_metadata?.role as string | undefined;

    if (!role) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const adminClient = createAdminClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        );
        const { data: prof } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (prof?.role) role = prof.role;
      }
    }

    return {
      success: true,
      role: role || 'nasabah',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}

export async function quickLoginAction(role: string): Promise<LoginResult> {
  const roleEmails: Record<string, string> = {
    nasabah: 'nasabah@bss.uinsa.ac.id',
    petugas: 'petugas@bss.uinsa.ac.id',
    bendahara: 'bendahara@bss.uinsa.ac.id',
    admin: 'admin@bss.uinsa.ac.id',
  };

  const email = roleEmails[role.toLowerCase()] || role;
  return loginAction(email, 'password123');
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch {
    return { success: false };
  }
}
