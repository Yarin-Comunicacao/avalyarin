import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, CalendarDays, Clock, Users, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function ReservarPage() {
  const [, params] = useRoute("/reservar/:slug");
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const slug = params?.slug || "";

  const { data: establishment, isLoading } = trpc.establishments.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const createReservation = trpc.events.createDirectReservation.useMutation({
    onSuccess: () => {
      setSuccess(true);
      toast.success("Reserva criada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar reserva.");
    },
  });

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Estabelecimento não encontrado.</p>
        </div>
      </div>
    );
  }

  // Check if establishment accepts reservations
  const acceptsReservations = (establishment as any).acceptsReservations === true;
  if (!acceptsReservations) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-xl text-foreground mb-2">RESERVAS INDISPONÍVEIS</h2>
          <p className="text-sm text-muted-foreground">
            Este estabelecimento não está aceitando reservas no momento.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => navigate(`/estabelecimento/${slug}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-foreground mb-2">RESERVA CONFIRMADA!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sua reserva em <span className="text-foreground font-medium">{establishment.name}</span> foi criada.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(`/estabelecimento/${slug}`)}>
              Voltar ao Local
            </Button>
            <Button onClick={() => navigate("/minhas-reservas")}>
              Minhas Reservas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      toast.error("Selecione data e horário.");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Faça login para reservar.");
      return;
    }

    const eventDate = new Date(`${date}T${time}:00`);
    const now = new Date();
    const minAdvance = (establishment as any).reservationMinAdvanceMinutes || 30;
    const minTime = new Date(eventDate.getTime() - minAdvance * 60 * 1000);

    if (now > minTime) {
      toast.error(`Reservas devem ser feitas com pelo menos ${minAdvance >= 60 ? `${minAdvance / 60}h` : `${minAdvance}min`} de antecedência.`);
      return;
    }

    createReservation.mutate({
      title: `Reserva - ${establishment.name}`,
      description: notes || `Reserva para ${guests} pessoa(s)`,
      eventDate: eventDate.toISOString(),
      establishmentId: establishment.id,
    });
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Header */}
      <div className="container pt-6 pb-4">
        <button onClick={() => navigate(`/estabelecimento/${slug}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="font-display text-2xl tracking-wider text-primary">FAZER RESERVA</h1>
        <p className="text-sm text-muted-foreground mt-1">{establishment.name}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="container space-y-5">
        {/* Date */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-primary" /> Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm"
            required
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" /> Horário
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm"
            required
          />
        </div>

        {/* Guests */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" /> Número de Pessoas
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-10 rounded-lg border border-border bg-card text-foreground flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            <span className="text-lg font-medium text-foreground w-8 text-center">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(20, guests + 1))}
              className="w-10 h-10 rounded-lg border border-border bg-card text-foreground flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: mesa ao ar livre, aniversário, cadeirante..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm resize-none h-24"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          disabled={createReservation.isPending}
          className="w-full font-display text-lg tracking-wider glow-amber"
        >
          {createReservation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> RESERVANDO...</>
          ) : (
            "CONFIRMAR RESERVA"
          )}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Antecedência mínima: {((establishment as any).reservationMinAdvanceMinutes || 30) >= 60
            ? `${((establishment as any).reservationMinAdvanceMinutes || 30) / 60} hora(s)`
            : `${(establishment as any).reservationMinAdvanceMinutes || 30} minutos`
          } antes do horário
        </p>
      </form>
    </div>
  );
}
