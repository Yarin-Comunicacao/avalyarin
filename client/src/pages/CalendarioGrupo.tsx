import { useState, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, ChevronLeft, ChevronRight, CalendarDays,
  MapPin, Clock, Users, Check, HelpCircle, X, Loader2, Search
} from "lucide-react";

// ─── Create Event Modal ──────────────────────────────────────────────────────

function CreateEventModal({
  groupId,
  onClose,
}: {
  groupId: number;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("20:00");
  const [maxGuests, setMaxGuests] = useState("");
  const [estabSearch, setEstabSearch] = useState("");
  const [selectedEstab, setSelectedEstab] = useState<{ id: number; name: string } | null>(null);

  const utils = trpc.useUtils();

  // Search establishments
  const { data: searchResults } = trpc.establishments.search.useQuery(
    { query: estabSearch },
    { enabled: estabSearch.length >= 2 }
  );

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast.success("Evento criado com sucesso!");
      utils.events.listByGroup.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar evento");
    },
  });

  const handleSubmit = () => {
    if (!selectedEstab || !title.trim() || !eventDate) return;
    const dateTime = new Date(`${eventDate}T${eventTime}:00`);
    createMutation.mutate({
      groupId,
      establishmentId: selectedEstab.id,
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate: dateTime.toISOString(),
      maxGuests: maxGuests ? parseInt(maxGuests) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl tracking-wider text-primary">CRIAR EVENTO</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1 block">Nome do evento</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Happy Hour de Sexta"
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            maxLength={255}
          />
        </div>

        {/* Establishment Search */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1 block">Local (estabelecimento)</label>
          {selectedEstab ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{selectedEstab.name}</span>
              </div>
              <button onClick={() => setSelectedEstab(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={estabSearch}
                onChange={(e) => setEstabSearch(e.target.value)}
                placeholder="Buscar bar ou restaurante..."
                className="w-full bg-background border border-border/50 rounded-lg pl-10 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              {searchResults && searchResults.establishments && searchResults.establishments.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg overflow-hidden z-10 max-h-40 overflow-y-auto">
                  {searchResults.establishments.map((estab: any) => (
                    <button
                      key={estab.id}
                      onClick={() => {
                        setSelectedEstab({ id: estab.id, name: estab.name });
                        setEstabSearch("");
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors border-b border-border/20 last:border-0"
                    >
                      <p className="text-sm text-foreground">{estab.name}</p>
                      <p className="text-xs text-muted-foreground">{estab.neighborhood || estab.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Data</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Horário</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Max Guests */}
        <div className="mb-4">
          <label className="text-sm text-muted-foreground mb-1 block">Limite de pessoas (opcional)</label>
          <input
            type="number"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
            placeholder="Ex: 20"
            min="1"
            max="500"
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-1 block">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre o evento..."
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-20"
            maxLength={1000}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !selectedEstab || !eventDate || createMutation.isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-display tracking-wider"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <CalendarDays className="w-4 h-4 mr-2" />
          )}
          CRIAR EVENTO
        </Button>
      </div>
    </div>
  );
}

// ─── Calendar Component ──────────────────────────────────────────────────────

function MiniCalendar({
  currentMonth,
  onMonthChange,
  eventDates,
  selectedDate,
  onSelectDate,
}: {
  currentMonth: Date;
  onMonthChange: (d: Date) => void;
  eventDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (d: string | null) => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 mb-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-display text-lg tracking-wider text-foreground">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="p-1 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvent = eventDates.has(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground font-bold"
                  : isToday
                  ? "bg-primary/20 text-primary font-bold"
                  : hasEvent
                  ? "text-foreground hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Event Card ──────────────────────────────────────────────────────────────

function EventCard({ event }: { event: any }) {
  const date = new Date(event.eventDate);
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <Link href={`/evento/${event.id}`}>
      <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground truncate">{event.title}</h4>
            {event.establishmentName && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground truncate">{event.establishmentName}</span>
              </div>
            )}
          </div>
          <div className="text-right ml-3">
            <div className="text-xs font-medium text-primary">{dateStr}</div>
            <div className="text-xs text-muted-foreground">{timeStr}</div>
          </div>
        </div>

        {/* RSVP Summary */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-muted-foreground">{event.confirmedCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{event.maybeCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-muted-foreground">{event.declinedCount || 0}</span>
          </div>
          {event.maxGuests && (
            <div className="flex items-center gap-1 ml-auto">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {event.confirmedCount || 0}/{event.maxGuests}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CalendarioGrupo() {
  const params = useParams<{ id: string }>();
  const groupId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: events, isLoading } = trpc.events.listByGroup.useQuery(
    { groupId, status: "active" },
    { enabled: !!user && groupId > 0 }
  );

  // Build set of dates that have events
  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    if (events) {
      events.forEach((e: any) => {
        const d = new Date(e.eventDate).toISOString().split("T")[0];
        dates.add(d);
      });
    }
    return dates;
  }, [events]);

  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!selectedDate) return events;
    return events.filter((e: any) => {
      const d = new Date(e.eventDate).toISOString().split("T")[0];
      return d === selectedDate;
    });
  }, [events, selectedDate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-28 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-2xl tracking-wider text-primary">CALENDÁRIO</h1>
              <p className="text-xs text-muted-foreground">Eventos do grupo</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo
          </Button>
        </div>

        {/* Calendar */}
        <MiniCalendar
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          eventDates={eventDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Events List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground">
              {selectedDate
                ? `EVENTOS EM ${new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase()}`
                : "PRÓXIMOS EVENTOS"}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-primary hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10 bg-card/50 rounded-xl border border-border/30">
              <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {selectedDate ? "Nenhum evento nesta data" : "Nenhum evento agendado"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Crie um evento para reunir o grupo!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event: any) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreate && (
        <CreateEventModal groupId={groupId} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
