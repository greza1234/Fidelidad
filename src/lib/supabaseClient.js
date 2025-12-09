import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ Mantener sesión mientras la pestaña esté abierta (incluye F5 / refresh)
    // pero se borra cuando cierras la pestaña/navegador.
    persistSession: true,
    storage: sessionStorage,
    detectSessionInUrl: true,
  },
});
