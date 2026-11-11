import { useMovieNight } from "../hooks/useMovieNight";
import { MediaPoster } from "./MediaPoster";
import { MovieNightSummary } from "./MovieNightSummary";
import type { SavedMovieNight } from "../types/MovieNight";
export function MovieNightScreen({
  userId,
  onSaved,
}: {
  userId: string;
  onSaved: (night: SavedMovieNight) => void;
}) {
  const night = useMovieNight(userId, onSaved);
  const fitting = night.candidates.filter((movie) => night.fitsAlone(movie));
  const unavailable = night.candidates.filter(
    (movie) => movie.status !== "ready",
  );
  const tooLong = night.candidates.filter(
    (movie) => movie.status === "ready" && !night.fitsAlone(movie),
  );
  return (
    <main className="container movie-night-screen">
      <p className="eyebrow">Your personal double feature</p>
      <h1>Movie Night</h1>
      <p>
        Choose pending movies that fit your evening. We include a 10-minute
        break between movies.
      </p>
      <form
        className="search-bar p-4 mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          night.findMovies();
        }}
      >
        <label className="form-label" htmlFor="night-budget">
          Available minutes
        </label>
        <div className="d-flex flex-wrap gap-3">
          <input
            className="form-control night-budget"
            id="night-budget"
            type="text"
            inputMode="numeric"
            value={night.available}
            onChange={(event) => night.setAvailable(event.target.value)}
            disabled={night.locked}
            aria-describedby="budget-help"
            aria-invalid={night.available !== "" && !night.budget.valid}
          />
          <button
            className="btn btn-primary"
            disabled={!night.budget.valid || night.locked}
          >
            Find movies
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!night.budget.valid || night.locked}
            onClick={night.planNight}
          >
            {night.planning ? "Planning…" : "Plan my night"}
          </button>
        </div>
        <p id="budget-help" className="mt-2 mb-0">
          Whole minutes, from 30 to 600.
        </p>
        {night.available !== "" && !night.budget.valid && (
          <p className="error-search mt-3" role="alert">
            {night.budget.reason}
          </p>
        )}
      </form>
      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <h2 className="h4">What fits</h2>
          <label className="form-label" htmlFor="night-genre">
            Genre
          </label>
          <select
            id="night-genre"
            className="form-select mb-3"
            value={night.genre}
            disabled={night.locked}
            onChange={(event) => night.setGenre(event.target.value)}
          >
            <option value="">All genres</option>
            {night.genre &&
              !night.genres.some(
                (genre) => String(genre.id) === night.genre,
              ) && (
                <option value={night.genre}>
                  Selected genre (metadata unavailable)
                </option>
              )}
            {night.genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
          {night.requested &&
            !night.loading &&
            !night.loadError &&
            night.hasPendingMovies &&
            night.candidates.length === 0 && (
              <p role="status">No pending movies match this genre.</p>
            )}
          {!night.requested && (
            <p>Enter your available time, then choose Find movies.</p>
          )}
          {night.loading && (
            <p role="status">Loading your movies and their durations…</p>
          )}
          {night.loadError && (
            <div className="error-search" role="alert">
              <p>{night.loadError}</p>
              <button
                className="btn btn-secondary"
                disabled={night.locked || !night.budget.valid}
                onClick={night.findMovies}
              >
                Retry loading movies
              </button>
            </div>
          )}
          {night.requested &&
            !night.loading &&
            !night.loadError &&
            !night.hasPendingMovies && (
              <p role="status">
                You have no pending movies. Add a movie to your collection and
                set it to Plan to Watch.
              </p>
            )}
          {night.requested &&
            !night.loading &&
            !night.loadError &&
            night.candidates.length > 0 &&
            fitting.length === 0 &&
            night.budget.valid && (
              <p role="status">
                No movies with a known duration fit this budget.
              </p>
            )}
          <div className="row g-3">
            {fitting.map((movie) => {
              const check = night.addCheck(movie);
              return (
                <div className="col-12 col-sm-6" key={movie.tmdbId}>
                  <article className="media-card h-100">
                    <div className="card-body">
                      <h3 className="card-title">{movie.title}</h3>
                      <MediaPoster src={movie.posterUrl} title={movie.title} />
                      <p>
                        {movie.status === "ready" &&
                          `${movie.runtimeMinutes} minutes`}
                      </p>
                      {!check.valid && (
                        <p id={`night-reason-${movie.tmdbId}`}>
                          {check.reason}
                        </p>
                      )}
                      <button
                        className="btn btn-primary"
                        aria-label={`Add ${movie.title}`}
                        disabled={night.locked || !check.valid}
                        aria-describedby={
                          !check.valid
                            ? `night-reason-${movie.tmdbId}`
                            : undefined
                        }
                        onClick={() => night.add(movie)}
                      >
                        Add movie
                      </button>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
          {tooLong.length > 0 && night.budget.valid && (
            <p className="mt-3">
              {tooLong.length} other pending{" "}
              {tooLong.length === 1 ? "movie exceeds" : "movies exceed"} your
              full budget.
            </p>
          )}
          {unavailable.length > 0 && (
            <section className="mt-4" aria-labelledby="unavailable-movies">
              <h2 className="h5" id="unavailable-movies">
                Unavailable movies
              </h2>
              <ul className="list-unstyled">
                {unavailable.map((movie) => (
                  <li
                    className="media-card p-3 mb-3 night-unavailable"
                    key={movie.tmdbId}
                  >
                    <h3 className="h6">{movie.title}</h3>
                    <p role={movie.status === "error" ? "alert" : "status"}>
                      {movie.status === "loading"
                        ? "Loading duration…"
                        : movie.reason}
                    </p>
                    {movie.status === "error" && (
                      <button
                        className="btn btn-secondary"
                        disabled={night.locked}
                        aria-label={`Retry ${movie.title}`}
                        onClick={() => void night.retryMovie(movie)}
                      >
                        Retry duration
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <div className="col-12 col-lg-5">
          <MovieNightSummary
            movies={night.selected}
            calculation={night.calculation}
            onRemove={night.remove}
            locked={night.locked}
          />
          <div className="search-bar p-4 mt-3">
            <label className="form-label" htmlFor="night-name">
              Session name
            </label>
            <input
              id="night-name"
              className="form-control"
              value={night.name}
              disabled={night.locked}
              onChange={(event) => night.setName(event.target.value)}
              aria-describedby="night-save-help"
            />
            <p className="mt-3" id="night-save-help">
              {night.saveProblem ??
                "Saving keeps your movies in Plan to Watch."}
            </p>
            {night.error && (
              <p role="alert" className="error-search">
                {night.error}
              </p>
            )}
            {night.saveError && (
              <p role="alert" className="error-search">
                {night.saveError}
              </p>
            )}
            {night.review && (
              <div className="error-search" role="alert">
                <h2 className="h5">Review required</h2>
                <ul>
                  {night.review.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p>
                  {night.uncertain
                    ? "The earlier save may still complete. Accept source updates and retry the same session; if an earlier attempt was saved, its actual plan will be recovered."
                    : "No session was saved. Accept these updates, check the total, then save again."}
                </p>
                <button
                  className="btn btn-secondary"
                  disabled={night.saving || night.planning}
                  onClick={night.acceptReview}
                >
                  Accept updated draft
                </button>
              </div>
            )}
            {night.uncertain && (
              <p role="status">
                Your draft is locked until its save outcome is resolved. Name,
                budget, and manual movie changes stay locked. Source updates can
                be reviewed; retry saving to recover the same session.
              </p>
            )}
            <button
              className="btn btn-primary w-100"
              disabled={
                night.saving || night.planning || Boolean(night.saveProblem)
              }
              onClick={() => void night.save()}
            >
              {night.saving
                ? "Saving…"
                : night.uncertain || night.saveError
                  ? "Retry saving"
                  : "Save Night"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
