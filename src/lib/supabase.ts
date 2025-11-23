import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types (will be generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          address: Record<string, unknown> | null;
          is_admin: boolean;
          role: "super_admin" | "admin" | "freelancer" | "customer";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          address?: Record<string, unknown> | null;
          is_admin?: boolean;
          role?: "super_admin" | "admin" | "freelancer" | "customer";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          address?: Record<string, unknown> | null;
          is_admin?: boolean;
          role?: "super_admin" | "admin" | "freelancer" | "customer";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

