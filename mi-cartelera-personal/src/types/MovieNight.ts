export interface MovieSnapshot {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  runtimeMinutes: number;
}
export interface CandidateMovie {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
}
export type MovieCandidate = CandidateMovie &
  (
    | { status: "loading" }
    | { status: "ready"; runtimeMinutes: number }
    | { status: "unknown" | "error"; reason: string }
  );
export interface MovieNightDraft {
  id: string;
  name: string;
  availableMinutes: number;
  movies: MovieSnapshot[];
}
export interface SavedMovieNight extends MovieNightDraft {
  userId: string;
  pauseMinutes: number;
  totalMinutes: number;
  createdAt: string;
}
export type Validation<T> =
  { valid: true; value: T } | { valid: false; reason: string };
export type SessionCalculation =
  | {
      valid: true;
      movieMinutes: number;
      breakMinutes: number;
      totalMinutes: number;
      remainingMinutes: number;
      fits: boolean;
    }
  | { valid: false; reason: string };
export type SaveNightResult =
  | { status: "saved"; night: SavedMovieNight }
  | { status: "review"; movies: MovieSnapshot[]; reasons: string[] };
