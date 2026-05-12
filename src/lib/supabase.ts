import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Checklist:');
  console.warn('1. Copy VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to .env');
  console.warn('2. Run the provided SQL schema in your Supabase SQL Editor');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Multi-user Realtime Helpers
 */
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => callback(payload)
    )
    .subscribe();
};
