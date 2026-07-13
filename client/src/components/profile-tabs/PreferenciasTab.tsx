import { trpc } from "@/lib/trpc";
import { Loader2, User } from "lucide-react";

import { toast } from "sonner";

export default function PreferenciasTab() {
  const { data: surveyData, isLoading, error } = trpc.survey.get.useQuery();


  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (error) {
    toast.error("Erro ao carregar preferências");
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

  const preferenceItems = [
    { label: "Região", value: data.region },
    { label: "Frequência", value: data.frequency },
    { label: "Gasto Médio", value: data.avgSpend },
    { label: "Categorias Favoritas", value: Array.isArray(data.categories) ? data.categories.join(", ") : data.categories },
    { label: "Prioridades", value: Array.isArray(data.priorities) ? data.priorities.join(", ") : data.priorities },
    { label: "Como Descobre", value: Array.isArray(data.discovery) ? data.discovery.join(", ") : data.discovery },
  ].filter(item => item.value);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-4">Suas respostas da pesquisa de preferências</p>
      {preferenceItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma preferência registrada ainda.</p>
      ) : (
        preferenceItems.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-sm text-foreground">{item.value}</p>
          </div>
        ))
      )}
      <div className="pt-4">
        <button
          onClick={() => {
            localStorage.removeItem("avalyarin_survey_completed");
            localStorage.removeItem("avalyarin_survey_answers");
            toast.info("Redirecionando para refazer a pesquisa...");
            window.location.href = "/";
          }}
          className="w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          Refazer Pesquisa
        </button>
      </div>
    </div>
  );
}
