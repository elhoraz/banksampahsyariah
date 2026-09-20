'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database, Profile, Balance } from '@/types/database';

function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );
}

// 1. Data Loader for Nasabah Dashboard
export async function getNasabahData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getAdminClient();

    let customerId = user?.id;

    if (customerId) {
      const { data: userProf } = await admin
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (userProf && userProf.role !== 'nasabah') {
        const { data: defaultNasabah } = await admin
          .from('profiles')
          .select('id')
          .eq('role', 'nasabah')
          .limit(1)
          .maybeSingle();
        if (defaultNasabah) customerId = defaultNasabah.id;
      }
    } else {
      const { data: defaultNasabah } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'nasabah')
        .limit(1)
        .maybeSingle();
      if (defaultNasabah) customerId = defaultNasabah.id;
    }

    if (!customerId) {
      return { authenticated: false };
    }

    // Profile
    let profile: Profile | null = null;
    const { data: dbProf } = await admin
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (dbProf) {
      profile = dbProf;
    } else {
      profile = {
        id: customerId,
        full_name: (user?.user_metadata?.full_name as string) || 'Siti Aminah (FST)',
        username: user?.email?.split('@')[0] || 'siti_aminah',
        phone_number: (user?.user_metadata?.phone_number as string) || '089876543210',
        role: 'nasabah',
        created_at: user?.created_at || new Date().toISOString(),
      };
    }

    // Balance
    let balance: Balance | null = null;
    const { data: dbBal } = await admin
      .from('balances')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (dbBal) {
      balance = dbBal;
    } else {
      balance = {
        customer_id: customerId,
        current_balance: 45000,
        total_weight_kg: 18.5,
        updated_at: new Date().toISOString(),
      };
    }

    // Transactions
    const { data: txs } = await admin
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    // Active Waste Categories
    const { data: categories } = await admin
      .from('waste_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    return {
      authenticated: true,
      profile,
      balance,
      transactions: txs || [],
      categories: categories || [],
    };
  } catch (err: unknown) {
    console.error('getNasabahData error:', err);
    return { authenticated: false, error: err instanceof Error ? err.message : 'Error' };
  }
}

// 2. Data Loader for Petugas Pos Timbang
export async function getPetugasData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getAdminClient();

    let currentOfficer: Profile | null = null;
    if (user) {
      const { data: prof } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (prof) {
        currentOfficer = prof;
      } else {
        currentOfficer = {
          id: user.id,
          full_name: (user.user_metadata?.full_name as string) || 'Petugas Jaga Pos',
          username: user.email?.split('@')[0] || 'petugas',
          phone_number: null,
          role: 'petugas',
          created_at: user.created_at,
        };
      }
    }

    if (!currentOfficer) {
      const { data: defaultOfficer } = await admin
        .from('profiles')
        .select('*')
        .eq('role', 'petugas')
        .limit(1)
        .maybeSingle();

      currentOfficer = defaultOfficer || {
        id: 'd57b7fd2-f327-4298-9626-48450c345926',
        full_name: 'Ahmad Petugas Jaga',
        username: 'petugas_ahmad',
        phone_number: '081234567890',
        role: 'petugas',
        created_at: new Date().toISOString(),
      };
    }

    // Categories
    const { data: categories } = await admin
      .from('waste_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    // Customers (Nasabah)
    const { data: customers } = await admin
      .from('profiles')
      .select('*')
      .eq('role', 'nasabah')
      .order('full_name');

    // Shift Transactions (Today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: txData } = await admin
      .from('transactions')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false });

    const custMap = new Map((customers || []).map((c) => [c.id, c]));
    const shiftTransactions = (txData || []).map((t) => {
      const c = custMap.get(t.customer_id);
      return {
        id: t.id,
        invoiceCode: t.invoice_code,
        customerName: c?.full_name || 'Nasabah BSS',
        customerUsername: c?.username || 'nasabah',
        officerName: currentOfficer?.full_name || 'Petugas Jaga Pos',
        totalWeight: Number(t.total_weight),
        totalAmount: Number(t.total_amount),
        createdAt: t.created_at,
      };
    });

    return {
      currentOfficer,
      categories: categories || [],
      customers: customers || [],
      shiftTransactions,
    };
  } catch (err: unknown) {
    console.error('getPetugasData error:', err);
    return {
      currentOfficer: null,
      categories: [],
      customers: [],
      shiftTransactions: [],
      error: err instanceof Error ? err.message : 'Error',
    };
  }
}

// 3. Customer Balance
export async function getCustomerBalance(customerId: string) {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from('balances')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    return data || null;
  } catch {
    return null;
  }
}

// 4. Data Loader for Bendahara Dashboard
export async function getBendaharaData() {
  try {
    const admin = getAdminClient();

    // Fetch transactions
    const { data: txs } = await admin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch profiles
    const { data: profiles } = await admin.from('profiles').select('*');
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const enrichedTransactions = (txs || []).map((t) => ({
      ...t,
      customer: profileMap.get(t.customer_id),
      officer: profileMap.get(t.officer_id),
    }));

    // Category Breakdown
    const { data: items } = await admin
      .from('transaction_items')
      .select('waste_category_id, weight, subtotal');

    const { data: categories } = await admin.from('waste_categories').select('*');
    const catMap = new Map((categories || []).map((c) => [c.id, c.name]));

    const catAgg = new Map<string, { weight: number; amount: number }>();
    (items || []).forEach((item) => {
      const catId = item.waste_category_id;
      const cur = catAgg.get(catId) || { weight: 0, amount: 0 };
      catAgg.set(catId, {
        weight: cur.weight + Number(item.weight),
        amount: cur.amount + Number(item.subtotal),
      });
    });

    const totalWeight = Array.from(catAgg.values()).reduce((s, c) => s + c.weight, 0) || 1;
    const categoryBreakdown = Array.from(catAgg.entries()).map(([id, val]) => ({
      id,
      name: catMap.get(id) || 'Kategori',
      weight: Math.round(val.weight * 100) / 100,
      amount: val.amount,
      percentage: Math.round((val.weight / totalWeight) * 100),
    }));

    return {
      transactions: enrichedTransactions,
      categoryBreakdown,
    };
  } catch (err) {
    console.error('getBendaharaData error:', err);
    return { transactions: [], categoryBreakdown: [] };
  }
}

// 5. Data Loader for Admin Overview
export async function getAdminOverviewData() {
  try {
    const admin = getAdminClient();

    const { data: txs } = await admin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    const sumAmount = txs?.reduce((acc, t) => acc + Number(t.total_amount), 0) || 0;
    const sumWeight = txs?.reduce((acc, t) => acc + Number(t.total_weight), 0) || 0;

    const { data: profiles } = await admin.from('profiles').select('*');
    const nasabahs = profiles?.filter((p) => p.role === 'nasabah') || [];
    const officers = profiles?.filter((p) => p.role === 'petugas') || [];

    const { data: categories } = await admin
      .from('waste_categories')
      .select('id')
      .eq('is_active', true);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const recentTransactions = (txs?.slice(0, 6) || []).map((t) => ({
      ...t,
      customer: profileMap.get(t.customer_id),
    }));

    return {
      totalKas: sumAmount,
      totalWeightKg: sumWeight,
      customerCount: nasabahs.length,
      officerCount: officers.length,
      activeCommodityCount: categories?.length || 0,
      recentTransactions,
    };
  } catch (err) {
    console.error('getAdminOverviewData error:', err);
    return {
      totalKas: 0,
      totalWeightKg: 0,
      customerCount: 0,
      officerCount: 0,
      activeCommodityCount: 0,
      recentTransactions: [],
    };
  }
}

// 6. Data Loader for Admin Pricelist
export async function getAllCategories() {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from('waste_categories')
      .select('*')
      .order('name');
    return data || [];
  } catch (err) {
    console.error('getAllCategories error:', err);
    return [];
  }
}

// 7. Data Loader for Admin Users
export async function getAllUsers() {
  try {
    const admin = getAdminClient();
    const { data: profiles } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: balances } = await admin.from('balances').select('*');
    const balanceMap = new Map((balances || []).map((b) => [b.customer_id, b]));

    const extended = (profiles || []).map((p) => ({
      ...p,
      balance: balanceMap.get(p.id) || null,
    }));

    return extended;
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
}
