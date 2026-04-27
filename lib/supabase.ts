"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _logged = false;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!_logged) {
    console.info(
      `[supabase] env check — url: ${url ? "✓" : "✗ MISSING"}  key: ${
        key ? `✓ (${key.slice(0, 14)}…, len=${key.length})` : "✗ MISSING"
      }`
    );
    _logged = true;
  }

  if (!url || !key) {
    console.warn(
      "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. " +
        "If you just edited .env.local, you must STOP the dev server and run `npm run dev` again — Next.js only reads env vars at startup."
    );
    return null;
  }

  console.info(`[supabase] Connecting to ${url}`);

  _client = createClient(url, key, {
    auth: { persistSession: false },
    // Force the apikey header on every request. PostgREST returns
    // "No API key found" if this isn't set, even if the SDK already added it.
    // Belt-and-braces against SDK regressions with sb_publishable_* keys.
    global: {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    },
  });
  return _client;
}
