import { useState, useEffect } from "react";

import type { MediaType } from "../types/MediaType.ts"
import type { WatchState } from "../types/WatchState.ts";
import type { Media } from "../types/Media.ts"

import { insertListing } from "../services/listingService.ts"
import { getCurrentUserId } from "../services/authService.ts";

import { SearchMediaCard } from "./SearchMediaCard.tsx"

const BASE_URL = "https://api.themoviedb.org/3/search"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const POSTER_SIZE = "w500"
const POSTER_BASE_URL = `https://image.tmdb.org/t/p/${POSTER_SIZE}`

const RESULT_COUNT = 5

export function SearchScreen() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [searchType, setSearchType] = useState<MediaType>("movie");
  const [retryCounter, setRetryCounter] = useState<number>(1)
  const [searchResult, setSearchResult] = useState<Omit<Media, "id" | "user_id">[]>([])
  
  function onSearch(event: React.SubmitEvent) {
    event.preventDefault()
    if (input === '') return
    setSearch(input.trim())
  }
  
  function onRetry() {
    setSearch(input.trim())
    setRetryCounter((previous) => previous += 1)
  }

  function parseResults(
    results: Array<{
      title?: string
      name?: string
      id: number
      poster_path: string | null
    }>,
    searchType: MediaType
  ): Omit<Media, "id" | "user_id">[] {
    let media_list: Array<Omit<Media, "id" | "user_id">> = []

    results.forEach((element) => {
      const title: string = (searchType === 'movie' ? element.title : element.name) ?? ""
      const tmdb_id: number = element.id
      const poster_url: string = POSTER_BASE_URL + element.poster_path
      const media_type: MediaType = searchType
      const watch_state: WatchState = "plan_to_watch"

      const media: Omit<Media, "id" | "user_id"> = {
        title: title,
        tmdb_id: tmdb_id,
        poster_url: poster_url,
        media_type: media_type,
        watch_state: watch_state
      }

      media_list.push(media) 
    })

    return media_list
  }

  async function onAddListing(media: Omit<Media, "id" | "user_id">) {
    try {
      const user_id = await getCurrentUserId()
      if (!user_id) throw new Error("Unable to get User ID")
      await insertListing(media, user_id)
      window.alert(`"${media.title}" has been added successfully.`)
    }

    catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error ocurred")
    }
  }

  useEffect(() => {
    async function getSearchResults() {
      if (search === "") return

      setLoading(true)
      setError(null)

      const endpoint = searchType === "movie" ? "movie" : "tv"

      try {
        const url = BASE_URL + `/${endpoint}?api_key=${API_KEY}&query=${encodeURIComponent(search)}`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`failed to find data for: ${search}`)
        }

        const data = await response.json()
        const results = data.results.slice(0, RESULT_COUNT);
        
        if (results.length <= 0) {
          throw new Error(`No results found for: ${search}`)
        }

        console.log(results)

        const cleaned_results = parseResults(results, searchType)
        setSearchResult(cleaned_results)
      }

      catch(err: any) {
        setError(err instanceof Error ? err.message : "An unexpected error ocurred")
      }

      finally {
        setLoading(false)
      }
      
    }

    getSearchResults()

  }, [search, retryCounter])

  return (
    <div className="search-screen container flex-column py-5">
      <div className="row mb-5 justify-content-center">
        <div className="search-bar p-4 col-8 d-flex flex-column gap-3">
          <form onSubmit={onSearch}>
            <div className="mb-3">
              <label className="form-label"> Movie/Series Name </label>
              <input type="text" className="form-control mb-2" value={input} placeholder="Star Wars..."
              onChange={(e) => setInput(e.target.value)} required />
              <button className="btn btn-primary" disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </button>
            </div>
          </form>
          
          <div className="btn-group mx-5" role="group" aria-label="Search type">
            <button
              type="button"
              className={`btn ${searchType === "movie" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSearchType("movie")}
              aria-pressed={searchType === "movie"}
            >
              Movies
            </button>

            <button
              type="button"
              className={`btn ${searchType === "tv" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setSearchType("tv")}
              aria-pressed={searchType === "tv"}
            >
              TV Shows
            </button>
          </div>
        </div>        
      </div>

      <div className="row justify-content-center">
        <div className="col-8">
          {loading && (
            <div className="d-flex flex-column align-items-center gap-2">
              <div className="spinner-loading"></div>
              <p className="mb-0 text-white">Loading...</p>
            </div>
          )}
          {!loading && error && (
            <div className="error-search">
              <p>⚠️ {error}</p>
              <button className="btn btn-danger" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && searchResult[0] && (
            <div className="d-flex flex-column align-items-center gap-2">
              <h2 className="text-white"> 
                Showing Results for {searchResult[0].media_type === "movie" ? "Movies" : "TV Shows"}
              </h2>
              {searchResult.map(result => (
                <div className="col-8 mb-4" key={result.tmdb_id}>
                  <SearchMediaCard media={result} onAddListing={onAddListing}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
