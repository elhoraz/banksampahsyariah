'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export interface DepositItemPayload {
  wasteCategoryId: string;
  weight: number;
}

export interface SaveTransactionPayload {
  customerId: string;
  officerId?: string;
  items: DepositItemPayload[];
}

export interface SaveTransactionResult {
  success: boolean;
  invoiceCode?: string;
  totalAmount?: number;
  totalWeight?: number;
  error?: string;
}

export async function saveTransactionAction(
  payload: SaveTransactionPayload
): Promise<SaveTransactionResult> {
  try {
    const { customerId, items } = payload;

    if (!customerId) {
      return { success: false, error: 'Nasabah belum dipilih.' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Daftar setoran sampah masih kosong.' };
    }

    // Filter valid items with weight > 0
    const validItems = items.filter((item) => item.weight > 0);
    if (validItems.length === 0) {
      return { success: false, error: 'Berat sampah harus lebih dari 0 kg.' };
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = serviceRoleKey
      ? createAdminClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey
        )
      : await createClient();

    // 1. Determine officer ID
    let officerId = payload.officerId;
    if (!officerId) {
      // Check authenticated user
      try {
        const authClient = await createClient();
        const {
          data: { user },
        } = await authClient.auth.getUser();

        if (user) {
          officerId = user.id;
        }
      } catch {
        // Continue to fallback
      }

      if (!officerId) {
        // Fallback to active officer profile
        const { data: officers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'petugas')
          .limit(1);

        if (officers && officers.length > 0) {
          officerId = officers[0].id;
        } else {
          return { success: false, error: 'Petugas jaga tidak ditemukan.' };
        }
      }
    }

    // 2. Fetch price snapshot for each category from server (BR-01 immutable snapshot)
    const categoryIds = validItems.map((item) => item.wasteCategoryId);
    const { data: categories, error: catError } = await supabase
      .from('waste_categories')
      .select('id, name, price_per_kg')
      .in('id', categoryIds);

    if (catError || !categories) {
      return {
        success: false,
        error: `Gagal mengambil data kategori: ${catError?.message || 'Data tidak ditemukan'}`,
      };
    }

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // 3. Compute immutable subtotal and totals
    let totalAmount = 0;
    let totalWeight = 0;

    const computedItems = validItems.map((item) => {
      const category = categoryMap.get(item.wasteCategoryId);
      if (!category) {
        throw new Error(`Kategori sampah ID ${item.wasteCategoryId} tidak ditemukan.`);
      }

      const pricePerUnit = Number(category.price_per_kg);
      const weight = Number(item.weight);
      const subtotal = Math.round(weight * pricePerUnit);

      totalAmount += subtotal;
      totalWeight += weight;

      return {
        waste_category_id: category.id,
        weight,
        unit: 'kg',
        price_per_unit: pricePerUnit,
        subtotal,
      };
    });

    // 4. Generate unique invoice code (Format: BSS-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceCode = `BSS-${dateStr}-${randomSuffix}`;

    // 5. Insert header transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        invoice_code: invoiceCode,
        customer_id: customerId,
        officer_id: officerId,
        total_amount: totalAmount,
        total_weight: Math.round(totalWeight * 100) / 100,
      })
      .select()
      .single();

    if (txError || !transaction) {
      return {
        success: false,
        error: `Gagal menyimpan transaksi: ${txError?.message || 'Terjadi kesalahan sistem'}`,
      };
    }

    // 6. Insert transaction items
    const itemsToInsert = computedItems.map((item) => ({
      ...item,
      transaction_id: transaction.id,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsToInsert);

    if (itemsError) {
      return {
        success: false,
        error: `Gagal menyimpan rincian item: ${itemsError.message}`,
      };
    }

    // 7. Update customer balances
    const { data: existingBalance } = await supabase
      .from('balances')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (existingBalance) {
      const updatedBalance = Number(existingBalance.current_balance) + totalAmount;
      const updatedTotalWeight =
        Number(existingBalance.total_weight_kg) + totalWeight;

      await supabase
        .from('balances')
        .update({
          current_balance: updatedBalance,
          total_weight_kg: Math.round(updatedTotalWeight * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customerId);
    } else {
      await supabase.from('balances').insert({
        customer_id: customerId,
        current_balance: totalAmount,
        total_weight_kg: Math.round(totalWeight * 100) / 100,
      });
    }

    // 8. Revalidate routes
    revalidatePath('/petugas');
    revalidatePath('/nasabah');
    revalidatePath('/bendahara');
    revalidatePath('/admin');

    return {
      success: true,
      invoiceCode,
      totalAmount,
      totalWeight: Math.round(totalWeight * 100) / 100,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.';
    return { success: false, error: message };
  }
}
