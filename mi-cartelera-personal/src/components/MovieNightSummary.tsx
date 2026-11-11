import { useRef } from "react";
import type { MovieSnapshot, SessionCalculation } from "../types/MovieNight";
export function MovieNightSummary({
  movies,
  calculation,
  onRemove,
  locked = false,
}: {
  movies: MovieSnapshot[];
  calculation: SessionCalculation;
  onRemove?: (id: number) => void;
  locked?: boolean;
}) {
  const summary = useRef<HTMLElement>(null);
  return (
    <section
      className="media-card p-4 night-summary"
      aria-labelledby="night-summary-title"
      ref={summary}
      tabIndex={-1}
    >
      <h2 id="night-summary-title" className="h4">
        Session plan
      </h2>
      {!movies.length && <p>No movies selected yet.</p>}
      <ol className="list-unstyled">
        {movies.map((movie, index) => (
          <li key={movie.tmdbId} className="mb-3">
            {index > 0 && <p className="eyebrow">10-minute break</p>}
            <div className="d-flex gap-3 justify-content-between align-items-start">
              <span>
                {index + 1}. {movie.title}{" "}
                <span className="d-block">{movie.runtimeMinutes} minutes</span>
              </span>
              {onRemove && (
                <button
                  className="btn btn-danger"
                  disabled={locked}
                  aria-label={`Remove ${movie.title}`}
                  onClick={() => {
                    onRemove(movie.tmdbId);
                    queueMicrotask(() => summary.current?.focus());
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div role="status" aria-live="polite" aria-atomic="true">
        {calculation.valid ? (
          <dl className="night-totals">
            <div>
              <dt>Movie time</dt>
              <dd>{calculation.movieMinutes} minutes</dd>
            </div>
            <div>
              <dt>Break time</dt>
              <dd>{calculation.breakMinutes} minutes</dd>
            </div>
            <div>
              <dt>Total time</dt>
              <dd>{calculation.totalMinutes} minutes</dd>
            </div>
            <div>
              <dt>Time remaining</dt>
              <dd>{calculation.remainingMinutes} minutes</dd>
            </div>
          </dl>
        ) : (
          <p>{calculation.reason}</p>
        )}
      </div>
    </section>
  );
}
