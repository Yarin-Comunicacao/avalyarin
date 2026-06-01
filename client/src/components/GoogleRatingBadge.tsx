// GoogleRatingBadge — Shows Google rating with stars (4.7+) or just review count (below 4.7)
import { StarRating } from "./StarRating";

interface GoogleRatingBadgeProps {
  rating: number | null | undefined;
  reviewCount: number | null | undefined;
}

export function GoogleRatingBadge({ rating, reviewCount }: GoogleRatingBadgeProps) {
  if (!reviewCount && !rating) return null;

  const numRating = rating ? Number(rating) : 0;
  const showRating = numRating >= 4.7;

  return (
    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
      {showRating ? (
        <>
          <StarRating rating={numRating} size={14} />
          <span className="font-numbers text-sm font-semibold text-amber-400">
            {numRating.toFixed(1)}
          </span>
        </>
      ) : null}
      {reviewCount ? (
        <span className="text-xs text-muted-foreground">
          {showRating ? "·" : ""} {reviewCount.toLocaleString("pt-BR")} avaliações no Google
        </span>
      ) : null}
    </div>
  );
}
