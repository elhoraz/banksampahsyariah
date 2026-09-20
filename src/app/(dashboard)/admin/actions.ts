'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface UpdatePricePayload {
  categoryId: string;
  newPrice: number;
}

export async function updateWasteCategoryPriceAction(payload: UpdatePricePayload) {
  try {
    const { categoryId, newPrice } = payload;

    if (!categoryId) {
      return { success: false, error: 'Kategori tidak valid.' };
    }

    if (newPrice < 0) {
      return { success: false, error: 'Tarif sampah tidak boleh negatif.' };
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = serviceRoleKey
      ? createAdminClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
      : await createClient();

    const { error } = await supabase
      .from('waste_categories')
      .update({
        price_per_kg: newPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/pricelist');
    revalidatePath('/petugas');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}

export async function toggleWasteCategoryStatusAction(
  categoryId: string,
  isActive: boolean
) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = serviceRoleKey
      ? createAdminClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
      : await createClient();

    const { error } = await supabase
      .from('waste_categories')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin');
    revalidatePath('/admin/pricelist');
    revalidatePath('/petugas');

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return { success: false, error: msg };
  }
}
