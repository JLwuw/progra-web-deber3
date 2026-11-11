import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  loadMovieCandidates,
  loadMovieCandidate,
  saveMovieNight,
  getSavedMovieNight,
  listSavedMovieNights,
  parseSavedMovieNight,
  SaveUncertainError,
  deleteSavedMovieNight,
  markMovieNightWatched,
} from "./movieNightService";
import type { Media } from "../types/Media";
import type { MovieNightDraft } from "../types/MovieNight";
const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  getCurrentUserId: vi.fn(),
  getListings: vi.fn(),
  getMoviePlanningDetails: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({ getSupabase: mocks.getSupabase }));
vi.mock("./authService", () => ({ getCurrentUserId: mocks.getCurrentUserId }));
vi.mock("./listingService", () => ({ getListings: mocks.getListings }));
vi.mock("./tmdbService", () => ({
  getMoviePlanningDetails: mocks.getMoviePlanningDetails,
}));
const movie = {
  tmdbId: 1,
  title: "First",
  posterUrl: null,
  runtimeMinutes: 90,
};
const draft: MovieNightDraft = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Friday",
  availableMinutes: 200,
  movies: [movie],
};
const row = {
  id: draft.id,
  user_id: "owner",
  name: "Friday",
  available_minutes: 200,
  pause_minutes: 10,
  total_minutes: 90,
  movies: [movie],
  created_at: "2026-11-11T12:00:00Z",
};
function listing(id = 1): Media {
  return {
    id,
    userId: "owner",
    tmdbId: id,
    title: id === 1 ? "First" : `Movie ${id}`,
    posterUrl: null,
    mediaType: "movie",
    watchState: "plan_to_watch",
    userGrade: null,
    comment: null,
    createdAt: null,
  };
}
function queries(
  ...replies: {
    data: unknown;
    error: { code?: string; message: string } | null;
    count?: number | null;
  }[]
) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    then: (
      resolve: (value: unknown) => unknown,
      reject: (reason: unknown) => unknown,
    ) => {
      const next = replies.shift();
      return (
        next
          ? Promise.resolve(next)
          : Promise.reject(new Error("Unexpected database query"))
      ).then(resolve, reject);
    },
  };
  mocks.getSupabase.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
  return query;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentUserId.mockResolvedValue("owner");
  mocks.getListings.mockResolvedValue([listing()]);
  mocks.getMoviePlanningDetails.mockResolvedValue({ runtime: 90, genres: [] });
});
describe("Movie Night service", () => {
  it("loads only distinct owned pending movies with partial errors and bounded concurrency", async () => {
    mocks.getListings.mockResolvedValue([
      listing(),
      listing(2),
      listing(3),
      listing(4),
      { ...listing(), id: 5 },
      { ...listing(6), mediaType: "tv" },
      { ...listing(7), watchState: "finished" },
      { ...listing(8), userId: "other" },
    ]);
    let active = 0;
    let peak = 0;
    mocks.getMoviePlanningDetails.mockImplementation(async (id: number) => {
      active++;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active--;
      if (id === 3) throw new Error("Catalog failed");
      return { runtime: id === 2 ? null : 90, genres: [] };
    });
    const progress = vi.fn();
    const candidates = await loadMovieCandidates("owner", undefined, progress);
    expect(candidates.map((x) => x.status)).toEqual([
      "ready",
      "unknown",
      "error",
      "ready",
    ]);
    expect(mocks.getMoviePlanningDetails).toHaveBeenCalledTimes(4);
    expect(peak).toBeLessThanOrEqual(3);
    expect(
      progress.mock.calls[0][0].every(
        (item: { status: string }) => item.status === "loading",
      ),
    ).toBe(true);
    expect((await loadMovieCandidate(listing(3))).status).toBe("error");
  });
  it("rejects an account change before reading personal data", async () => {
    mocks.getCurrentUserId.mockResolvedValue("other");
    await expect(loadMovieCandidates("owner")).rejects.toThrow(
      "account changed",
    );
    await expect(saveMovieNight(draft, "owner")).rejects.toThrow(
      "account changed",
    );
    expect(mocks.getSupabase).not.toHaveBeenCalled();
    expect(mocks.getListings).not.toHaveBeenCalled();
  });
  it("stops cancelled candidate loading without reporting missing metadata", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      loadMovieCandidates("owner", controller.signal),
    ).rejects.toThrow();
    expect(mocks.getMoviePlanningDetails).not.toHaveBeenCalled();
  });
  it("saves exactly one ordered snapshot without updating the collection", async () => {
    const query = queries(
      { data: null, error: null },
      { data: row, error: null },
    );
    const result = await saveMovieNight(draft, "owner");
    expect(result.status).toBe("saved");
    expect(query.insert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        id: draft.id,
        user_id: "owner",
        total_minutes: 90,
        movies: [movie],
      }),
    );
    expect(mocks.getListings).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it.each(["removed", "status", "runtime", "unknown"])(
    "requires explicit review when the source is %s",
    async (change) => {
      const query = queries({ data: null, error: null });
      if (change === "removed") mocks.getListings.mockResolvedValue([]);
      if (change === "status")
        mocks.getListings.mockResolvedValue([
          { ...listing(), watchState: "watching" },
        ]);
      if (change === "runtime")
        mocks.getMoviePlanningDetails.mockResolvedValue({
          runtime: 100,
          genres: [],
        });
      if (change === "unknown")
        mocks.getMoviePlanningDetails.mockResolvedValue({
          runtime: null,
          genres: [],
        });
      const result = await saveMovieNight(draft, "owner");
      expect(result.status).toBe("review");
      expect(query.insert).not.toHaveBeenCalled();
      if (result.status === "review")
        expect(result.reasons.length).toBeGreaterThan(0);
    },
  );
  it("does not erase selection information when runtime refresh fails", async () => {
    queries({ data: null, error: null });
    mocks.getMoviePlanningDetails.mockRejectedValue(
      new Error("Network failed"),
    );
    await expect(saveMovieNight(draft, "owner")).rejects.toThrow(
      "Network failed",
    );
    expect(draft.movies).toEqual([movie]);
  });
  it("recovers an unchanged saved draft before checking subsequently removed titles", async () => {
    const query = queries({ data: row, error: null });
    const result = await saveMovieNight(draft, "owner");
    expect(result.status).toBe("saved");
    expect(query.insert).not.toHaveBeenCalled();
    expect(mocks.getListings).not.toHaveBeenCalled();
    expect(mocks.getMoviePlanningDetails).not.toHaveBeenCalled();
  });
  it("retains identity after a lost save response and recovers without another insert", async () => {
    const query = queries(
      { data: null, error: null },
      { data: null, error: { message: "Failed to fetch", code: "" } },
      { data: row, error: null },
    );
    await expect(saveMovieNight(draft, "owner")).rejects.toBeInstanceOf(
      SaveUncertainError,
    );
    expect((await saveMovieNight(draft, "owner")).status).toBe("saved");
    expect(query.insert).toHaveBeenCalledOnce();
  });
  it("recovers a concurrent duplicate UUID only if the saved contents match", async () => {
    const query = queries(
      { data: null, error: null },
      { data: null, error: { code: "23505", message: "Duplicate" } },
      { data: row, error: null },
    );
    expect((await saveMovieNight(draft, "owner")).status).toBe("saved");
    expect(query.insert).toHaveBeenCalledOnce();
    queries({ data: { ...row, name: "Different" }, error: null });
    await expect(saveMovieNight(draft, "owner")).rejects.toThrow(
      "different saved plan",
    );
  });
  it("reads historical detail without consulting TMDB or the collection", async () => {
    queries({ data: row, error: null });
    expect((await getSavedMovieNight(draft.id, "owner")).movies).toEqual([
      movie,
    ]);
    expect(mocks.getMoviePlanningDetails).not.toHaveBeenCalled();
    expect(mocks.getListings).not.toHaveBeenCalled();
  });
  it("orders history stably, scopes by owner and pages by returned count", async () => {
    const query = queries({ data: [row], error: null });
    const page = await listSavedMovieNights("owner", 20);
    expect(page.nextOffset).toBe(21);
    expect(query.range).toHaveBeenCalledWith(20, 39);
    expect(query.order.mock.calls).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("rejects malformed, oversized or foreign saved rows", async () => {
    expect(() => parseSavedMovieNight({ ...row, total_minutes: 91 })).toThrow();
    expect(() =>
      parseSavedMovieNight({ ...row, available_minutes: 30 }),
    ).toThrow();
    expect(() =>
      parseSavedMovieNight({
        ...row,
        movies: [{ ...movie, runtimeMinutes: null }],
      }),
    ).toThrow();
    const query = queries({ data: { ...row, user_id: "other" }, error: null });
    await expect(getSavedMovieNight(draft.id, "owner")).rejects.toThrow(
      "not accessible",
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("allows the same pending movie in separate saved sessions", async () => {
    const secondId = "22222222-2222-4222-8222-222222222222";
    const query = queries(
      { data: null, error: null },
      { data: row, error: null },
      { data: null, error: null },
      { data: { ...row, id: secondId }, error: null },
    );
    expect((await saveMovieNight(draft, "owner")).status).toBe("saved");
    expect(
      (await saveMovieNight({ ...draft, id: secondId }, "owner")).status,
    ).toBe("saved");
    expect(query.insert).toHaveBeenCalledTimes(2);
  });
  it("treats a malformed post-insert response as uncertain rather than allowing duplicate creation", async () => {
    queries(
      { data: null, error: null },
      { data: { ...row, total_minutes: 999 }, error: null },
    );
    await expect(saveMovieNight(draft, "owner")).rejects.toBeInstanceOf(
      SaveUncertainError,
    );
  });
  it("recovers a late original insert when it wins against a reviewed retry", async () => {
    const reviewed = { ...draft, movies: [{ ...movie, runtimeMinutes: 95 }] };
    mocks.getMoviePlanningDetails.mockResolvedValue({
      runtime: 95,
      genres: [],
    });
    const query = queries(
      { data: null, error: null },
      {
        data: null,
        error: { code: "23505", message: "Original write committed first" },
      },
      { data: row, error: null },
    );
    const result = await saveMovieNight(reviewed, "owner", undefined, [draft]);
    expect(result.status).toBe("saved");
    if (result.status === "saved")
      expect(result.night.movies[0].runtimeMinutes).toBe(90);
    expect(query.insert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ id: draft.id, movies: reviewed.movies }),
    );
  });
  it("recovers a prior known attempt even when reviewed sources leave no selection", async () => {
    const query = queries({ data: row, error: null });
    const result = await saveMovieNight(
      { ...draft, movies: [] },
      "owner",
      undefined,
      [draft],
    );
    expect(result.status).toBe("saved");
    expect(query.insert).not.toHaveBeenCalled();
    expect(mocks.getListings).not.toHaveBeenCalled();
  });
  it("accepts an intermediate committed attempt but not an unrelated recovery identity", async () => {
    const intermediate = {
      ...draft,
      movies: [{ ...movie, runtimeMinutes: 95 }],
    };
    queries({
      data: { ...row, total_minutes: 95, movies: intermediate.movies },
      error: null,
    });
    const result = await saveMovieNight(
      { ...draft, movies: [{ ...movie, runtimeMinutes: 100 }] },
      "owner",
      undefined,
      [draft, intermediate],
    );
    expect(result.status).toBe("saved");
    if (result.status === "saved") expect(result.night.totalMinutes).toBe(95);
    queries({ data: { ...row, name: "Unrecognized" }, error: null });
    await expect(
      saveMovieNight(draft, "owner", undefined, [
        { ...draft, id: "different", name: "Unrecognized" },
      ]),
    ).rejects.toThrow("different saved plan");
  });
  it("never inserts an invalid reviewed payload while the original outcome is unresolved", async () => {
    const query = queries({ data: null, error: null });
    await expect(
      saveMovieNight({ ...draft, movies: [] }, "owner", undefined, [draft]),
    ).rejects.toThrow("at least one movie");
    expect(query.insert).not.toHaveBeenCalled();
  });
  it("deletes only the expected owner's session and checks the returned row", async () => {
    const query = queries({ data: [{ id: draft.id }], error: null });
    await deleteSavedMovieNight(draft.id, "owner");
    expect(query.delete).toHaveBeenCalledOnce();
    expect(query.eq.mock.calls).toEqual([
      ["id", draft.id],
      ["user_id", "owner"],
    ]);
    expect(mocks.getListings).not.toHaveBeenCalled();
    expect(mocks.getMoviePlanningDetails).not.toHaveBeenCalled();
  });
  it("does not claim deletion succeeded for inaccessible or missing sessions", async () => {
    queries({ data: [], error: null });
    await expect(deleteSavedMovieNight(draft.id, "owner")).rejects.toThrow(
      "not deleted",
    );
    mocks.getCurrentUserId.mockResolvedValue("other");
    const query = queries({ data: [{ id: draft.id }], error: null });
    await expect(deleteSavedMovieNight(draft.id, "owner")).rejects.toThrow(
      "account changed",
    );
    expect(query.delete).not.toHaveBeenCalled();
  });
  it("uses exact totals to avoid phantom pages without hiding server-capped results", async () => {
    const query = queries({ data: [row], error: null, count: 1 });
    expect((await listSavedMovieNights("owner")).hasMore).toBe(false);
    expect(query.select).toHaveBeenCalledWith("*", { count: "exact" });
    queries({ data: [row], error: null, count: 30 });
    expect(await listSavedMovieNights("owner")).toMatchObject({
      hasMore: true,
      nextOffset: 1,
    });
  });
});

describe("optional metadata and completion services", () => {
  it("loads genres alongside runtime in one request", async () => {
    mocks.getMoviePlanningDetails.mockResolvedValue({
      runtime: 90,
      genres: [{ id: 18, name: "Drama" }],
    });
    expect(await loadMovieCandidate(listing())).toMatchObject({
      status: "ready",
      genres: [{ id: 18, name: "Drama" }],
    });
    expect(mocks.getMoviePlanningDetails).toHaveBeenCalledOnce();
  });
  it("calls the completion RPC and validates its owned completed row", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({
        data: { ...row, watched_at: "2026-11-11T14:00:00Z" },
        error: null,
      });
    mocks.getSupabase.mockReturnValue({ rpc });
    expect(
      (await markMovieNightWatched(draft.id, "owner")).watchedAt,
    ).toBeTruthy();
    expect(rpc).toHaveBeenCalledWith("mark_movie_night_watched", {
      p_night_id: draft.id,
    });
  });
  it("rejects account changes, server errors, and malformed or foreign completion responses", async () => {
    const rpc = vi.fn();
    mocks.getSupabase.mockReturnValue({ rpc });
    mocks.getCurrentUserId.mockResolvedValueOnce("other");
    await expect(markMovieNightWatched(draft.id, "owner")).rejects.toThrow(
      /account changed/,
    );
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValueOnce({ data: null, error: { message: "Denied" } });
    await expect(markMovieNightWatched(draft.id, "owner")).rejects.toThrow(
      "Denied",
    );
    for (const data of [
      row,
      { ...row, user_id: "other", watched_at: "2026-11-11T14:00:00Z" },
      { ...row, watched_at: "bad" },
    ]) {
      rpc.mockResolvedValueOnce({ data, error: null });
      await expect(markMovieNightWatched(draft.id, "owner")).rejects.toThrow();
    }
  });
});
