import { useState, useEffect } from "react";

import type { ContentType } from "../types/ContentType.ts"

const BASE_URL = "https://api.themoviedb.org/3/search"
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

export function SearchScreen() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [searchType, setSearchType] = useState<ContentType>("movie");
  
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
        setError(err.message)
        console.log(err.message)
      }

      finally {
        setLoading(false)
      }
      
    }

    getSearchResults()

  }, [search])

  function onSearch(event: React.SubmitEvent) {
    event.preventDefault()
    if (input === '') return
    setSearch(input.trim())
  }

  return (
    <div className="search-screen">
      <div className="search-bar p-4">
        <form onSubmit={onSearch}>
          <div className="mb-3">
            <label className="form-label"> Movie/Series Name </label>
            <input type="text" className="form-control" value={input}
            onChange={(e) => setInput(e.target.value)} required />
          </div>
        </form>

        <div className="btn-group" role="group" aria-label="Search type">
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
  )
}