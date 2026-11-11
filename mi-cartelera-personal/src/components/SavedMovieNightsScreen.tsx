import { useEffect, useState } from "react";
import { listSavedMovieNights } from "../services/movieNightService";
import type { SavedMovieNight } from "../types/MovieNight";
export function SavedMovieNightsScreen({
  userId,
  onDetail,
}: {
  userId: string;
  onDetail: (id: string) => void;
}) {
  const [nights, setNights] = useState<SavedMovieNight[]>([]);
  const [offset, setOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const page = await listSavedMovieNights(
          userId,
          offset,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setNights((previous) =>
            offset === 0
              ? page.nights
              : [
                  ...previous,
                  ...page.nights.filter(
                    (night) => !previous.some((item) => item.id === night.id),
                  ),
                ],
          );
          setNextOffset(page.nextOffset);
          setHasMore(page.hasMore);
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load saved sessions.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [userId, offset, retry]);
  return (
    <main className="container movie-night-screen">
      <p className="eyebrow">Your plans, ready for later</p>
      <h1>Saved Nights</h1>
      <p>
        Private plans, newest first. Saving a plan does not mark its movies as
        watched.
      </p>
      {loading && <p role="status">Loading saved sessions…</p>}
      {error && (
        <div className="error-search" role="alert">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && nights.length === 0 && (
        <p role="status">
          No saved sessions yet. Build your first Movie Night.
        </p>
      )}
      <div className="row g-3">
        {nights.map((night) => (
          <div className="col-12 col-md-6" key={night.id}>
            <article className="media-card">
              <div className="card-body">
                <h2 className="card-title">{night.name}</h2>
                <p>{night.watchedAt ? "Watched" : "Planned"}</p>
                <p>
                  Saved{" "}
                  <time dateTime={night.createdAt}>
                    {new Date(night.createdAt).toLocaleString()}
                  </time>
                </p>
                <p>
                  {night.totalMinutes} minutes total · {night.movies.length}{" "}
                  {night.movies.length === 1 ? "movie" : "movies"}
                </p>
                <button
                  className="btn btn-primary"
                  aria-label={`View ${night.name}`}
                  onClick={() => onDetail(night.id)}
                >
                  View session
                </button>
              </div>
            </article>
          </div>
        ))}
      </div>
      {(nights.length > 0 || error) && (
        <button
          className="btn btn-secondary mt-4"
          disabled={loading || (!error && !hasMore)}
          onClick={() =>
            error ? setRetry((value) => value + 1) : setOffset(nextOffset)
          }
        >
          {error
            ? "Retry saved sessions"
            : loading
              ? "Loading more sessions…"
              : hasMore
                ? "Load more sessions"
                : "All sessions loaded"}
        </button>
      )}
    </main>
  );
}
