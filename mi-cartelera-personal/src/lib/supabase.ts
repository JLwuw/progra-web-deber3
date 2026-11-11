import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getConfigurationError(): string | null {
  const url: unknown = import.meta.env.VITE_SUPABASE_URL;
  const key: unknown = import.meta.env.VITE_SUPABASE_ANON_KEY;
  try {
    if (
      typeof url !== "string" ||
      !["http:", "https:"].includes(new URL(url).protocol)
    )
      return "Set a valid Supabase project URL in the local configuration.";
  } catch {
    return "Set a valid Supabase project URL in the local configuration.";
  }
  if (typeof key !== "string" || !key.trim())
    return "Set the public Supabase client key in the local configuration.";
  return null;
}
let client: SupabaseClient | undefined;
export function getSupabase(): SupabaseClient {
  const error = getConfigurationError();
  if (error) throw new Error(error);
  client ??= createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
  return client;
}
