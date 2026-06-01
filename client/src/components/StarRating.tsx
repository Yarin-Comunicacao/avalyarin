// StarRating component — renders 5 stars filled proportionally based on rating
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0 to 5
  size?: number;
  className?: string;
}

export function StarRating({ rating, size = 16, className = "" }: StarRatingProps) {
  const stars = [];
  const clampedRating = Math.max(0, Math.min(5, rating));

  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.max(0, Math.min(1, clampedRating - (i - 1)));

    if (fillPercentage >= 1) {
      // Full star
      stars.push(
        <Star
          key={i}
          className="text-amber-400 fill-amber-400"
          style={{ width: size, height: size }}
        />
      );
    } else if (fillPercentage > 0) {
      // Partial star using clip-path
      stars.push(
        <div key={i} className="relative" style={{ width: size, height: size }}>
          {/* Background empty star */}
          <Star
            className="absolute inset-0 text-muted-foreground/30"
            style={{ width: size, height: size }}
          />
          {/* Filled portion */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <Star
              className="text-amber-400 fill-amber-400"
              style={{ width: size, height: size }}
            />
          </div>
        </div>
      );
    } else {
      // Empty star
      stars.push(
        <Star
          key={i}
          className="text-muted-foreground/30"
          style={{ width: size, height: size }}
        />
      );
    }
  }

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {stars}
    </div>
  );
}
