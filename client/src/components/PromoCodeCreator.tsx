/**
 * PromoCodeCreator — modal/form compartilhado para critic e specialist
 * criarem códigos promocionais vinculados a múltiplos estabelecimentos.
 *
 * Fluxo:
 * 1. Critic/specialist preenche código, tipo, valor, descrição, validade
 * 2. Seleciona 1+ estabelecimentos da lista (busca por nome)
 * 3. Envia → cada estab entra como "pending"; business recebe notificação no sino
 * 4. Critic/specialist acompanha status por estab em "Meus Pedidos"
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Search, Check, Loader2, Store, Tag } from "lucide-react";

interface PromoCodeCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  /** Cor de destaque: azul safira (critic) ou âmbar (specialist) */
  accent: "critic" | "specialist";
}

const ACCENT = {
  critic: {
    text: "text-blue-400",
    bg: "bg-blue-500",
    bgSoft: "bg-blue-500/10",
    border: "border-blue-500/40",
    ring: "ring-blue-500",
    button: "bg-blue-600 hover:bg-blue-500 text-white",
  },
  specialist: {
    text: "text-amber-400",
    bg: "bg-amber-500",
    bgSoft: "bg-amber-500/10",
    border: "border-amber-500/40",
    ring: "ring-amber-500",
    button: "bg-amber-600 hover:bg-amber-500 text-black",
  },
};

export function PromoCodeCreator({ open, onClose, onCreated, accent }: PromoCodeCreatorProps) {
  const colors = ACCENT[accent];
  const utils = trpc.useUtils();

  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "buy_one_get_one" | "free_item" | "fixed_discount">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [estabSearch, setEstabSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: establishments, isLoading: loadingEstabs } = trpc.promo.establishmentsForSelection.useQuery(
    undefined,
    { enabled: open }
  );

  const createMutation = trpc.promo.createWithEstablishments.useMutation({
    onSuccess: () => {
      toast.success("Código criado! Os estabelecimentos foram notificados.");
      utils.promo.myRequests.invalidate();
      utils.promo.myCodes.invalidate();
      resetForm();
      onClose();
      onCreated?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredEstabs = useMemo(() => {
    if (!establishments) return [];
    const q = estabSearch.trim().toLowerCase();
    if (!q) return establishments;
    return establishments.filter((e: any) =>
      e.name.toLowerCase().includes(q) ||
      (e.neighborhood || "").toLowerCase().includes(q)
    );
  }, [establishments, estabSearch]);

  const resetForm = () => {
    setFormCode("");
    setFormType("percentage");
    setFormValue("");
    setFormDescription("");
    setFormExpiresAt("");
    setFormMaxUses("");
    setEstabSearch("");
    setSelectedIds([]);
  };

  const toggleEstab = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!formCode.trim() || formCode.trim().length < 3) {
      toast.error("Informe um código com pelo menos 3 caracteres");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Selecione ao menos 1 estabelecimento");
      return;
    }
    if (["percentage", "fixed_discount"].includes(formType) && !formValue) {
      toast.error("Informe o valor do desconto");
      return;
    }
    createMutation.mutate({
      code: formCode.trim(),
      type: formType,
      value: formValue ? Number(formValue) : undefined,
      description: formDescription || undefined,
      establishmentIds: selectedIds,
      expiresAt: formExpiresAt ? new Date(formExpiresAt + "T23:59:59").getTime() : undefined,
      maxUses: formMaxUses ? Number(formMaxUses) : undefined,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className={`w-5 h-5 ${colors.text}`} />
            <h3 className={`font-display text-lg tracking-wider ${colors.text}`}>CRIAR CÓDIGO</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Código */}
        <div>
          <label className="text-xs text-muted-foreground">Código (ex: YARIN10)</label>
          <input
            value={formCode}
            onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="YARIN10"
            maxLength={20}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono uppercase mt-1"
          />
        </div>

        {/* Tipo + Valor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Tipo</label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as any)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
            >
              <option value="percentage">% Desconto</option>
              <option value="buy_one_get_one">Pague 1 Leve 2</option>
              <option value="free_item">Item Grátis</option>
              <option value="fixed_discount">R$ Desconto</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Valor (se aplicável)</label>
            <input
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="10"
              type="number"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
          <input
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="10% de desconto na conta"
            maxLength={500}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
          />
        </div>

        {/* Validade + Limite */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Válido até (opcional)</label>
            <input
              value={formExpiresAt}
              onChange={(e) => setFormExpiresAt(e.target.value)}
              type="date"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Limite de usos (opcional)</label>
            <input
              value={formMaxUses}
              onChange={(e) => setFormMaxUses(e.target.value)}
              placeholder="100"
              type="number"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground mt-1"
            />
          </div>
        </div>

        {/* Seleção de estabelecimentos */}
        <div>
          <label className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Estabelecimentos ({selectedIds.length} selecionado{selectedIds.length !== 1 ? "s" : ""})</span>
          </label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={estabSearch}
              onChange={(e) => setEstabSearch(e.target.value)}
              placeholder="Buscar estabelecimento..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-foreground"
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 border border-border/50 rounded-lg p-2">
            {loadingEstabs ? (
              <div className="flex justify-center py-4">
                <Loader2 className={`w-5 h-5 animate-spin ${colors.text}`} />
              </div>
            ) : filteredEstabs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhum estabelecimento encontrado.</p>
            ) : (
              filteredEstabs.map((estab: any) => {
                const selected = selectedIds.includes(estab.id);
                return (
                  <button
                    key={estab.id}
                    onClick={() => toggleEstab(estab.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left ${
                      selected
                        ? `${colors.bgSoft} ${colors.border}`
                        : "border-transparent hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 ${
                      selected ? `${colors.bg} border-transparent` : "border-border"
                    }`}>
                      {selected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    {estab.logo || estab.image ? (
                      <img
                        src={estab.logo || estab.image}
                        alt={estab.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{estab.name}</p>
                      {estab.neighborhood && (
                        <p className="text-[11px] text-muted-foreground truncate">{estab.neighborhood}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors ${colors.button}`}
          >
            {createMutation.isPending ? "Enviando..." : "Enviar Pedido"}
          </button>
          <button
            onClick={() => { resetForm(); onClose(); }}
            className="px-4 py-2.5 bg-card border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          * Cada estabelecimento selecionado receberá o pedido e poderá aceitar ou colocar em espera. Você será notificado quando um pedido for aceito.
        </p>
      </div>
    </div>
  );
}
