import { describe, expect, it } from "vitest";
import { filterCandidatesByGenre, suggestMovieNight } from "./movieNight";
import type { MovieCandidate } from "../types/MovieNight";
const movie = (
  id: number,
  runtimeMinutes: number,
  genre = 1,
): MovieCandidate => ({
  tmdbId: id,
  title: `Movie ${id}`,
  posterUrl: null,
  status: "ready",
  runtimeMinutes,
  genres: [{ id: genre, name: `Genre ${genre}` }],
});
function ids(budget: unknown, movies: MovieCandidate[], genre?: number) {
  const result = suggestMovieNight(budget, movies, 10, genre);
  if (!result.valid) throw new Error(result.reason);
  return result.value.map((movie) => movie.tmdbId);
}
describe("automatic movie-night suggestions", () => {
  it("finds an optimum that a shortest-first greedy choice misses, counting breaks", () =>
    expect(ids(150, [movie(1, 30), movie(2, 70), movie(3, 70)])).toEqual([
      2, 3,
    ]));
  it("allows a single exact fit without a break", () =>
    expect(ids(90, [movie(1, 90)])).toEqual([1]));
  it("returns no suggestion when nothing fits", () =>
    expect(ids(30, [movie(1, 40)])).toEqual([]));
  it("deduplicates and excludes unknown, failed and invalid runtimes", () =>
    expect(
      ids(100, [
        movie(1, 40),
        movie(1, 40),
        movie(2, 0),
        {
          tmdbId: 3,
          title: "Unknown",
          posterUrl: null,
          status: "unknown",
          reason: "Missing",
        },
        {
          tmdbId: 4,
          title: "Failed",
          posterUrl: null,
          status: "error",
          reason: "Catalog failed",
        },
      ]),
    ).toEqual([1]));
  it("prefers fewer movies at an equal occupied time", () =>
    expect(ids(100, [movie(1, 40), movie(2, 50), movie(3, 100)])).toEqual([3]));
  it("uses stable ordering and does not mutate input", () => {
    const movies = [movie(2, 60), movie(1, 60)];
    expect(ids(60, movies)).toEqual([1]);
    expect(movies[0].tmdbId).toBe(2);
  });
  it("filters by genre and never duplicates multi-genre films", () => {
    const movies = [
      {
        ...movie(1, 60),
        genres: [
          { id: 1, name: "Drama" },
          { id: 2, name: "Comedy" },
        ],
      },
      movie(2, 60, 2),
    ];
    expect(ids(60, movies, 2)).toEqual([1]);
    expect(
      filterCandidatesByGenre(movies, 2).map((movie) => movie.tmdbId),
    ).toEqual([1, 2]);
    expect(ids(130, movies, 2)).toEqual([1, 2]);
    expect(filterCandidatesByGenre(movies, 3)).toEqual([]);
    expect(filterCandidatesByGenre(movies)).toEqual(movies);
  });
  it("rejects invalid budgets and pauses", () => {
    expect(suggestMovieNight(29, []).valid).toBe(false);
    expect(suggestMovieNight(100, [], -1).valid).toBe(false);
  });
});
