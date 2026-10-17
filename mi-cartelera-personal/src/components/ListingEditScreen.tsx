import { useState } from "react";

import type { Media } from "../types/Media"
import type { WatchState } from "../types/WatchState";

import { updateListing } from "../services/listingService";

interface ListingEditProps {
    listing: Media,
    onListingExit: () => void
}



export function ListingEditScreen( { listing, onListingExit }: ListingEditProps  ) {

  const [error, setError] = useState<string | null>(null);
  const [watchState, setWatchState] = useState<WatchState>("plan_to_watch")
  const [rating, setRating] = useState<number>(listing.user_grade ? listing.user_grade : 0)
  const [comment, setComment] = useState<string>(listing.comment ? listing.comment : "")
  const [sent, setSent] = useState<boolean>(false)

  async function onEditListing(event: React.SubmitEvent) {
    event.preventDefault()
    setSent(true)
    const id = listing.id
    const user_grade = rating === 0 ? undefined : rating
    const user_comment = comment === "" ? undefined : comment

    const new_listing: Omit<Media, "id" | "user_id"> = {
      tmdb_id: listing.tmdb_id,
      title: listing.title,
      poster_url: listing.poster_url,
      media_type: listing.media_type,
      watch_state: watchState,
      user_grade: user_grade,
      comment: user_comment
    } 

    try {
      await updateListing(id, new_listing)
      onListingExit()
    }
    catch(err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el tripulante.");
    }
    finally {
      setSent(false)
    }
  }

  return (
    <div className="container listing-edit-screen">
      <div className="row justify-content-center">
        <div className="card media-card col-8">
          <div className="card-body text-center">
            <h2 className="text-center mb-4"> Edit Listing: </h2>

            <h2 className="card-title mb-3">{listing.title}</h2>
            <img className="w-500 mb-3" src={listing.poster_url}/>

            {error && <div className="error-auth">⚠️ {error}</div>}
            <form onSubmit={onEditListing}>
              <div className="mb-3">
                <label className="form-label text-white">
                  Watch State
                </label>
                <select
                  className="form-select"
                  value={watchState}
                  onChange={(e) => setWatchState(e.target.value as WatchState)}
                  required
                >
                  <option value="plan_to_watch">Plan to Watch</option>
                  <option value="watching">Watching</option>
                  <option value="finished">Finished</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label text-white">
                  Rating (1–5) 0 for empty
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={rating}
                  onChange={(e) =>
                    setRating(Number(e.target.value))
                  }
                  min={0}
                  max={5}
                  step={1}
                  placeholder="Rate from 1 to 5 (optional)"
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-white">
                  Comment
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment (optional)"
                />
              </div>

              <button
                type="submit"
                className="auth-submit btn btn-primary w-100 mb-3"
                disabled={sent}
              >
                {sent ? "Loading..." : "Confirm"}
              </button>
            </form>
            <button 
              className="btn btn-danger"
              onClick={onListingExit}
            >
              Exit
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}