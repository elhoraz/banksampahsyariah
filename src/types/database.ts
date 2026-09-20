export type UserRole = 'admin' | 'petugas' | 'bendahara' | 'nasabah';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          phone_number: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          username: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          username?: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      waste_categories: {
        Row: {
          id: string;
          name: string;
          price_per_kg: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price_per_kg: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price_per_kg?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          invoice_code: string;
          customer_id: string;
          officer_id: string;
          total_amount: number;
          total_weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_code: string;
          customer_id: string;
          officer_id: string;
          total_amount?: number;
          total_weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_code?: string;
          customer_id?: string;
          officer_id?: string;
          total_amount?: number;
          total_weight?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_officer_id_fkey';
            columns: ['officer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transaction_items: {
        Row: {
          id: string;
          transaction_id: string;
          waste_category_id: string;
          weight: number;
          unit: string;
          price_per_unit: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          waste_category_id: string;
          weight: number;
          unit?: string;
          price_per_unit: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          waste_category_id?: string;
          weight?: number;
          unit?: string;
          price_per_unit?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'transaction_items_transaction_id_fkey';
            columns: ['transaction_id'];
            isOneToOne: false;
            referencedRelation: 'transactions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transaction_items_waste_category_id_fkey';
            columns: ['waste_category_id'];
            isOneToOne: false;
            referencedRelation: 'waste_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      balances: {
        Row: {
          customer_id: string;
          current_balance: number;
          total_weight_kg: number;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          current_balance?: number;
          total_weight_kg?: number;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          current_balance?: number;
          total_weight_kg?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'balances_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience Type Aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type WasteCategory = Database['public']['Tables']['waste_categories']['Row'];
export type WasteCategoryInsert = Database['public']['Tables']['waste_categories']['Insert'];
export type WasteCategoryUpdate = Database['public']['Tables']['waste_categories']['Update'];

export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export type TransactionItem = Database['public']['Tables']['transaction_items']['Row'];
export type TransactionItemInsert = Database['public']['Tables']['transaction_items']['Insert'];
export type TransactionItemUpdate = Database['public']['Tables']['transaction_items']['Update'];

export type Balance = Database['public']['Tables']['balances']['Row'];
export type BalanceInsert = Database['public']['Tables']['balances']['Insert'];
export type BalanceUpdate = Database['public']['Tables']['balances']['Update'];

// Extended types for joined queries
export type TransactionItemWithCategory = TransactionItem & {
  waste_category?: WasteCategory;
};

export type TransactionWithDetails = Transaction & {
  customer?: Profile;
  officer?: Profile;
  items?: TransactionItemWithCategory[];
};
