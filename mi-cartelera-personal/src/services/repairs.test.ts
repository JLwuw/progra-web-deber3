import { describe, expect, it, vi } from "vitest";
import {
  parseListing,
  toListingChanges,
  deleteListing,
  getListings,
  insertListing,
} from "./listingService";
import { parseSearchPage, parseMediaDetails, searchMedia } from "./tmdbService";
import { getConfigurationError } from "../lib/supabase";
const { getSupabaseMock, getCurrentUserIdMock } = vi.hoisted(() => ({
  getSupabaseMock: vi.fn(),
  getCurrentUserIdMock: vi.fn(),
}));
vi.mock("../lib/supabase", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/supabase")>()),
  getSupabase: getSupabaseMock,
}));
vi.mock("./authService", () => ({ getCurrentUserId: getCurrentUserIdMock }));
const row = {
  id: 1,
  user_id: "owner",
  tmdb_id: 3,
  title: "Example",
  poster_url: "",
  media_type: "tv",
  watch_state: "watching",
  user_grade: null,
  comment: null,
  created_at: null,
};
describe("service boundaries", () => {
  it("maps nullable database fields to validated camelCase domain values", () => {
    expect(parseListing(row)).toMatchObject({
      userGrade: null,
      comment: null,
      posterUrl: null,
      mediaType: "tv",
      watchState: "watching",
    });
    expect(() => parseListing({ ...row, user_grade: 6 })).toThrow(
      "Invalid rating",
    );
    expect(() => parseListing({ ...row, media_type: "person" })).toThrow();
  });
  it("updates personal fields only and keeps null values in serialized JSON", () => {
    const payload = toListingChanges({
      watchState: "watching",
      userGrade: null,
      comment: null,
    });
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      watch_state: "watching",
      user_grade: null,
      comment: null,
    });
    expect(() =>
      toListingChanges({
        watchState: "watching",
        userGrade: 1.5,
        comment: null,
      }),
    ).toThrow();
  });
  it("uses TV dates and handles missing posters/years without fabricating URLs", () => {
    expect(
      parseSearchPage(
        {
          total_pages: 3,
          results: [
            {
              id: 4,
              name: "TV",
              first_air_date: "2021-01-01",
              poster_path: null,
            },
          ],
        },
        "tv",
      ),
    ).toEqual({
      totalPages: 3,
      results: [
        {
          tmdbId: 4,
          title: "TV",
          mediaType: "tv",
          releaseYear: "2021",
          posterUrl: null,
        },
      ],
    });
    expect(parseSearchPage({ total_pages: 0, results: [] }, "movie")).toEqual({
      results: [],
      totalPages: 1,
    });
    expect(() => parseSearchPage({ results: "bad" }, "movie")).toThrow();
    expect(parseMediaDetails({})).toMatchObject({
      cast: [],
      genres: [],
      voteCount: 0,
    });
  });
  it("provides safe missing-configuration errors before a request", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "invalid");
    expect(getConfigurationError()).toMatch(/project URL/);
    vi.stubEnv("VITE_TMDB_API_KEY", "");
    await expect(searchMedia("Example", "movie", 1)).rejects.toThrow(
      "not configured",
    );
    vi.unstubAllEnvs();
  });
  it("rejects zero-row deletion rather than claiming success", async () => {
    getCurrentUserIdMock.mockResolvedValue("owner");
    const query = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    getSupabaseMock.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
    await expect(deleteListing(1)).rejects.toThrow("not removed");
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  });
  it("loads all bounded collection pages with cancellation and owner filtering", async () => {
    getCurrentUserIdMock.mockResolvedValue("owner");
    const page = Array.from({ length: 100 }, (_, index) => ({
      ...row,
      id: index + 1,
    }));
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi
        .fn()
        .mockResolvedValueOnce({ data: page, error: null })
        .mockResolvedValueOnce({ data: [{ ...row, id: 101 }], error: null })
        .mockResolvedValueOnce({ data: [], error: null }),
    };
    getSupabaseMock.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
    const controller = new AbortController();
    expect(await getListings(controller.signal)).toHaveLength(101);
    expect(query.range).toHaveBeenNthCalledWith(2, 100, 199);
    expect(query.abortSignal).toHaveBeenCalledWith(controller.signal);
  });
  it("continues past short server-capped pages without skipping rows", async () => {
    getCurrentUserIdMock.mockResolvedValue("owner");
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi
        .fn()
        .mockResolvedValueOnce({ data: [row, { ...row, id: 2 }], error: null })
        .mockResolvedValueOnce({ data: [{ ...row, id: 3 }], error: null })
        .mockResolvedValueOnce({ data: [], error: null }),
    };
    getSupabaseMock.mockReturnValue({ from: vi.fn().mockReturnValue(query) });
    expect(await getListings(new AbortController().signal)).toHaveLength(3);
    expect(query.range).toHaveBeenNthCalledWith(2, 2, 101);
    expect(query.range).toHaveBeenNthCalledWith(3, 3, 102);
  });
  it("does not silently rewrite a whitespace-only personal comment on read", () => {
    expect(parseListing({ ...row, comment: "  " }).comment).toBe("  ");
  });

  it("rejects an already saved title before attempting an insert", async () => {
    getCurrentUserIdMock.mockResolvedValue("owner");
    const lookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    };
    const from = vi.fn().mockReturnValue(lookup);
    getSupabaseMock.mockReturnValue({ from });
    await expect(
      insertListing({
        tmdbId: 3,
        title: "Example",
        mediaType: "movie",
        posterUrl: null,
        releaseYear: null,
      }),
    ).rejects.toThrow("already in your collection");
    expect(from).toHaveBeenCalledOnce();
  });
  it("turns a concurrent unique-index conflict into a duplicate-title explanation", async () => {
    getCurrentUserIdMock.mockResolvedValue("owner");
    const lookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const insert = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({
          data: null,
          error: { code: "23505", message: "duplicate" },
        }),
    };
    getSupabaseMock.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(lookup).mockReturnValueOnce(insert),
    });
    await expect(
      insertListing({
        tmdbId: 3,
        title: "Example",
        mediaType: "movie",
        posterUrl: null,
        releaseYear: null,
      }),
    ).rejects.toThrow("already in your collection");
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "owner",
        watch_state: "plan_to_watch",
        poster_url: "",
      }),
    );
  });
  it("encodes catalog queries and forwards the cancellation signal", async () => {
    vi.stubEnv("VITE_TMDB_API_KEY", "test-only");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ results: [], total_pages: 0 }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    await searchMedia("A & B?", "tv", 2, signal);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/3/search/tv");
    expect(url.searchParams.get("query")).toBe("A & B?");
    expect(url.searchParams.get("page")).toBe("2");
    expect(fetchMock.mock.calls[0][1]).toEqual({ signal });
  });
});
