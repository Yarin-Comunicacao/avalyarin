import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Plus, Trash2, Calendar as CalendarIcon, MapPin, Search, ChevronDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CreatePollModalProps {
  groupId: number;
  onClose: () => void;
  onCreated?: () => void;
}

type PollType = "texto" | "data" | "estab" | "total";

// ==================== Poll Type Selector (dropdown before modal) ====================
export function PollTypeDropdown({ onSelect, onCancel }: { onSelect: (type: PollType) => void; onCancel: () => void }) {
  const types: { key: PollType; label: string; desc: string }[] = [
    { key: "texto", label: "Texto", desc: "Opções de texto livre" },
    { key: "data", label: "Data", desc: "Votação de datas" },
    { key: "estab", label: "Estabelecimento", desc: "Escolha entre locais" },
    { key: "total", label: "Total", desc: "Local + Data combinados" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-xs p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-sm tracking-wider text-primary mb-3">TIPO DE ENQUETE</h3>
        <div className="space-y-1">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group"
            >
              <span className="text-sm font-medium text-foreground group-hover:text-primary">{t.label}</span>
              <p className="text-[10px] text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== Main Create Poll Modal ====================
export default function CreatePollModal({ groupId, onClose, onCreated }: CreatePollModalProps) {
  const [pollType, setPollType] = useState<PollType>("texto");
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [multipleChoice, setMultipleChoice] = useState(false);

  // Texto options
  const [textOptions, setTextOptions] = useState(["", ""]);

  // Data options
  const [dateOptions, setDateOptions] = useState(["", ""]);

  // Estab options - minimum 2 search fields
  const [estabSearches, setEstabSearches] = useState(["", ""]);
  const [selectedEstabs, setSelectedEstabs] = useState<{ id: number; name: string }[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);

  // Total options (estab + date combined as single options)
  const [totalOptions, setTotalOptions] = useState<{ estabId?: number; estabName: string; date: string }[]>([
    { estabName: "", date: "" },
    { estabName: "", date: "" },
  ]);
  const [totalSearches, setTotalSearches] = useState(["", ""]);
  const [activeTotalSearchIdx, setActiveTotalSearchIdx] = useState<number | null>(null);

  // Local Extra (for Total mode)
  const [hasCustomLocation, setHasCustomLocation] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [customComplement, setCustomComplement] = useState("");

  // Search establishments - use the active search term
  const currentSearch = activeSearchIdx !== null ? estabSearches[activeSearchIdx] : 
                        activeTotalSearchIdx !== null ? totalSearches[activeTotalSearchIdx] : "";
  const searchQueryRaw = trpc.establishments.search.useQuery(
    { query: currentSearch },
    { enabled: currentSearch.length >= 2 }
  );
  const searchResults = searchQueryRaw.data && !Array.isArray(searchQueryRaw.data) ? searchQueryRaw.data.establishments || [] : (searchQueryRaw.data || []);

  const createMutation = trpc.groups.createPoll.useMutation({
    onSuccess: () => {
      toast.success("Enquete criada!");
      onCreated?.();
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Duplicate detection for text options
  const textDuplicates = useMemo(() => {
    const dupes = new Set<number>();
    const normalized = textOptions.map((o) => o.trim().toLowerCase());
    for (let i = 0; i < normalized.length; i++) {
      if (!normalized[i]) continue;
      for (let j = 0; j < i; j++) {
        if (!normalized[j]) continue;
        if (normalized[i] === normalized[j]) { dupes.add(i); break; }
      }
    }
    return dupes;
  }, [textOptions]);

  // Duplicate detection for dates
  const dateDuplicates = useMemo(() => {
    const dupes = new Set<number>();
    for (let i = 0; i < dateOptions.length; i++) {
      if (!dateOptions[i]) continue;
      for (let j = 0; j < i; j++) {
        if (!dateOptions[j]) continue;
        if (dateOptions[i] === dateOptions[j]) { dupes.add(i); break; }
      }
    }
    return dupes;
  }, [dateOptions]);

  const hasDuplicates = pollType === "texto" ? textDuplicates.size > 0 : dateDuplicates.size > 0;

  const handleSubmit = () => {
    if (!question.trim()) { toast.error("Digite a pergunta da enquete"); return; }

    let options: { text: string; dateValue?: string; establishmentId?: number }[] = [];

    if (pollType === "texto") {
      const valid = textOptions.filter((o) => o.trim());
      if (valid.length < 2) { toast.error("Adicione pelo menos 2 opções"); return; }
      if (textDuplicates.size > 0) { toast.error("Remova opções duplicadas"); return; }
      options = valid.map((t) => ({ text: t.trim() }));
    } else if (pollType === "data") {
      const valid = dateOptions.filter((d) => d);
      if (valid.length < 2) { toast.error("Selecione pelo menos 2 datas"); return; }
      if (dateDuplicates.size > 0) { toast.error("Remova datas duplicadas"); return; }
      options = valid.map((d) => ({ text: formatDate(d), dateValue: d }));
    } else if (pollType === "estab") {
      if (selectedEstabs.length < 2) { toast.error("Selecione pelo menos 2 estabelecimentos"); return; }
      options = selectedEstabs.map((e) => ({ text: e.name, establishmentId: e.id }));
    } else if (pollType === "total") {
      // Each option is Estab + Date combined
      const validOptions = totalOptions.filter((o) => o.estabId && o.date);
      if (validOptions.length < 2) { toast.error("Preencha pelo menos 2 opções com estabelecimento e data"); return; }
      options = validOptions.map((o) => ({
        text: `${o.estabName} — ${formatDate(o.date)}`,
        dateValue: o.date,
        establishmentId: o.estabId,
      }));
      // Add custom location option if enabled
      if (hasCustomLocation && customTitle.trim() && customDate) {
        options.push({
          text: `${customTitle.trim()} — ${formatDate(customDate)}`,
          dateValue: customDate,
        });
      }
    }

    createMutation.mutate({
      groupId,
      question: question.trim(),
      description: description.trim() || undefined,
      pollType,
      multipleChoice,
      options,
      customAddress: hasCustomLocation ? customAddress.trim() || customTitle.trim() : undefined,
      customNumber: hasCustomLocation ? customNumber.trim() || undefined : undefined,
      customComplement: hasCustomLocation ? customComplement.trim() || undefined : undefined,
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const addEstab = (estab: { id: number; name: string }) => {
    if (selectedEstabs.find((e) => e.id === estab.id)) return;
    setSelectedEstabs([...selectedEstabs, estab]);
    if (activeSearchIdx !== null) {
      const u = [...estabSearches];
      u[activeSearchIdx] = estab.name;
      setEstabSearches(u);
    }
    setActiveSearchIdx(null);
  };

  const addTotalEstab = (estab: { id: number; name: string }, idx: number) => {
    const u = [...totalOptions];
    u[idx] = { ...u[idx], estabId: estab.id, estabName: estab.name };
    setTotalOptions(u);
    const s = [...totalSearches];
    s[idx] = estab.name;
    setTotalSearches(s);
    setActiveTotalSearchIdx(null);
  };

  const pollTypeTabs: { key: PollType; label: string }[] = [
    { key: "texto", label: "Texto" },
    { key: "data", label: "Data" },
    { key: "estab", label: "Estab" },
    { key: "total", label: "Total" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wider text-primary">NOVA ENQUETE</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poll type tabs */}
        <div className="flex gap-1 mb-4 bg-background rounded-lg p-1">
          {pollTypeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPollType(tab.key)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                pollType === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1 block">Pergunta *</label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Onde vamos neste sábado?"
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
            maxLength={255}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-1 block">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto adicional..."
            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none h-14"
            maxLength={500}
          />
        </div>

        {/* Type-specific content */}
        {pollType === "texto" && (
          <TextOptions
            options={textOptions}
            setOptions={setTextOptions}
            duplicates={textDuplicates}
          />
        )}

        {pollType === "data" && (
          <DateOptions
            dates={dateOptions}
            setDates={setDateOptions}
            duplicates={dateDuplicates}
          />
        )}

        {pollType === "estab" && (
          <div className="mb-2">
            <label className="text-xs text-muted-foreground mb-2 block">Estabelecimentos *</label>
            {/* Selected chips */}
            {selectedEstabs.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedEstabs.map((e) => (
                  <span key={e.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary">
                    {e.name}
                    <button onClick={() => setSelectedEstabs(selectedEstabs.filter((s) => s.id !== e.id))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Search fields - minimum 2 */}
            <div className="space-y-2">
              {estabSearches.map((s, idx) => (
                <div key={idx} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={s}
                    onChange={(e) => {
                      const u = [...estabSearches]; u[idx] = e.target.value; setEstabSearches(u);
                      setActiveSearchIdx(idx);
                    }}
                    onFocus={() => setActiveSearchIdx(idx)}
                    placeholder={`Buscar estabelecimento ${idx + 1}...`}
                    className="w-full bg-background border border-border/50 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  {/* Results dropdown */}
                  {activeSearchIdx === idx && s.length >= 2 && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto border border-border/30 rounded-lg bg-card shadow-lg">
                      {searchResults
                        .filter((r: any) => !selectedEstabs.find((sel) => sel.id === r.id))
                        .slice(0, 5)
                        .map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => addEstab({ id: r.id, name: r.name })}
                            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 border-b border-border/20 last:border-0"
                          >
                            {r.name}
                            {r.neighborhood && <span className="text-muted-foreground ml-1">• {r.neighborhood}</span>}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Add establishment button */}
            <button
              onClick={() => setEstabSearches([...estabSearches, ""])}
              className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar estabelecimento
            </button>
            {selectedEstabs.length < 2 && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">Selecione pelo menos 2 estabelecimentos</p>
            )}
          </div>
        )}

        {pollType === "total" && (
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground block">Opções (Estabelecimento + Data) *</label>
            {totalOptions.map((opt, idx) => (
              <div key={idx} className="p-3 bg-background rounded-lg border border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-medium">Opção {idx + 1}</span>
                  {totalOptions.length > 2 && (
                    <button
                      onClick={() => {
                        setTotalOptions(totalOptions.filter((_, i) => i !== idx));
                        setTotalSearches(totalSearches.filter((_, i) => i !== idx));
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Estab search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={totalSearches[idx]}
                    onChange={(e) => {
                      const u = [...totalSearches]; u[idx] = e.target.value; setTotalSearches(u);
                      setActiveTotalSearchIdx(idx);
                      // Clear selection if user edits
                      if (opt.estabId) {
                        const o = [...totalOptions]; o[idx] = { ...o[idx], estabId: undefined, estabName: "" }; setTotalOptions(o);
                      }
                    }}
                    onFocus={() => setActiveTotalSearchIdx(idx)}
                    placeholder="Buscar estabelecimento..."
                    className="w-full bg-card border border-border/50 rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  {activeTotalSearchIdx === idx && totalSearches[idx].length >= 2 && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto border border-border/30 rounded-lg bg-card shadow-lg">
                      {searchResults
                        .slice(0, 5)
                        .map((r: any) => (
                          <button
                            key={r.id}
                            onClick={() => addTotalEstab({ id: r.id, name: r.name }, idx)}
                            className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-primary/10 border-b border-border/20 last:border-0"
                          >
                            {r.name}
                            {r.neighborhood && <span className="text-muted-foreground ml-1">• {r.neighborhood}</span>}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-2 bg-card border border-border/50 rounded-lg px-3 py-2 text-sm text-left hover:border-primary/50 ${
                        opt.date ? "text-foreground" : "text-muted-foreground/50"
                      }`}
                    >
                      <CalendarIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      {opt.date ? format(new Date(opt.date + "T12:00:00"), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={opt.date ? new Date(opt.date + "T12:00:00") : undefined}
                      onSelect={(day: Date | undefined) => {
                        if (day) {
                          const u = [...totalOptions];
                          u[idx] = { ...u[idx], date: format(day, "yyyy-MM-dd") };
                          setTotalOptions(u);
                        }
                      }}
                      locale={ptBR}
                      disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            ))}
            {/* Add option button */}
            {totalOptions.length < 10 && (
              <button
                onClick={() => {
                  setTotalOptions([...totalOptions, { estabName: "", date: "" }]);
                  setTotalSearches([...totalSearches, ""]);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar opção
              </button>
            )}
            {/* Custom location (Local Extra) */}
            <div className="border-t border-border/30 pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCustomLocation}
                  onChange={(e) => setHasCustomLocation(e.target.checked)}
                  className="rounded border-border/50 text-primary focus:ring-primary/50"
                />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Local extra
                </span>
              </label>
              {hasCustomLocation && (
                <div className="mt-2 space-y-2 pl-5">
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Nome do local (ex: Casa do João)"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Endereço (ex: Rua Augusta, 1200)"
                    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      placeholder="Número"
                      className="w-24 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                    />
                    <input
                      type="text"
                      value={customComplement}
                      onChange={(e) => setCustomComplement(e.target.value)}
                      placeholder="Complemento (opcional)"
                      className="flex-1 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={`w-full flex items-center gap-2 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm text-left hover:border-primary/50 ${
                          customDate ? "text-foreground" : "text-muted-foreground/50"
                        }`}
                      >
                        <CalendarIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                        {customDate ? format(new Date(customDate + "T12:00:00"), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDate ? new Date(customDate + "T12:00:00") : undefined}
                        onSelect={(day: Date | undefined) => {
                          if (day) setCustomDate(format(day, "yyyy-MM-dd"));
                        }}
                        locale={ptBR}
                        disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multiple choice toggle */}
        <div className="my-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="multipleChoice"
            checked={multipleChoice}
            onChange={(e) => setMultipleChoice(e.target.checked)}
            className="rounded border-border/50 text-primary focus:ring-primary/50"
          />
          <label htmlFor="multipleChoice" className="text-xs text-muted-foreground cursor-pointer">
            Permitir múltipla escolha
          </label>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || hasDuplicates}
          className={`w-full ${hasDuplicates ? "bg-red-500/50 cursor-not-allowed" : "bg-primary hover:bg-primary/80"}`}
        >
          {createMutation.isPending ? "Criando..." : hasDuplicates ? "Remova duplicatas" : "Criar Enquete"}
        </Button>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function TextOptions({ options, setOptions, duplicates }: {
  options: string[];
  setOptions: (o: string[]) => void;
  duplicates: Set<number>;
}) {
  return (
    <div className="mb-2">
      <label className="text-xs text-muted-foreground mb-2 block">Opções de resposta</label>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isDupe = duplicates.has(idx);
          return (
            <div key={idx}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const u = [...options]; u[idx] = e.target.value; setOptions(u);
                  }}
                  placeholder={`Opção ${idx + 1}`}
                  className={`flex-1 bg-background border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none ${isDupe ? "border-red-500 text-red-400" : "border-border/50 focus:border-primary/50"}`}
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isDupe && <p className="text-[11px] text-red-500 mt-0.5 ml-1">Opção duplicada</p>}
            </div>
          );
        })}
      </div>
      {options.length < 10 && (
        <button onClick={() => setOptions([...options, ""])} className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80">
          <Plus className="w-3.5 h-3.5" /> Adicionar opção
        </button>
      )}
    </div>
  );
}

function DateOptions({ dates, setDates, duplicates }: {
  dates: string[];
  setDates: (d: string[]) => void;
  duplicates: Set<number>;
}) {
  return (
    <div className="mb-2">
      <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
        <CalendarIcon className="w-3.5 h-3.5" /> Datas *
      </label>
      <div className="space-y-2">
        {dates.map((d, idx) => {
          const isDupe = duplicates.has(idx);
          const dateValue = d ? new Date(d + "T12:00:00") : undefined;
          return (
            <div key={idx}>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`flex-1 flex items-center gap-2 bg-background border rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                        isDupe
                          ? "border-red-500 text-red-400"
                          : d
                            ? "border-border/50 text-foreground"
                            : "border-border/50 text-muted-foreground/50"
                      } hover:border-primary/50`}
                    >
                      <CalendarIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      {d ? format(dateValue!, "dd 'de' MMMM, yyyy", { locale: ptBR }) : `Selecionar data ${idx + 1}`}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateValue}
                      onSelect={(day: Date | undefined) => {
                        if (day) {
                          const u = [...dates];
                          u[idx] = format(day, "yyyy-MM-dd");
                          setDates(u);
                        }
                      }}
                      locale={ptBR}
                      disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {dates.length > 2 && (
                  <button onClick={() => setDates(dates.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isDupe && <p className="text-[11px] text-red-500 mt-0.5 ml-1">Data duplicada</p>}
            </div>
          );
        })}
      </div>
      {dates.length < 10 && (
        <button onClick={() => setDates([...dates, ""])} className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80">
          <Plus className="w-3.5 h-3.5" /> Adicionar data
        </button>
      )}
    </div>
  );
}
