import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  CheckCircle, XCircle, Users, MessageSquare, Bell,
  Tag, UtensilsCrossed, CalendarDays, Trash2, Download,
  ClipboardCheck, History, ChevronDown, ChevronUp, Send, Loader2
} from "lucide-react";

interface EventCardProps {
  event: any;
  type: "event" | "reservation";
  establishmentId: number;
}

export default function BusinessEventActions({ event, type, establishmentId }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [inputValue2, setInputValue2] = useState("");
  const [newDate, setNewDate] = useState("");
  const [attendanceList, setAttendanceList] = useState<{ userId: number; attended: boolean }[]>([]);

  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.events.dayEvents.invalidate();
    utils.events.calendarCounts.invalidate();
  };

  const confirmMutation = trpc.events.confirmReservation.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); invalidate(); setActiveModal(null); },
    onError: (e) => toast.error(e.message),
  });

  const maxGuestsMutation = trpc.events.updateMaxGuests.useMutation({
    onSuccess: () => { toast.success("Limite atualizado!"); invalidate(); setActiveModal(null); },
    onError: (e) => toast.error(e.message),
  });

  const noteMutation = trpc.events.addNote.useMutation({
    onSuccess: () => { toast.success("Observação salva!"); invalidate(); setActiveModal(null); setInputValue(""); },
    onError: (e) => toast.error(e.message),
  });

  const completeMutation = trpc.events.markCompleted.useMutation({
    onSuccess: () => { toast.success("Marcado como concluído!"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const messageMutation = trpc.events.sendMessageToGroup.useMutation({
    onSuccess: () => { toast.success("Mensagem enviada ao grupo!"); setActiveModal(null); setInputValue(""); },
    onError: (e) => toast.error(e.message),
  });

  const notifyMutation = trpc.events.notifyChange.useMutation({
    onSuccess: () => { toast.success("Notificação enviada!"); setActiveModal(null); setInputValue(""); },
    onError: (e) => toast.error(e.message),
  });

  const promoMutation = trpc.events.addPromotion.useMutation({
    onSuccess: () => { toast.success("Promoção vinculada!"); invalidate(); setActiveModal(null); setInputValue(""); setInputValue2(""); },
    onError: (e) => toast.error(e.message),
  });

  const menuMutation = trpc.events.suggestMenu.useMutation({
    onSuccess: () => { toast.success("Sugestão de cardápio enviada!"); setActiveModal(null); setInputValue(""); },
    onError: (e) => toast.error(e.message),
  });

  const rescheduleMutation = trpc.events.reschedule.useMutation({
    onSuccess: () => { toast.success("Evento reagendado!"); invalidate(); setActiveModal(null); setNewDate(""); },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.events.cancelByBusiness.useMutation({
    onSuccess: () => { toast.success("Evento cancelado."); invalidate(); setActiveModal(null); setInputValue(""); },
    onError: (e) => toast.error(e.message),
  });

  const { data: confirmedList, isLoading: loadingList } = trpc.events.exportConfirmedList.useQuery(
    { eventId: event.id },
    { enabled: activeModal === "attendance" || activeModal === "export" }
  );

  const attendanceMutation = trpc.events.markAttendance.useMutation({
    onSuccess: () => { toast.success("Presença registrada!"); invalidate(); setActiveModal(null); },
    onError: (e) => toast.error(e.message),
  });

  const borderColor = type === "event" ? "border-blue-400/20" : "border-red-400/20";
  const bgColor = type === "event" ? "bg-blue-400/5" : "bg-red-400/5";

  return (
    <div className={`p-3 rounded-lg border ${borderColor} ${bgColor} mb-2`}>
      {/* Event Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="text-sm font-medium text-foreground">{event.title}</h5>
          <p className="text-xs text-muted-foreground">Grupo: {event.groupName} · {event.creatorName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(event.eventDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* RSVP Counts */}
      <div className="flex items-center gap-3 mt-2 text-xs">
        <span className="text-green-400">✓ {event.rsvpCounts.confirmed} confirmados</span>
        <span className="text-yellow-400">? {event.rsvpCounts.maybe} talvez</span>
        <span className="text-red-400">✗ {event.rsvpCounts.declined}</span>
        {event.maxGuests && <span className="text-muted-foreground ml-auto">{event.rsvpCounts.confirmed}/{event.maxGuests} vagas</span>}
      </div>

      {/* Business Status Badge */}
      {event.businessStatus && event.businessStatus !== "pending" && (
        <div className={`mt-2 text-xs font-medium px-2 py-0.5 rounded-full inline-block ${
          event.businessStatus === "confirmed" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        }`}>
          {event.businessStatus === "confirmed" ? "✅ Confirmado" : "❌ Recusado"}
        </div>
      )}

      {/* Expanded Actions Panel */}
      {expanded && (
        <div className="mt-4 pt-3 border-t border-border/30 space-y-3">
          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {/* Gestão */}
            {(!event.businessStatus || event.businessStatus === "pending") && (
              <ActionBtn icon={CheckCircle} label="Confirmar" color="text-green-400" onClick={() => confirmMutation.mutate({ eventId: event.id, action: "confirm" })} loading={confirmMutation.isPending} />
            )}
            {(!event.businessStatus || event.businessStatus === "pending") && (
              <ActionBtn icon={XCircle} label="Recusar" color="text-red-400" onClick={() => setActiveModal("reject")} />
            )}
            <ActionBtn icon={Users} label="Limitar Vagas" color="text-blue-400" onClick={() => setActiveModal("maxGuests")} />
            <ActionBtn icon={ClipboardCheck} label="Observação" color="text-amber-400" onClick={() => setActiveModal("note")} />
            {event.status === "active" && (
              <ActionBtn icon={CheckCircle} label="Concluído" color="text-emerald-400" onClick={() => completeMutation.mutate({ eventId: event.id })} loading={completeMutation.isPending} />
            )}

            {/* Comunicação */}
            <ActionBtn icon={MessageSquare} label="Mensagem" color="text-purple-400" onClick={() => setActiveModal("message")} />
            <ActionBtn icon={Bell} label="Notificar" color="text-orange-400" onClick={() => setActiveModal("notify")} />

            {/* Promoção */}
            <ActionBtn icon={Tag} label="Promoção" color="text-pink-400" onClick={() => setActiveModal("promo")} />
            <ActionBtn icon={UtensilsCrossed} label="Cardápio" color="text-cyan-400" onClick={() => setActiveModal("menu")} />

            {/* Organização */}
            <ActionBtn icon={CalendarDays} label="Reagendar" color="text-indigo-400" onClick={() => setActiveModal("reschedule")} />
            <ActionBtn icon={Trash2} label="Cancelar" color="text-red-400" onClick={() => setActiveModal("cancel")} />
            <ActionBtn icon={Download} label="Lista" color="text-teal-400" onClick={() => setActiveModal("export")} />

            {/* Métricas */}
            <ActionBtn icon={ClipboardCheck} label="Presença" color="text-lime-400" onClick={() => { setActiveModal("attendance"); setAttendanceList([]); }} />
            <ActionBtn icon={History} label="Histórico" color="text-slate-400" onClick={() => toast("Em breve!", { description: "Histórico de reservas será implementado." })} />
          </div>

          {/* Modals / Inline Forms */}
          {activeModal === "reject" && (
            <InlineForm
              title="Motivo da Recusa"
              placeholder="Ex: Lotação máxima atingida..."
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => confirmMutation.mutate({ eventId: event.id, action: "reject", rejectionReason: inputValue })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={confirmMutation.isPending}
            />
          )}

          {activeModal === "maxGuests" && (
            <InlineForm
              title="Limite de Vagas"
              placeholder="Ex: 20"
              value={inputValue}
              onChange={setInputValue}
              type="number"
              onSubmit={() => maxGuestsMutation.mutate({ eventId: event.id, maxGuests: Number(inputValue) })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={maxGuestsMutation.isPending}
            />
          )}

          {activeModal === "note" && (
            <InlineForm
              title="Observação para o Evento"
              placeholder="Ex: Mesa na área externa, chegue 15min antes..."
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => noteMutation.mutate({ eventId: event.id, note: inputValue, sendToGroup: true })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={noteMutation.isPending}
              submitLabel="Salvar e Enviar ao Grupo"
            />
          )}

          {activeModal === "message" && (
            <InlineForm
              title="Mensagem ao Grupo"
              placeholder="Ex: Confirmado! Mesa reservada para 8 pessoas..."
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => messageMutation.mutate({ eventId: event.id, message: inputValue })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={messageMutation.isPending}
              submitLabel="Enviar"
            />
          )}

          {activeModal === "notify" && (
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Notificar Alteração</p>
              <select
                value={inputValue2}
                onChange={(e) => setInputValue2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              >
                <option value="">Tipo de alteração...</option>
                <option value="horario">⏰ Horário</option>
                <option value="local">📍 Local</option>
                <option value="cancelamento">❌ Cancelamento</option>
                <option value="outro">ℹ️ Outro</option>
              </select>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Descreva a alteração..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (inputValue2 && inputValue) notifyMutation.mutate({ eventId: event.id, changeType: inputValue2 as any, message: inputValue }); }}
                  disabled={!inputValue2 || !inputValue || notifyMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {notifyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Enviar"}
                </button>
                <button onClick={() => { setActiveModal(null); setInputValue(""); setInputValue2(""); }} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}

          {activeModal === "promo" && (
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Vincular Promoção</p>
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Código promocional (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
              <input
                value={inputValue2}
                onChange={(e) => setInputValue2(e.target.value)}
                placeholder="Descrição da promoção (ex: 10% off no chopp)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => promoMutation.mutate({ eventId: event.id, promoCode: inputValue || undefined, promoDescription: inputValue2 || undefined })}
                  disabled={(!inputValue && !inputValue2) || promoMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {promoMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Salvar e Enviar"}
                </button>
                <button onClick={() => { setActiveModal(null); setInputValue(""); setInputValue2(""); }} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}

          {activeModal === "menu" && (
            <InlineForm
              title="Sugestão de Cardápio"
              placeholder="Ex: Combo especial: 2 chopps + porção de batata por R$49..."
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => menuMutation.mutate({ eventId: event.id, suggestedMenu: inputValue })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={menuMutation.isPending}
              submitLabel="Enviar Sugestão"
              multiline
            />
          )}

          {activeModal === "reschedule" && (
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Reagendar Evento</p>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (newDate) rescheduleMutation.mutate({ eventId: event.id, newDate: new Date(newDate).toISOString() }); }}
                  disabled={!newDate || rescheduleMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {rescheduleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Reagendar"}
                </button>
                <button onClick={() => { setActiveModal(null); setNewDate(""); }} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}

          {activeModal === "cancel" && (
            <InlineForm
              title="Cancelar Evento"
              placeholder="Motivo do cancelamento..."
              value={inputValue}
              onChange={setInputValue}
              onSubmit={() => cancelMutation.mutate({ eventId: event.id, reason: inputValue })}
              onCancel={() => { setActiveModal(null); setInputValue(""); }}
              loading={cancelMutation.isPending}
              submitLabel="Confirmar Cancelamento"
              destructive
            />
          )}

          {activeModal === "export" && (
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Lista de Confirmados</p>
              {loadingList ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
              ) : confirmedList && confirmedList.length > 0 ? (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {confirmedList.filter((a: any) => a.status === "confirmed").map((a: any) => (
                    <div key={a.userId} className="flex items-center gap-2 text-xs text-foreground">
                      <span className="text-green-400">✓</span>
                      <span>{a.name} (@{a.username})</span>
                    </div>
                  ))}
                  {confirmedList.filter((a: any) => a.status === "maybe").map((a: any) => (
                    <div key={a.userId} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-yellow-400">?</span>
                      <span>{a.name} (@{a.username})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum confirmado ainda.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirmedList) {
                      const text = confirmedList.map((a: any) => `${a.name} (@${a.username}) - ${a.status}`).join("\n");
                      navigator.clipboard.writeText(text);
                      toast.success("Lista copiada!");
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                >
                  Copiar Lista
                </button>
                <button onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Fechar</button>
              </div>
            </div>
          )}

          {activeModal === "attendance" && (
            <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Marcar Presença</p>
              {loadingList ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
              ) : confirmedList && confirmedList.filter((a: any) => a.status === "confirmed").length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {confirmedList.filter((a: any) => a.status === "confirmed").map((a: any) => {
                    const isMarked = attendanceList.find(x => x.userId === a.userId);
                    return (
                      <div key={a.userId} className="flex items-center justify-between text-xs py-1">
                        <span className="text-foreground">{a.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setAttendanceList(prev => [...prev.filter(x => x.userId !== a.userId), { userId: a.userId, attended: true }])}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${isMarked?.attended === true ? 'bg-green-500/20 text-green-400' : 'bg-card border border-border text-muted-foreground'}`}
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => setAttendanceList(prev => [...prev.filter(x => x.userId !== a.userId), { userId: a.userId, attended: false }])}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${isMarked?.attended === false ? 'bg-red-500/20 text-red-400' : 'bg-card border border-border text-muted-foreground'}`}
                          >
                            Ausente
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum confirmado para marcar presença.</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { if (attendanceList.length > 0) attendanceMutation.mutate({ eventId: event.id, attendees: attendanceList }); }}
                  disabled={attendanceList.length === 0 || attendanceMutation.isPending}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {attendanceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Salvar Presença"}
                </button>
                <button onClick={() => setActiveModal(null)} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

function ActionBtn({ icon: Icon, label, color, onClick, loading }: { icon: any; label: string; color: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-border/50 bg-card hover:bg-primary/5 transition-colors text-xs disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Icon className={`w-3.5 h-3.5 ${color}`} />}
      <span className="text-foreground truncate">{label}</span>
    </button>
  );
}

function InlineForm({ title, placeholder, value, onChange, onSubmit, onCancel, loading, submitLabel, type, multiline, destructive }: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  type?: string;
  multiline?: boolean;
  destructive?: boolean;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-foreground">{title}</p>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground resize-none"
        />
      ) : (
        <input
          type={type || "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={!value || loading}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 ${
            destructive ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-primary text-primary-foreground'
          }`}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (submitLabel || "Salvar")}
        </button>
        <button onClick={onCancel} className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground">Cancelar</button>
      </div>
    </div>
  );
}
