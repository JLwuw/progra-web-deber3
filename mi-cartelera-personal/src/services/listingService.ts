import { supabase } from "../lib/supabaseClient.ts";
import type { Media } from "../types/Media.ts";

const TABLE_NAME = "my_listing"

export async function getListings(): Promise<Media[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Media[];
}

export async function insertListing(
  listing: Omit<Media, "id" | "user_id">,
  userId: string
): Promise<Media> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({ ...listing, user_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Media;
}

export async function updateListing(
  id: number,
  listing: Omit<Media, "id" | "user_id">
): Promise<Media> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(listing)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Media;
}

export async function deleteListing(id: number): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
