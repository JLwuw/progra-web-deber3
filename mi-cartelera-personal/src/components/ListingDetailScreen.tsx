import type { Media } from "../types/Media"


interface ListingDetailProps {
    listing: Media,
    onListingExit: () => void
}


export function ListingDetailScreen( { listing, onListingExit }: ListingDetailProps  ) {
  return (
    <div className="container listing-detail-screen">
      <div className="row justify-content-center">
        <div className="card media-card col-8">
          <div className="card-body text-center">
            <h2 className="card-title mb-3">{listing.title}</h2>
            <img className="w-500 mb-3" src={listing.poster_url}/>
            <p className="mb-3">TMDB ID: {listing.tmdb_id}</p>

            <h5 className="text-white"> Type: </h5>
            <p>{listing.media_type === "movie" ? "Movie" : "TV Show"}</p>

            <h5 className="text-white"> State: </h5>
            <p>
              {listing.watch_state === "plan_to_watch" ? "Planning to Watch" :
                listing.watch_state === "watching" ? "Watching" : "Finished"}
            </p>

            <h5 className="text-white">Comment:</h5>
            {listing.comment ? (
              <p>{listing.comment}</p>
            ) : (
              <p>You havent added a comment yet</p>
            )}
            <h5 className="text-white">Rating: </h5>
            {listing.user_grade ? (
              <p>{listing.user_grade}</p>
            ) : (
              <p>You havent given this listing a rating yet</p>
            )}
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