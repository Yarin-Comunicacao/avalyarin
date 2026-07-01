import { useState, useMemo } from "react";
import { Camera, Loader2 } from "lucide-react";
import PhotoExpanded, { PhotoData } from "./PhotoExpanded";

interface PhotoGridProps {
  photos: PhotoData[];
  isLoading?: boolean;
  emptyMessage?: string;
  /** If provided, shows comment from rating items */
  getComment?: (photo: PhotoData) => string | undefined;
  /** If provided, shows tagged item names */
  getTaggedItems?: (photo: PhotoData) => string[];
  /** Group photos by ratingId into carousels (default: true) */
  groupByRating?: boolean;
}

interface GroupedPhoto extends PhotoData {
  carouselPhotos: PhotoData[];
  photoCount: number;
}

export default function PhotoGrid({ photos, isLoading, emptyMessage, getComment, getTaggedItems, groupByRating = true }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GroupedPhoto | null>(null);

  // Group photos by ratingId
  const groupedPhotos = useMemo(() => {
    if (!photos || photos.length === 0) return [];
    if (!groupByRating) {
      return photos.map(p => ({ ...p, carouselPhotos: [p], photoCount: 1 }));
    }

    const byRating: Record<number, PhotoData[]> = {};
    for (const p of photos) {
      if (p.ratingId) {
        if (!byRating[p.ratingId]) byRating[p.ratingId] = [];
        byRating[p.ratingId].push(p);
      }
    }

    const result: GroupedPhoto[] = [];
    const seenRatingIds = new Set<number>();
    for (const p of photos) {
      if (p.ratingId && seenRatingIds.has(p.ratingId)) continue;
      if (p.ratingId) seenRatingIds.add(p.ratingId);
      const carousel = p.ratingId ? (byRating[p.ratingId] || [p]) : [p];
      result.push({
        ...p,
        carouselPhotos: carousel,
        photoCount: carousel.length,
      });
    }
    return result;
  }, [photos, groupByRating]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-20">
        <Camera className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h3 className="font-display text-xl tracking-wider text-foreground mb-2">GALERIA</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {emptyMessage || "Nenhuma foto ainda. Avalie estabelecimentos e envie fotos para construir sua galeria!"}
        </p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 max-w-md mx-auto">
          <Camera className="w-5 h-5 text-primary shrink-0" />
          <p className="text-xs text-foreground/80 text-left">
            Ao avaliar, envie fotos dos itens consumidos para construir sua galeria pessoal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Grid 4:5 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {groupedPhotos.map((photo) => (
          <button
            key={`photo-${photo.id}`}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-[4/5] overflow-hidden rounded-sm group"
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.establishmentName}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : photo.establishmentLogo ? (
              <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                <img
                  src={photo.establishmentLogo}
                  alt={photo.establishmentName}
                  className="w-2/3 h-2/3 object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                <Camera className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
            {/* Multi-photo indicator */}
            {photo.photoCount > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <span className="text-white text-[10px] font-medium">{photo.photoCount}</span>
              </div>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
              <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{photo.establishmentName}</p>
                {photo.overallScore && (
                  <p className="text-primary text-[10px]">★ {Number(photo.overallScore).toFixed(1)}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Expanded Photo Viewer with Carousel */}
      {selectedPhoto && (
        <PhotoExpanded
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          carouselPhotos={selectedPhoto.carouselPhotos}
          taggedItemNames={getTaggedItems ? getTaggedItems(selectedPhoto) : undefined}
          comment={getComment ? getComment(selectedPhoto) : undefined}
        />
      )}
    </>
  );
}
