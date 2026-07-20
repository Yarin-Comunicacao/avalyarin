/**
 * ReportButton — A "Denunciar" (Report) button + modal for flagging content.
 * Can be placed next to any rating, photo, comment, or user.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flag, X, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

type TargetType = "rating" | "photo" | "comment" | "user";

interface ReportButtonProps {
  targetType: TargetType;
  targetId: number;
  targetUserId?: number;
  /** If true, show only icon without text */
  iconOnly?: boolean;
  /** Custom class */
  className?: string;
}

const REASONS = [
  { value: "sexual_content", label: "Conteúdo Sexual" },
  { value: "hate_speech", label: "Discurso de Ódio" },
  { value: "violence", label: "Violência" },
  { value: "financial_scam", label: "Golpe Financeiro" },
  { value: "phishing", label: "Phishing / Roubo de Dados" },
  { value: "false_identity", label: "Falsa Identidade" },
  { value: "misinformation", label: "Desinformação" },
  { value: "spam", label: "Spam / Propaganda" },
  { value: "other", label: "Outro" },
] as const;

export default function ReportButton({
  targetType,
  targetId,
  targetUserId,
  iconOnly = false,
  className = "",
}: ReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");

  const reportMutation = trpc.report.create.useMutation({
    onSuccess: () => {
      toast.success("Denúncia enviada com sucesso", {
        description: "Nossa equipe irá analisar em até 48h.",
      });
      setOpen(false);
      setReason("");
      setDescription("");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar denúncia");
    },
  });

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Selecione um motivo para a denúncia");
      return;
    }
    reportMutation.mutate({
      targetType,
      targetId,
      targetUserId,
      reason: reason as any,
      description: description || undefined,
    });
  };

  if (!user) return null; // Only authenticated users can report

  // Don't show report button for own content
  if (targetUserId && targetUserId === user.id) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-red-400 transition-colors ${className}`}
        title="Denunciar"
      >
        <Flag className="w-3 h-3" />
        {!iconOnly && <span>Denunciar</span>}
      </button>

      {/* Report Modal */}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-card border border-border/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                <h3 className="font-display text-lg tracking-wider text-foreground">DENUNCIAR</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Selecione o motivo da denúncia. Nossa equipe de moderação irá analisar.
            </p>

            {/* Reason selection */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    reason === r.value
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-secondary/50 text-foreground hover:bg-secondary border border-transparent"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Optional description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais (opcional)..."
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 mb-4 focus:outline-none focus:border-primary/50"
              maxLength={500}
            />

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!reason || reportMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {reportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Flag className="w-4 h-4 mr-1" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
