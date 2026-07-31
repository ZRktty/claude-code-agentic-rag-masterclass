import { createClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import type { AppEnv } from "../types";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars");
}

const authClient = createClient(supabaseUrl!, supabaseAnonKey!);

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return c.json({ error: "Missing Authorization header" }, 401);
  }

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", data.user);
  c.set("accessToken", token);
  await next();
}
