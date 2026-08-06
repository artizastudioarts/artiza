import { createClient } from "@supabase/supabase-js";

// Public client — safe to use in the browser. Can only read products
// (enforced by the row-level security policy in supabase/schema.sql).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client — SERVER-SIDE ONLY. Never import this in a client component.
// Uses the service role key, which bypasses row-level security.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
