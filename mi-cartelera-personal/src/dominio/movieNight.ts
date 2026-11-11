import type { Media } from "../types/Media";
import type {
  MovieSnapshot,
  MovieCandidate,
  Validation,
  SessionCalculation,
} from "../types/MovieNight";
export const PAUSE_MINUTES = 10;
export function validateAvailableMinutes(raw: unknown): Validation<number> {
  const value =
    typeof raw === "string" && /^\d+$/.test(raw.trim())
      ? Number(raw.trim())
      : raw;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 30 ||
    value > 600
  )
    return {
      valid: false,
      reason: "Enter a whole number of minutes from 30 to 600.",
    };
  return { valid: true, value };
}
export function normalizeRuntime(value: unknown): Validation<number> {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? { valid: true, value }
    : {
        valid: false,
        reason:
          "Duration is unavailable from TMDB. This movie cannot be added.",
      };
}
export function validateNightName(raw: string): Validation<string> {
  const value = raw.trim();
  return [...value].length >= 1 && [...value].length <= 80
    ? { valid: true, value }
    : { valid: false, reason: "Enter a session name with 1–80 characters." };
}
export function calculateSession(
  availableMinutes: unknown,
  durations: readonly unknown[],
  pauseMinutes: number,
): SessionCalculation {
  const budget = validateAvailableMinutes(availableMinutes);
  if (!budget.valid) return budget;
  if (!Number.isSafeInteger(pauseMinutes) || pauseMinutes < 0)
    return {
      valid: false,
      reason: "Break length must be a nonnegative whole number.",
    };
  let movieMinutes = 0;
  for (const duration of durations) {
    const runtime = normalizeRuntime(duration);
    if (!runtime.valid) return runtime;
    movieMinutes += runtime.value;
  }
  const breakMinutes = pauseMinutes * Math.max(durations.length - 1, 0);
  const totalMinutes = movieMinutes + breakMinutes;
  if (!Number.isSafeInteger(totalMinutes))
    return { valid: false, reason: "The total duration is too large." };
  return {
    valid: true,
    movieMinutes,
    breakMinutes,
    totalMinutes,
    remainingMinutes: budget.value - totalMinutes,
    fits: totalMinutes <= budget.value,
  };
}
export function canAddMovie(
  budget: unknown,
  selectedMovies: readonly MovieSnapshot[],
  candidate: MovieSnapshot,
  pauseMinutes: number,
): Validation<MovieSnapshot> {
  if (selectedMovies.some((movie) => movie.tmdbId === candidate.tmdbId))
    return { valid: false, reason: "This movie is already included." };
  const total = calculateSession(
    budget,
    [
      ...selectedMovies.map((movie) => movie.runtimeMinutes),
      candidate.runtimeMinutes,
    ],
    pauseMinutes,
  );
  if (!total.valid) return total;
  if (!total.fits)
    return {
      valid: false,
      reason:
        "This movie and the next required break exceed your remaining time.",
    };
  return { valid: true, value: candidate };
}
export function getEligibleMovies(listings: readonly Media[]): Media[] {
  const movies = new Map<number, Media>();
  for (const listing of listings) {
    if (listing.mediaType !== "movie" || listing.watchState !== "plan_to_watch")
      continue;
    const previous = movies.get(listing.tmdbId);
    if (!previous || listing.id < previous.id)
      movies.set(listing.tmdbId, listing);
  }
  return [...movies.values()];
}
export function sortCandidates(
  movies: readonly MovieCandidate[],
): MovieCandidate[] {
  return [...movies].sort((a, b) => {
    if (a.status === "ready" && b.status !== "ready") return -1;
    if (b.status === "ready" && a.status !== "ready") return 1;
    if (
      a.status === "ready" &&
      b.status === "ready" &&
      a.runtimeMinutes !== b.runtimeMinutes
    )
      return a.runtimeMinutes - b.runtimeMinutes;
    return a.title.localeCompare(b.title, "en") || a.tmdbId - b.tmdbId;
  });
}

export function filterCandidatesByGenre(
  movies: readonly MovieCandidate[],
  genreId?: number,
): MovieCandidate[] {
  return movies.filter(
    (movie) =>
      genreId === undefined ||
      movie.genres?.some((genre) => genre.id === genreId),
  );
}

/** Exact 0/1 time packing. A trailing break is removed from the transformed capacity. */
export function suggestMovieNight(
  available: unknown,
  movies: readonly MovieCandidate[],
  pauseMinutes = PAUSE_MINUTES,
  genreId?: number,
): Validation<MovieSnapshot[]> {
  const budget = validateAvailableMinutes(available);
  if (!budget.valid) return budget;
  if (
    !Number.isSafeInteger(pauseMinutes) ||
    pauseMinutes < 0 ||
    pauseMinutes > 600
  )
    return { valid: false, reason: "Invalid break length." };
  const capacity = budget.value + pauseMinutes;
  const plans: (MovieSnapshot[] | undefined)[] = Array(capacity + 1);
  plans[0] = [];
  const seen = new Set<number>();
  for (const movie of sortCandidates(
    filterCandidatesByGenre(movies, genreId),
  )) {
    if (
      movie.status !== "ready" ||
      !normalizeRuntime(movie.runtimeMinutes).valid ||
      seen.has(movie.tmdbId)
    )
      continue;
    seen.add(movie.tmdbId);
    const weight = movie.runtimeMinutes + pauseMinutes;
    for (let total = capacity; total >= weight; total--) {
      const previous = plans[total - weight];
      if (!previous) continue;
      const next = [
        ...previous,
        {
          tmdbId: movie.tmdbId,
          title: movie.title,
          posterUrl: movie.posterUrl,
          runtimeMinutes: movie.runtimeMinutes,
        },
      ];
      const existing = plans[total];
      if (!existing || next.length < existing.length) plans[total] = next;
    }
  }
  for (let total = capacity; total > 0; total--) {
    const plan = plans[total];
    if (plan?.length) return { valid: true, value: plan };
  }
  return { valid: true, value: [] };
}
