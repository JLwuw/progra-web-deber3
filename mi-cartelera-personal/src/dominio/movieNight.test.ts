import { describe, it, expect } from "vitest";
import {
  calculateSession,
  validateAvailableMinutes,
  normalizeRuntime,
  validateNightName,
  canAddMovie,
  getEligibleMovies,
  sortCandidates,
} from "./movieNight";
import type { Media } from "../types/Media";
const movie = {
  tmdbId: 1,
  title: "Example",
  posterUrl: null,
  runtimeMinutes: 90,
};
describe("Movie Night domain", () => {
  it("accepts exact fit including only inter-movie breaks", () => {
    expect(calculateSession(200, [90, 100], 10)).toEqual({
      valid: true,
      movieMinutes: 190,
      breakMinutes: 10,
      totalMinutes: 200,
      remainingMinutes: 0,
      fits: true,
    });
  });
  it("does not add a break to a single movie or empty draft", () => {
    expect(calculateSession(120, [90], 10)).toMatchObject({
      breakMinutes: 0,
      totalMinutes: 90,
      remainingMinutes: 30,
    });
    expect(calculateSession(120, [], 10)).toMatchObject({
      totalMinutes: 0,
      remainingMinutes: 120,
    });
  });
  it.each([null, undefined, 0, -1, 1.5, "90", NaN, Infinity])(
    "rejects unknown/invalid runtime %s",
    (value) => {
      expect(normalizeRuntime(value).valid).toBe(false);
      expect(calculateSession(120, [value], 10).valid).toBe(false);
    },
  );
  it.each(["", " ", "abc", 29, 601, 30.5, NaN, null, true, "1e2", "0x64"])(
    "rejects invalid available time %s",
    (value) => expect(validateAvailableMinutes(value).valid).toBe(false),
  );
  it.each([30, 600, "30", "600"])("accepts budget boundary %s", (value) =>
    expect(validateAvailableMinutes(value).valid).toBe(true),
  );
  it("rejects a next movie that fits alone but not with the next break", () => {
    expect(
      canAddMovie(
        200,
        [movie],
        { ...movie, tmdbId: 2, runtimeMinutes: 101 },
        10,
      ).valid,
    ).toBe(false);
    expect(
      canAddMovie(
        200,
        [movie],
        { ...movie, tmdbId: 2, runtimeMinutes: 100 },
        10,
      ).valid,
    ).toBe(true);
    expect(canAddMovie(200, [movie], movie, 10).valid).toBe(false);
  });
  it("recalculates removals without modifying input", () => {
    const durations = [80, 90, 100];
    expect(calculateSession(300, durations, 10)).toMatchObject({
      totalMinutes: 290,
      breakMinutes: 20,
    });
    expect(
      calculateSession(300, [durations[0], durations[2]], 10),
    ).toMatchObject({ totalMinutes: 190, breakMinutes: 10 });
    expect(durations).toEqual([80, 90, 100]);
    expect(calculateSession(100, [100], -1).valid).toBe(false);
  });
  it("validates trimmed names with Unicode character lengths", () => {
    expect(validateNightName("  Night  ")).toEqual({
      valid: true,
      value: "Night",
    });
    for (const value of ["", " ", "a".repeat(81)])
      expect(validateNightName(value).valid).toBe(false);
    expect(validateNightName("🎬".repeat(80)).valid).toBe(true);
  });
  it("deduplicates pending movies deterministically and sorts runtime/title/id", () => {
    const base: Media = {
      id: 2,
      userId: "owner",
      tmdbId: 1,
      title: "B",
      posterUrl: null,
      mediaType: "movie",
      watchState: "plan_to_watch",
      userGrade: null,
      comment: null,
      createdAt: null,
    };
    expect(
      getEligibleMovies([
        base,
        { ...base, id: 1 },
        { ...base, id: 3, mediaType: "tv" },
        { ...base, id: 4, watchState: "finished" },
      ]).map((x) => x.id),
    ).toEqual([1]);
    expect(
      sortCandidates([
        { ...movie, status: "ready", tmdbId: 2, title: "B" },
        { ...movie, status: "unknown", tmdbId: 3, reason: "Unknown" },
        { ...movie, status: "ready", title: "A" },
      ]).map((x) => x.tmdbId),
    ).toEqual([1, 2, 3]);
  });
});
