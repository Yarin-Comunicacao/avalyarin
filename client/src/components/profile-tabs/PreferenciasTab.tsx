import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, User, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

// Helper to parse options from DB (same as OnboardingSurvey)
function parseOptions(raw: any): { label: string; value: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((o: any) => {
      if (typeof o === "string") return { label: o, value: o };
      return { label: o.label || o.value || "", value: o.value || o.label || "" };
    });
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseOptions(parsed);
    } catch {
      return raw.split(",").map((s: string) => ({ label: s.trim(), value: s.trim() }));
    }
  }
  return [];
}

// Map questionId from DB to the key used in surveyData JSON
const QUESTION_TO_FIELD: Record<string, string> = {
  frequency: "frequency",
  spend: "avgSpend",
  categories: "categories",
  priorities: "priorities",
  discovery: "discovery",
};

// Display labels for field names
const FIELD_LABELS: Record<string, string> = {
  frequency: "Frequência",
  avgSpend: "Gasto Médio",
  categories: "Categorias Favoritas",
  priorities: "Prioridades",
  discovery: "Como Descobre",
};

export default function PreferenciasTab() {
  const { data: surveyData, isLoading, error } = trpc.survey.get.useQuery();
  const { data: dbQuestions, isLoading: questionsLoading } = trpc.survey.questions.useQuery({ phase: "onboarding" });
  const utils = trpc.useUtils();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[]>("");

  const saveSurveyMutation = trpc.survey.save.useMutation({
    onSuccess: () => {
      toast.success("Preferência atualizada!");
      setEditingField(null);
      utils.survey.get.invalidate();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  // Build question options map from DB
  const questionOptionsMap = useMemo(() => {
    if (!dbQuestions) return {};
    const map: Record<string, { type: "single" | "multi"; maxSelect?: number; options: { label: string; value: string }[] }> = {};
    for (const q of dbQuestions) {
      const fieldKey = QUESTION_TO_FIELD[q.questionId];
      if (fieldKey) {
        map[fieldKey] = {
          type: q.type as "single" | "multi",
          maxSelect: q.maxSelect || undefined,
          options: parseOptions(q.options),
        };
      }
    }
    return map;
  }, [dbQuestions]);

  if (isLoading || questionsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Erro ao carregar suas preferências</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Tente novamente mais tarde</p>
      </div>
    );
  }

  if (!surveyData || !surveyData.surveyData) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma preferência registrada</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Complete a pesquisa inicial para ver suas preferências aqui</p>
        <div className="pt-4">
          <button
            onClick={() => {
              localStorage.removeItem("avalyarin_survey_completed");
              localStorage.removeItem("avalyarin_survey_answers");
              toast.info("Redirecionando para a pesquisa...");
              window.location.href = "/";
            }}
            className="w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            Fazer Pesquisa
          </button>
        </div>
      </div>
    );
  }

  const data = surveyData.surveyData as Record<string, any>;

  // Fields to display (Região removed - now in EditarTab > Dados Pessoais)
  const preferenceFields = [
    { key: "frequency", value: data.frequency },
    { key: "avgSpend", value: data.avgSpend },
    { key: "categories", value: data.categories },
    { key: "priorities", value: data.priorities },
    { key: "discovery", value: data.discovery },
  ];

  const getDisplayValue = (key: string, value: any): string => {
    if (!value) return "Não informado";
    const qInfo = questionOptionsMap[key];
    if (Array.isArray(value)) {
      if (qInfo?.options) {
        return value.map(v => qInfo.options.find(o => o.value === v)?.label || v).join(", ");
      }
      return value.join(", ");
    }
    if (qInfo?.options) {
      return qInfo.options.find(o => o.value === value)?.label || value;
    }
    return value;
  };

  const startEditing = (key: string) => {
    const currentValue = data[key];
    setEditValue(currentValue || (questionOptionsMap[key]?.type === "multi" ? [] : ""));
    setEditingField(key);
  };

  const handleSingleSelect = (value: string) => {
    setEditValue(value);
  };

  const handleMultiToggle = (value: string) => {
    const current = Array.isArray(editValue) ? editValue : [];
    const qInfo = questionOptionsMap[editingField!];
    if (current.includes(value)) {
      setEditValue(current.filter(v => v !== value));
    } else {
      if (qInfo?.maxSelect && current.length >= qInfo.maxSelect) {
        toast.error(`Máximo de ${qInfo.maxSelect} opções`);
        return;
      }
      setEditValue([...current, value]);
    }
  };

  const handleSave = () => {
    if (!editingField) return;
    // Merge with existing data to avoid losing other fields
    const mergedData: Record<string, any> = { ...data };
    mergedData[editingField] = editValue;
    // Map back to the format expected by survey.save
    saveSurveyMutation.mutate({
      region: mergedData.region,
      frequency: mergedData.frequency,
      avgSpend: mergedData.avgSpend,
      categories: mergedData.categories,
      priorities: mergedData.priorities,
      discovery: mergedData.discovery,
    });
  };

  const hasChanges = () => {
    if (!editingField) return false;
    const currentValue = data[editingField];
    if (Array.isArray(editValue) && Array.isArray(currentValue)) {
      return JSON.stringify([...editValue].sort()) !== JSON.stringify([...currentValue].sort());
    }
    return editValue !== currentValue;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-4">
        Suas preferências gastronômicas — toque em <Pencil className="w-3 h-3 inline" /> para editar
      </p>

      {preferenceFields.map(({ key, value }) => {
        const isEditing = editingField === key;
        const qInfo = questionOptionsMap[key];
        const label = FIELD_LABELS[key] || key;

        return (
          <div key={key} className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              {!isEditing && (
                <button
                  onClick={() => startEditing(key)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              )}
              {isEditing && (
                <button
                  onClick={() => setEditingField(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              )}
            </div>

            {!isEditing ? (
              <p className="text-sm text-foreground">{getDisplayValue(key, value)}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {qInfo?.options && qInfo.options.length > 0 ? (
                  <>
                    <div className={`grid gap-1.5 ${qInfo.options.length > 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      {qInfo.options.map((opt) => {
                        const isSelected = qInfo.type === "single"
                          ? editValue === opt.value
                          : Array.isArray(editValue) && editValue.includes(opt.value);

                        return (
                          <button
                            key={opt.value}
                            onClick={() => qInfo.type === "single" ? handleSingleSelect(opt.value) : handleMultiToggle(opt.value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                              isSelected
                                ? "border-primary/60 bg-primary/10"
                                : "border-border/30 bg-card hover:border-border/60"
                            }`}
                          >
                            {qInfo.type === "multi" ? (
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </div>
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-primary" : "border-muted-foreground/40"
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                            )}
                            <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {qInfo.type === "multi" && qInfo.maxSelect && (
                      <p className="text-[11px] text-muted-foreground/60 text-center">
                        {Array.isArray(editValue) ? editValue.length : 0} de {qInfo.maxSelect} selecionados
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Opções não disponíveis. Refaça a pesquisa.</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || saveSurveyMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-primary/20 border border-primary/40 text-sm text-primary font-medium disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {saveSurveyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-4">
        <button
          onClick={() => {
            localStorage.removeItem("avalyarin_survey_completed");
            localStorage.removeItem("avalyarin_survey_answers");
            toast.info("Redirecionando para refazer a pesquisa...");
            window.location.href = "/";
          }}
          className="w-full py-3 rounded-lg border border-border/30 text-muted-foreground text-sm font-medium hover:bg-card/80 transition-colors"
        >
          Refazer Pesquisa Completa
        </button>
      </div>
    </div>
  );
}
