import { getSupabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
export { getConfigurationError } from "../lib/supabase";

export async function registerUser(
  email: string,
  password: string,
): Promise<boolean> {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data.session !== null;
}
export async function startSession(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
}
export async function closeSession(): Promise<void> {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(error.message);
}
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}
export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentSession())?.user.id ?? null;
}
export function subscribeToSession(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) =>
    callback(session),
  );
  return () => data.subscription.unsubscribe();
}
