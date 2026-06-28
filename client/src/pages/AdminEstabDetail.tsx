/**
 * AdminEstabDetail — Página de administração individual do Estabelecimento
 * 
 * Features:
 * - Informações gerais do estab
 * - Edição do cardápio: Nome, Descrição, Preço, Foto, Categoria do cardápio
 * - Drag-and-drop para reordenar categorias do cardápio
 * - Categorias sempre com primeira letra maiúscula
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useMemo } from "react";
import { Link, useParams, useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeft, Store, Plus, Pencil, Trash2, Image as ImageIcon,
  Save, X, Shield, DollarSign, Tag, FileText, Upload, GripVertical, AlertTriangle
} from "lucide-react";
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

const MENU_CATEGORY_SUGGESTIONS = [
  "Petiscos", "Pratos", "Chopp", "Cervejas", "Drinks", "Sobremesas",
  "Entradas", "Porções", "Vinhos", "Coquetéis", "Cafés", "Lanches"
];

/** Capitalize first letter */
function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function AdminEstabDetail() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const estabId = Number(params.id);

  // Parse query params for back navigation
  const searchParams = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const fromCategoryId = searchParams.get("fromCategory");

  const { data: estab, isLoading } = trpc.admin.estabDetail.useQuery(
    { id: estabId },
    { enabled: !!estabId }
  );

  const { data: categoriesWithOrder } = trpc.admin.menuCategoriesWithOrder.useQuery(
    { establishmentId: estabId },
    { enabled: !!estabId }
  );

  const reorderMutation = trpc.admin.reorderMenuCategories.useMutation();
  const utils = trpc.useUtils();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [editInfo, setEditInfo] = useState({
    name: '',
    description: '',
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    phone: '',
    instagram: '',
    hours: '',
    status: 'active' as 'active' | 'hidden' | 'pending',
  });

  const updateEstabMutation = trpc.admin.updateEstablishment.useMutation({
    onSuccess: () => {
      toast.success('Informações atualizadas!');
      setEditingInfo(false);
      utils.admin.estabDetail.invalidate({ id: estabId });
    },
    onError: (err) => {
      toast.error('Erro ao salvar: ' + err.message);
    },
  });

  // Initialize edit form when estab data loads or editing starts
  const startEditing = () => {
    if (estab) {
      setEditInfo({
        name: estab.name || '',
        description: (estab as any).description || '',
        address: estab.address || '',
        addressNumber: (estab as any).addressNumber || '',
        complement: (estab as any).complement || '',
        neighborhood: estab.neighborhood || '',
        phone: estab.phone || '',
        instagram: estab.instagram || '',
        hours: estab.hours || '',
        status: estab.status || 'active',
      });
      setEditingInfo(true);
    }
  };

  const handleSaveInfo = () => {
    setSavingInfo(true);
    updateEstabMutation.mutate({
      id: estabId,
      name: editInfo.name || undefined,
      description: editInfo.description || undefined,
      address: editInfo.address || undefined,
      addressNumber: editInfo.addressNumber || undefined,
      complement: editInfo.complement || undefined,
      neighborhood: editInfo.neighborhood || undefined,
      phone: editInfo.phone || undefined,
      instagram: editInfo.instagram || undefined,
      hours: editInfo.hours || undefined,
      status: editInfo.status,
    }, {
      onSettled: () => setSavingInfo(false),
    });
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleBack = () => {
    window.history.back();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-display text-2xl">Carregando...</div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">ACESSO RESTRITO</h1>
          <button onClick={() => window.history.back()} className="text-primary hover:underline">Voltar ao Admin</button>
        </div>
      </div>
    );
  }

  if (!estab) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h1 className="font-display text-xl text-foreground mb-2">Estabelecimento não encontrado</h1>
          <button onClick={handleBack} className="text-primary hover:underline">
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  // Group menu items by category, using sortOrder from categoriesWithOrder
  const menuByCategory = (estab.menuItems || []).reduce((acc, item) => {
    const cat = item.category || "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof estab.menuItems>);

  // Use categoriesWithOrder for ordering, fallback to alphabetical
  const menuCategories = categoriesWithOrder
    ? categoriesWithOrder.map(c => c.name).filter(name => menuByCategory[name])
    : Object.keys(menuByCategory).sort();

  // Add any categories that exist in items but not in the order table
  const orderedSet = new Set(menuCategories.map(c => c.toLowerCase()));
  const extraCategories = Object.keys(menuByCategory)
    .filter(c => !orderedSet.has(c.toLowerCase()))
    .sort();
  const allMenuCategories = [...menuCategories, ...extraCategories];

  const filteredMenu = filterCategory === "all"
    ? estab.menuItems || []
    : (menuByCategory[filterCategory] || []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="font-display text-lg tracking-wider text-primary truncate max-w-[200px] sm:max-w-none">
                {estab.name}
              </h1>
              <p className="text-xs text-muted-foreground">{estab.categoryName} • {estab.neighborhood}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-8">
        {/* Completeness Alert */}
        {estab.missingFields && estab.missingFields.length > 0 && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">Estabelecimento incompleto</p>
              <p className="text-xs text-red-400/80 mt-1">
                Campos obrigatórios faltando: <strong>{estab.missingFields.join(', ')}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Este estabelecimento ficará oculto no app até que todos os campos obrigatórios sejam preenchidos.
              </p>
            </div>
          </div>
        )}

        {/* Items without photo alert */}
        {estab.itemsWithoutPhoto > 0 && (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-400">
                {estab.itemsWithoutPhoto} {estab.itemsWithoutPhoto === 1 ? 'item' : 'itens'} sem foto
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Itens sem foto estão destacados em vermelho no cardápio abaixo.
              </p>
            </div>
          </div>
        )}

        {/* Establishment Info Card */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-sm tracking-wider text-muted-foreground">INFORMAÇÕES</h3>
            <button
              onClick={() => editingInfo ? setEditingInfo(false) : startEditing()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3 h-3" />
              {editingInfo ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {editingInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Nome</label>
                  <input
                    type="text"
                    value={editInfo.name}
                    onChange={(e) => setEditInfo({...editInfo, name: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
                  <input
                    type="text"
                    value={editInfo.description}
                    onChange={(e) => setEditInfo({...editInfo, description: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    placeholder="Ex: Hamburgueria artesanal"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Endereço (logradouro)</label>
                  <input
                    type="text"
                    value={editInfo.address}
                    onChange={(e) => setEditInfo({...editInfo, address: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                    placeholder="Rua, Avenida, Alameda..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Número</label>
                    <input
                      type="text"
                      value={editInfo.addressNumber}
                      onChange={(e) => setEditInfo({...editInfo, addressNumber: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Complemento</label>
                    <input
                      type="text"
                      value={editInfo.complement}
                      onChange={(e) => setEditInfo({...editInfo, complement: e.target.value})}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                      placeholder="Shopping, Loja 5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={editInfo.neighborhood}
                    onChange={(e) => setEditInfo({...editInfo, neighborhood: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editInfo.phone}
                    onChange={(e) => setEditInfo({...editInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Instagram</label>
                  <input
                    type="text"
                    value={editInfo.instagram}
                    onChange={(e) => setEditInfo({...editInfo, instagram: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Horário</label>
                  <input
                    type="text"
                    value={editInfo.hours}
                    onChange={(e) => setEditInfo({...editInfo, hours: e.target.value})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Status</label>
                  <select
                    value={editInfo.status}
                    onChange={(e) => setEditInfo({...editInfo, status: e.target.value as 'active' | 'hidden' | 'pending'})}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="active">Ativo</option>
                    <option value="pending">Pendente</option>
                    <option value="hidden">Oculto</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingInfo(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveInfo}
                  disabled={savingInfo}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingInfo ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Endereço</span>
                <p className="text-foreground">
                  {estab.address ? `${estab.address}${estab.addressNumber ? ', ' + estab.addressNumber : ''}` : "—"}
                </p>
              </div>
              {estab.complement && (
                <div>
                  <span className="text-xs text-muted-foreground">Complemento</span>
                  <p className="text-foreground">{estab.complement}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">Bairro</span>
                <p className="text-foreground">{estab.neighborhood || "—"}</p>
              </div>
              {estab.description && (
                <div>
                  <span className="text-xs text-muted-foreground">Descrição</span>
                  <p className="text-foreground">{estab.description}</p>
                </div>
              )}
              <div>
                <span className="text-xs text-muted-foreground">Telefone</span>
                <p className="text-foreground">{estab.phone || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Instagram</span>
                <p className="text-foreground">{estab.instagram || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Horário</span>
                <p className="text-foreground">{estab.hours || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                <p className={estab.status === 'active' ? "text-green-400" : estab.status === 'pending' ? "text-yellow-400" : "text-orange-400"}>
                  {estab.status === 'active' ? "Ativo" : estab.status === 'pending' ? "Pendente" : "Oculto"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Menu Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl tracking-wider text-foreground">CARDÁPIO</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {estab.menuItems?.length || 0} itens • {allMenuCategories.length} categorias
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <GripVertical className="w-3.5 h-3.5" />
                Ordenar
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Item
              </button>
            </div>
          </div>

          {/* Category Reorder Manager (drag-and-drop) */}
          {showCategoryManager && (
            <CategoryReorderManager
              establishmentId={estabId}
              categories={allMenuCategories}
              onClose={() => setShowCategoryManager(false)}
              onReordered={() => {
                utils.admin.menuCategoriesWithOrder.invalidate();
                utils.admin.estabDetail.invalidate();
              }}
            />
          )}

          {/* Category filter */}
          {allMenuCategories.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button
                onClick={() => setFilterCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filterCategory === "all"
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({estab.menuItems?.length || 0})
              </button>
              {allMenuCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    filterCategory === cat
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat} ({menuByCategory[cat]?.length || 0})
                </button>
              ))}
            </div>
          )}

          {/* Add Form */}
          {showAddForm && (
            <MenuItemForm
              establishmentId={estabId}
              onClose={() => setShowAddForm(false)}
              existingCategories={allMenuCategories}
            />
          )}

          {/* Menu Items List */}
          {filteredMenu.length > 0 ? (
            <div className="space-y-2">
              {filteredMenu.map(item => (
                editingItem === item.id ? (
                  <MenuItemForm
                    key={item.id}
                    establishmentId={estabId}
                    editItem={item}
                    onClose={() => setEditingItem(null)}
                    existingCategories={allMenuCategories}
                  />
                ) : (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditingItem(item.id)}
                  />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum item no cardápio{filterCategory !== "all" ? ` na categoria "${filterCategory}"` : ""}</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-primary hover:underline text-sm mt-2"
              >
                Adicionar primeiro item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Category Reorder Manager (Drag-and-Drop) ============
function CategoryReorderManager({
  establishmentId,
  categories,
  onClose,
  onReordered,
}: {
  establishmentId: number;
  categories: string[];
  onClose: () => void;
  onReordered: () => void;
}) {
  const [items, setItems] = useState(categories);
  const reorderMutation = trpc.admin.reorderMenuCategories.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      await reorderMutation.mutateAsync({
        establishmentId,
        orderedNames: items,
      });
      toast.success("Ordem das categorias salva!");
      onReordered();
      onClose();
    } catch {
      toast.error("Erro ao salvar ordem");
    }
  };

  return (
    <div className="mb-6 p-4 rounded-xl bg-card border border-primary/30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display text-sm tracking-wider text-primary">
          ORDENAR CATEGORIAS
        </h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Arraste para reordenar as categorias do cardápio
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((cat) => (
              <SortableCategoryItem key={cat} id={cat} name={cat} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleSave}
          disabled={reorderMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Salvar Ordem
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ============ Sortable Category Item ============
function SortableCategoryItem({ id, name }: { id: string; name: string }) {
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/50 border ${
        isDragging ? "border-primary/50 shadow-lg" : "border-border/30"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-secondary"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="text-sm text-foreground font-medium">{name}</span>
    </div>
  );
}

// ============ Menu Item Card ============
function MenuItemCard({ item, onEdit }: { item: any; onEdit: () => void }) {
  const deleteMutation = trpc.admin.deleteMenuItem.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id: item.id });
      utils.admin.estabDetail.invalidate();
      toast.success("Item excluído");
    } catch {
      toast.error("Erro ao excluir item");
    }
  };

  const hasNoPhoto = !item.imageUrl || item.imageUrl.trim() === '';

  return (
    <div className={`p-4 rounded-xl flex gap-4 ${
      hasNoPhoto
        ? "bg-red-500/5 border border-red-500/30"
        : "bg-card border border-border/50"
    }`}>
      {/* Image — uses thumbnail for fast loading */}
      <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
        hasNoPhoto
          ? "bg-red-500/10 border border-red-500/30"
          : "bg-secondary/50 border border-border/30"
      }`}>
        {(item.imageThumbUrl || item.imageUrl) ? (
          <img
            src={item.imageThumbUrl || item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <ImageIcon className={`w-6 h-6 ${hasNoPhoto ? "text-red-400/60" : "text-muted-foreground/30"}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {item.price && (
            <span className="text-xs font-medium text-primary">
              R$ {item.price.toFixed(2).replace(".", ",")}
            </span>
          )}
          {item.category && (
            <span className="text-xs px-2 py-0.5 rounded bg-secondary/50 text-muted-foreground">
              {item.category}
            </span>
          )}
          {hasNoPhoto && (
            <span className="text-xs text-red-400 flex items-center gap-1 font-medium">
              <ImageIcon className="w-3 h-3" /> Sem foto
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Menu Item Form (Add/Edit) ============
function MenuItemForm({
  establishmentId,
  editItem,
  onClose,
  existingCategories,
}: {
  establishmentId: number;
  editItem?: any;
  onClose: () => void;
  existingCategories: string[];
}) {
  const [name, setName] = useState(editItem?.name || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [price, setPrice] = useState(editItem?.price?.toString() || "");
  const [category, setCategory] = useState(editItem?.category || "");
  const [customCategory, setCustomCategory] = useState("");
  const [imageUrl, setImageUrl] = useState(editItem?.imageUrl || "");
  const [imageThumbUrl, setImageThumbUrl] = useState(editItem?.imageThumbUrl || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMutation = trpc.admin.addMenuItem.useMutation();
  const updateMutation = trpc.admin.updateMenuItem.useMutation();
  const utils = trpc.useUtils();

  const allCategories = Array.from(new Set([
    ...MENU_CATEGORY_SUGGESTIONS,
    ...existingCategories,
  ])).sort();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome do item é obrigatório");
      return;
    }

    const rawCategory = category === "__custom__" ? customCategory : category;
    const finalCategory = rawCategory ? capitalize(rawCategory) : undefined;
    
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: price ? parseFloat(price) : undefined,
      category: finalCategory,
      imageUrl: imageUrl || undefined,
      imageThumbUrl: imageThumbUrl || undefined,
    };

    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...data });
        toast.success("Item atualizado");
      } else {
        await addMutation.mutateAsync({ establishmentId, ...data });
        toast.success("Item adicionado ao cardápio");
      }
      utils.admin.estabDetail.invalidate();
      utils.admin.menuCategoriesWithOrder.invalidate();
      onClose();
    } catch {
      toast.error("Erro ao salvar item");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas arquivos de imagem são aceitos");
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      
      const res = await fetch("/api/upload-menu-image", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-File-Name": file.name,
        },
        body: buffer,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Upload failed");
      const { url, thumbUrl } = await res.json();
      setImageUrl(url);
      setImageThumbUrl(thumbUrl);
      toast.success("Imagem otimizada e enviada (WebP)");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-card border border-primary/30 mb-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm tracking-wider text-primary">
          {editItem ? "EDITAR ITEM" : "NOVO ITEM DO CARDÁPIO"}
        </h4>
        <button type="button" onClick={onClose} className="p-1 rounded hover:bg-secondary/50">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Nome do Item *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
            placeholder="Ex: Hambúrguer Artesanal"
            required
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm resize-none"
            placeholder="Blend de costela e fraldinha, queijo cheddar, bacon crocante..."
            rows={2}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Preço (R$)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              placeholder="0,00"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Categoria do Cardápio</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm appearance-none"
            >
              <option value="">Selecione...</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__custom__">+ Nova categoria</option>
            </select>
          </div>
          {category === "__custom__" && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm"
              placeholder="Nome da nova categoria"
            />
          )}
        </div>

        {/* Image */}
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            Foto do Item
            <span className="text-orange-400 ml-1">(importante para diferencial de mercado)</span>
          </label>
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border/50">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Enviando..." : "Enviar Foto"}
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG ou WebP. Máx 5MB.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={addMutation.isPending || updateMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {editItem ? "Salvar Alterações" : "Adicionar Item"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
