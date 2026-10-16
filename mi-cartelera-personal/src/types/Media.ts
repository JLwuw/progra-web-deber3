import type { MediaType } from "./MediaType"
import type { WatchState } from "./WatchState"

export interface Media {
    id: number
    user_id: string
    tmdb_id: number
    title: string
    poster_url: string
    media_type: MediaType
    watch_state: WatchState
    user_grade?: number
    comment?: string
}