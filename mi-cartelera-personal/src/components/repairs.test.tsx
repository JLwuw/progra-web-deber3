import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { Media, SearchMedia } from "../types/Media";
import { ListingEditScreen } from "./ListingEditScreen";
import { SearchScreen } from "./SearchScreen";
import { ListingScreen } from "./ListingScreen";
import { MediaPoster } from "./MediaPoster";
import { AuthScreen } from "./AuthScreen";
import {
  updateListing,
  insertListing,
  getListings,
  deleteListing,
} from "../services/listingService";
import { searchMedia } from "../services/tmdbService";
import { registerUser } from "../services/authService";
vi.mock("../services/listingService", () => ({
  updateListing: vi.fn(),
  insertListing: vi.fn(),
  getListings: vi.fn(),
  deleteListing: vi.fn(),
}));
vi.mock("../services/tmdbService", () => ({ searchMedia: vi.fn() }));
vi.mock("../services/authService", () => ({
  registerUser: vi.fn(),
  startSession: vi.fn(),
}));
const listing: Media = {
  id: 1,
  userId: "owner",
  tmdbId: 3,
  title: "Example",
  posterUrl: null,
  mediaType: "movie",
  watchState: "finished",
  userGrade: 4,
  comment: "Old note",
  createdAt: "2026-01-01T12:00:00Z",
};
const result: SearchMedia = {
  tmdbId: 3,
  title: "Example",
  posterUrl: null,
  mediaType: "movie",
  releaseYear: "2020",
};
function submitSearch() {
  fireEvent.change(screen.getByLabelText("Movie/Series Name"), {
    target: { value: "Example" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
}
describe("existing workflow regression repairs", () => {
  it("preserves Finished while clearing rating/comment with explicit null", async () => {
    vi.mocked(updateListing).mockResolvedValue(listing);
    const exit = vi.fn();
    render(<ListingEditScreen listing={listing} onListingExit={exit} />);
    expect(
      (screen.getByLabelText("Watch State") as HTMLSelectElement).value,
    ).toBe("finished");
    fireEvent.change(screen.getByLabelText(/Rating/), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(updateListing).toHaveBeenCalledWith(1, {
        watchState: "finished",
        userGrade: null,
        comment: null,
      }),
    );
    expect(exit).toHaveBeenCalledOnce();
  });
  it("refreshes the same query, category and result page", async () => {
    vi.mocked(searchMedia).mockResolvedValue({
      results: [result],
      totalPages: 2,
    });
    render(<SearchScreen />);
    submitSearch();
    await screen.findByText("2020");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(searchMedia).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "TV Shows" }));
    await waitFor(() =>
      expect(searchMedia).toHaveBeenLastCalledWith(
        "Example",
        "tv",
        1,
        expect.any(AbortSignal),
      ),
    );
    await screen.findByText("2020");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(searchMedia).toHaveBeenLastCalledWith(
        "Example",
        "tv",
        2,
        expect.any(AbortSignal),
      ),
    );
  });
  it("ignores a late result from the old category", async () => {
    let resolveOld!: (data: {
      results: SearchMedia[];
      totalPages: number;
    }) => void;
    vi.mocked(searchMedia)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValueOnce({
        results: [{ ...result, title: "New TV result", mediaType: "tv" }],
        totalPages: 1,
      });
    render(<SearchScreen />);
    submitSearch();
    fireEvent.click(screen.getByRole("button", { name: "TV Shows" }));
    await screen.findByText("New TV result");
    await act(async () =>
      resolveOld({
        results: [{ ...result, title: "Old movie result" }],
        totalPages: 1,
      }),
    );
    expect(screen.queryByText("Old movie result")).toBeNull();
  });
  it("keeps search results on add failure and retries only the add", async () => {
    vi.mocked(searchMedia).mockResolvedValue({
      results: [result],
      totalPages: 1,
    });
    vi.mocked(insertListing)
      .mockRejectedValueOnce(new Error("Insert failed"))
      .mockResolvedValueOnce(listing);
    render(<SearchScreen />);
    submitSearch();
    await screen.findByText("2020");
    fireEvent.click(screen.getByRole("button", { name: "Add to my Listing" }));
    await screen.findByRole("alert");
    expect(screen.getByText("2020")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry adding" }));
    await screen.findByText("Added to your collection.");
    expect(searchMedia).toHaveBeenCalledOnce();
  });
  it("separates empty search from a request error", async () => {
    vi.mocked(searchMedia).mockResolvedValue({ results: [], totalPages: 1 });
    render(<SearchScreen />);
    submitSearch();
    await screen.findByText(/No results found/);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("retains a collection entry after failed delete and blocks pending removal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(getListings).mockResolvedValue([listing]);
    let rejectDelete!: (reason: Error) => void;
    vi.mocked(deleteListing).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject;
        }),
    );
    render(<ListingScreen onListingDetail={vi.fn()} onListingEdit={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    expect(
      (screen.getByRole("button", { name: "Removing…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await act(async () => rejectDelete(new Error("Not removed")));
    await screen.findByText("Not removed");
    expect(screen.getByText("Example")).toBeTruthy();
  });
  it("replaces missing and broken posters with a readable alternative", () => {
    const { rerender } = render(<MediaPoster src={null} title="Example" />);
    expect(
      screen.getByRole("img", { name: "Example: poster unavailable" }),
    ).toBeTruthy();
    rerender(
      <MediaPoster src="https://example.test/poster.jpg" title="Example" />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Example poster" }));
    expect(screen.getByText("Poster unavailable")).toBeTruthy();
  });
  it("explains registration confirmation without claiming a session", async () => {
    vi.mocked(registerUser).mockResolvedValue(false);
    render(<AuthScreen />);
    fireEvent.click(screen.getByRole("button", { name: /Don’t have/ }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.test" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "example-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    await screen.findByText(/Check your email/);
  });
});
