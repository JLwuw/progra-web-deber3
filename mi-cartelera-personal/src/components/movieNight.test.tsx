import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MovieNightScreen } from "./MovieNightScreen";
import { SavedMovieNightsScreen } from "./SavedMovieNightsScreen";
import { MovieNightDetailScreen } from "./MovieNightDetailScreen";
import {
  loadMovieCandidates,
  loadMovieCandidate,
  saveMovieNight,
  listSavedMovieNights,
  getSavedMovieNight,
  SaveUncertainError,
  deleteSavedMovieNight,
  markMovieNightWatched,
} from "../services/movieNightService";
import type { MovieCandidate, SavedMovieNight } from "../types/MovieNight";
vi.mock("../services/movieNightService", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/movieNightService")>()),
  loadMovieCandidates: vi.fn(),
  loadMovieCandidate: vi.fn(),
  saveMovieNight: vi.fn(),
  listSavedMovieNights: vi.fn(),
  getSavedMovieNight: vi.fn(),
  deleteSavedMovieNight: vi.fn(),
  markMovieNightWatched: vi.fn(),
}));
const first = {
  tmdbId: 1,
  title: "First",
  posterUrl: null,
  runtimeMinutes: 90,
};
const second = {
  tmdbId: 2,
  title: "Second",
  posterUrl: null,
  runtimeMinutes: 100,
};
const candidates: MovieCandidate[] = [
  { ...first, status: "ready" },
  { ...second, status: "ready" },
  {
    ...second,
    tmdbId: 3,
    title: "Too much with break",
    runtimeMinutes: 101,
    status: "ready",
  },
  {
    tmdbId: 4,
    title: "Unknown",
    posterUrl: null,
    status: "unknown",
    reason: "Duration unavailable",
  },
  {
    tmdbId: 5,
    title: "Failed",
    posterUrl: null,
    status: "error",
    reason: "Request failed",
  },
];
const saved: SavedMovieNight = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "owner",
  name: "Friday",
  availableMinutes: 200,
  pauseMinutes: 10,
  totalMinutes: 200,
  movies: [first, second],
  createdAt: "2026-11-11T12:00:00Z",
};
beforeEach(() => {
  vi.mocked(loadMovieCandidates).mockReset().mockResolvedValue(candidates);
  vi.mocked(loadMovieCandidate)
    .mockReset()
    .mockResolvedValue({
      ...first,
      tmdbId: 5,
      title: "Failed",
      status: "ready",
    });
  vi.mocked(saveMovieNight)
    .mockReset()
    .mockResolvedValue({ status: "saved", night: saved });
  vi.mocked(listSavedMovieNights)
    .mockReset()
    .mockResolvedValue({ nights: [saved], hasMore: false, nextOffset: 1 });
  vi.mocked(getSavedMovieNight).mockReset().mockResolvedValue(saved);
  vi.mocked(deleteSavedMovieNight).mockReset().mockResolvedValue(undefined);
  vi.mocked(markMovieNightWatched)
    .mockReset()
    .mockResolvedValue({ ...saved, watchedAt: "2026-11-11T14:00:00Z" });
});
async function plan() {
  fireEvent.change(screen.getByLabelText("Available minutes"), {
    target: { value: "200" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Find movies" }));
  await screen.findByRole("button", { name: "Add First" });
}
function nameNight() {
  fireEvent.change(screen.getByLabelText("Session name"), {
    target: { value: "Friday" },
  });
}
describe("Movie Night interface", () => {
  it("builds an exact fit, refuses an overflowing next movie and saves in order", async () => {
    const onSaved = vi.fn();
    render(<MovieNightScreen userId="owner" onSaved={onSaved} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    expect(
      (
        screen.getByRole("button", {
          name: "Add Too much with break",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText(/next required break exceed/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Add Second" }));
    expect(screen.getByText("0 minutes")).toBeTruthy();
    expect(screen.getByText("10-minute break")).toBeTruthy();
    nameNight();
    fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
    expect(vi.mocked(saveMovieNight).mock.calls[0][0]).toMatchObject({
      name: "Friday",
      availableMinutes: 200,
      movies: [first, second],
    });
  });
  it("shows unknown runtimes, retries only failures and preserves valid choices", async () => {
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    expect(screen.getByText("Duration unavailable")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add Unknown" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry Failed" }));
    await screen.findByRole("button", { name: "Add Failed" });
    expect(screen.getByRole("button", { name: "Add First" })).toBeTruthy();
    expect(loadMovieCandidates).toHaveBeenCalledOnce();
    expect(loadMovieCandidate).toHaveBeenCalledOnce();
  });
  it("retains an over-budget draft and recalculates removing the last movie", async () => {
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    nameNight();
    fireEvent.change(screen.getByLabelText("Available minutes"), {
      target: { value: "30" },
    });
    expect(screen.getByText("-60 minutes")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Save Night" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Remove First" }));
    expect(screen.getByText("No movies selected yet.")).toBeTruthy();
    expect(screen.getByText("30 minutes")).toBeTruthy();
  });
  it("requires explicit acceptance and a second save after sources change", async () => {
    vi.mocked(saveMovieNight).mockResolvedValueOnce({
      status: "review",
      movies: [{ ...first, runtimeMinutes: 95 }],
      reasons: ["First changed duration"],
    });
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    nameNight();
    fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
    await screen.findByText("Review required");
    expect(saveMovieNight).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: "Accept updated draft" }),
    );
    expect(screen.getAllByText("95 minutes").length).toBeGreaterThan(0);
    expect(saveMovieNight).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
    await waitFor(() => expect(saveMovieNight).toHaveBeenCalledTimes(2));
    expect(
      vi.mocked(saveMovieNight).mock.calls[1][0].movies[0].runtimeMinutes,
    ).toBe(95);
  });
  it("locks an uncertain draft and retries with exactly the same identity", async () => {
    vi.mocked(saveMovieNight).mockRejectedValueOnce(new SaveUncertainError());
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    nameNight();
    fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
    await screen.findByText(/draft is locked/);
    expect(
      (screen.getByLabelText("Session name") as HTMLInputElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Retry saving" }));
    await waitFor(() => expect(saveMovieNight).toHaveBeenCalledTimes(2));
    expect(vi.mocked(saveMovieNight).mock.calls[1][0]).toEqual(
      vi.mocked(saveMovieNight).mock.calls[0][0],
    );
  });
  it("distinguishes no pending movies from no movies fitting", async () => {
    vi.mocked(loadMovieCandidates).mockResolvedValueOnce([]);
    const { unmount } = render(
      <MovieNightScreen userId="owner" onSaved={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("Available minutes"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find movies" }));
    await screen.findByText(/You have no pending movies/);
    unmount();
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Available minutes"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Find movies" }));
    await screen.findByText(/No movies with a known duration fit/);
    expect(screen.getByText("Duration unavailable")).toBeTruthy();
  });
  it("does not start a second save while one is pending", async () => {
    let complete!: (value: { status: "saved"; night: SavedMovieNight }) => void;
    vi.mocked(saveMovieNight).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    nameNight();
    fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
    expect(
      (screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Saving…" }));
    expect(saveMovieNight).toHaveBeenCalledOnce();
    await act(async () => complete({ status: "saved", night: saved }));
  });
  it("shows saved history/detail with immutable data and no edit controls", async () => {
    const onDetail = vi.fn();
    const { unmount } = render(
      <SavedMovieNightsScreen userId="owner" onDetail={onDetail} />,
    );
    fireEvent.click(await screen.findByRole("button", { name: "View Friday" }));
    expect(onDetail).toHaveBeenCalledWith(saved.id);
    unmount();
    render(
      <MovieNightDetailScreen id={saved.id} userId="owner" onBack={vi.fn()} />,
    );
    await screen.findByRole("heading", { name: "Friday" });
    expect(screen.getByText("0 minutes")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Remove/ })).toBeNull();
    expect(getSavedMovieNight).toHaveBeenCalledWith(
      saved.id,
      "owner",
      expect.any(AbortSignal),
    );
  });
  it("cancels session deletion without writing", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <MovieNightDetailScreen id={saved.id} userId="owner" onBack={vi.fn()} />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete session" }),
    );
    expect(deleteSavedMovieNight).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Friday" })).toBeTruthy();
  });
  it("guards pending deletion and returns to history only after successful removal", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let complete!: () => void;
    vi.mocked(deleteSavedMovieNight).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const onBack = vi.fn();
    render(
      <MovieNightDetailScreen id={saved.id} userId="owner" onBack={onBack} />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete session" }),
    );
    const pending = screen.getByRole("button", {
      name: "Deleting session…",
    }) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    fireEvent.click(pending);
    expect(deleteSavedMovieNight).toHaveBeenCalledExactlyOnceWith(
      saved.id,
      "owner",
    );
    expect(onBack).not.toHaveBeenCalled();
    await act(async () => complete());
    expect(onBack).toHaveBeenCalledOnce();
  });
  it("retains the plan on delete failure and allows retry", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteSavedMovieNight).mockRejectedValueOnce(
      new Error("Delete denied"),
    );
    const onBack = vi.fn();
    render(
      <MovieNightDetailScreen id={saved.id} userId="owner" onBack={onBack} />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Delete session" }),
    );
    await screen.findByText("Delete denied");
    expect(screen.getByRole("heading", { name: "Friday" })).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry deleting session" }),
    );
    await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
  });
  it("keeps the pagination footer visible while loading and after the final page", async () => {
    let complete!: (page: {
      nights: SavedMovieNight[];
      nextOffset: number;
      hasMore: boolean;
    }) => void;
    vi.mocked(listSavedMovieNights)
      .mockReset()
      .mockResolvedValueOnce({ nights: [saved], nextOffset: 1, hasMore: true })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      );
    render(<SavedMovieNightsScreen userId="owner" onDetail={vi.fn()} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Load more sessions" }),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Loading more sessions…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByRole("button", { name: "View Friday" })).toBeTruthy();
    await act(async () =>
      complete({
        nights: [{ ...saved, id: "second", name: "Saturday" }],
        nextOffset: 2,
        hasMore: false,
      }),
    );
    expect(screen.getByRole("button", { name: "View Saturday" })).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "All sessions loaded",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("retains existing history and a retry footer when loading another page fails", async () => {
    vi.mocked(listSavedMovieNights)
      .mockReset()
      .mockResolvedValueOnce({ nights: [saved], nextOffset: 1, hasMore: true })
      .mockRejectedValueOnce(new Error("Page failed"))
      .mockResolvedValueOnce({
        nights: [{ ...saved, id: "second", name: "Saturday" }],
        nextOffset: 2,
        hasMore: false,
      });
    render(<SavedMovieNightsScreen userId="owner" onDetail={vi.fn()} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Load more sessions" }),
    );
    await screen.findByText("Page failed");
    expect(screen.getByRole("button", { name: "View Friday" })).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry saved sessions" }),
    );
    await screen.findByRole("button", { name: "View Saturday" });
    expect(
      screen.getByRole("button", { name: "All sessions loaded" }),
    ).toBeTruthy();
  });
});

describe("optional movie-night interactions", () => {
  it("filters candidates without removing selected movies and uses the filter for planning", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(loadMovieCandidates).mockResolvedValue([
      { ...first, status: "ready", genres: [{ id: 1, name: "Drama" }] },
      { ...second, status: "ready", genres: [{ id: 2, name: "Comedy" }] },
    ]);
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    fireEvent.change(screen.getByLabelText("Genre"), {
      target: { value: "2" },
    });
    expect(screen.queryByRole("button", { name: "Add First" })).toBeNull();
    expect(screen.getByRole("button", { name: "Remove First" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Plan my night" }));
    await screen.findByRole("button", { name: "Remove Second" });
    expect(screen.queryByRole("button", { name: "Remove First" })).toBeNull();
    expect(loadMovieCandidates).toHaveBeenCalledTimes(2);
    expect(saveMovieNight).not.toHaveBeenCalled();
  });
  it("preserves a draft on cancellation, loading failure and no fit, and locks pending edits", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
    await plan();
    fireEvent.click(screen.getByRole("button", { name: "Add First" }));
    fireEvent.click(screen.getByRole("button", { name: "Plan my night" }));
    expect(loadMovieCandidates).toHaveBeenCalledOnce();
    confirm.mockReturnValue(true);
    let fail!: (error: Error) => void;
    vi.mocked(loadMovieCandidates).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Plan my night" }));
    expect(
      (screen.getByLabelText("Available minutes") as HTMLInputElement).disabled,
    ).toBe(true);
    expect((screen.getByLabelText("Genre") as HTMLSelectElement).disabled).toBe(
      true,
    );
    await act(async () => fail(new Error("Catalog unavailable")));
    expect(screen.getByRole("button", { name: "Remove First" })).toBeTruthy();
    vi.mocked(loadMovieCandidates).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole("button", { name: "Plan my night" }));
    await screen.findByText(/Your selection was kept/);
    expect(screen.getByRole("button", { name: "Remove First" })).toBeTruthy();
  });
  it("confirms completion, preserves state on failure, guards deletion and retries safely", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(
      <MovieNightDetailScreen id={saved.id} userId="owner" onBack={vi.fn()} />,
    );
    const button = (await screen.findByRole("button", {
      name: "Mark as watched",
    })) as HTMLButtonElement;
    fireEvent.click(button);
    expect(markMovieNightWatched).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    vi.mocked(markMovieNightWatched).mockRejectedValueOnce(
      new Error("Completion failed"),
    );
    fireEvent.click(button);
    await screen.findByText(/Completion failed/);
    expect(screen.getByText("Planned · Not watched yet")).toBeTruthy();
    let finish!: (value: SavedMovieNight) => void;
    vi.mocked(markMovieNightWatched).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(button);
    expect(
      (
        screen.getByRole("button", {
          name: "Delete session",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(button.disabled).toBe(true);
    await act(async () =>
      finish({ ...saved, watchedAt: "2026-11-11T14:00:00Z" }),
    );
    expect(screen.getByRole("button", { name: "✓ Watched" })).toBeTruthy();
    expect(screen.getByText("Watched")).toBeTruthy();
    expect(button.disabled).toBe(true);
    expect(markMovieNightWatched).toHaveBeenCalledTimes(2);
  });
});

it("keeps Save Night after no-fit planning feedback and reserves retry for a failed save", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  render(<MovieNightScreen userId="owner" onSaved={vi.fn()} />);
  await plan();
  fireEvent.click(screen.getByRole("button", { name: "Add First" }));
  nameNight();
  vi.mocked(loadMovieCandidates).mockResolvedValueOnce([]);
  fireEvent.click(screen.getByRole("button", { name: "Plan my night" }));
  await screen.findByText(/Your selection was kept/);
  expect(saveMovieNight).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Remove First" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Retry saving" })).toBeNull();
  vi.mocked(saveMovieNight).mockRejectedValueOnce(new Error("Save rejected"));
  fireEvent.click(screen.getByRole("button", { name: "Save Night" }));
  await screen.findByText("Save rejected");
  expect(screen.getByRole("button", { name: "Retry saving" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Session name"), {
    target: { value: "Saturday" },
  });
  expect(screen.queryByText("Save rejected")).toBeNull();
  expect(screen.getByRole("button", { name: "Save Night" })).toBeTruthy();
});
