import type { Media } from "../types/Media"


interface ListingEditProps {
    listing: Media,
    onListingExit: () => void
}


export function ListingEditScreen( { listing, onListingExit }: ListingEditProps  ) {
  return (
    <div className="container listing-edit-screen">
      ListingEdit: {listing.title}
      <button 
        className="btn btn-danger"
        onClick={onListingExit}
      >
        Exit
      </button>
    </div>
  )
}