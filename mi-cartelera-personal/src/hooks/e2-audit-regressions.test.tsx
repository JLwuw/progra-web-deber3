import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMovieNight } from "./useMovieNight";
import {
  loadMovieCandidates,
  loadMovieCandidate,
  saveMovieNight,
  SaveUncertainError,
} from "../services/movieNightService";
import type { MovieCandidate, SavedMovieNight } from "../types/MovieNight";
vi.mock("../services/movieNightService", async (original) => ({
  ...(await original<typeof import("../services/movieNightService")>()),
  loadMovieCandidates: vi.fn(),
  loadMovieCandidate: vi.fn(),
  saveMovieNight: vi.fn(),
}));
const ready: MovieCandidate = {
  tmdbId: 1,
  title: "First",
  posterUrl: null,
  runtimeMinutes: 90,
  status: "ready",
};
const failed: MovieCandidate = {
  tmdbId: 1,
  title: "First",
  posterUrl: null,
  status: "error",
  reason: "Old failure",
};
const waiting: MovieCandidate = {
  tmdbId: 2,
  title: "Second",
  posterUrl: null,
  status: "loading",
};
beforeEach(() => vi.resetAllMocks());
describe("E2 audit regressions", () => {
  it("must retain successful retry after later initial-load progress", async () => {
    let publish!: (movies: MovieCandidate[]) => void;
    let finish!: (movies: MovieCandidate[]) => void;
    vi.mocked(loadMovieCandidates).mockImplementationOnce(
      (_owner, _signal, onProgress) =>
        new Promise((resolve) => {
          publish = onProgress!;
          finish = resolve;
          publish([failed, waiting]);
        }),
    );
    vi.mocked(loadMovieCandidate).mockResolvedValue(ready);
    const { result } = renderHook(() => useMovieNight("owner", vi.fn()));
    act(() => result.current.setAvailable("200"));
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]?.status).toBe("error"),
    );
    await act(async () => result.current.retryMovie(failed));
    expect(
      result.current.candidates.find((movie) => movie.tmdbId === 1)?.status,
    ).toBe("ready");
    await act(async () => {
      publish([failed, { ...ready, tmdbId: 2, title: "Second" }]);
      finish([failed, { ...ready, tmdbId: 2, title: "Second" }]);
    });
    expect(
      result.current.candidates.find((movie) => movie.tmdbId === 1)?.status,
    ).toBe("ready");
  });
  it("must retain the uncertain identity until the original save outcome is resolved", async () => {
    vi.mocked(loadMovieCandidates).mockResolvedValue([ready]);
    const saved: SavedMovieNight = {
      id: "saved",
      name: "Friday",
      availableMinutes: 200,
      movies: [
        { tmdbId: 1, title: "First", posterUrl: null, runtimeMinutes: 95 },
      ],
      userId: "owner",
      pauseMinutes: 10,
      totalMinutes: 95,
      createdAt: "2026-11-11T12:00:00Z",
    };
    vi.mocked(saveMovieNight)
      .mockRejectedValueOnce(new SaveUncertainError())
      .mockResolvedValueOnce({
        status: "review",
        movies: saved.movies,
        reasons: ["Duration changed"],
      })
      .mockResolvedValueOnce({ status: "saved", night: saved });
    const { result } = renderHook(() => useMovieNight("owner", vi.fn()));
    act(() => {
      result.current.setAvailable("200");
      result.current.setName("Friday");
    });
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]?.status).toBe("ready"),
    );
    act(() => result.current.add(ready));
    await act(async () => result.current.save());
    expect(result.current.uncertain).toBe(true);
    const originalId = vi.mocked(saveMovieNight).mock.calls[0][0].id;
    await act(async () => result.current.save());
    expect(result.current.uncertain).toBe(true);
    act(() => result.current.setName("A different plan"));
    expect(result.current.name).toBe("Friday");
    act(() => result.current.acceptReview());
    expect(result.current.uncertain).toBe(true);
    await act(async () => result.current.save());
    expect(vi.mocked(saveMovieNight).mock.calls[2][0].id).toBe(originalId);
  });
  it("ignores an older retry when a newer retry for the same movie succeeds", async () => {
    vi.mocked(loadMovieCandidates).mockResolvedValue([failed]);
    let finishOld!: (movie: MovieCandidate) => void;
    vi.mocked(loadMovieCandidate)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOld = resolve;
          }),
      )
      .mockResolvedValueOnce({ ...ready, runtimeMinutes: 95 });
    const { result } = renderHook(() => useMovieNight("owner", vi.fn()));
    act(() => result.current.setAvailable("200"));
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]?.status).toBe("error"),
    );
    let oldRequest!: Promise<void>;
    act(() => {
      oldRequest = result.current.retryMovie(failed);
    });
    await act(async () => result.current.retryMovie(failed));
    await act(async () => {
      finishOld(ready);
      await oldRequest;
    });
    expect(result.current.candidates[0]).toMatchObject({
      status: "ready",
      runtimeMinutes: 95,
    });
    expect(vi.mocked(loadMovieCandidate).mock.calls[0][1]?.aborted).toBe(true);
  });
  it("allows a new full refresh to replace old successful retry overrides", async () => {
    vi.mocked(loadMovieCandidates)
      .mockResolvedValueOnce([failed])
      .mockResolvedValueOnce([{ ...ready, runtimeMinutes: 100 }]);
    vi.mocked(loadMovieCandidate).mockResolvedValue(ready);
    const { result } = renderHook(() => useMovieNight("owner", vi.fn()));
    act(() => result.current.setAvailable("200"));
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]?.status).toBe("error"),
    );
    await act(async () => result.current.retryMovie(failed));
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]).toMatchObject({
        runtimeMinutes: 100,
      }),
    );
  });
  it("preserves accepted review metadata against older batch progress", async () => {
    let publish!: (movies: MovieCandidate[]) => void;
    let finish!: (movies: MovieCandidate[]) => void;
    vi.mocked(loadMovieCandidates).mockImplementationOnce(
      (_owner, _signal, onProgress) =>
        new Promise((resolve) => {
          publish = onProgress!;
          finish = resolve;
          publish([ready, waiting]);
        }),
    );
    vi.mocked(saveMovieNight).mockResolvedValueOnce({
      status: "review",
      movies: [
        { tmdbId: 1, title: "First", posterUrl: null, runtimeMinutes: 95 },
      ],
      reasons: ["Duration changed"],
    });
    const { result } = renderHook(() => useMovieNight("owner", vi.fn()));
    act(() => {
      result.current.setAvailable("200");
      result.current.setName("Friday");
    });
    act(() => result.current.findMovies());
    await waitFor(() =>
      expect(result.current.candidates[0]?.status).toBe("ready"),
    );
    act(() => result.current.add(ready));
    await act(async () => result.current.save());
    act(() => result.current.acceptReview());
    await act(async () => {
      publish([ready, { ...ready, tmdbId: 2 }]);
      finish([ready, { ...ready, tmdbId: 2 }]);
    });
    expect(
      result.current.candidates.find((movie) => movie.tmdbId === 1),
    ).toMatchObject({ runtimeMinutes: 95 });
    expect(result.current.selected[0].runtimeMinutes).toBe(95);
  });
});
