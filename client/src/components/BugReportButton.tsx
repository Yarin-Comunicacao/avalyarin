import { useState } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { Bug, X, Loader2, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "bug", label: "Bug ou comportamento inesperado" },
  { value: "broken_route", label: "Página 404 ou botão quebrado" },
  { value: "performance", label: "Lentidão ou carregamento" },
  { value: "content", label: "Conteúdo ou cardápio incorreto" },
  { value: "account", label: "Conta, acesso ou permissões" },
  { value: "other", label: "Outro problema" },
] as const;

const SEVERITIES = [
  { value: "low", label: "Baixa", description: "Não impede o uso" },
  { value: "medium", label: "Média", description: "Afeta uma função" },
  { value: "high", label: "Alta", description: "Impede uma tarefa importante" },
  { value: "critical", label: "Crítica", description: "Bloqueia o aplicativo" },
] as const;

export default function BugReportButton() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("bug");
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]["value"]>("medium");

  const createMutation = trpc.bugReports.create.useMutation({
    onSuccess: ({ code }) => {
      toast.success("Reporte enviado", { description: `Protocolo ${code}. A equipe de suporte fará a triagem.` });
      setOpen(false);
      setTitle("");
      setDescription("");
      setCategory("bug");
      setSeverity("medium");
    },
    onError: (error) => toast.error(error.message || "Não foi possível enviar o reporte"),
  });

  if (!user) return null;

  const handleSubmit = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (cleanTitle.length < 1) {
      toast.error("Dê um título curto ao problema");
      return;
    }
    if (cleanDescription.length < 5) {
      toast.error("Descreva o que aconteceu com um pouco mais de detalhe");
      return;
    }

    const browserContext = {
      language: typeof navigator !== "undefined" ? navigator.language : undefined,
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
      visibility: typeof document !== "undefined" ? document.visibilityState : undefined,
    };

    createMutation.mutate({
      title: cleanTitle,
      description: cleanDescription,
      category,
      severity,
      routePath: location,
      platform: Capacitor.getPlatform(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      viewport: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
      appVersion: import.meta.env.VITE_APP_VERSION || "web",
      contextJson: JSON.stringify(browserContext),
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-card/95 text-primary shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Reportar bug ou problema"
        title="Reportar bug ou problema"
      >
        <Bug className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/50 bg-card p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg tracking-wider text-foreground">REPORTAR PROBLEMA</h2>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Enviaremos a rota atual, plataforma e informações técnicas básicas para a equipe reproduzir o problema. Não capturamos sua localização neste formulário.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-foreground">Título</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={255}
                  placeholder="Ex.: O cardápio não abre no Soul Hops"
                  className="w-full rounded-lg border border-border/50 bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-foreground">Tipo de problema</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="w-full rounded-lg border border-border/50 bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60">
                  {CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">Impacto</span>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITIES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSeverity(option.value)}
                      className={`rounded-lg border px-3 py-2 text-left transition ${severity === option.value ? "border-primary/60 bg-primary/15" : "border-border/40 bg-secondary/30 hover:border-primary/30"}`}
                    >
                      <span className="block text-xs font-medium text-foreground">{option.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-foreground">O que aconteceu?</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={5000}
                  rows={5}
                  placeholder="Informe os passos para reproduzir o problema e o resultado esperado."
                  className="w-full resize-none rounded-lg border border-border/50 bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                />
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border/50 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button type="button" onClick={handleSubmit} disabled={createMutation.isPending} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
