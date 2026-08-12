import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Clock, X, Camera } from "lucide-react";

type ViewMode = "month" | "year";

export default function CalendarioTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Get user's ratings (with visitDate) for calendar dots
  const { data: myRatings } = trpc.ratings.myRatings.useQuery({ limit: 100, offset: 0 });
  // Get user's gallery photos (with visitDate)
  const { data: galleryPhotos } = trpc.ratings.myGallery.useQuery({ limit: 100, offset: 0 });
  // Get user's events (upcoming + past)
  const { data: upcomingEvents } = trpc.events.myEvents.useQuery({ upcoming: true });
  const { data: pastEvents } = trpc.events.myEvents.useQuery({ upcoming: false });

  const allEvents = useMemo(() => [
    ...(upcomingEvents || []),
    ...(pastEvents || []),
  ], [upcomingEvents, pastEvents]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const monthNamesShort = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Map dates to ratings/photos
  const ratingsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (myRatings || []).forEach((r: any) => {
      const date = r.visitDate || r.createdAt;
      if (date) {
        const key = new Date(date).toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(r);
      }
    });
    return map;
  }, [myRatings]);

  const photosByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    (galleryPhotos || []).forEach((p: any) => {
      const date = p.visitDate || p.createdAt;
      if (date) {
        const key = new Date(date).toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [galleryPhotos]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    allEvents.forEach((ev: any) => {
      if (ev.eventDate) {
        const key = new Date(ev.eventDate).toISOString().split("T")[0];
        if (!map[key]) map[key] = [];
        map[key].push(ev);
      }
    });
    return map;
  }, [allEvents]);

  // Count events/ratings per month for year view dots
  const monthHasContent = useMemo(() => {
    const result: Record<number, { ratings: boolean; photos: boolean; events: boolean }> = {};
    for (let m = 0; m < 12; m++) {
      let hasRatings = false;
      let hasPhotos = false;
      let hasEvents = false;
      const prefix = `${year}-${String(m + 1).padStart(2, "0")}`;
      for (const key of Object.keys(ratingsByDate)) {
        if (key.startsWith(prefix)) { hasRatings = true; break; }
      }
      for (const key of Object.keys(photosByDate)) {
        if (key.startsWith(prefix)) { hasPhotos = true; break; }
      }
      for (const key of Object.keys(eventsByDate)) {
        if (key.startsWith(prefix)) { hasEvents = true; break; }
      }
      result[m] = { ratings: hasRatings, photos: hasPhotos, events: hasEvents };
    }
    return result;
  }, [year, ratingsByDate, photosByDate, eventsByDate]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const nextYear = () => setCurrentDate(new Date(year + 1, month, 1));

  const getDateKey = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split("T")[0];
  };

  const handleMonthClick = (m: number) => {
    setCurrentDate(new Date(year, m, 1));
    setViewMode("month");
    setSelectedDay(null);
  };

  const selectedDateKey = selectedDay ? getDateKey(selectedDay) : null;
  const selectedRatings = selectedDateKey ? (ratingsByDate[selectedDateKey] || []) : [];
  const selectedPhotos = selectedDateKey ? (photosByDate[selectedDateKey] || []) : [];
  const selectedEvents = selectedDateKey ? (eventsByDate[selectedDateKey] || []) : [];
  const hasContent = selectedRatings.length > 0 || selectedPhotos.length > 0 || selectedEvents.length > 0;

  // ─── Year View ─────────────────────────────────────────────
  if (viewMode === "year") {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return (
      <div className="flex-1">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevYear} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h3 className="font-display text-sm tracking-wider text-foreground">
            {year}
          </h3>
          <button onClick={nextYear} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 12 months grid */}
        <div className="grid grid-cols-3 gap-2">
          {monthNamesShort.map((name, m) => {
            const isCurrentMonth = m === currentMonth && year === currentYear;
            const content = monthHasContent[m];
            return (
              <button
                key={m}
                onClick={() => handleMonthClick(m)}
                className={`py-3 px-2 rounded-lg text-center transition-all ${
                  isCurrentMonth
                    ? "bg-primary/10 border border-primary/40 text-primary"
                    : "hover:bg-secondary border border-border/30 text-foreground"
                }`}
              >
                <span className="text-sm font-medium">{name}</span>
                {/* Dots for content */}
                <div className="flex gap-0.5 mt-1 justify-center">
                  {content?.photos && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                  {content?.ratings && !content?.photos && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  {content?.events && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 justify-center">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[9px] text-muted-foreground">Fotos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[9px] text-muted-foreground">Avaliações</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[9px] text-muted-foreground">Eventos</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Month View ────────────────────────────────────────────
  return (
    <div className="flex gap-0 relative">
      {/* Side panel - 30% when a day is selected */}
      {selectedDay !== null && (
        <div className="w-[30%] min-w-[120px] max-w-[200px] border-r border-border/30 pr-2 overflow-y-auto max-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-foreground">
              {selectedDay}/{month + 1}
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!hasContent && (
            <p className="text-[10px] text-muted-foreground text-center py-4">
              Nenhuma avaliação ou evento foi feito neste dia
            </p>
          )}

          {/* Photos from ratings on this day */}
          {selectedPhotos.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Fotos
              </p>
              <div className="grid grid-cols-2 gap-1">
                {selectedPhotos.map((p: any) => (
                  <div key={p.id} className="aspect-square rounded overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings without photos */}
          {selectedRatings.filter((r: any) => !selectedPhotos.some((p: any) => p.ratingId === r.id)).length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground mb-1">Avaliações</p>
              {selectedRatings
                .filter((r: any) => !selectedPhotos.some((p: any) => p.ratingId === r.id))
                .map((r: any) => (
                  <div key={r.id} className="p-1.5 rounded bg-card border border-border/30 mb-1">
                    <p className="text-[10px] font-medium text-foreground truncate">{r.establishmentName}</p>
                    {r.overallScore && (
                      <p className="text-[9px] text-primary">{Number(r.overallScore).toFixed(1)}★</p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Events */}
          {selectedEvents.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Eventos
              </p>
              {selectedEvents.map((ev: any) => {
                // Determine RSVP status color
                const rsvpStatus = ev.myRsvp || "pending";
                const borderColor = rsvpStatus === "confirmed" ? "border-green-500/50 bg-green-500/5"
                  : rsvpStatus === "declined" ? "border-gray-500/50 bg-gray-500/5 opacity-60"
                  : "border-primary/30 bg-primary/5";
                return (
                  <div key={ev.id} className={`p-1.5 rounded border mb-1 ${borderColor}`}>
                    <p className="text-[10px] font-medium text-foreground truncate">{ev.title}</p>
                    {ev.manualLocationName && (
                      <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {ev.manualLocationName}
                      </p>
                    )}
                    {ev.establishmentName && (
                      <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {ev.establishmentName}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(ev.eventDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className={`text-[8px] px-1 py-0.5 rounded mt-0.5 inline-block ${
                      rsvpStatus === "confirmed" ? "bg-green-500/20 text-green-400" :
                      rsvpStatus === "declined" ? "bg-gray-500/20 text-gray-400" :
                      "bg-primary/20 text-primary"
                    }`}>
                      {rsvpStatus === "confirmed" ? "Aceito" : rsvpStatus === "declined" ? "Recusado" : "Pendente"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className={`flex-1 ${selectedDay !== null ? "pl-2" : ""}`}>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setViewMode("year")}
            className="font-display text-sm tracking-wider text-foreground hover:text-primary transition-colors cursor-pointer"
          >
            {monthNames[month]} {year}
          </button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[9px] text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = getDateKey(day);
            const hasRating = !!ratingsByDate[dateKey];
            const hasPhoto = !!photosByDate[dateKey];
            const hasEvent = !!eventsByDate[dateKey];
            const isSelected = selectedDay === day;
            const isToday = new Date().toISOString().split("T")[0] === dateKey;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all relative ${
                  isSelected
                    ? "bg-primary/20 border border-primary/50 text-primary"
                    : isToday
                    ? "bg-primary/5 border border-primary/20 text-foreground"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <span className="text-[11px]">{day}</span>
                {/* Dots indicator */}
                <div className="flex gap-0.5 mt-0.5">
                  {hasPhoto && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                  {hasRating && !hasPhoto && <span className="w-1 h-1 rounded-full bg-primary" />}
                  {hasEvent && <span className="w-1 h-1 rounded-full bg-green-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3 justify-center">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[9px] text-muted-foreground">Fotos</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-[9px] text-muted-foreground">Avaliações</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[9px] text-muted-foreground">Eventos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
