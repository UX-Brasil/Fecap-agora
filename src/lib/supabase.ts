// src/lib/supabase.ts

import "react-native-url-polyfill/auto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

if (!supabaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL não foi definida."
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_KEY não foi definida."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);