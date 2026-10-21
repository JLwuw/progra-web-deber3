import { useEffect, useState } from "react"
import type { Media } from "../types/Media"
import { getMediaDetails } from "../services/tmdbService"
import type { MediaDetails } from "../services/tmdbService"


interface ListingDetailProps {
    listing: Media,
    onListingExit: () => void
}


export function ListingDetailScreen( { listing, onListingExit }: ListingDetailProps  ) {
  const [details, setDetails] = useState<MediaDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCounter, setRetryCounter] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDetails() {
      setLoading(true)
      setError(null)
      setDetails(null)

      try {
        const data = await getMediaDetails(listing.tmdb_id, listing.media_type, controller.signal)
        if (!controller.signal.aborted) setDetails(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load details from TMDB.")
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadDetails()
    return () => controller.abort()
  }, [listing.tmdb_id, listing.media_type, retryCounter])

  return (
    <div className="container listing-detail-screen">
      <div className="row justify-content-center">
        <div className="card media-card col-8">
          <div className="card-body detail-layout">
            <aside className="detail-poster">
              <p className="eyebrow">In your collection</p>
            <h2 className="card-title mb-3">{listing.title}</h2>
            <img className="img-fluid mb-3" src={listing.poster_url} alt={`${listing.title} poster`}/>
            <p className="mb-3">TMDB ID: {listing.tmdb_id}</p>
            </aside>
            <div className="detail-content">
            <h5 className="text-white"> Type: </h5>
            <p>{listing.media_type === "movie" ? "Movie" : "TV Show"}</p>

            {loading && <p role="status">Loading TMDB details...</p>}
            {error && (
              <div className="mb-3" role="alert">
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => setRetryCounter((prev) => prev + 1)}>
                  Retry
                </button>
              </div>
            )}
            {!loading && details && (
              <section aria-label="TMDB details" className="mb-4">
                {details.tagline && <p className="fst-italic">{details.tagline}</p>}
                <h5 className="text-white">Synopsis:</h5>
                <p>{details.overview || "No synopsis available."}</p>

                <h5 className="text-white">Genres:</h5>
                <p>{details.genres.map((genre) => genre.name).join(", ") || "Not available"}</p>

                <h5 className="text-white">TMDB Rating:</h5>
                <p>{details.vote_count > 0
                  ? `${details.vote_average.toFixed(1)} / 10 (${details.vote_count.toLocaleString()} votes)`
                  : "No votes yet"}</p>

                <h5 className="text-white">{listing.media_type === "movie" ? "Release Date:" : "First Air Date:"}</h5>
                <p>{(listing.media_type === "movie" ? details.release_date : details.first_air_date) || "Not available"}</p>

                {listing.media_type === "movie" ? (
                  <>
                    <h5 className="text-white">Runtime:</h5>
                    <p>{details.runtime ? `${details.runtime} minutes` : "Not available"}</p>
                  </>
                ) : (
                  <>
                    <h5 className="text-white">Seasons / Episodes:</h5>
                    <p>{details.number_of_seasons ?? "Unknown"} seasons / {details.number_of_episodes ?? "Unknown"} episodes</p>
                  </>
                )}

                <h5 className="text-white">Production Status:</h5>
                <p>{details.status || "Not available"}</p>

                <h5 className="text-white">Cast:</h5>
                {details.credits?.cast.length ? (
                  <ul className="list-unstyled">
                    {details.credits.cast.slice(0, 10).map((actor) => (
                      <li key={actor.id}>
                        {actor.name}{actor.character ? ` as ${actor.character}` : ""}
                      </li>
                    ))}
                  </ul>
                ) : <p>No cast information available.</p>}
              </section>
            )}

            <h5 className="text-white"> State: </h5>
            <p>
              {listing.watch_state === "plan_to_watch" ? "Planning to Watch" :
                listing.watch_state === "watching" ? "Watching" : "Finished"}
            </p>

            <h5 className="text-white">Comment:</h5>
            {listing.comment ? (
              <p>{listing.comment}</p>
            ) : (
              <p>You havent added a comment yet</p>
            )}
            <h5 className="text-white">Rating: </h5>
            {listing.user_grade ? (
              <p>{listing.user_grade}</p>
            ) : (
              <p>You havent given this listing a rating yet</p>
            )}
            <button 
              className="btn btn-secondary"
              onClick={onListingExit}
            >
              Back to My Listings
            </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
