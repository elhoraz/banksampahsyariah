'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types/database';

export interface CreateUserPayload {
  email: string;
  password?: string;
  fullName: string;
  username: string;
  phoneNumber?: string;
  role: UserRole;
}

export async function createUserAction(payload: CreateUserPayload) {
  try {
    const { email, fullName, username, phoneNumber, role } = payload;
    const password = payload.password || 'password123';

    if (!email || !fullName || !username || !role) {
      return { success: false, error: 'Semua data wajib diisi.' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      return { success: false, error: 'Service role key tidak terkonfigurasi.' };
    }

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

    // 1. Create user in Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (authError || !authUser.user) {
      return {
        success: false,
        error: authError?.message || 'Gagal mendaftarkan akun di sistem autentikasi.',
      };
    }

    // 2. Insert into profiles
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authUser.user.id,
      full_name: fullName.trim(),
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
      phone_number: phoneNumber?.trim() || null,
      role,
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    // 3. If role is nasabah, initialize balance
    if (role === 'nasabah') {
      await adminClient.from('balances').insert({
        customer_id: authUser.user.id,
        current_balance: 0,
        total_weight_kg: 0,
      });
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    revalidatePath('/petugas');

    return { success: true, userId: authUser.user.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}
