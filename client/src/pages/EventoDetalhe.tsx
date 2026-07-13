import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, CalendarDays, Users,
  Check, HelpCircle, X, Loader2, Trash2, ExternalLink, Vote, Trophy
} from "lucide-react";

export default function EventoDetalhe() {
  const params = useParams<{ id: string }>();
  const eventId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const utils = trpc.useUtils();

  const { data: event, isLoading } = trpc.events.getById.useQuery(
    { eventId },
    { enabled: !!user && eventId > 0 }
  );

  const rsvpMutation = trpc.events.rsvp.useMutation({
    onSuccess: () => {
      toast.success("Presença atualizada!");
      utils.events.getById.invalidate({ eventId });
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar presença");
    },
  });

  const cancelMutation = trpc.events.cancel.useMutation({
    onSuccess: () => {
      toast.success("Evento cancelado");
      navigate("/grupos");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao cancelar evento");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar  />
        <div className="container pt-28 pb-24 text-center">
          <p className="text-muted-foreground">Evento não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/grupos")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const date = new Date(event.eventDate);
  const dateStr = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isCreator = user?.id === event.creatorId;
  const isPast = date < new Date();
  const isCancelled = event.status === "cancelled";

  // Current user's RSVP
  const myRsvp = event.rsvps?.find((r: any) => r.userId === user?.id);
  const confirmedList = event.rsvps?.filter((r: any) => r.status === "confirmed") || [];
  const maybeList = event.rsvps?.filter((r: any) => r.status === "maybe") || [];
  const declinedList = event.rsvps?.filter((r: any) => r.status === "declined") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-28 pb-24">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Status Badge */}
        {(isCancelled || isPast) && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            isCancelled
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-muted text-muted-foreground border border-border/50"
          }`}>
            {isCancelled ? "Cancelado" : "Evento passado"}
          </div>
        )}

        {/* Event Title */}
        <h1 className="font-display text-3xl tracking-wider text-primary mb-2">
          {event.title}
        </h1>

        {event.description && (
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event Info Card */}
        <div className="bg-card border border-border/50 rounded-xl p-5 mb-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground capitalize">{dateStr}</p>
              <p className="text-xs text-muted-foreground">às {timeStr}</p>
            </div>
          </div>

          {/* Location */}
          {event.establishmentName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{event.establishmentName}</p>
                {event.establishmentAddress && (
                  <p className="text-xs text-muted-foreground">{event.establishmentAddress}</p>
                )}
              </div>
              {event.establishmentSlug && (
                <button
                  onClick={() => navigate(`/estabelecimento/${event.establishmentSlug}`)}
                  className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Manual Location */}
          {!event.establishmentName && event.manualLocationName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{event.manualLocationName}</p>
                {event.manualLocationAddress && (
                  <p className="text-xs text-muted-foreground">{event.manualLocationAddress}</p>
                )}
              </div>
            </div>
          )}

          {/* Voting Mode Indicator */}
          {event.locationMode === 'voting' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Vote className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Votação de local em andamento</p>
                <p className="text-xs text-muted-foreground">Membros estão votando no local</p>
              </div>
            </div>
          )}

          {/* Decided (after voting) */}
          {event.locationMode === 'decided' && !event.establishmentName && event.manualLocationName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{event.manualLocationName}</p>
                <p className="text-xs text-green-400">Local definido por votação</p>
              </div>
            </div>
          )}

          {/* Capacity */}
          {event.maxGuests && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {confirmedList.length}/{event.maxGuests} confirmados
                </p>
                <p className="text-xs text-muted-foreground">Limite de pessoas</p>
              </div>
            </div>
          )}

          {/* Creator */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(event.creatorName || "?")[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Criado por <span className="text-foreground font-medium">{event.creatorName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Location Voting Section */}
        {event.locationMode === 'voting' && !isPast && !isCancelled && (
          <LocationVotingSection eventId={eventId} isCreator={isCreator} />
        )}

        {/* RSVP Buttons */}
        {!isPast && !isCancelled && (
          <div className="mb-6">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground mb-3">
              SUA PRESENÇA
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => rsvpMutation.mutate({ eventId, status: "confirmed" })}
                disabled={rsvpMutation.isPending}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  myRsvp?.status === "confirmed"
                    ? "bg-green-500/10 border-green-500/50 text-green-400"
                    : "border-border/50 text-muted-foreground hover:border-green-500/30 hover:text-green-400"
                }`}
              >
                <Check className="w-5 h-5" />
                <span className="text-xs font-medium">Vou</span>
              </button>
              <button
                onClick={() => rsvpMutation.mutate({ eventId, status: "maybe" })}
                disabled={rsvpMutation.isPending}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  myRsvp?.status === "maybe"
                    ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                    : "border-border/50 text-muted-foreground hover:border-yellow-500/30 hover:text-yellow-400"
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-xs font-medium">Talvez</span>
              </button>
              <button
                onClick={() => rsvpMutation.mutate({ eventId, status: "declined" })}
                disabled={rsvpMutation.isPending}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                  myRsvp?.status === "declined"
                    ? "bg-red-500/10 border-red-500/50 text-red-400"
                    : "border-border/50 text-muted-foreground hover:border-red-500/30 hover:text-red-400"
                }`}
              >
                <X className="w-5 h-5" />
                <span className="text-xs font-medium">Não posso</span>
              </button>
            </div>
          </div>
        )}

        {/* Attendees List */}
        <div className="space-y-4">
          {/* Confirmed */}
          {confirmedList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-medium text-foreground">
                  Confirmados ({confirmedList.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {confirmedList.map((r: any) => (
                  <div key={r.userId} className="flex items-center gap-3 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                    <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-green-400">
                        {(r.userName || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-foreground">{r.userName || "Usuário"}</span>
                    {r.username && (
                      <span className="text-xs text-muted-foreground">@{r.username}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maybe */}
          {maybeList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-medium text-foreground">
                  Talvez ({maybeList.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {maybeList.map((r: any) => (
                  <div key={r.userId} className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <div className="w-7 h-7 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-yellow-400">
                        {(r.userName || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-foreground">{r.userName || "Usuário"}</span>
                    {r.username && (
                      <span className="text-xs text-muted-foreground">@{r.username}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declined */}
          {declinedList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <X className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-medium text-foreground">
                  Não vão ({declinedList.length})
                </h4>
              </div>
              <div className="space-y-1.5">
                {declinedList.map((r: any) => (
                  <div key={r.userId} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                    <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-red-400">
                        {(r.userName || "?")[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-foreground">{r.userName || "Usuário"}</span>
                    {r.username && (
                      <span className="text-xs text-muted-foreground">@{r.username}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No responses yet */}
          {confirmedList.length === 0 && maybeList.length === 0 && declinedList.length === 0 && (
            <div className="text-center py-8 bg-card/50 rounded-xl border border-border/30">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma resposta ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Seja o primeiro a confirmar presença!
              </p>
            </div>
          )}
        </div>

        {/* Cancel Button (creator only) */}
        {isCreator && !isPast && !isCancelled && (
          <div className="mt-8 pt-6 border-t border-border/30">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Tem certeza que deseja cancelar este evento? Todos os membros serão notificados.")) {
                  cancelMutation.mutate({ eventId });
                }
              }}
              disabled={cancelMutation.isPending}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancelar Evento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Location Voting Section ────────────────────────────────────────────────

function LocationVotingSection({ eventId, isCreator }: { eventId: number; isCreator: boolean }) {
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const { data: options, isLoading: optionsLoading } = trpc.events.locationOptions.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const { data: votes } = trpc.events.locationVotes.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const voteMutation = trpc.events.voteLocation.useMutation({
    onSuccess: () => {
      toast.success("Voto registrado!");
      utils.events.locationVotes.invalidate({ eventId });
      utils.events.locationOptions.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message || "Erro ao votar"),
  });

  const closeVotingMutation = trpc.events.closeVoting.useMutation({
    onSuccess: () => {
      toast.success("Votação encerrada! Local definido.");
      utils.events.getById.invalidate({ eventId });
      utils.events.locationOptions.invalidate({ eventId });
    },
    onError: (err) => toast.error(err.message || "Erro ao encerrar votação"),
  });

  // Initialize selected options from user's existing votes
  const myVotes = votes?.filter((v: any) => v.userId === user?.id).map((v: any) => v.optionId) || [];

  const toggleOption = (optId: number) => {
    setSelectedOptions(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  const handleVote = () => {
    if (selectedOptions.length === 0) {
      toast.error("Selecione ao menos uma opção");
      return;
    }
    voteMutation.mutate({ eventId, optionIds: selectedOptions });
  };

  if (optionsLoading) {
    return (
      <div className="mb-6 flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!options || options.length === 0) return null;

  // Count votes per option
  const voteCountByOption: Record<number, number> = {};
  votes?.forEach((v: any) => {
    voteCountByOption[v.optionId] = (voteCountByOption[v.optionId] || 0) + 1;
  });

  const totalVoters = new Set(votes?.map((v: any) => v.userId)).size;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm tracking-wider text-muted-foreground flex items-center gap-2">
          <Vote className="w-4 h-4 text-purple-400" />
          VOTAÇÃO DE LOCAL
        </h3>
        {totalVoters > 0 && (
          <span className="text-xs text-muted-foreground">{totalVoters} {totalVoters === 1 ? "voto" : "votos"}</span>
        )}
      </div>

      <div className="space-y-2">
        {options.map((opt: any) => {
          const count = voteCountByOption[opt.id] || 0;
          const isMyVote = myVotes.includes(opt.id);
          const isSelected = selectedOptions.includes(opt.id);
          const displayName = opt.establishment?.name || opt.manualName || "Local";
          const displayAddress = opt.establishment?.address || opt.manualAddress || "";

          return (
            <button
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all ${
                isSelected
                  ? "bg-purple-500/10 border-purple-500/40"
                  : isMyVote
                    ? "bg-purple-500/5 border-purple-500/20"
                    : "border-border/50 hover:border-purple-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-purple-500 border-purple-500"
                      : "border-border/50"
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                    {displayAddress && (
                      <p className="text-xs text-muted-foreground">{displayAddress}</p>
                    )}
                  </div>
                </div>
                {count > 0 && (
                  <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Button */}
      <div className="mt-3 flex gap-2">
        <Button
          onClick={handleVote}
          disabled={selectedOptions.length === 0 || voteMutation.isPending}
          className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
          size="sm"
        >
          {voteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Vote className="w-4 h-4 mr-1" />
          )}
          Votar
        </Button>

        {/* Close Voting (creator only) */}
        {isCreator && (
          <Button
            onClick={() => {
              if (confirm("Encerrar votação? O local mais votado será definido.")) {
                closeVotingMutation.mutate({ eventId });
              }
            }}
            disabled={closeVotingMutation.isPending}
            variant="outline"
            size="sm"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Trophy className="w-4 h-4 mr-1" />
            Encerrar
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/60 mt-2">
        Selecione uma ou mais opções. O criador pode encerrar a votação a qualquer momento.
      </p>
    </div>
  );
}
