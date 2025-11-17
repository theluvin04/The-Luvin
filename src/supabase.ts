import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ljceqjuibrayuebpcdli.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqY2VxanVpYnJheXVlYnBjZGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNDM5ODUsImV4cCI6MjA3ODgxOTk4NX0.trF2Fd22uF7XJuqtNKxHwju4QDKSIfIG_d4uXkRJh2I";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);