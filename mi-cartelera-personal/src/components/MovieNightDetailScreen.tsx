import { useEffect, useState, useRef } from "react";
import {
  getSavedMovieNight,
  deleteSavedMovieNight,
} from "../services/movieNightService";
import { calculateSession } from "../dominio/movieNight";
import type { SavedMovieNight } from "../types/MovieNight";
import { MovieNightSummary } from "./MovieNightSummary";
import { MediaPoster } from "./MediaPoster";
export function MovieNightDetailScreen({
  id,
  userId,
  onBack,
}: {
  id: string;
  userId: string;
  onBack: () => void;
}) {
  const [night, setNight] = useState<SavedMovieNight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pendingDelete = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function handleDelete() {
    if (
      !night ||
      pendingDelete.current ||
      !window.confirm(`Delete session "${night.name}"? This cannot be undone.`)
    )
      return;
    pendingDelete.current = true;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSavedMovieNight(id, userId);
      if (active.current) onBack();
    } catch (error) {
      if (active.current)
        setDeleteError(
          error instanceof Error
            ? error.message
            : "Unable to delete this session.",
        );
    } finally {
      pendingDelete.current = false;
      if (active.current) setDeleting(false);
    }
  }
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      setNight(null);
      try {
        const saved = await getSavedMovieNight(id, userId, controller.signal);
        if (!controller.signal.aborted) setNight(saved);
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load this session.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [id, userId, retry]);
  return (
    <main className="container movie-night-screen">
      <p className="eyebrow">Your saved plan</p>
      <h1>{night?.name ?? "Session details"}</h1>
      {loading && <p role="status">Loading session…</p>}
      {error && (
        <div className="error-search" role="alert">
          <p>{error}</p>
          <button
            className="btn btn-secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry session detail
          </button>
        </div>
      )}
      {night && (
        <>
          <p>
            Saved{" "}
            <time dateTime={night.createdAt}>
              {new Date(night.createdAt).toLocaleString()}
            </time>{" "}
            · {night.availableMinutes} minutes available
          </p>
          <p>
            This plan preserves the movie information from when you saved it.
          </p>
          <MovieNightSummary
            movies={night.movies}
            calculation={calculateSession(
              night.availableMinutes,
              night.movies.map((movie) => movie.runtimeMinutes),
              night.pauseMinutes,
            )}
          />
          <section className="mt-4" aria-label="Saved movies">
            <div className="row g-3">
              {night.movies.map((movie, index) => (
                <div className="col-12 col-sm-6 col-lg-4" key={movie.tmdbId}>
                  <article className="media-card">
                    <div className="card-body">
                      <h2 className="h5">
                        {index + 1}. {movie.title}
                      </h2>
                      <MediaPoster src={movie.posterUrl} title={movie.title} />
                      <p>{movie.runtimeMinutes} minutes</p>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {deleteError && (
        <p className="error-search mt-4" role="alert">
          {deleteError}
        </p>
      )}
      {night && (
        <button
          className="btn btn-danger mt-4 me-3"
          disabled={deleting}
          onClick={() => void handleDelete()}
        >
          {deleting
            ? "Deleting session…"
            : deleteError
              ? "Retry deleting session"
              : "Delete session"}
        </button>
      )}
      <button
        className="btn btn-secondary mt-4"
        disabled={deleting}
        onClick={onBack}
      >
        Back to Saved Nights
      </button>
    </main>
  );
}
