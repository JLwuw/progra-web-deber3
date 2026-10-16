import type { Media } from "../types/Media"

interface ListingCardProps {
    media: Omit<Media, "id" | "user_id">,
}

export function ListingMediaCard( { media }: ListingCardProps) {
    return (
    <div className="card media-card h-100">
      <div className="card-body text-center">
        <h2 className="card-title mb-3">{media.title}</h2>
        <img className="w-500 mb-3" src={media.poster_url}/>
        <p className="mb-3">TMDB ID: {media.tmdb_id}</p>

        <div className="botones-tarjeta d-flex gap-2 justify-content-center mt-3">
            <button 
                className="btn btn-primary"
            >
                View Details
            </button>
            <button 
                className="btn btn-info auth-submit"
            >
                Edit
            </button>
            <button 
                className="btn btn-danger auth-submit"
            >
                Remove
            </button>
        </div>

      </div>
    </div>
    )
}