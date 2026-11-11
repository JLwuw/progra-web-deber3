import { getSupabase } from "../lib/supabase";
import {
  record,
  positiveId,
  integer,
  text,
  nullableText,
} from "../lib/validation";
import { getCurrentUserId } from "./authService";
import { getListings } from "./listingService";
import { getMovieRuntime } from "./tmdbService";
import {
  calculateSession,
  normalizeRuntime,
  validateNightName,
  getEligibleMovies,
  PAUSE_MINUTES,
} from "../dominio/movieNight";
import type {
  CandidateMovie,
  MovieCandidate,
  MovieSnapshot,
  MovieNightDraft,
  SavedMovieNight,
  SaveNightResult,
} from "../types/MovieNight";

function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to retrieve this movie's duration. Retry to try again.";
}
async function owner(expected: string): Promise<string> {
  const current = await getCurrentUserId();
  if (!current || current !== expected)
    throw new Error("Your account changed. Sign in again before continuing.");
  return current;
}
export async function loadMovieCandidate(
  movie: CandidateMovie,
  signal?: AbortSignal,
): Promise<MovieCandidate> {
  try {
    const runtime = normalizeRuntime(
      await getMovieRuntime(movie.tmdbId, signal),
    );
    signal?.throwIfAborted();
    return runtime.valid
      ? { ...movie, status: "ready", runtimeMinutes: runtime.value }
      : { ...movie, status: "unknown", reason: runtime.reason };
  } catch (error) {
    signal?.throwIfAborted();
    return { ...movie, status: "error", reason: message(error) };
  }
}
export async function loadMovieCandidates(
  expectedOwner: string,
  signal?: AbortSignal,
  onProgress?: (movies: MovieCandidate[]) => void,
): Promise<MovieCandidate[]> {
  const userId = await owner(expectedOwner);
  const movies = getEligibleMovies(
    (await getListings(signal)).filter((movie) => movie.userId === userId),
  );
  signal?.throwIfAborted();
  const candidates: MovieCandidate[] = movies.map((movie) => ({
    tmdbId: movie.tmdbId,
    title: movie.title,
    posterUrl: movie.posterUrl,
    status: "loading",
  }));
  onProgress?.([...candidates]);
  let cursor = 0;
  async function worker() {
    while (cursor < movies.length) {
      signal?.throwIfAborted();
      const index = cursor++;
      candidates[index] = await loadMovieCandidate(movies[index], signal);
      signal?.throwIfAborted();
      onProgress?.([...candidates]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, movies.length) }, worker));
  await owner(expectedOwner);
  signal?.throwIfAborted();
  return candidates;
}
function parseSnapshot(value: unknown): MovieSnapshot {
  const row = record(value);
  const runtime = normalizeRuntime(row.runtimeMinutes);
  if (!runtime.valid || !text(row.title).trim())
    throw new Error("Invalid saved movie information.");
  return {
    tmdbId: positiveId(row.tmdbId),
    title: text(row.title),
    posterUrl: nullableText(row.posterUrl),
    runtimeMinutes: runtime.value,
  };
}
export function parseSavedMovieNight(value: unknown): SavedMovieNight {
  const row = record(value);
  const name = validateNightName(text(row.name));
  if (!name.valid || !Array.isArray(row.movies) || row.movies.length === 0)
    throw new Error("Invalid saved session.");
  const movies = row.movies.map(parseSnapshot);
  if (new Set(movies.map((movie) => movie.tmdbId)).size !== movies.length)
    throw new Error("A saved session contains duplicate movies.");
  const availableMinutes = integer(row.available_minutes);
  const pauseMinutes = integer(row.pause_minutes);
  const totalMinutes = integer(row.total_minutes);
  const calculation = calculateSession(
    availableMinutes,
    movies.map((movie) => movie.runtimeMinutes),
    pauseMinutes,
  );
  const id = text(row.id);
  const userId = text(row.user_id);
  const createdAt = text(row.created_at);
  if (
    !id ||
    !userId ||
    !Number.isFinite(Date.parse(createdAt)) ||
    pauseMinutes !== PAUSE_MINUTES ||
    !calculation.valid ||
    !calculation.fits ||
    calculation.totalMinutes !== totalMinutes
  )
    throw new Error("Invalid saved session totals or metadata.");
  return {
    id,
    userId,
    name: name.value,
    availableMinutes,
    pauseMinutes,
    totalMinutes,
    movies,
    createdAt,
  };
}
async function findSavedNight(
  id: string,
  userId: string,
  signal?: AbortSignal,
): Promise<SavedMovieNight | null> {
  let query = getSupabase()
    .from("movie_nights")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  const night = data ? parseSavedMovieNight(data) : null;
  if (night && (night.userId !== userId || night.id !== id))
    throw new Error("This session is not accessible.");
  return night;
}
export async function getSavedMovieNight(
  id: string,
  expectedOwner: string,
  signal?: AbortSignal,
): Promise<SavedMovieNight> {
  const userId = await owner(expectedOwner);
  const night = await findSavedNight(id, userId, signal);
  if (!night)
    throw new Error("This session was not found or is not accessible.");
  await owner(expectedOwner);
  return night;
}
export async function listSavedMovieNights(
  expectedOwner: string,
  offset = 0,
  signal?: AbortSignal,
) {
  const userId = await owner(expectedOwner);
  let query = getSupabase()
    .from("movie_nights")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + 19);
  if (signal) query = query.abortSignal(signal);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  if (!Array.isArray(data)) throw new Error("Invalid saved sessions response.");
  const nights = data.map(parseSavedMovieNight);
  if (nights.some((night) => night.userId !== userId))
    throw new Error("This session is not accessible.");
  await owner(expectedOwner);
  signal?.throwIfAborted();
  const nextOffset = offset + data.length;
  return {
    nights,
    nextOffset,
    hasMore:
      count !== null && count !== undefined
        ? nextOffset < count
        : data.length > 0,
  };
}
function fingerprint(draft: MovieNightDraft): string {
  return JSON.stringify([
    draft.name.trim(),
    draft.availableMinutes,
    draft.movies.map((movie) => [
      movie.tmdbId,
      movie.title,
      movie.posterUrl,
      movie.runtimeMinutes,
    ]),
  ]);
}
export class SaveUncertainError extends Error {
  constructor() {
    super(
      "The save outcome is uncertain. Retry saving this unchanged draft to recover it safely.",
    );
  }
}
export async function saveMovieNight(
  draft: MovieNightDraft,
  expectedOwner: string,
  signal?: AbortSignal,
  recoveryDrafts: readonly MovieNightDraft[] = [],
): Promise<SaveNightResult> {
  const userId = await owner(expectedOwner);
  const previousAttempts = recoveryDrafts.filter(
    (attempt) => attempt.id === draft.id,
  );
  function matchesAttempt(night: SavedMovieNight, current: MovieNightDraft) {
    return (
      night.id === draft.id &&
      (fingerprint(night) === fingerprint(current) ||
        previousAttempts.some(
          (attempt) => fingerprint(night) === fingerprint(attempt),
        ))
    );
  }
  // Reviewed sources can now be empty or over budget. Always resolve an uncertain prior write first.
  if (previousAttempts.length) {
    const recovered = await findSavedNight(draft.id, userId, signal);
    if (recovered) {
      if (!matchesAttempt(recovered, draft)) throw new SaveUncertainError();
      return { status: "saved", night: recovered };
    }
  }
  const name = validateNightName(draft.name);
  const calculation = calculateSession(
    draft.availableMinutes,
    draft.movies.map((movie) => movie.runtimeMinutes),
    PAUSE_MINUTES,
  );
  if (!name.valid) throw new Error(name.reason);
  if (!draft.movies.length)
    throw new Error("Add at least one movie before saving.");
  if (!calculation.valid) throw new Error(calculation.reason);
  if (!calculation.fits)
    throw new Error("This session exceeds the available time.");
  if (
    new Set(draft.movies.map((movie) => movie.tmdbId)).size !==
    draft.movies.length
  )
    throw new Error("A movie can only appear once in a session.");
  const normalized = {
    ...draft,
    name: name.value,
    movies: draft.movies.map(parseSnapshot),
  };
  // Recover an earlier successful insert BEFORE refreshing sources: historical plans are immutable.
  const existing = previousAttempts.length
    ? null
    : await findSavedNight(draft.id, userId, signal);
  if (existing) {
    if (fingerprint(existing) !== fingerprint(normalized))
      throw new Error(
        "This draft identity already belongs to a different saved plan.",
      );
    return { status: "saved", night: existing };
  }
  const currentMovies = getEligibleMovies(
    (await getListings(signal)).filter((movie) => movie.userId === userId),
  );
  const fresh: MovieSnapshot[] = [];
  const reasons: string[] = [];
  // Sequential refresh is bounded and only touches selected movies.
  for (const selected of normalized.movies) {
    const current = currentMovies.find(
      (movie) => movie.tmdbId === selected.tmdbId,
    );
    if (!current) {
      reasons.push(
        `${selected.title} is no longer in your pending movies and will be removed from the draft.`,
      );
      continue;
    }
    const candidate = await loadMovieCandidate(current, signal);
    if (candidate.status === "error")
      throw new Error(`${candidate.title}: ${candidate.reason}`);
    if (candidate.status !== "ready") {
      reasons.push(
        `${current.title} no longer has a known duration and will be removed from the draft.`,
      );
      continue;
    }
    const snapshot: MovieSnapshot = {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      posterUrl: candidate.posterUrl,
      runtimeMinutes: candidate.runtimeMinutes,
    };
    fresh.push(snapshot);
    if (
      JSON.stringify([
        snapshot.title,
        snapshot.posterUrl,
        snapshot.runtimeMinutes,
      ]) !==
      JSON.stringify([
        selected.title,
        selected.posterUrl,
        selected.runtimeMinutes,
      ])
    )
      reasons.push(
        `${current.title} has updated information. Review its duration and the new total.`,
      );
  }
  await owner(expectedOwner);
  signal?.throwIfAborted();
  if (reasons.length) return { status: "review", movies: fresh, reasons };
  let response;
  try {
    response = await getSupabase()
      .from("movie_nights")
      .insert({
        id: normalized.id,
        user_id: userId,
        name: normalized.name,
        available_minutes: normalized.availableMinutes,
        pause_minutes: PAUSE_MINUTES,
        total_minutes: calculation.totalMinutes,
        movies: fresh,
      })
      .select()
      .single();
  } catch {
    // Once a write is sent, any unknown transport failure may follow a committed insert.
    throw new SaveUncertainError();
  }
  const { data, error } = response;
  if (error) {
    if (error.code === "23505") {
      let recovered: SavedMovieNight | null;
      try {
        recovered = await findSavedNight(normalized.id, userId);
      } catch {
        throw new SaveUncertainError();
      }
      if (recovered && matchesAttempt(recovered, normalized))
        return { status: "saved", night: recovered };
    }
    if (!error.code) throw new SaveUncertainError();
    throw new Error(error.message);
  }
  try {
    const night = parseSavedMovieNight(data);
    if (night.userId !== userId || !matchesAttempt(night, normalized))
      throw new SaveUncertainError();
    return { status: "saved", night };
  } catch {
    throw new SaveUncertainError();
  }
}

export async function deleteSavedMovieNight(
  id: string,
  expectedOwner: string,
): Promise<void> {
  const userId = await owner(expectedOwner);
  const { data, error } = await getSupabase()
    .from("movie_nights")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data || data.length !== 1 || data[0].id !== id)
    throw new Error(
      "The session was not deleted. It may no longer exist or you may not have access.",
    );
}
