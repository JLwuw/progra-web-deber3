import { useState } from "react";
export function MediaPoster({
  src,
  title,
  className = "media-poster mb-3",
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (!src || failedSource === src)
    return (
      <div
        className={`poster-placeholder ${className}`}
        role="img"
        aria-label={`${title}: poster unavailable`}
      >
        Poster unavailable
      </div>
    );
  return (
    <img
      className={className}
      src={src}
      alt={`${title} poster`}
      onError={() => setFailedSource(src)}
    />
  );
}
