// OwnerSurvey — Gerenciar perguntas das pesquisas (com drag-and-drop e perguntas condicionais)
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Crown, ClipboardList, Plus, Pencil, Trash2, GripVertical,
  ChevronDown, ChevronUp, Eye, EyeOff, Save, X, Loader2, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  parentQuestionId?: number | null;
  triggerOption?: string | null;
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
    const mainQuestions = questions.filter(q => !q.parentQuestionId);
    const idx = mainQuestions.findIndex(q => q.id === questionId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === mainQuestions.length - 1) return;

    const newOrder = [...mainQuestions.map(q => q.id)];
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
        parentQuestionId: data.parentQuestionId ?? null,
        triggerOption: data.triggerOption ?? null,
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
        parentQuestionId: data.parentQuestionId ?? null,
        triggerOption: data.triggerOption ?? null,
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
      parentQuestionId: null,
      triggerOption: null,
    });
  };

  const startCreateChild = (parentId: number, triggerOpt: string) => {
    setIsCreating(true);
    setEditingQuestion({
      phase: activePhase,
      questionId: "",
      title: "",
      subtitle: "",
      type: "single",
      icon: "",
      sortOrder: 0,
      active: true,
      options: [],
      lowScoreReasons: [],
      parentQuestionId: parentId,
      triggerOption: triggerOpt,
    });
  };

  // Separate main questions from child questions
  const mainQuestions = questions?.filter(q => !q.parentQuestionId) || [];
  const childQuestions = questions?.filter(q => !!q.parentQuestionId) || [];

  const getChildrenOf = (parentId: number) =>
    childQuestions.filter(q => q.parentQuestionId === parentId);

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
              {isLoading ? "Carregando..." : `${mainQuestions.length} perguntas principais, ${childQuestions.length} condicionais`}
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
            allQuestions={mainQuestions}
            onSave={handleSave}
            onCancel={() => { setEditingQuestion(null); setIsCreating(false); }}
            isSaving={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Questions List */}
        {!editingQuestion && !isLoading && mainQuestions.length > 0 && (
          <div className="space-y-3">
            {mainQuestions.map((q, idx) => {
              const children = getChildrenOf(q.id);
              return (
                <div key={q.id}>
                  <div
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
                          disabled={idx === mainQuestions.length - 1 || reorderMutation.isPending}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-medium">
                            {TYPE_LABELS[q.type as QuestionType] || q.type}
                          </span>
                          {!q.active && (
                            <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">
                              Inativa
                            </span>
                          )}
                          {children.length > 0 && (
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {children.length} condicional(is)
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
                              {opts.slice(0, 5).map((opt: Option) => (
                                <span key={opt.value} className="text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                  {opt.label}
                                </span>
                              ))}
                              {opts.length > 5 && (
                                <span className="text-xs text-muted-foreground/60">
                                  +{opts.length - 5} mais
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingQuestion({
                            id: q.id,
                            phase: q.phase as Phase,
                            questionId: q.questionId,
                            title: q.title,
                            subtitle: (q.subtitle as string) || "",
                            type: q.type as QuestionType,
                            icon: q.icon || "",
                            maxSelect: q.maxSelect || undefined,
                            lowScoreThreshold: q.lowScoreThreshold || undefined,
                            options: (q.options as Option[]) || [],
                            lowScoreReasons: (q.lowScoreReasons as Option[]) || [],
                            parentQuestionId: q.parentQuestionId || null,
                            triggerOption: q.triggerOption || null,
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

                    {/* Add conditional question button */}
                    {(q.type === "single" || q.type === "multi") && (q.options as Option[])?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <details className="group">
                          <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            Perguntas Condicionais ({children.length})
                          </summary>
                          <div className="mt-2 ml-4 space-y-2">
                            {/* Show existing children */}
                            {children.map(child => (
                              <div key={child.id} className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
                                <GitBranch className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-blue-400">
                                    Se responder: <strong>"{child.triggerOption}"</strong>
                                  </p>
                                  <p className="text-sm text-foreground truncate">{child.title}</p>
                                </div>
                                <button
                                  onClick={() => setEditingQuestion({
                                    id: child.id,
                                    phase: child.phase as Phase,
                                    questionId: child.questionId,
                                    title: child.title,
                                    subtitle: (child.subtitle as string) || "",
                                    type: child.type as QuestionType,
                                    icon: child.icon || "",
                                    maxSelect: child.maxSelect || undefined,
                                    lowScoreThreshold: child.lowScoreThreshold || undefined,
                                    options: (child.options as Option[]) || [],
                                    lowScoreReasons: (child.lowScoreReasons as Option[]) || [],
                                    parentQuestionId: child.parentQuestionId || null,
                                    triggerOption: child.triggerOption || null,
                                    sortOrder: child.sortOrder,
                                    active: child.active,
                                  })}
                                  className="p-1 text-muted-foreground hover:text-yellow-500"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Excluir sub-pergunta "${child.title}"?`)) {
                                      deleteMutation.mutate({ id: child.id });
                                    }
                                  }}
                                  className="p-1 text-muted-foreground hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {/* Add child for each option */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {((q.options as Option[]) || []).map(opt => {
                                const hasChild = children.some(c => c.triggerOption === opt.value);
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => !hasChild && startCreateChild(q.id, opt.value)}
                                    disabled={hasChild}
                                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                                      hasChild
                                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400 cursor-default"
                                        : "border-border/50 text-muted-foreground hover:border-blue-500/50 hover:text-blue-400 cursor-pointer"
                                    }`}
                                  >
                                    <Plus className="w-3 h-3 inline mr-0.5" />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
// SORTABLE OPTION ITEM (for drag-and-drop)
// ============================================================

function SortableOptionItem({
  id,
  option,
  index,
  onRemove,
}: {
  id: string;
  option: Option;
  index: number;
  onRemove: (idx: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground/50 w-5">{index + 1}.</span>
      <span className="text-sm text-foreground flex-1">{option.label}</span>
      <span className="text-xs text-muted-foreground">{option.value}</span>
      <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-300">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ============================================================
// QUESTION EDITOR COMPONENT (with drag-and-drop options + conditional fields)
// ============================================================

function QuestionEditor({
  data,
  allQuestions,
  onSave,
  onCancel,
  isSaving,
}: {
  data: QuestionData;
  allQuestions: any[];
  onSave: (data: QuestionData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<QuestionData>(data);
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newReasonLabel, setNewReasonLabel] = useState("");
  const [newReasonValue, setNewReasonValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateField = <K extends keyof QuestionData>(key: K, value: QuestionData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addOption = () => {
    if (!newOptionLabel.trim()) return;
    const value = newOptionValue.trim() || newOptionLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    updateField("options", [...(form.options || []), { label: newOptionLabel.trim(), value }]);
    setNewOptionLabel("");
    setNewOptionValue("");
  };

  const removeOption = (idx: number) => {
    updateField("options", (form.options || []).filter((_, i) => i !== idx));
  };

  const handleOptionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const options = form.options || [];
    const oldIndex = options.findIndex((_, i) => `opt-${i}` === active.id);
    const newIndex = options.findIndex((_, i) => `opt-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      updateField("options", arrayMove(options, oldIndex, newIndex));
    }
  }, [form.options]);

  const addReason = () => {
    if (!newReasonLabel.trim()) return;
    const value = newReasonValue.trim() || newReasonLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    updateField("lowScoreReasons", [...(form.lowScoreReasons || []), { label: newReasonLabel.trim(), value }]);
    setNewReasonLabel("");
    setNewReasonValue("");
  };

  const removeReason = (idx: number) => {
    updateField("lowScoreReasons", (form.lowScoreReasons || []).filter((_, i) => i !== idx));
  };

  const handleReasonDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reasons = form.lowScoreReasons || [];
    const oldIndex = reasons.findIndex((_, i) => `reason-${i}` === active.id);
    const newIndex = reasons.findIndex((_, i) => `reason-${i}` === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      updateField("lowScoreReasons", arrayMove(reasons, oldIndex, newIndex));
    }
  }, [form.lowScoreReasons]);

  // Get parent question options for conditional UI
  const parentQuestion = form.parentQuestionId
    ? allQuestions.find(q => q.id === form.parentQuestionId)
    : null;

  return (
    <div className="bg-card border border-yellow-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-yellow-500">
          {data.id ? "EDITAR PERGUNTA" : "NOVA PERGUNTA"}
          {form.parentQuestionId && (
            <span className="text-xs text-blue-400 ml-2 font-normal">
              (Condicional — ativada por "{form.triggerOption}")
            </span>
          )}
        </h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Conditional info banner */}
        {form.parentQuestionId && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <GitBranch className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-400 font-medium">Pergunta Condicional</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Esta pergunta aparece apenas quando o usuário responde <strong>"{form.triggerOption}"</strong> na pergunta pai.
              </p>
            </div>
          </div>
        )}

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

        {/* Conditional Question Config */}
        <div className="border-t border-border/30 pt-4">
          <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            Pergunta Condicional (opcional)
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            Se quiser que esta pergunta apareça apenas quando o usuário responder uma opção específica de outra pergunta, selecione abaixo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pergunta Pai</label>
              <select
                value={form.parentQuestionId ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  updateField("parentQuestionId", val);
                  // Reset trigger when parent changes
                  if (!val) updateField("triggerOption", null);
                }}
                className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Nenhuma (pergunta independente)</option>
                {allQuestions
                  .filter(q => q.id !== form.id) // can't be parent of itself
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.questionId})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ativada quando responder</label>
              <select
                value={form.triggerOption ?? ""}
                onChange={(e) => updateField("triggerOption", e.target.value || null)}
                disabled={!form.parentQuestionId}
                className="w-full bg-secondary border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground disabled:opacity-50"
              >
                <option value="">Selecione a opção...</option>
                {(() => {
                  const parent = allQuestions.find(q => q.id === form.parentQuestionId);
                  const parentOpts = parent?.options as Option[] | null;
                  if (!parentOpts || !Array.isArray(parentOpts)) return null;
                  return parentOpts.map((opt: Option) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>
          {form.parentQuestionId && form.triggerOption && (
            <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-400">
                Esta pergunta aparecerá apenas quando o usuário responder <strong>"{(() => {
                  const parent = allQuestions.find(q => q.id === form.parentQuestionId);
                  const parentOpts = parent?.options as Option[] | null;
                  const opt = parentOpts?.find(o => o.value === form.triggerOption);
                  return opt?.label || form.triggerOption;
                })()}"</strong> na pergunta <strong>"{allQuestions.find(q => q.id === form.parentQuestionId)?.title || ''}"</strong>
              </p>
            </div>
          )}
        </div>

        {/* Options (for single/multi) with DRAG AND DROP */}
        {(form.type === "single" || form.type === "multi") && (
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-medium text-foreground mb-1">Opções de Resposta</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Arraste as opções para reordenar. A ordem aqui é a ordem exibida ao usuário.
            </p>
            {form.options && form.options.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOptionDragEnd}
              >
                <SortableContext
                  items={form.options.map((_, i) => `opt-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5 mb-3">
                    {form.options.map((opt, idx) => (
                      <SortableOptionItem
                        key={`opt-${idx}`}
                        id={`opt-${idx}`}
                        option={opt}
                        index={idx}
                        onRemove={removeOption}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="Label (ex: Zona Norte)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <input
                type="text"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addOption()}
                placeholder="Value (auto se vazio)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Low Score Reasons (for score type) with DRAG AND DROP */}
        {form.type === "score" && (
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-medium text-foreground mb-1">Motivos para Nota Baixa</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Arraste para reordenar os motivos.
            </p>
            {form.lowScoreReasons && form.lowScoreReasons.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReasonDragEnd}
              >
                <SortableContext
                  items={form.lowScoreReasons.map((_, i) => `reason-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5 mb-3">
                    {form.lowScoreReasons.map((reason, idx) => (
                      <SortableOptionItem
                        key={`reason-${idx}`}
                        id={`reason-${idx}`}
                        option={reason}
                        index={idx}
                        onRemove={removeReason}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newReasonLabel}
                onChange={(e) => setNewReasonLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReason()}
                placeholder="Motivo (ex: Preço abusivo)"
                className="flex-1 bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground"
              />
              <input
                type="text"
                value={newReasonValue}
                onChange={(e) => setNewReasonValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addReason()}
                placeholder="Value (auto se vazio)"
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
