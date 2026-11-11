import { useState, useEffect, useRef } from "react";
import type { MediaType } from "../types/MediaType";
import type { SearchMedia } from "../types/Media";
import { insertListing } from "../services/listingService";
import { searchMedia } from "../services/tmdbService";
import { SearchMediaCard } from "./SearchMediaCard";

export function SearchScreen() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<MediaType>("movie");
  const [page, setPage] = useState(1);
  const [retryCounter, setRetryCounter] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchMedia[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [addStates, setAddStates] = useState<
    Record<string, { pending: boolean; added: boolean; error: string | null }>
  >({});
  const pendingAdds = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (!search) return;
    const controller = new AbortController();
    async function loadResults() {
      setLoading(true);
      setError(null);
      setResults([]);
      try {
        const data = await searchMedia(
          search,
          searchType,
          page,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setResults(data.results);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (!controller.signal.aborted)
          setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadResults();
    return () => controller.abort();
  }, [search, searchType, page, retryCounter]);
  async function onAddListing(media: SearchMedia) {
    const key = `${media.mediaType}:${media.tmdbId}`;
    if (pendingAdds.current.has(key) || addStates[key]?.added) return;
    pendingAdds.current.add(key);
    setAddStates((prev) => ({
      ...prev,
      [key]: { pending: true, added: false, error: null },
    }));
    try {
      await insertListing(media);
      if (mounted.current)
        setAddStates((prev) => ({
          ...prev,
          [key]: { pending: false, added: true, error: null },
        }));
    } catch (err) {
      if (mounted.current)
        setAddStates((prev) => ({
          ...prev,
          [key]: {
            pending: false,
            added: false,
            error: err instanceof Error ? err.message : "Unable to add title.",
          },
        }));
    } finally {
      pendingAdds.current.delete(key);
    }
  }
  return (
    <main className="search-screen container flex-column py-5">
      <h1 className="h2">Search movies and TV shows</h1>
      <div className="row mb-5 justify-content-center">
        <div className="search-bar p-4 col-8 d-flex flex-column gap-3">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!input.trim()) return;
              setSearch(input.trim());
              setPage(1);
              setRetryCounter((n) => n + 1);
            }}
          >
            <div className="mb-3">
              <label htmlFor="title-search" className="form-label">
                Movie/Series Name
              </label>
              <input
                id="title-search"
                type="search"
                className="form-control"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                required
                placeholder="Star Wars…"
              />
              <button className="btn btn-primary">Search</button>
            </div>
          </form>
          <div className="btn-group" role="group" aria-label="Search type">
            {(["movie", "tv"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`btn ${searchType === type ? "btn-primary" : "btn-outline-primary"}`}
                aria-pressed={searchType === type}
                onClick={() => {
                  setSearchType(type);
                  setPage(1);
                }}
              >
                {type === "movie" ? "Movies" : "TV Shows"}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading && <p role="status">Loading…</p>}
      {error && (
        <div className="error-search" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            onClick={() => setRetryCounter((n) => n + 1)}
          >
            Retry search
          </button>
        </div>
      )}
      {!loading && !error && search && (
        <>
          {results.length === 0 && (
            <p role="status">No results found for “{search}”.</p>
          )}
          <div className="media-grid">
            {results.map((media) => {
              const key = `${media.mediaType}:${media.tmdbId}`;
              return (
                <SearchMediaCard
                  key={key}
                  media={media}
                  onAddListing={onAddListing}
                  pending={addStates[key]?.pending ?? false}
                  added={addStates[key]?.added ?? false}
                  error={addStates[key]?.error ?? null}
                />
              );
            })}
          </div>
          <nav
            aria-label="Search result pages"
            className="d-flex gap-3 align-items-center mt-4"
          >
            <button
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((n) => n - 1)}
            >
              Previous
            </button>
            <span role="status">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((n) => n + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
