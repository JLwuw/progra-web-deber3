import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";
import App from "./App";
import {
  getCurrentSession,
  subscribeToSession,
  closeSession,
  getConfigurationError,
} from "./services/authService";
vi.mock("./services/authService", () => ({
  getCurrentSession: vi.fn(),
  subscribeToSession: vi.fn(),
  closeSession: vi.fn(),
  getConfigurationError: vi.fn(() => null),
}));
vi.mock("./components/SearchScreen", () => ({
  SearchScreen: () => <p>Search screen</p>,
}));
vi.mock("./components/ListingScreen", () => ({
  ListingScreen: () => <p>Collection screen</p>,
}));
function session(id: string): Session {
  return {
    access_token: "test-only",
    refresh_token: "test-only",
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2026-01-01",
    },
  };
}
describe("session lifecycle", () => {
  it("leaves loading after a session failure and can retry", async () => {
    vi.mocked(subscribeToSession).mockReturnValue(vi.fn());
    vi.mocked(getCurrentSession)
      .mockRejectedValueOnce(new Error("Session unavailable"))
      .mockResolvedValueOnce(null);
    render(<App />);
    await screen.findByText("Session unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry session" }));
    await screen.findByRole("button", { name: "Log In" });
  });
  it("resets the current view when another account replaces the session", async () => {
    let notify!: (value: Session | null) => void;
    vi.mocked(subscribeToSession).mockImplementation((callback) => {
      notify = callback;
      return vi.fn();
    });
    vi.mocked(getCurrentSession).mockResolvedValue(session("A"));
    render(<App />);
    await screen.findByText("Search screen");
    fireEvent.click(screen.getByRole("button", { name: "My Listing" }));
    expect(screen.getByText("Collection screen")).toBeTruthy();
    act(() => notify(session("B")));
    expect(screen.queryByText("Collection screen")).toBeNull();
    expect(screen.getByText("Search screen")).toBeTruthy();
    act(() => notify(null));
    expect(screen.queryByText("Search screen")).toBeNull();
  });
  it("ignores stale session restoration after a newer auth event", async () => {
    let notify!: (value: Session | null) => void;
    let restore!: (value: Session | null) => void;
    vi.mocked(subscribeToSession).mockImplementation((callback) => {
      notify = callback;
      return vi.fn();
    });
    vi.mocked(getCurrentSession).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          restore = resolve;
        }),
    );
    render(<App />);
    act(() => notify(null));
    await act(async () => restore(session("old-account")));
    expect(screen.queryByText("Search screen")).toBeNull();
    expect(screen.getByRole("button", { name: "Log In" })).toBeTruthy();
  });
  it("shows logout errors without hiding authenticated navigation", async () => {
    vi.mocked(subscribeToSession).mockReturnValue(vi.fn());
    vi.mocked(getCurrentSession).mockResolvedValue(session("A"));
    vi.mocked(closeSession).mockRejectedValue(new Error("Unable to sign out"));
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Logout" }));
    await screen.findByText("Unable to sign out");
    expect(screen.getByRole("button", { name: "My Listing" })).toBeTruthy();
  });
  it("renders startup configuration guidance without contacting auth", () => {
    vi.mocked(getConfigurationError).mockReturnValueOnce(
      "Set a valid project URL.",
    );
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Configuration required" }),
    ).toBeTruthy();
    expect(getCurrentSession).not.toHaveBeenCalled();
  });
  it("discards the view after batched sign-out and sign-in to the same account", async () => {
    let notify!: (value: Session | null) => void;
    vi.mocked(subscribeToSession).mockImplementation((callback) => {
      notify = callback;
      return vi.fn();
    });
    vi.mocked(getCurrentSession).mockResolvedValue(session("A"));
    render(<App />);
    await screen.findByText("Search screen");
    fireEvent.click(screen.getByRole("button", { name: "My Listing" }));
    expect(screen.getByText("Collection screen")).toBeTruthy();
    act(() => {
      notify(null);
      notify(session("A"));
    });
    expect(screen.queryByText("Collection screen")).toBeNull();
    expect(screen.getByText("Search screen")).toBeTruthy();
  });

  it("recovers from a synchronous auth subscription startup failure", async () => {
    vi.mocked(subscribeToSession)
      .mockImplementationOnce(() => {
        throw new Error("Auth startup failed");
      })
      .mockReturnValueOnce(vi.fn());
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    render(<App />);
    await screen.findByText("Auth startup failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry session" }));
    await screen.findByRole("button", { name: "Log In" });
  });
  it("exposes Movie Night only after sign-in and discards it on account change", async () => {
    let notify!: (value: Session | null) => void;
    vi.mocked(subscribeToSession).mockImplementation((callback) => {
      notify = callback;
      return vi.fn();
    });
    vi.mocked(getCurrentSession).mockResolvedValue(null);
    render(<App />);
    await screen.findByRole("button", { name: "Log In" });
    expect(screen.queryByRole("button", { name: "Movie Night" })).toBeNull();
    act(() => notify(session("A")));
    fireEvent.click(screen.getByRole("button", { name: "Movie Night" }));
    fireEvent.change(screen.getByLabelText("Available minutes"), {
      target: { value: "200" },
    });
    act(() => notify(session("B")));
    fireEvent.click(screen.getByRole("button", { name: "Movie Night" }));
    expect(
      (screen.getByLabelText("Available minutes") as HTMLInputElement).value,
    ).toBe("");
  });
});
