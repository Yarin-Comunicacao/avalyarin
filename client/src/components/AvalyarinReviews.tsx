// AvalyarinReviews — Displays clickable Avalyarin reviews with order summary
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { StarRating } from "./StarRating";
import { X, User, Calendar, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AvalyarinReviewsProps {
  establishmentId: number;
}

export function AvalyarinReviews({ establishmentId }: AvalyarinReviewsProps) {
  const [selectedReview, setSelectedReview] = useState<number | null>(null);

  const { data: reviews, isLoading } = trpc.ratings.byEstablishment.useQuery(
    { establishmentId, limit: 10, offset: 0 },
    { enabled: !!establishmentId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">Nenhuma avaliação no Avalyarin ainda</p>
      </div>
    );
  }

  const selected = reviews.find((r) => r.id === selectedReview);

  return (
    <div>
      {/* Review cards */}
      <div className="space-y-2">
        {reviews.map((review) => {
          const itemNames = review.items?.map((i) => i.itemName).join(", ") || "Sem itens";
          const visitDateStr = review.visitDate
            ? format(new Date(review.visitDate), "dd/MM/yyyy", { locale: ptBR })
            : review.createdAt
            ? format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })
            : "";

          return (
            <button
              key={review.id}
              onClick={() => setSelectedReview(review.id)}
              className="w-full text-left p-3 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 transition-all"
            >
              {/* Title: items ordered */}
              <p className="text-sm font-medium text-foreground line-clamp-1">
                {itemNames}
              </p>
              {/* Subtitle: date + @username */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-muted-foreground">{visitDateStr}</span>
                {review.username && (
                  <span className="text-[11px] text-primary/70">@{review.username}</span>
                )}
                {!review.username && review.userName && (
                  <span className="text-[11px] text-muted-foreground">{review.userName}</span>
                )}
              </div>
              {/* Score */}
              {review.overallScore && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <StarRating rating={Number(review.overallScore) / 2} size={12} />
                  <span className="font-numbers text-xs text-amber-400">
                    {Number(review.overallScore).toFixed(1)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Review detail modal */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[90] bg-card border-t border-border/50 rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-display text-lg tracking-wider text-primary">RESUMO DO PEDIDO</h4>
                <div className="flex items-center gap-3 mt-1">
                  {selected.visitDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(selected.visitDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-primary/70">
                    <User className="w-3 h-3" />
                    {selected.username ? `@${selected.username}` : selected.userName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Overall score */}
            {selected.overallScore && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <StarRating rating={Number(selected.overallScore) / 2} size={16} />
                <span className="font-numbers text-base font-semibold text-amber-400">
                  {Number(selected.overallScore).toFixed(1)}/10
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  ({selected.type === "analytic" ? "Analítico" : "Direto"})
                </span>
              </div>
            )}

            {/* Items ordered */}
            {selected.items && selected.items.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShoppingBag className="w-4 h-4 text-primary/60" />
                  <span className="text-sm font-medium text-foreground">Itens consumidos</span>
                </div>
                {selected.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ""}
                        {item.itemName}
                      </p>
                      {item.comment && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          "{item.comment}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.price && (
                        <span className="text-xs text-muted-foreground">
                          R$ {Number(item.price).toFixed(2).replace(".", ",")}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded">
                        <span className="font-numbers text-xs font-semibold text-primary">
                          {Number(item.score).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedReview(null)}
              className="w-full mt-5 py-2.5 rounded-xl border border-border/30 text-sm text-muted-foreground hover:bg-secondary/30 transition-colors"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
