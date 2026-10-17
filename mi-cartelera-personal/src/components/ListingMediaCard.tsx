import type { Media } from "../types/Media" 

interface ListingCardProps {
    media: Media,
    onListingDetail: (listing: Media) => void,
    onListingEdit: (listing: Media) => void,
    onListingDelete: (listing: Media) => void
}

export function ListingMediaCard( { media, onListingDetail, onListingEdit, onListingDelete  }: ListingCardProps) {

  return (
    <div className="card media-card h-100 container flex-column py-5">
      <div className="card-body text-center">
        <h2 className="card-title mb-3">{media.title}</h2>
        <img className="w-500 mb-3" src={media.poster_url}/>
        <h5 className="text-white"> State: </h5>
        <p>
          {media.watch_state === "plan_to_watch" ? "Planning to Watch" :
          media.watch_state === "watching" ? "Watching" : "Finished"}
        </p>

        <h5 className="text-white">Rating: </h5>
        {media.user_grade ? (
          <p>{media.user_grade}</p>
        ) : (
          <p>You havent given this listing a rating yet</p>
        )}

        <div className="botones-tarjeta d-flex gap-2 justify-content-center mt-3">
          <button 
            className="btn btn-primary"
            onClick={() => onListingDetail(media)}
          >
            View Details
          </button>
          <button 
            className="btn btn-info auth-submit"
            onClick={() => onListingEdit(media)}
          >
            Edit
          </button>
          <button 
            className="btn btn-danger auth-submit"
            onClick={() => onListingDelete(media)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  )
}