import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 👉 No guardar la sesión en localStorage
    persistSession: false,
    // (opcional, normalmente ya está en true por defecto)
    detectSessionInUrl: true,
  },
});
