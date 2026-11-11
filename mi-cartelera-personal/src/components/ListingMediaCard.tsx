import { MediaPoster } from "./MediaPoster";
import type { Media } from "../types/Media";

interface ListingCardProps {
  media: Media;
  deleting?: boolean;
  onListingDetail: (listing: Media) => void;
  onListingEdit: (listing: Media) => void;
  onListingDelete: (listing: Media) => void;
}

export function ListingMediaCard({
  media,
  deleting,
  onListingDetail,
  onListingEdit,
  onListingDelete,
}: ListingCardProps) {
  return (
    <div className="card media-card h-100 container flex-column py-5">
      <div className="card-body text-center">
        <h2 className="card-title mb-3">{media.title}</h2>
        <MediaPoster src={media.posterUrl} title={media.title} />
        <h5 className="text-white"> State: </h5>
        <p>
          {media.watchState === "plan_to_watch"
            ? "Planning to Watch"
            : media.watchState === "watching"
              ? "Watching"
              : "Finished"}
        </p>

        <h5 className="text-white">Rating: </h5>
        {media.userGrade ? (
          <p>{media.userGrade}</p>
        ) : (
          <p>You haven’t given this listing a rating yet</p>
        )}

        <div className="card-actions d-flex flex-wrap gap-2 justify-content-center mt-3">
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
            disabled={deleting}
            onClick={() => onListingDelete(media)}
          >
            {deleting ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
