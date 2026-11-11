import type { SearchMedia } from "../types/Media";
import { MediaPoster } from "./MediaPoster";
interface Props {
  media: SearchMedia;
  onAddListing: (media: SearchMedia) => void;
  pending: boolean;
  added: boolean;
  error: string | null;
}
export function SearchMediaCard({
  media,
  onAddListing,
  pending,
  added,
  error,
}: Props) {
  return (
    <article className="card media-card h-100">
      <div className="card-body text-center">
        <h2 className="card-title mb-3">{media.title}</h2>
        <MediaPoster src={media.posterUrl} title={media.title} />
        <p>{media.releaseYear ?? "Year unavailable"}</p>
        {error && (
          <p role="alert" className="error-search">
            {error}
          </p>
        )}
        {added && <p role="status">Added to your collection.</p>}
        <button
          className="btn btn-primary auth-submit"
          disabled={pending || added}
          onClick={() => onAddListing(media)}
        >
          {pending
            ? "Adding…"
            : added
              ? "Added"
              : error
                ? "Retry adding"
                : "Add to my Listing"}
        </button>
      </div>
    </article>
  );
}
