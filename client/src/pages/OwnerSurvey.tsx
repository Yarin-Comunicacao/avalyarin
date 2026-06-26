// Owner Survey Management — Gerenciar perguntas dos surveys
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import {
  Crown, ClipboardList, Plus, Pencil, Trash2, GripVertical,
  ChevronDown, ChevronUp, Eye, EyeOff, Save, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Phase = "onboarding" | "explorer" | "connoisseur";
type QuestionType = "single" | "multi" | "score" | "text" | "birthdate";

interface Option {
  label: string;
  value: string;
}

interface QuestionData {
  id?: number;
  phase: Phase;
  questionId: string;
  title: string;
  subtitle: string;
  type: QuestionType;
  icon: string;
  maxSelect?: number;
  lowScoreThreshold?: number;
  options?: Option[];
  lowScoreReasons?: Option[];
  sortOrder: number;
  active: boolean;
}

const PHASE_LABELS: Record<Phase, string> = {
  onboarding: "Onboarding (Fase 1)",
  explorer: "Explorer (Fase 2 — após 5 avaliações)",
  connoisseur: "Connoisseur (Fase 3 — após 10 avaliações)",
};

const TYPE_LABELS: Record<QuestionType, string> = {
  single: "Seleção Única",
  multi: "Múltipla Escolha",
  score: "Nota (1-10)",
  text: "Texto Livre",
  birthdate: "Data de Nascimento",
};

export default function OwnerSurvey() {
  const { user, loading: authLoading } = useAuth();
  const [activePhase, setActivePhase] = useState<Phase>("onboarding");
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: questions, isLoading, refetch } = trpc.surveyManagement.list.useQuery(
    { phase: activePhase }
  );

  const seedMutation = trpc.surveyManagement.seed.useMutation({
    onSuccess: (data) => {
      if (data.seeded) {
        toast.success(`${data.count} perguntas criadas com sucesso!`);
        refetch();
      } else {
        toast.info(data.message);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const createMutation = trpc.surveyManagement.create.useMutation({
    onSuccess: () => {
      toast.success("Pergunta criada!");
      refetch();
      setIsCreating(false);
      setEditingQuestion(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.surveyManagement.update.useMutation({
    onSuccess: () => {
      toast.success("Pergunta atualizada!");
      refetch();
      setEditingQuestion(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.surveyManagement.delete.useMutation({
    onSuccess: () => {
      toast.success("Pergunta removida!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const reorderMutation = trpc.surveyManagement.reorder.useMutation({
    onSuccess: () => {
      toast.success("Ordem atualizada!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <p className="text-muted-foreground">Apenas o Owner pode acessar esta página.</p>
          <Link href="/">
            <span className="text-primary hover:underline mt-4 inline-block">Voltar ao início</span>
          </Link>
        </div>
      </div>
    );
  }

  const moveQuestion = (questionId: number, direction: "up" | "down") => {
    if (!questions) return;
    const idx = questions.findIndex(q => q.id === questionId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === questions.length - 1) return;

    const newOrder = [...questions.map(q => q.id)];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
    reorderMutation.mutate({ orderedIds: newOrder });
  };

  const handleSave = (data: QuestionData) => {
    if (isCreating) {
      createMutation.mutate({
        phase: data.phase,
        questionId: data.questionId,
        title: data.title,
        subtitle: data.subtitle || undefined,
        type: data.type,
        icon: data.icon || undefined,
        maxSelect: data.maxSelect || undefined,
        lowScoreThreshold: data.lowScoreThreshold || undefined,
        options: data.options && data.options.length > 0 ? data.options : undefined,
        lowScoreReasons: data.lowScoreReasons && data.lowScoreReasons.length > 0 ? data.lowScoreReasons : undefined,
        sortOrder: data.sortOrder,
        active: data.active,
      });
    } else if (data.id) {
      updateMutation.mutate({
        id: data.id,
        phase: data.phase,
        questionId: data.questionId,
        title: data.title,
        subtitle: data.subtitle || undefined,
        type: data.type,
        icon: data.icon || undefined,
        maxSelect: data.maxSelect || undefined,
        lowScoreThreshold: data.lowScoreThreshold || undefined,
        options: data.options && data.options.length > 0 ? data.options : undefined,
        lowScoreReasons: data.lowScoreReasons && data.lowScoreReasons.length > 0 ? data.lowScoreReasons : undefined,
        sortOrder: data.sortOrder,
        active: data.active,
      });
    }
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingQuestion({
      phase: activePhase,
      questionId: "",
      title: "",
      subtitle: "",
      type: "single",
      icon: "",
      sortOrder: (questions?.length || 0),
      active: true,
      options: [],
      lowScoreReasons: [],
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-900/20 to-background border-b border-yellow-500/20 px-4 pt-6 pb-4">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="font-display text-2xl tracking-wider text-yellow-500">SURVEY</h1>
              <p className="text-xs text-muted-foreground">Gerenciar perguntas das pesquisas de preferência</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container flex overflow-x-auto scrollbar-hide">
          {(Object.keys(PHASE_LABELS) as Phase[]).map((phase) => (
            <button
              key={phase}
              onClick={() => { setActivePhase(phase); setEditingQuestion(null); setIsCreating(false); }}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activePhase === phase
                  ? "border-yellow-500 text-yellow-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container py-6 px-4">
        {/* Seed Button (if no questions) */}
        {!isLoading && questions && questions.length === 0 && !editingQuestion && (
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center mb-6">
            <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma pergunta cadastrada ainda.</p>
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Carregar Perguntas Padrão (Todas as Fases)
            </Button>
          </div>
        )}

        {/* Actions Bar */}
        {!editingQuestion && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${questions?.length || 0} perguntas`}
            </p>
            <Button
              size="sm"
              onClick={startCreate}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="w-4 h-4 mr-1" />
              Nova Pergunta
            </Button>
          </div>
        )}

        {/* Question Editor */}
        {editingQuestion && (
          <QuestionEditor
            data={editingQuestion}
            onSave={handleSave}
            onCancel={() => { setEditingQuestion(null); setIsCreating(false); }}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Questions List */}
        {!editingQuestion && !isLoading && questions && questions.length > 0 && (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`bg-card border rounded-xl p-4 transition-all ${
                  q.active ? "border-border/50" : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => moveQuestion(q.id, "up")}
                      disabled={idx === 0 || reorderMutation.isPending}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                    <button
                      onClick={() => moveQuestion(q.id, "down")}
                      disabled={idx === questions.length - 1 || reorderMutation.isPending}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-medium">
                        {TYPE_LABELS[q.type as QuestionType] || q.type}
                      </span>
                      {!q.active && (
                        <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                          Inativa
                        </span>
                      )}
                      {q.icon && (
                        <span className="text-xs text-muted-foreground">
                          📎 {q.icon}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display text-base tracking-wider text-foreground truncate">
                      {q.title}
                    </h4>
                    {q.subtitle && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {q.subtitle as string}
                      </p>
                    )}
                    {/* Options preview */}
                    {(() => {
                      const opts = q.options as Option[] | null;
                      if (!opts || !Array.isArray(opts) || opts.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {opts.slice(0, 4).map((opt: Option) => (
                            <span key={opt.value} className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                              {opt.label}
                            </span>
                          ))}
                          {opts.length > 4 && (
                            <span className="text-xs text-muted-foreground/60">
                              +{opts.length - 4} mais
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {q.maxSelect && (
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Máx. seleção: {q.maxSelect}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingQuestion({
                        id: q.id,
                        phase: q.phase as Phase,
                        questionId: q.questionId,
                        title: q.title,
                        subtitle: q.subtitle || "",
                        type: q.type as QuestionType,
                        icon: q.icon || "",
                        maxSelect: q.maxSelect || undefined,
                        lowScoreThreshold: q.lowScoreThreshold || undefined,
                        options: (q.options as Option[]) || [],
                        lowScoreReasons: (q.lowScoreReasons as Option[]) || [],
                        sortOrder: q.sortOrder,
                        active: q.active,
                      })}
                      className="p-2 rounded-lg hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir "${q.title}"?`)) {
                          deleteMutation.mutate({ id: q.id });
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// QUESTION EDITOR COMPONENT
// ============================================================

function QuestionEditor({
  data,
  onSave,
  onCancel,
  isSaving,
}: {
  data: QuestionData;
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<QuestionData>(data);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newReasonLabel, setNewReasonLabel] = useState("");
  const [newReasonValue, setNewReasonValue] = useState("");

  const updateField = <K extends keyof QuestionData>(key: K, value: QuestionData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addOption = () => {
    if (!newOptionLabel.trim() || !newOptionValue.trim()) return;
    updateField("options", [...(form.options || []), { label: newOptionLabel.trim(), value: newOptionValue.trim() }]);
    setNewOptionLabel("");
    setNewOptionValue("");
  };

  const removeOption = (idx: number) => {
    updateField("options", (form.options || []).filter((_, i) => i !== idx));
  };

  const addReason = () => {
    if (!newReasonLabel.trim() || !newReasonValue.trim()) return;
    updateField("lowScoreReasons", [...(form.lowScoreReasons || []), { label: newReasonLabel.trim(), value: newReasonValue.trim() }]);
    setNewReasonLabel("");
    setNewReasonValue("");
  };

  const removeReason = (idx: number) => {
    updateField("lowScoreReasons", (form.lowScoreReasons || []).filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-card border border-yellow-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-yellow-500">
          {data.id ? "EDITAR PERGUNTA" : "NOVA PERGUNTA"}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ID da Pergunta</label>
            <input
              type="text"
              value={form.questionId}
              onChange={(e) => updateField("questionId", e.target.value)}
              placeholder="ex: region, frequency"
              className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ícone (Lucide)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => updateField("icon", e.target.value)}
              placeholder="ex: MapPin, Clock, Heart"
              className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Título</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="TÍTULO DA PERGUNTA"
            className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Subtítulo / Descrição</label>
          <textarea
            value={form.subtitle}
            onChange={(e) => updateField("subtitle", e.target.value)}
            placeholder="Texto explicativo da pergunta..."
            rows={2}
            className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => updateField("type", e.target.value as QuestionType)}
              className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Máx. Seleção (multi)</label>
            <input
              type="number"
              value={form.maxSelect || ""}
              onChange={(e) => updateField("maxSelect", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ex: 3"
              min={1}
              max={20}
              className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Threshold Nota Baixa</label>
            <input
              type="number"
              value={form.lowScoreThreshold || ""}
              onChange={(e) => updateField("lowScoreThreshold", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="ex: 6"
              min={1}
              max={10}
              className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => updateField("active", !form.active)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              form.active
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {form.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {form.active ? "Ativa" : "Inativa"}
          </button>
        </div>

        {/* Options (for single/multi) */}
        {(form.type === "single" || form.type === "multi") && (
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Opções de Resposta</h4>
            {form.options && form.options.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-foreground flex-1">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.value}</span>
                    <button onClick={() => removeOption(idx)} className="text-red-400 hover:text-red-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                placeholder="Label (ex: Zona Norte)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                placeholder="Value (ex: zona-norte)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Low Score Reasons (for score type) */}
        {form.type === "score" && (
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Motivos para Nota Baixa</h4>
            {form.lowScoreReasons && form.lowScoreReasons.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {form.lowScoreReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-foreground flex-1">{reason.label}</span>
                    <span className="text-xs text-muted-foreground">{reason.value}</span>
                    <button onClick={() => removeReason(idx)} className="text-red-400 hover:text-red-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newReasonLabel}
                onChange={(e) => setNewReasonLabel(e.target.value)}
                placeholder="Motivo (ex: Preço abusivo)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <input
                type="text"
                value={newReasonValue}
                onChange={(e) => setNewReasonValue(e.target.value)}
                placeholder="Value (ex: preco-abusivo)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <Button size="sm" variant="outline" onClick={addReason}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Save / Cancel */}
        <div className="flex items-center gap-3 pt-4 border-t border-border/30">
          <Button
            onClick={() => onSave(form)}
            disabled={isSaving || !form.questionId || !form.title}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
