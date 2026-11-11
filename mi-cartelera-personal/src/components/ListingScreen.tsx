import { useState, useEffect, useRef } from "react";

import type { Media } from "../types/Media.ts";
import type { WatchState } from "../types/WatchState.ts";

import { getListings } from "../services/listingService.ts";
import { deleteListing } from "../services/listingService.ts";

import { ListingMediaCard } from "./ListingMediaCard.tsx";

interface ListingScreenProps {
  onListingDetail: (listing: Media) => void;
  onListingEdit: (listing: Media) => void;
}

export function ListingScreen({
  onListingDetail,
  onListingEdit,
}: ListingScreenProps) {
  const [listing, setListing] = useState<Media[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number[]>([]);
  const pendingDeletes = useRef(new Set<number>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCounter, setRetryCounter] = useState<number>(1);
  const [watchStateFilter, setWatchStateFilter] = useState<WatchState | "">("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const watchStateCounts = listing.reduce<Record<WatchState, number>>(
    (counts, item) => {
      counts[item.watchState] += 1;
      return counts;
    },
    { plan_to_watch: 0, watching: 0, finished: 0 },
  );

  const invalidDateRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const filteredListings = listing.filter((item) => {
    if (invalidDateRange) return false;
    if (watchStateFilter && item.watchState !== watchStateFilter) return false;
    if (gradeFilter === "unrated" && item.userGrade != null) return false;
    if (
      gradeFilter &&
      gradeFilter !== "unrated" &&
      item.userGrade !== Number(gradeFilter)
    )
      return false;

    if (dateFrom || dateTo) {
      const addedAt = item.createdAt ? new Date(item.createdAt).getTime() : NaN;
      if (!Number.isFinite(addedAt)) return false;
      if (dateFrom && addedAt < new Date(`${dateFrom}T00:00:00`).getTime())
        return false;
      if (dateTo && addedAt > new Date(`${dateTo}T23:59:59.999`).getTime())
        return false;
    }

    return true;
  });

  function clearFilters() {
    setWatchStateFilter("");
    setGradeFilter("");
    setDateFrom("");
    setDateTo("");
  }

  function onRetry() {
    setRetryCounter((previous) => previous + 1);
  }

  async function onListingDelete(listing: Media) {
    if (pendingDeletes.current.has(listing.id)) return;
    if (!window.confirm(`Are you sure you want to remove "${listing.title}"?`))
      return;

    const id = listing.id;
    pendingDeletes.current.add(id);
    setDeleting((prev) => [...prev, id]);
    setDeleteError(null);

    try {
      await deleteListing(id);
      if (mounted.current)
        setListing((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      if (mounted.current)
        setDeleteError(
          err instanceof Error ? err.message : "Unable to remove this title.",
        );
    } finally {
      pendingDeletes.current.delete(id);
      if (mounted.current)
        setDeleting((prev) => prev.filter((value) => value !== id));
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings(controller.signal);
        if (!controller.signal.aborted) setListing(data);
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error ? err.message : "Failed to get Listings",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadListings();
    return () => controller.abort();
  }, [retryCounter]);

  return (
    <div className="container listing-screen">
      {deleteError && (
        <p className="error-search" role="alert">
          {deleteError}
        </p>
      )}
      <h2 className="my-5 text-white">My Listings: </h2>
      <div className="row justify-content-center">
        <div className="col-8">
          {!loading && !error && (
            <section aria-label="Watch state totals" className="mb-4">
              <h3 className="h5 text-white">All Listings by Watch State</h3>
              <dl className="row g-3 mb-0" aria-live="polite">
                <div className="col-12 col-md-4">
                  <div className="media-card rounded p-3 h-100">
                    <dt className="text-white">Planning to Watch</dt>
                    <dd className="fs-3 mb-0">
                      {watchStateCounts.plan_to_watch}
                    </dd>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="media-card rounded p-3 h-100">
                    <dt className="text-white">Watching</dt>
                    <dd className="fs-3 mb-0">{watchStateCounts.watching}</dd>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="media-card rounded p-3 h-100">
                    <dt className="text-white">Finished</dt>
                    <dd className="fs-3 mb-0">{watchStateCounts.finished}</dd>
                  </div>
                </div>
              </dl>
            </section>
          )}
          <div className="row g-3 mb-4 text-start">
            <div className="col-12 col-md-6">
              <label
                htmlFor="watch-state-filter"
                className="form-label text-white"
              >
                Watch State
              </label>
              <select
                id="watch-state-filter"
                className="form-select"
                value={watchStateFilter}
                onChange={(e) =>
                  setWatchStateFilter(e.target.value as WatchState | "")
                }
              >
                <option value="">All watch states</option>
                <option value="plan_to_watch">Planning to Watch</option>
                <option value="watching">Watching</option>
                <option value="finished">Finished</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="grade-filter" className="form-label text-white">
                Your Rating
              </label>
              <select
                id="grade-filter"
                className="form-select"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
              >
                <option value="">All ratings</option>
                <option value="unrated">Unrated</option>
                {[1, 2, 3, 4, 5].map((grade) => (
                  <option key={grade} value={grade}>
                    {grade} / 5
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label
                htmlFor="date-from-filter"
                className="form-label text-white"
              >
                Added From
              </label>
              <input
                id="date-from-filter"
                className="form-control"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-6">
              <label htmlFor="date-to-filter" className="form-label text-white">
                Added Through
              </label>
              <input
                id="date-to-filter"
                className="form-control"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {invalidDateRange && (
              <p className="text-danger" role="alert">
                The end date must be on or after the start date.
              </p>
            )}
            <div className="col-12">
              <button className="btn btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </div>
          {loading && (
            <div className="d-flex flex-column align-items-center gap-2">
              <div className="spinner-loading"></div>
              <p className="mb-0 text-white" role="status">
                Loading...
              </p>
            </div>
          )}
          {!loading && error && (
            <div className="error-search" role="alert">
              <p>⚠️ {error}</p>
              <button className="btn btn-danger" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="media-grid">
              <p className="text-white" role="status">
                {listing.length === 0
                  ? "You haven't added any listings yet."
                  : filteredListings.length === 0
                    ? "No listings match your filters."
                    : `Showing ${filteredListings.length} of ${listing.length} listings`}
              </p>
              {filteredListings.map((result) => (
                <div className="col-8 mb-4" key={result.id}>
                  <ListingMediaCard
                    media={result}
                    deleting={deleting.includes(result.id)}
                    onListingDetail={onListingDetail}
                    onListingEdit={onListingEdit}
                    onListingDelete={onListingDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
