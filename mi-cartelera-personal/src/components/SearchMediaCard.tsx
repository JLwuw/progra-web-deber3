import type { Media } from "../types/Media"

interface MediaCardProps {
    media: Omit<Media, "id" | "user_id">,
    onAddListing: (media: Omit<Media, "id" | "user_id">) => void
}

export function SearchMediaCard( { media, onAddListing }: MediaCardProps) {
    return (
    <div className="card media-card h-100">
      <div className="card-body text-center">
        <h2 className="card-title mb-3">{media.title}</h2>
        <img className="media-poster mb-3" src={media.poster_url} alt={`${media.title} poster`}/>
        <p className="mb-3">TMDB ID: {media.tmdb_id}</p>
        <button 
          className="btn btn-primary auth-submit"
          onClick={() => onAddListing(media)}
        >
            Add to my Listing
        </button>
      </div>
    </div>
    )
}
