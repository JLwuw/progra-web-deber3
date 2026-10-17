import { useState, useEffect } from "react";

import type { Media } from "../types/Media.ts"

import { getListings } from "../services/listingService.ts"

import { ListingMediaCard } from "./ListingMediaCard.tsx";

interface ListingScreenProps {
    onListingDetail: (listing: Media) => void,
    onListingEdit: (listing: Media) => void
}

export function ListingScreen( { onListingDetail, onListingEdit}: ListingScreenProps) {
  const [listing, setListing] = useState<Media[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [retryCounter, setRetryCounter] = useState<number>(1)

  function onRetry() {
    setRetryCounter((previous) => previous += 1)
  }

  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const data = await getListings();
        setListing(data);
      } 
      catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get Listings");
      }
      finally {
        setLoading(false);
      }
    }
    loadListings();
  }, [retryCounter])

  return (
    <div className="container listing-screen">
      <h2 className="my-5 text-white">My Listings: </h2>
      <div className="row justify-content-center">
        <div className="col-8">
          {loading && (
            <div className="d-flex flex-column align-items-center gap-2">
              <div className="spinner-loading"></div>
              <p className="mb-0 text-white">Loading...</p>
            </div>
          )}
          {!loading && error && (
            <div className="error-search">
              <p>⚠️ {error}</p>
              <button className="btn btn-danger" onClick={onRetry}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && listing[0] && (
            <div className="d-flex flex-column align-items-center gap-2">
              {listing.map(result => (
                <div className="col-8 mb-4" key={result.tmdb_id}>
                  <ListingMediaCard 
                    media={result}
                    onListingDetail={onListingDetail}
                    onListingEdit={onListingEdit}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}