import { getSupabase } from "../lib/supabase";
import {
  record,
  positiveId,
  nullableText,
  text,
  integer,
} from "../lib/validation";
import { getCurrentUserId } from "./authService";
import type { Media, SearchMedia, ListingChanges } from "../types/Media";

export function parseListing(value: unknown): Media {
  const row = record(value);
  if (row.media_type !== "movie" && row.media_type !== "tv")
    throw new Error("Invalid media type.");
  if (
    !["plan_to_watch", "watching", "finished"].includes(text(row.watch_state))
  )
    throw new Error("Invalid viewing state.");
  const userGrade = row.user_grade == null ? null : integer(row.user_grade);
  if (userGrade !== null && (userGrade < 1 || userGrade > 5))
    throw new Error("Invalid rating.");
  const title = text(row.title);
  const userId = text(row.user_id);
  if (!title.trim() || !userId) throw new Error("Incomplete listing data.");
  return {
    id: positiveId(row.id),
    userId,
    tmdbId: positiveId(row.tmdb_id),
    title,
    posterUrl: nullableText(row.poster_url),
    mediaType: row.media_type,
    watchState: row.watch_state as Media["watchState"],
    userGrade,
    comment: row.comment == null ? null : text(row.comment),
    createdAt: nullableText(row.created_at),
  };
}
export function toListingChanges(changes: ListingChanges) {
  if (!["plan_to_watch", "watching", "finished"].includes(changes.watchState))
    throw new Error("Invalid viewing state.");
  if (
    changes.userGrade !== null &&
    (!Number.isInteger(changes.userGrade) ||
      changes.userGrade < 1 ||
      changes.userGrade > 5)
  )
    throw new Error("Rating must be a whole number from 1 to 5.");
  return {
    watch_state: changes.watchState,
    user_grade: changes.userGrade,
    comment: changes.comment || null,
  };
}
async function requireOwner(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Please sign in again.");
  return userId;
}
export async function getListings(signal?: AbortSignal): Promise<Media[]> {
  const userId = await requireOwner();
  const listings: Media[] = [];
  const pageSize = 100;
  for (let start = 0; ;) {
    let query = getSupabase()
      .from("my_listing")
      .select("*")
      .eq("user_id", userId)
      .order("id")
      .range(start, start + pageSize - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) throw new Error("Invalid collection response.");
    listings.push(...data.map(parseListing));
    if (data.length === 0) return listings;
    start += data.length;
  }
}
export async function insertListing(listing: SearchMedia): Promise<Media> {
  const userId = await requireOwner();
  const { data: existing, error: lookupError } = await getSupabase()
    .from("my_listing")
    .select("id")
    .eq("user_id", userId)
    .eq("media_type", listing.mediaType)
    .eq("tmdb_id", listing.tmdbId)
    .limit(1);
  if (lookupError) throw new Error(lookupError.message);
  if (existing?.length)
    throw new Error("This title is already in your collection.");
  const { data, error } = await getSupabase()
    .from("my_listing")
    .insert({
      user_id: userId,
      tmdb_id: listing.tmdbId,
      title: listing.title,
      poster_url: listing.posterUrl ?? "",
      media_type: listing.mediaType,
      watch_state: "plan_to_watch",
    })
    .select()
    .single();
  if (error)
    throw new Error(
      error.code === "23505"
        ? "This title is already in your collection."
        : error.message,
    );
  return parseListing(data);
}
export async function updateListing(
  id: number,
  changes: ListingChanges,
): Promise<Media> {
  const userId = await requireOwner();
  const { data, error } = await getSupabase()
    .from("my_listing")
    .update(toListingChanges(changes))
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return parseListing(data);
}
export async function deleteListing(id: number): Promise<void> {
  const userId = await requireOwner();
  const { data, error } = await getSupabase()
    .from("my_listing")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length !== 1)
    throw new Error(
      "The title was not removed. It may no longer exist or you may not have access.",
    );
}
