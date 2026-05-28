import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://cuhkvmwygnxpqfagufte.supabase.co",
  "YOUR_SUPABASE_ANON_KEY"
);