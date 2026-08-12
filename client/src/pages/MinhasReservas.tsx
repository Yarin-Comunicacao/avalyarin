import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { CalendarDays, Clock, MapPin, Loader2, ArrowLeft, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function MinhasReservas() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: reservations, isLoading } = trpc.events.myReservations.useQuery(undefined, {
    enabled: !!user,
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const now = new Date();

  const upcoming = (reservations || []).filter((r: any) => new Date(r.eventDate) >= now);
  const past = (reservations || []).filter((r: any) => new Date(r.eventDate) < now);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <div className="container pt-6">
        <button onClick={() => navigate(-1 as any)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="font-display text-2xl tracking-wider text-primary mb-6">MINHAS RESERVAS</h1>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (!reservations || reservations.length === 0) && (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Você ainda não fez nenhuma reserva.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Visite a página de um estabelecimento e clique em "Reservar".
            </p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Próximas
            </h2>
            <div className="space-y-3">
              {upcoming.map((r: any) => (
                <div
                  key={r.id}
                  className="border border-primary/20 rounded-xl p-4 bg-card/50 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => r.establishmentSlug && navigate(`/estabelecimento/${r.establishmentSlug}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      {r.establishmentName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {r.establishmentName}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 font-medium">
                      Confirmada
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {formatDate(r.eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(r.eventDate)}
                    </span>
                    {r.description && r.description.match(/(\d+) pessoa/) && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {r.description.match(/(\d+) pessoa/)?.[1]} pessoa(s)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Anteriores
            </h2>
            <div className="space-y-3">
              {past.map((r: any) => (
                <div
                  key={r.id}
                  className="border border-border/30 rounded-xl p-4 bg-card/30 opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.title}</p>
                      {r.establishmentName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {r.establishmentName}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/30 font-medium">
                      Concluída
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> {formatDate(r.eventDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatTime(r.eventDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
