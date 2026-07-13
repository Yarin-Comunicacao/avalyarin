import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Plus, Trash2, Pencil, Save, X, Loader2, GitBranch, Power, PowerOff,
} from "lucide-react";

interface SkipRule {
  id: number;
  phase: string;
  triggerQuestionId: string;
  triggerValue: string;
  skipQuestionIds: string[];
  description: string | null;
  active: boolean;
}

interface Props {
  phase: "onboarding" | "explorer" | "connoisseur";
  questions: Array<{ id: number; questionId: string; title: string; options?: any }>;
}

export default function SkipRulesManager({ phase, questions }: Props) {
  const [editing, setEditing] = useState<Partial<SkipRule> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: rules, isLoading, refetch } = trpc.surveyManagement.skipRules.list.useQuery({ phase });

  const createMutation = trpc.surveyManagement.skipRules.create.useMutation({
    onSuccess: () => { toast.success("Regra criada!"); refetch(); setEditing(null); setIsCreating(false); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.surveyManagement.skipRules.update.useMutation({
    onSuccess: () => { toast.success("Regra atualizada!"); refetch(); setEditing(null); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.surveyManagement.skipRules.delete.useMutation({
    onSuccess: () => { toast.success("Regra removida!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const startCreate = () => {
    setIsCreating(true);
    setEditing({
      phase,
      triggerQuestionId: "",
      triggerValue: "",
      skipQuestionIds: [],
      description: "",
      active: true,
    });
  };

  const handleSave = () => {
    if (!editing) return;
    if (!editing.triggerQuestionId || !editing.triggerValue || !editing.skipQuestionIds?.length) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (isCreating) {
      createMutation.mutate({
        phase,
        triggerQuestionId: editing.triggerQuestionId!,
        triggerValue: editing.triggerValue!,
        skipQuestionIds: editing.skipQuestionIds!,
        description: editing.description || undefined,
        active: editing.active ?? true,
      });
    } else if (editing.id) {
      updateMutation.mutate({
        id: editing.id,
        triggerQuestionId: editing.triggerQuestionId,
        triggerValue: editing.triggerValue,
        skipQuestionIds: editing.skipQuestionIds,
        description: editing.description || undefined,
        active: editing.active,
      });
    }
  };

  const toggleActive = (rule: SkipRule) => {
    updateMutation.mutate({ id: rule.id, active: !rule.active });
  };

  // Get options for a specific question
  const getOptionsForQuestion = (questionId: string) => {
    const q = questions.find(q => q.questionId === questionId);
    if (!q || !q.options) return [];
    try {
      const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      return Array.isArray(opts) ? opts : [];
    } catch { return []; }
  };

  // Toggle a questionId in the skipQuestionIds array
  const toggleSkipQuestion = (qId: string) => {
    if (!editing) return;
    const current = editing.skipQuestionIds || [];
    if (current.includes(qId)) {
      setEditing({ ...editing, skipQuestionIds: current.filter(id => id !== qId) });
    } else {
      setEditing({ ...editing, skipQuestionIds: [...current, qId] });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4">Carregando regras...</div>;
  }

  return (
    <div className="mt-6 border-t border-border/50 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-yellow-500 shrink-0" />
          <h3 className="font-display text-base sm:text-lg tracking-wider text-yellow-500">REGRAS DE ENCERRAMENTO</h3>
        </div>
        {!editing && (
          <Button size="sm" onClick={startCreate} className="bg-yellow-500 hover:bg-yellow-600 text-black w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" />
            Nova Regra
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Defina quais perguntas devem ser puladas quando o usuário der uma resposta específica.
        Ex: Se responder "Sim, sou dono" na pergunta "role", pular perguntas de consumidor.
      </p>

      {/* Editor */}
      {editing && (
        <div className="bg-card border border-yellow-500/30 rounded-xl p-4 mb-4 space-y-4">
          <h4 className="font-medium text-foreground text-sm">
            {isCreating ? "Nova Regra de Encerramento" : "Editar Regra"}
          </h4>

          {/* Trigger Question */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Quando a pergunta...</label>
            <select
              value={editing.triggerQuestionId || ""}
              onChange={(e) => setEditing({ ...editing, triggerQuestionId: e.target.value, triggerValue: "" })}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="">Selecione uma pergunta</option>
              {questions.map(q => (
                <option key={q.questionId} value={q.questionId}>{q.title} ({q.questionId})</option>
              ))}
            </select>
          </div>

          {/* Trigger Value */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">...tiver a resposta:</label>
            {editing.triggerQuestionId && getOptionsForQuestion(editing.triggerQuestionId).length > 0 ? (
              <select
                value={editing.triggerValue || ""}
                onChange={(e) => setEditing({ ...editing, triggerValue: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Selecione o valor</option>
                {getOptionsForQuestion(editing.triggerQuestionId).map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editing.triggerValue || ""}
                onChange={(e) => setEditing({ ...editing, triggerValue: e.target.value })}
                placeholder="Digite o valor da resposta (ex: yes, no)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            )}
          </div>

          {/* Skip Questions */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">...então PULAR as perguntas:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {questions
                .filter(q => q.questionId !== editing.triggerQuestionId)
                .map(q => (
                  <label
                    key={q.questionId}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs ${
                      editing.skipQuestionIds?.includes(q.questionId)
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={editing.skipQuestionIds?.includes(q.questionId) || false}
                      onChange={() => toggleSkipQuestion(q.questionId)}
                      className="accent-yellow-500"
                    />
                    <span className="text-foreground">{q.title}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Ex: Donos de estabelecimento pulam perguntas de consumidor"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setEditing(null); setIsCreating(false); }}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {!editing && rules && rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule: any) => {
            const triggerQ = questions.find(q => q.questionId === rule.triggerQuestionId);
            const triggerOpts = getOptionsForQuestion(rule.triggerQuestionId);
            const triggerLabel = triggerOpts.find((o: any) => o.value === rule.triggerValue)?.label || rule.triggerValue;
            const skipIds: string[] = typeof rule.skipQuestionIds === "string"
              ? JSON.parse(rule.skipQuestionIds)
              : rule.skipQuestionIds || [];

            return (
              <div
                key={rule.id}
                className={`bg-card border rounded-xl p-4 transition-all ${
                  rule.active ? "border-border/50" : "border-red-500/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="w-4 h-4 text-yellow-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">
                        Se "{triggerQ?.title || rule.triggerQuestionId}" = "{triggerLabel}"
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6 mb-2">
                      → Pular: {skipIds.map(id => {
                        const q = questions.find(q => q.questionId === id);
                        return q?.title || id;
                      }).join(", ")}
                    </p>
                    {rule.description && (
                      <p className="text-xs text-muted-foreground/70 ml-6 italic">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(rule)}
                      className={rule.active ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"}
                    >
                      {rule.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditing(rule); setIsCreating(false); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { if (confirm("Remover esta regra?")) deleteMutation.mutate({ id: rule.id }); }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!editing && (!rules || rules.length === 0) && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Nenhuma regra de encerramento configurada para esta fase.
        </div>
      )}
    </div>
  );
}
