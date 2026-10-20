import type { MediaType } from "../types/MediaType"

export interface MediaDetails {
  overview: string
  tagline: string
  genres: { id: number; name: string }[]
  vote_average: number
  vote_count: number
  release_date?: string
  first_air_date?: string
  runtime?: number | null
  number_of_seasons?: number
  number_of_episodes?: number
  status: string
  credits?: {
    cast: { id: number; name: string; character: string }[]
  }
}

export async function getMediaDetails(
  id: number,
  mediaType: MediaType,
  signal?: AbortSignal
): Promise<MediaDetails> {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  if (!apiKey) throw new Error("TMDB API key is not configured.")

  const params = new URLSearchParams({ api_key: apiKey, append_to_response: "credits" })
  const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${id}?${params}`, { signal })

  if (!response.ok) throw new Error("Unable to load details from TMDB. Please try again.")

  return response.json()
}
