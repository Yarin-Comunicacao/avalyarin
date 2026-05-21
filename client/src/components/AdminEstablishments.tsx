/**
 * AdminEstablishments — Painel Admin > Estabelecimentos
 * 
 * Features:
 * 1. Lista de categorias com contagem (ordem alfabética)
 * 2. Abas Ativos/Ocultos dentro de cada categoria
 * 3. Botões Ocultar/Ativar para cada estab
 * 4. Estabs clicáveis → navega para /admin/estab/:id
 */
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Store, Eye, EyeOff, ChevronRight, ArrowLeft,
  Search, CheckSquare, Square, Trash2
} from "lucide-react";

export default function AdminEstablishments() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "hidden">("active");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const { data: categoriesData, isLoading: catLoading } = trpc.admin.categoriesWithCounts.useQuery();
  const { data: estabData, isLoading: estabLoading } = trpc.admin.estabByCategory.useQuery(
    { categoryId: selectedCategoryId!, hidden: activeTab === "hidden", limit: 500 },
    { enabled: !!selectedCategoryId }
  );

  const toggleMutation = trpc.admin.toggleVisibility.useMutation();
  const deleteMutation = trpc.admin.deleteEstablishment.useMutation();
  const utils = trpc.useUtils();

  const handleToggleVisibility = async (ids: number[], hide: boolean) => {
    try {
      await toggleMutation.mutateAsync({ ids, hidden: hide });
      utils.admin.estabByCategory.invalidate();
      utils.admin.categoriesWithCounts.invalidate();
      setSelectedIds([]);
      toast.success(
        hide
          ? `${ids.length} estab${ids.length > 1 ? "s" : ""} oculto${ids.length > 1 ? "s" : ""}`
          : `${ids.length} estab${ids.length > 1 ? "s" : ""} ativado${ids.length > 1 ? "s" : ""}`
      );
    } catch {
      toast.error("Erro ao alterar visibilidade");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR "${name}"? Esta ação é irreversível.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      utils.admin.estabByCategory.invalidate();
      utils.admin.categoriesWithCounts.invalidate();
      toast.success(`"${name}" excluído`);
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!filteredEstabs) return;
    if (selectedIds.length === filteredEstabs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEstabs.map(e => e.id));
    }
  };

  // Filter by search
  const filteredEstabs = estabData?.items?.filter(e =>
    !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategory = categoriesData?.find(c => c.id === selectedCategoryId);

  // ============ CATEGORY LIST VIEW ============
  if (!selectedCategoryId) {
    return (
      <div>
        <h2 className="font-display text-2xl tracking-wider text-foreground mb-6">ESTABELECIMENTOS</h2>
        
        {catLoading ? (
          <div className="text-muted-foreground">Carregando categorias...</div>
        ) : (
          <div className="space-y-2">
            {categoriesData?.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setActiveTab("active");
                  setSelectedIds([]);
                  setSearchQuery("");
                }}
                className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cat.activeCount} ativo{cat.activeCount !== 1 ? "s" : ""} • {cat.hiddenCount} oculto{cat.hiddenCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-numbers text-muted-foreground">{cat.totalCount}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ============ ESTABLISHMENT LIST VIEW (within category) ============
  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => {
            setSelectedCategoryId(null);
            setSelectedIds([]);
            setSearchQuery("");
          }}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="font-display text-xl tracking-wider text-foreground">
            {selectedCategory?.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            {selectedCategory?.activeCount} ativos • {selectedCategory?.hiddenCount} ocultos
          </p>
        </div>
      </div>

      {/* Tabs: Ativos / Ocultos */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setActiveTab("active"); setSelectedIds([]); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "active"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-4 h-4" />
          Ativos ({selectedCategory?.activeCount ?? 0})
        </button>
        <button
          onClick={() => { setActiveTab("hidden"); setSelectedIds([]); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "hidden"
              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              : "bg-secondary/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          <EyeOff className="w-4 h-4" />
          Ocultos ({selectedCategory?.hiddenCount ?? 0})
        </button>
      </div>

      {/* Search + Bulk actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
          />
        </div>

        {/* Bulk action buttons */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            {activeTab === "active" ? (
              <button
                onClick={() => handleToggleVisibility(selectedIds, true)}
                disabled={toggleMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors disabled:opacity-50"
              >
                <EyeOff className="w-4 h-4" />
                Ocultar ({selectedIds.length})
              </button>
            ) : (
              <button
                onClick={() => handleToggleVisibility(selectedIds, false)}
                disabled={toggleMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Ativar ({selectedIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Select all toggle */}
      {filteredEstabs && filteredEstabs.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedIds.length === filteredEstabs.length ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {selectedIds.length === filteredEstabs.length ? "Desmarcar todos" : "Selecionar todos"}
          </button>
          <span className="text-xs text-muted-foreground">
            ({filteredEstabs.length} estab{filteredEstabs.length !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {/* Establishment list */}
      {estabLoading ? (
        <div className="text-muted-foreground py-8 text-center">Carregando...</div>
      ) : filteredEstabs && filteredEstabs.length > 0 ? (
        <div className="space-y-1.5">
          {filteredEstabs.map(est => (
            <div
              key={est.id}
              className="p-3 rounded-lg bg-card border border-border/50 hover:border-primary/20 transition-all flex items-center gap-3"
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleSelect(est.id)}
                className="shrink-0"
              >
                {selectedIds.includes(est.id) ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground/50" />
                )}
              </button>

              {/* Clickable name → navigate to estab admin */}
              <button
                onClick={() => navigate(`/admin/estab/${est.id}`)}
                className="flex-1 text-left group"
              >
                <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                  {est.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {est.neighborhood}{est.hasMenu ? " • Cardápio ✓" : " • Sem cardápio"}
                </p>
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {activeTab === "active" ? (
                  <button
                    onClick={() => handleToggleVisibility([est.id], true)}
                    title="Ocultar"
                    className="p-1.5 rounded text-orange-400 hover:bg-orange-500/10 transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleVisibility([est.id], false)}
                    title="Ativar"
                    className="p-1.5 rounded text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(est.id, est.name)}
                  title="Excluir"
                  className="p-1.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/admin/estab/${est.id}`)}
                  title="Editar"
                  className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum estabelecimento {activeTab === "active" ? "ativo" : "oculto"} nesta categoria</p>
        </div>
      )}
    </div>
  );
}
