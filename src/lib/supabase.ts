import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aznaipcwhdrsxxomlizd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6bmFpcGN3aGRyc3h4b21saXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDE1MjYsImV4cCI6MjEwNzYxNzUyNn0.9mvhTRNv4SiltorRCwYZ68LTRmDCLIjaboaPWGYvYS0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

