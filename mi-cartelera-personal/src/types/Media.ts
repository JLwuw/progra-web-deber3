import type { MediaType } from "./MediaType";
import type { WatchState } from "./WatchState";

export interface Media {
  id: number;
  userId: string;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  mediaType: MediaType;
  watchState: WatchState;
  userGrade: number | null;
  comment: string | null;
  createdAt: string | null;
}
export interface SearchMedia {
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  mediaType: MediaType;
  releaseYear: string | null;
}
export interface ListingChanges {
  watchState: WatchState;
  userGrade: number | null;
  comment: string | null;
}
