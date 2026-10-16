import { supabase } from "../lib/supabaseClient.ts";
import type { Session } from "@supabase/supabase-js";

export async function registerUser(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function startSession(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function closeSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user.id ?? null;
}