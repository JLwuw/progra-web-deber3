import { MediaPoster } from "./MediaPoster";
import { useEffect, useState } from "react";
import type { Media } from "../types/Media";
import { getMediaDetails } from "../services/tmdbService";
import type { MediaDetails } from "../services/tmdbService";

interface ListingDetailProps {
  listing: Media;
  onListingExit: () => void;
}

export function ListingDetailScreen({
  listing,
  onListingExit,
}: ListingDetailProps) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetails() {
      setLoading(true);
      setError(null);
      setDetails(null);

      try {
        const data = await getMediaDetails(
          listing.tmdbId,
          listing.mediaType,
          controller.signal,
        );
        if (!controller.signal.aborted) setDetails(data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load details from TMDB.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadDetails();
    return () => controller.abort();
  }, [listing.tmdbId, listing.mediaType, retryCounter]);

  return (
    <div className="container listing-detail-screen">
      <div className="row justify-content-center">
        <div className="card media-card col-8">
          <div className="card-body detail-layout">
            <aside className="detail-poster">
              <p className="eyebrow">In your collection</p>
              <h2 className="card-title mb-3">{listing.title}</h2>
              <MediaPoster src={listing.posterUrl} title={listing.title} />
              <p className="mb-3">TMDB ID: {listing.tmdbId}</p>
            </aside>
            <div className="detail-content">
              <h5 className="text-white"> Type: </h5>
              <p>{listing.mediaType === "movie" ? "Movie" : "TV Show"}</p>

              {loading && <p role="status">Loading TMDB details...</p>}
              {error && (
                <div className="mb-3" role="alert">
                  <p>{error}</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setRetryCounter((prev) => prev + 1)}
                  >
                    Retry
                  </button>
                </div>
              )}
              {!loading && details && (
                <section aria-label="TMDB details" className="mb-4">
                  {details.tagline && (
                    <p className="fst-italic">{details.tagline}</p>
                  )}
                  <h5 className="text-white">Synopsis:</h5>
                  <p>{details.overview || "No synopsis available."}</p>

                  <h5 className="text-white">Genres:</h5>
                  <p>
                    {details.genres.map((genre) => genre.name).join(", ") ||
                      "Not available"}
                  </p>

                  <h5 className="text-white">TMDB Rating:</h5>
                  <p>
                    {details.voteCount > 0
                      ? `${details.voteAverage.toFixed(1)} / 10 (${details.voteCount.toLocaleString()} votes)`
                      : "No votes yet"}
                  </p>

                  <h5 className="text-white">
                    {listing.mediaType === "movie"
                      ? "Release Date:"
                      : "First Air Date:"}
                  </h5>
                  <p>
                    {(listing.mediaType === "movie"
                      ? details.releaseDate
                      : details.firstAirDate) || "Not available"}
                  </p>

                  {listing.mediaType === "movie" ? (
                    <>
                      <h5 className="text-white">Runtime:</h5>
                      <p>
                        {details.runtime
                          ? `${details.runtime} minutes`
                          : "Not available"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h5 className="text-white">Seasons / Episodes:</h5>
                      <p>
                        {details.numberOfSeasons ?? "Unknown"} seasons /{" "}
                        {details.numberOfEpisodes ?? "Unknown"} episodes
                      </p>
                    </>
                  )}

                  <h5 className="text-white">Production Status:</h5>
                  <p>{details.status || "Not available"}</p>

                  <h5 className="text-white">Cast:</h5>
                  {details.cast.length ? (
                    <ul className="list-unstyled">
                      {details.cast.slice(0, 10).map((actor) => (
                        <li key={actor.id}>
                          {actor.name}
                          {actor.character ? ` as ${actor.character}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No cast information available.</p>
                  )}
                </section>
              )}

              <h5 className="text-white"> State: </h5>
              <p>
                {listing.watchState === "plan_to_watch"
                  ? "Planning to Watch"
                  : listing.watchState === "watching"
                    ? "Watching"
                    : "Finished"}
              </p>

              <h5 className="text-white">Comment:</h5>
              {listing.comment ? (
                <p>{listing.comment}</p>
              ) : (
                <p>You haven’t added a comment yet</p>
              )}
              <h5 className="text-white">Rating: </h5>
              {listing.userGrade ? (
                <p>{listing.userGrade}</p>
              ) : (
                <p>You haven’t given this listing a rating yet</p>
              )}
              <button className="btn btn-secondary" onClick={onListingExit}>
                Back to My Listings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
