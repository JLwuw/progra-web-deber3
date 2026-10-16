import { useState, useEffect } from "react";

import type { ContentType } from "../types/ContentType.ts"

const BASE_URL = "https://api.themoviedb.org/3/search"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export function SearchScreen() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [searchType, setSearchType] = useState<ContentType>("movie");
  const [retryCounter, setRetryCounter] = useState<number>(1)
  
  useEffect(() => {
    async function getSearchResults() {
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
        console.log(data)
      }

      catch(err: any) {
        setError(err instanceof Error ? err.message : "An unexpected error ocurred")
        console.log(err.message)
      }

      finally {
        setLoading(false)
      }
      
    }

    getSearchResults()

  }, [search, retryCounter])

  function onSearch(event: React.SubmitEvent) {
    event.preventDefault()
    if (input === '') return
    setSearch(input.trim())
  }

  function onRetry() {
    setSearch(input.trim())
    setRetryCounter((previous) => previous += 1)
  }

  return (
    <div className="search-screen container flex-column py-5">
      <div className="row mb-5 justify-content-center">
        <div className="search-bar p-4 col-8 d-flex flex-column gap-3">
          <form onSubmit={onSearch}>
            <div className="mb-3">
              <label className="form-label"> Movie/Series Name </label>
              <input type="text" className="form-control" value={input}
              onChange={(e) => setInput(e.target.value)} required />
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
        </div>
      </div>

    </div>
  )
}