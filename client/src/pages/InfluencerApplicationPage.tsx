import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  CheckCircle2, XCircle, AlertTriangle, Star, Calendar,
  Loader2, ArrowLeft, Sparkles, Info
} from "lucide-react";

export default function InfluencerApplicationPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [motivation, setMotivation] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Fetch my ratings for application
  const { data: ratingsData, isLoading: loadingRatings } = trpc.influencer.myRatings.useQuery();
  // Fetch my existing application
  const { data: existingApp, isLoading: loadingApp } = trpc.influencer.myApplication.useQuery();

  const submitMutation = trpc.influencer.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada com sucesso! Aguarde a análise do admin.");
      navigate("/conta");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar solicitação");
    },
  });

  // Compute stats
  const stats = useMemo(() => {
    if (!ratingsData) return { total: 0, qualified: 0, uniqueEstabs: 0, selectedQualified: 0, selectedUniqueEstabs: 0 };
    const qualified = ratingsData.filter((r) => r.isQualified);
    const uniqueEstabs = new Set(ratingsData.map((r) => r.establishmentId)).size;

    const selectedRatings = ratingsData.filter((r) => selectedIds.has(r.id));
    const selectedQualified = selectedRatings.filter((r) => r.isQualified).length;
    const selectedUniqueEstabs = new Set(selectedRatings.map((r) => r.establishmentId)).size;

    return {
      total: ratingsData.length,
      qualified: qualified.length,
      uniqueEstabs,
      selectedQualified,
      selectedUniqueEstabs,
    };
  }, [ratingsData, selectedIds]);

  // Validation
  const canSubmit = useMemo(() => {
    if (!ratingsData) return false;
    const selectedRatings = ratingsData.filter((r) => selectedIds.has(r.id));
    const allSelectedQualified = selectedRatings.every((r) => r.isQualified);
    const uniqueEstabs = new Set(selectedRatings.map((r) => r.establishmentId)).size;
    return selectedIds.size >= 50 && uniqueEstabs >= 50 && allSelectedQualified;
  }, [ratingsData, selectedIds]);

  const handleToggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllQualified = () => {
    if (!ratingsData) return;
    const qualifiedIds = ratingsData.filter((r) => r.isQualified).map((r) => r.id);
    setSelectedIds(new Set(qualifiedIds));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    submitMutation.mutate({
      selectedRatingIds: Array.from(selectedIds),
      totalRatings: stats.total,
      qualifiedRatings: stats.selectedQualified,
      motivation: motivation.trim() || undefined,
      socialMedia: socialMedia.trim() || undefined,
    });
  };

  // If user already has a pending or approved application
  if (!loadingApp && existingApp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar  />
        <div className="container pt-28 pb-24 max-w-2xl">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="font-display text-2xl tracking-wider text-foreground">Solicitação de Influencer</h1>
            </div>

            {existingApp.status === "pending" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-500">Solicitação em análise</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sua solicitação foi enviada em {new Date(existingApp.createdAt).toLocaleDateString("pt-BR")} e está aguardando análise do admin.
                </p>
              </div>
            )}

            {existingApp.status === "approved" && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-500">Aprovado!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Parabéns! Você já é um influencer Avalyarin.
                </p>
              </div>
            )}

            {existingApp.status === "rejected" && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="font-semibold text-red-500">Solicitação rejeitada</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {existingApp.adminNotes || "Sua solicitação não foi aprovada. Você pode tentar novamente quando atender todos os requisitos."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-28 pb-24 max-w-3xl">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-7 h-7 text-primary" />
            <h1 className="font-display text-3xl tracking-wider text-foreground">Seja um Influencer</h1>
          </div>
          <p className="text-muted-foreground">
            Para se tornar um influencer Avalyarin, você precisa ter pelo menos <strong className="text-foreground">50 avaliações qualificadas</strong> de
            estabelecimentos <strong className="text-foreground">diferentes</strong> nos últimos 365 dias.
          </p>
        </div>

        {/* Requirements info */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Avaliação qualificada:</strong> todos os itens avaliados devem ter comentário com pelo menos 20 caracteres.</p>
              <p><strong className="text-foreground">Requisito:</strong> mínimo 50 avaliações de 50 estabelecimentos diferentes selecionadas.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total (365 dias)</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.qualified}</div>
            <div className="text-xs text-muted-foreground">Qualificadas</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.uniqueEstabs}</div>
            <div className="text-xs text-muted-foreground">Estabs Diferentes</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{selectedIds.size}</div>
            <div className="text-xs text-muted-foreground">Selecionadas</div>
          </div>
        </div>

        {/* Validation status */}
        {selectedIds.size > 0 && (
          <div className={`rounded-lg p-3 mb-6 border ${canSubmit ? "bg-green-500/10 border-green-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
            <div className="flex items-center gap-2 text-sm">
              {canSubmit ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">Requisitos atendidos! Você pode enviar a solicitação.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">
                    {stats.selectedUniqueEstabs < 50
                      ? `Faltam ${50 - stats.selectedUniqueEstabs} estabs diferentes (${stats.selectedUniqueEstabs}/50)`
                      : selectedIds.size < 50
                        ? `Faltam ${50 - selectedIds.size} avaliações (${selectedIds.size}/50)`
                        : "Algumas avaliações selecionadas não são qualificadas"}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Ratings list */}
        {loadingRatings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl tracking-wider text-foreground">Suas Avaliações</h2>
              <Button variant="outline" size="sm" onClick={handleSelectAllQualified}>
                Selecionar todas qualificadas
              </Button>
            </div>

            {ratingsData && ratingsData.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Você não tem avaliações nos últimos 365 dias.</p>
                <p className="text-sm mt-2">Avalie pelo menos 50 estabelecimentos diferentes para se candidatar.</p>
              </div>
            )}

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 mb-8">
              {ratingsData?.map((rating) => (
                <div
                  key={rating.id}
                  onClick={() => rating.isQualified ? handleToggle(rating.id) : toast.error(`Avaliação de "${rating.establishmentName}" (${rating.visitDate ? new Date(rating.visitDate).toLocaleDateString("pt-BR") : "sem data"}) não é qualificada: ${rating.missingComments ? "comentários faltando nos itens" : "sem itens"}`)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedIds.has(rating.id)
                      ? "bg-primary/10 border-primary/40"
                      : rating.isQualified
                        ? "bg-card border-border hover:border-primary/30"
                        : "bg-red-500/5 border-red-500/20 opacity-70"
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selectedIds.has(rating.id)
                      ? "bg-primary border-primary"
                      : rating.isQualified
                        ? "border-border"
                        : "border-red-500/50"
                  }`}>
                    {selectedIds.has(rating.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                    )}
                    {!rating.isQualified && !selectedIds.has(rating.id) && (
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {rating.establishmentName || "Estabelecimento"}
                      </span>
                      {rating.isQualified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {rating.visitDate ? new Date(rating.visitDate).toLocaleDateString("pt-BR") : new Date(rating.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {rating.overallScore?.toFixed(1) || "—"}
                      </span>
                      <span>{rating.itemCount} {rating.itemCount === 1 ? "item" : "itens"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Motivation & Social Media */}
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Motivação (opcional)
                </label>
                <Textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Por que você quer ser um influencer Avalyarin?"
                  className="resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Redes Sociais (opcional)
                </label>
                <Input
                  value={socialMedia}
                  onChange={(e) => setSocialMedia(e.target.value)}
                  placeholder="@seu_instagram, TikTok, etc."
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              className="w-full"
              size="lg"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Enviar Solicitação
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
