import { useState, useEffect, useRef } from "react";
import {
  calculateSession,
  canAddMovie,
  PAUSE_MINUTES,
  sortCandidates,
  validateAvailableMinutes,
  validateNightName,
} from "../dominio/movieNight";
import {
  loadMovieCandidates,
  loadMovieCandidate,
  saveMovieNight,
  SaveUncertainError,
} from "../services/movieNightService";
import type {
  MovieCandidate,
  MovieSnapshot,
  MovieNightDraft,
  SavedMovieNight,
} from "../types/MovieNight";

export function useMovieNight(
  userId: string,
  onSaved: (night: SavedMovieNight) => void,
) {
  const [available, setAvailable] = useState("");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<MovieSnapshot[]>([]);
  const [candidates, setCandidates] = useState<MovieCandidate[]>([]);
  const [requested, setRequested] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [review, setReview] = useState<{
    movies: MovieSnapshot[];
    reasons: string[];
  } | null>(null);
  const id = useRef<string | null>(null);
  const pendingSave = useRef(false);
  const recoveryDrafts = useRef<MovieNightDraft[]>([]);
  const candidateOverrides = useRef(new Map<number, MovieCandidate | null>());
  const candidateRequests = useRef(new Map<number, AbortController>());
  const alive = useRef(true);
  const requests = useRef(new Set<AbortController>());
  const generation = useRef(0);
  useEffect(() => {
    alive.current = true;
    const controllers = requests.current;
    return () => {
      alive.current = false;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, []);
  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    const controllers = requests.current;
    controllers.add(controller);
    const version = ++generation.current;
    candidateRequests.current.forEach((request) => request.abort());
    candidateRequests.current.clear();
    const overrides = new Map<number, MovieCandidate | null>();
    candidateOverrides.current = overrides;
    function merge(progress: MovieCandidate[]) {
      return progress.flatMap((movie) => {
        if (!overrides.has(movie.tmdbId)) return [movie];
        const newer = overrides.get(movie.tmdbId);
        return newer ? [newer] : [];
      });
    }
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const movies = await loadMovieCandidates(
          userId,
          controller.signal,
          (progress) => {
            if (!controller.signal.aborted && version === generation.current)
              setCandidates(merge(progress));
          },
        );
        if (!controller.signal.aborted && version === generation.current)
          setCandidates(merge(movies));
      } catch (error) {
        if (!controller.signal.aborted)
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load pending movies.",
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => {
      controller.abort();
      controllers.delete(controller);
    };
  }, [requested, refresh, userId]);
  const budget = validateAvailableMinutes(available);
  const validName = validateNightName(name);
  const calculation = calculateSession(
    available,
    selected.map((movie) => movie.runtimeMinutes),
    PAUSE_MINUTES,
  );
  const locked = saving || uncertain;
  function edit(action: () => void) {
    if (pendingSave.current || uncertain) return;
    id.current = null;
    recoveryDrafts.current = [];
    setReview(null);
    setError(null);
    action();
  }
  function findMovies() {
    if (!budget.valid || locked) return;
    setRequested(true);
    setRefresh((n) => n + 1);
  }
  function add(candidate: MovieCandidate) {
    if (locked || pendingSave.current || candidate.status !== "ready") return;
    const movie: MovieSnapshot = {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      posterUrl: candidate.posterUrl,
      runtimeMinutes: candidate.runtimeMinutes,
    };
    const check = canAddMovie(available, selected, movie, PAUSE_MINUTES);
    if (!check.valid) {
      setError(check.reason);
      return;
    }
    edit(() =>
      setSelected((previous) =>
        canAddMovie(available, previous, movie, PAUSE_MINUTES).valid
          ? [...previous, movie]
          : previous,
      ),
    );
  }
  async function retryMovie(candidate: MovieCandidate) {
    if (locked || pendingSave.current) return;
    candidateRequests.current.get(candidate.tmdbId)?.abort();
    const controller = new AbortController();
    candidateRequests.current.set(candidate.tmdbId, controller);
    requests.current.add(controller);
    const version = generation.current;
    const overrides = candidateOverrides.current;
    const loadingCandidate: MovieCandidate = {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      posterUrl: candidate.posterUrl,
      status: "loading",
    };
    overrides.set(candidate.tmdbId, loadingCandidate);
    setCandidates((previous) =>
      previous.map((movie) =>
        movie.tmdbId === candidate.tmdbId ? loadingCandidate : movie,
      ),
    );
    try {
      const updated = await loadMovieCandidate(candidate, controller.signal);
      if (
        !controller.signal.aborted &&
        version === generation.current &&
        candidateRequests.current.get(candidate.tmdbId) === controller
      ) {
        overrides.set(updated.tmdbId, updated);
        setCandidates((previous) =>
          previous.map((movie) =>
            movie.tmdbId === updated.tmdbId ? updated : movie,
          ),
        );
      }
    } catch (error) {
      if (!controller.signal.aborted && alive.current)
        setError(error instanceof Error ? error.message : "Retry failed.");
    } finally {
      if (candidateRequests.current.get(candidate.tmdbId) === controller)
        candidateRequests.current.delete(candidate.tmdbId);
      requests.current.delete(controller);
    }
  }
  const saveProblem = uncertain
    ? review
      ? "Review the source updates, then retry recovering this session."
      : null
    : !budget.valid
      ? budget.reason
      : !validName.valid
        ? validName.reason
        : !selected.length
          ? "Add at least one movie before saving."
          : !calculation.valid
            ? calculation.reason
            : !calculation.fits
              ? "Remove a movie or increase the available time before saving."
              : review
                ? "Review and accept the updated draft before saving."
                : null;
  async function save() {
    if (pendingSave.current || saveProblem || !budget.valid) return;
    pendingSave.current = true;
    setSaving(true);
    setError(null);
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      id.current ??= crypto.randomUUID();
      const draft: MovieNightDraft = {
        id: id.current,
        name,
        availableMinutes: budget.value,
        movies: selected,
      };
      const previousAttempts = uncertain ? [...recoveryDrafts.current] : [];
      recoveryDrafts.current.push(draft);
      const result = await saveMovieNight(
        draft,
        userId,
        controller.signal,
        previousAttempts,
      );
      if (!alive.current || controller.signal.aborted) return;
      if (result.status === "review") {
        setReview(result);
      } else {
        setSelected([]);
        setName("");
        setUncertain(false);
        id.current = null;
        recoveryDrafts.current = [];
        onSaved(result.night);
      }
    } catch (error) {
      if (alive.current && !controller.signal.aborted) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to save this session.",
        );
        if (error instanceof SaveUncertainError) setUncertain(true);
      }
    } finally {
      pendingSave.current = false;
      requests.current.delete(controller);
      if (alive.current) setSaving(false);
    }
  }
  return {
    available,
    name,
    selected,
    candidates: sortCandidates(candidates),
    requested,
    loading,
    loadError,
    error,
    saving,
    uncertain,
    locked,
    review,
    budget,
    calculation,
    saveProblem,
    setAvailable: (value: string) => edit(() => setAvailable(value)),
    setName: (value: string) => edit(() => setName(value)),
    findMovies,
    add,
    retryMovie,
    save,
    remove: (tmdbId: number) =>
      edit(() =>
        setSelected((movies) =>
          movies.filter((movie) => movie.tmdbId !== tmdbId),
        ),
      ),
    acceptReview: () => {
      if (!review || pendingSave.current) return;
      const refreshed = review.movies;
      const selectedIds = new Set(selected.map((movie) => movie.tmdbId));
      for (const tmdbId of selectedIds) {
        candidateRequests.current.get(tmdbId)?.abort();
        candidateRequests.current.delete(tmdbId);
        const fresh = refreshed.find((movie) => movie.tmdbId === tmdbId);
        candidateOverrides.current.set(
          tmdbId,
          fresh ? { ...fresh, status: "ready" } : null,
        );
      }
      // Source review can change the proposed payload, but never abandon an uncertain operation's UUID.
      if (!uncertain) {
        id.current = null;
        recoveryDrafts.current = [];
      }
      setReview(null);
      setError(null);
      setSelected(refreshed);
      setCandidates((previous) =>
        previous
          .filter(
            (movie) =>
              !selectedIds.has(movie.tmdbId) ||
              refreshed.some((fresh) => fresh.tmdbId === movie.tmdbId),
          )
          .map((movie) => {
            const fresh = refreshed.find(
              (item) => item.tmdbId === movie.tmdbId,
            );
            return fresh ? { ...fresh, status: "ready" as const } : movie;
          }),
      );
    },
    addCheck: (movie: MovieCandidate) =>
      movie.status === "ready"
        ? canAddMovie(
            available,
            selected,
            {
              tmdbId: movie.tmdbId,
              title: movie.title,
              posterUrl: movie.posterUrl,
              runtimeMinutes: movie.runtimeMinutes,
            },
            PAUSE_MINUTES,
          )
        : {
            valid: false as const,
            reason:
              movie.status === "loading" ? "Loading duration…" : movie.reason,
          },
    fitsAlone: (movie: MovieCandidate) => {
      const result = calculateSession(
        available,
        [movie.status === "ready" ? movie.runtimeMinutes : null],
        PAUSE_MINUTES,
      );
      return result.valid && result.fits;
    },
  };
}
