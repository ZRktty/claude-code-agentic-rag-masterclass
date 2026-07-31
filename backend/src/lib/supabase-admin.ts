import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

/**
 * Service-role client. Bypasses Row-Level Security entirely — documented
 * admin escape hatch only. Not used in any Module 1 request path; every
 * normal request should go through getUserClient() in supabase.ts instead.
 */
export const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!);
