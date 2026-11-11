import type { MediaType } from "../types/MediaType";
import type { SearchMedia } from "../types/Media";
import {
  record,
  text,
  nullableText,
  positiveId,
  integer,
} from "../lib/validation";

export interface MediaDetails {
  overview: string;
  tagline: string;
  genres: { id: number; name: string }[];
  voteAverage: number;
  voteCount: number;
  releaseDate: string;
  firstAirDate: string;
  runtime: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  status: string;
  cast: { id: number; name: string; character: string }[];
}
async function request(
  path: string,
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<unknown> {
  const apiKey: unknown = import.meta.env.VITE_TMDB_API_KEY;
  if (typeof apiKey !== "string" || !apiKey.trim())
    throw new Error("TMDB API key is not configured.");
  params.set("api_key", apiKey);
  const response = await fetch(
    `https://api.themoviedb.org/3/${path}?${params}`,
    { signal },
  );
  if (!response.ok)
    throw new Error("Unable to load information from TMDB. Please try again.");
  return response.json();
}
export function parseSearchPage(value: unknown, mediaType: MediaType) {
  const data = record(value);
  if (!Array.isArray(data.results)) throw new Error("Invalid search response.");
  const results: SearchMedia[] = data.results.map((value: unknown) => {
    const item = record(value);
    const date = text(
      mediaType === "movie" ? item.release_date : item.first_air_date,
    );
    const path = nullableText(item.poster_path);
    return {
      tmdbId: positiveId(item.id),
      title:
        text(mediaType === "movie" ? item.title : item.name).trim() ||
        "Untitled",
      posterUrl: path ? `https://image.tmdb.org/t/p/w500${path}` : null,
      mediaType,
      releaseYear: /^\d{4}-/.test(date) ? date.slice(0, 4) : null,
    };
  });
  return {
    results,
    totalPages: Math.min(500, Math.max(1, integer(data.total_pages))),
  };
}
export async function searchMedia(
  query: string,
  mediaType: MediaType,
  page: number,
  signal?: AbortSignal,
) {
  return parseSearchPage(
    await request(
      `search/${mediaType}`,
      new URLSearchParams({ query, page: String(page) }),
      signal,
    ),
    mediaType,
  );
}
function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function parseMediaDetails(value: unknown): MediaDetails {
  const item = record(value);
  const credits = item.credits == null ? {} : record(item.credits);
  return {
    overview: text(item.overview),
    tagline: text(item.tagline),
    status: text(item.status),
    genres: Array.isArray(item.genres)
      ? item.genres.map((value: unknown) => {
          const genre = record(value);
          return { id: positiveId(genre.id), name: text(genre.name) };
        })
      : [],
    voteAverage: optionalNumber(item.vote_average) ?? 0,
    voteCount: optionalNumber(item.vote_count) ?? 0,
    releaseDate: text(item.release_date),
    firstAirDate: text(item.first_air_date),
    runtime: optionalNumber(item.runtime),
    numberOfSeasons: optionalNumber(item.number_of_seasons),
    numberOfEpisodes: optionalNumber(item.number_of_episodes),
    cast: Array.isArray(credits.cast)
      ? credits.cast.map((value: unknown) => {
          const actor = record(value);
          return {
            id: positiveId(actor.id),
            name: text(actor.name),
            character: text(actor.character),
          };
        })
      : [],
  };
}
export async function getMediaDetails(
  id: number,
  mediaType: MediaType,
  signal?: AbortSignal,
): Promise<MediaDetails> {
  return parseMediaDetails(
    await request(
      `${mediaType}/${id}`,
      new URLSearchParams({ append_to_response: "credits" }),
      signal,
    ),
  );
}

export async function getMovieRuntime(
  id: number,
  signal?: AbortSignal,
): Promise<unknown> {
  return record(
    await request(`movie/${positiveId(id)}`, new URLSearchParams(), signal),
  ).runtime;
}

export async function getMoviePlanningDetails(
  id: number,
  signal?: AbortSignal,
) {
  const item = record(
    await request(`movie/${positiveId(id)}`, new URLSearchParams(), signal),
  );
  return { runtime: item.runtime, genres: parseMediaDetails(item).genres };
}
