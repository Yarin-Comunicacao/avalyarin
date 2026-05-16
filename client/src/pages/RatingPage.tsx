// Design: Neon Urbano — Rating page with Direct/Analytic modes
// Changes applied:
// 1. Back arrow → parent category page
// 2. Low-score reasons mandatory (1-3 selections) when score ≤6
// 3. Step numbering: "O que consumiu" and "Modo de avaliação" NOT numbered; numbering starts at first evaluation step
// 4. Beverages-only in Analytic → Direct-style first step (serves, recommend, taste), then General Criteria
// 5. Harmonização (c10) only shown if user has both food AND beverage items; excluded from score otherwise
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { PUB_CRITERIA, BONUS_CRITERIA } from "@/lib/data";
import type { MenuItem, RatingCriterion } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";
import { useParams, Redirect } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/sonner";
import ShareStoryCard from "@/components/ShareStoryCard";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ptBR } from "react-day-picker/locale";
import {
  Check, ChevronRight, ChevronLeft, Star, Zap, BarChart3,
  ShoppingBag, ClipboardCheck, Award, ThumbsUp, ThumbsDown, Users,
  CalendarIcon, DollarSign, Receipt, Camera, MessageSquare, Image, X
} from "lucide-react";

type RatingMode = "direto" | "analitico";
type Step = "items" | "visitDate" | "mode" | "rating" | "analyticBevDirect" | "analyticItems" | "analyticGlobal" | "bonus" | "spend" | "qualify" | "result";

interface ItemComment {
  itemId: string;
  comment: string;
}

interface PhotoWithTags {
  id: string;
  dataUrl: string;
  taggedItemIds: string[];
}

interface SpendData {
  servicePercent: "none" | "10" | "13";
  couvertEnabled: boolean;
  couvertValue: string;
  valetEnabled: boolean;
  valetValue: string;
  parkingEnabled: boolean;
  parkingValue: string;
}

interface DirectRating {
  itemId: string;
  serves: number;
  recommend: boolean | null;
  taste: number;
  lowReasons: string[];
  lowComment: string;
}

interface AnalyticItemRating {
  itemId: string;
  subScores: Record<string, number>;
  lowReasons: Record<string, string[]>;
  lowComments: Record<string, string>;
}

interface AnalyticGlobalRating {
  criterionId: string;
  subScores: Record<string, number>;
  lowReasons: Record<string, string[]>;
  lowComments: Record<string, string>;
}

// Beverage direct rating for analytic beverages-only flow
interface BevDirectRating {
  itemId: string;
  serves: number;
  recommend: boolean | null;
  taste: number;
  lowReasons: string[];
  lowComment: string;
}

// ============================================================
// PERSONALIZED LOW SCORE REASONS BY ITEM TYPE
// ============================================================

function getItemType(item: MenuItem): "cerveja" | "drink" | "entrada" | "prato" | "sobremesa" | "destilado" | "bebida" | "outro" {
  if (item.category === "cerveja" || item.category === "chopp") return "cerveja";
  if (item.category === "bebida" || item.category === "café") return "bebida";
  if (item.category === "drink" || item.category === "vinho") return "drink";
  if (item.category === "destilado") return "destilado";
  if (item.category === "entrada" || item.category === "petisco" || item.category === "salgado") return "entrada";
  if (item.category === "prato" || item.category === "hamburguer" || item.category === "pizza" || item.category === "lanche" || item.category === "sanduiche" || item.category === "sushi" || item.category === "temaki" || item.category === "ramen" || item.category === "salada" || item.category === "sopa" || item.category === "focaccia") return "prato";
  if (item.category === "sobremesa" || item.category === "doce" || item.category === "torta") return "sobremesa";
  return "outro";
}

function isFoodItem(item: MenuItem): boolean {
  return ["entrada", "petisco", "salgado", "prato", "hamburguer", "pizza", "lanche", "sanduiche", "sushi", "temaki", "ramen", "salada", "sopa", "focaccia", "sobremesa", "doce", "torta", "pão", "padaria"].includes(item.category);
}

function isBeverageItem(item: MenuItem): boolean {
  return ["bebida", "cerveja", "chopp", "drink", "vinho", "destilado", "café"].includes(item.category);
}

const DIRECT_TASTE_REASONS: Record<string, string[]> = {
  cerveja: [
    "Temperatura inadequada",
    "Choca (Aroma, Sabor ou Sem Gás)",
    "Gosto de Milho, Maçã Verde ou Manteiga",
    "Outros",
  ],
  drink: [
    "Muito Ácido",
    "Muito Doce",
    "Muito Amargo",
    "Drink Aguado",
    "Gelo com Gosto de Freezer",
    "Outros",
  ],
  entrada: [
    "Falta de sal",
    "Excesso de sal",
    "Sem tempero",
    "Comida fria",
    "Textura ruim",
    "Cheiro",
    "Gosto forte",
    "Outra",
  ],
  prato: [
    "Falta de sal",
    "Excesso de sal",
    "Sem tempero",
    "Comida fria",
    "Textura ruim",
    "Cheiro",
    "Gosto forte",
    "Outra",
  ],
  sobremesa: [
    "Falta de sal",
    "Excesso de sal",
    "Sem tempero",
    "Comida fria",
    "Textura ruim",
    "Cheiro",
    "Gosto forte",
    "Outra",
  ],
  outro: [
    "Falta de sal",
    "Excesso de sal",
    "Sem tempero",
    "Comida fria",
    "Textura ruim",
    "Cheiro",
    "Gosto forte",
    "Outra",
  ],
};

function getAnalyticItemReasons(subId: string, itemType: string): string[] {
  const isBeverage = itemType === "cerveja" || itemType === "drink" || itemType === "destilado" || itemType === "bebida";

  if (itemType === "cerveja") {
    if (subId === "c1_1") return ["Ingredientes sem frescor", "Qualidade abaixo", "Gosto de requentado", "Outros"];
    if (subId === "c1_2") return ["Temperatura inadequada", "Choca (Aroma, Sabor ou Sem Gás)", "Gosto de Milho, Maçã Verde ou Manteiga", "Outros"];
    if (subId === "c1_3") return ["Muito amarga", "Sem sabor", "Gosto metálico", "Outros"];
    if (subId === "c1_4") return ["Muito quente", "Muito gelada", "Temperatura instável", "Outros"];
  }
  if (itemType === "drink") {
    if (subId === "c1_1") return ["Ingredientes sem frescor", "Fruta passada", "Suco de caixinha", "Outros"];
    if (subId === "c1_2") return ["Muito Ácido", "Muito Doce", "Muito Amargo", "Drink Aguado", "Gelo com Gosto de Freezer", "Outros"];
    if (subId === "c1_3") return ["Desequilibrado", "Sem complexidade", "Álcool em excesso", "Gosto ácido", "Retrogosto amargo", "Outros"];
    if (subId === "c1_4") return ["Muito quente", "Gelo derretido", "Temperatura errada", "Outros"];
  }
  if (!isBeverage) {
    if (subId === "c1_1") return ["Ingredientes sem frescor", "Qualidade abaixo do esperado", "Gosto de requentado", "Ingrediente estragado", "Cheiro", "Gosto forte", "Outra"];
    if (subId === "c1_2") return ["Cozimento excessivo", "Cru demais", "Sem crocância", "Textura borrachuda", "Fritura encharcada", "Oleosa", "Seca", "Outra"];
    if (subId === "c1_3") return ["Falta de sal", "Excesso de sal", "Sem tempero", "Tempero artificial", "Desequilíbrio de sabores", "Gosto ácido", "Retrogosto amargo", "Outra"];
    if (subId === "c1_4") return ["Comida fria", "Comida morna", "Prato queimando", "Temperatura instável", "Outra"];
  }

  if (isBeverage) {
    if (subId === "c2_1") return ["Drink sem cor", "Visual desleixado", "Transbordando", "Tipo de copo errado", "Textura", "Outros"];
    if (subId === "c2_2") return ["Transbordando", "Derramado na bandeja", "Garnish caído", "Sem capricho", "Gelo quebrado", "Outros"];
    if (subId === "c2_3") return ["Copo com marcas de dedo", "Copo sujo", "Copo lascado", "Tipo de copo errado", "Tamanho inadequado", "Outros"];
    if (subId === "c2_4") return ["Drink sem cor", "Visual desleixado", "Transbordando", "Tipo de copo errado", "Textura", "Outros"];
    if (subId === "c2_5") return ["Transbordando", "Derramado na bandeja", "Garnish caído", "Sem capricho", "Gelo quebrado", "Outros"];
    if (subId === "c2_6") return ["Copo com marcas de dedo", "Copo sujo", "Copo lascado", "Tipo de copo errado", "Tamanho inadequado", "Outros"];
  }

  if (!isBeverage) {
    if (subId === "c2_1") return ["Prato sem cor", "Visual desleixado", "Harmonia", "Apresentação genérica", "Sem identidade", "Outra"];
    if (subId === "c2_2") return ["Marcas de dedos no prato", "Molho derramado", "Montagem torta", "Ingredientes caídos", "Porção espalhada", "Sem capricho", "Outra"];
    if (subId === "c2_3") return ["Prato inadequado", "Recipiente sujo", "Louça lascada", "Tamanho desproporcional", "Louça genérica", "Outra"];
    if (subId === "c2_4") return ["Sem garnish", "Apresentação genérica", "Sem identidade visual", "Outra"];
  }

  return ["Poderia melhorar", "Abaixo do esperado", "Outra"];
}

const GLOBAL_LOW_SCORE_REASONS: Record<string, string[]> = {
  c3_1: ["Recepção fria", "Ignorado na entrada", "Sem cumprimento", "Demora para ser recebido", "Atitude grosseira", "Outra"],
  c3_2: ["Não soube explicar o prato", "Informação errada", "Sem sugestões", "Desconhece ingredientes", "Não sabe harmonizar", "Outra"],
  c3_3: ["Demora excessiva", "Pedido esquecido", "Pratos em tempos diferentes", "Bebida demorou", "Conta demorou", "Outra"],
  c3_4: ["Não repôs água", "Não retirou pratos", "Sem atenção", "Precisei chamar várias vezes", "Mesa suja", "Outra"],
  c4_1: ["Música muito alta", "Sem música", "Música inadequada", "Acústica ruim (eco)", "Barulho da cozinha", "Outra"],
  c4_2: ["Banheiro sujo", "Sem papel", "Cheiro ruim", "Fila grande", "Sem sabonete", "Outra"],
  c4_3: ["Cadeira desconfortável", "Calor excessivo", "Frio excessivo", "Mesa instável", "Iluminação ruim", "Outra"],
  c4_4: ["Sem cobertura para chuva", "Assédio de ambulantes", "Barulho de trânsito", "Calçada irregular", "Sem ventilação", "Outra"],
  c5_1: ["Porção muito pequena", "Não serve nem uma pessoa", "Desproporcional ao preço", "Quantidade inconsistente", "Menos do que no cardápio", "Outra"],
  c5_2: ["Preço abusivo", "Ingredientes baratos por preço alto", "Não vale o que cobra", "Concorrente melhor e mais barato", "Qualidade não justifica", "Outra"],
  c5_3: ["Couvert não informado", "Taxa de serviço abusiva", "Preço diferente do cardápio", "Cobrança surpresa", "Água cobrada sem avisar", "Outra"],
  c6_1: ["Prato diferente da última vez", "Sabor inconsistente", "Porção menor que antes", "Qualidade caiu", "Receita mudou", "Outra"],
  c6_2: ["Qualidade caiu com lotação", "Demora muito mais cheio", "Atendimento pior lotado", "Comida pior no horário de pico", "Desorganização", "Outra"],
  c7_1: ["Cardápio genérico", "Nada diferente", "Cópia de outros bares", "Sem identidade", "Falta criatividade", "Outra"],
  c7_2: ["Sem prato exclusivo", "Nada memorável", "Sem drink autoral", "Cardápio padrão", "Falta personalidade", "Outra"],
  c8_1: ["Só cerveja industrial", "Pouca variedade", "Sem opções artesanais", "Carta limitada", "Sem novidades", "Outra"],
  c8_2: ["Drink mal feito", "Desequilibrado", "Sem gelo adequado", "Ingredientes ruins", "Sem técnica", "Outra"],
  c8_3: ["Sem opção sem álcool", "Só refrigerante", "Sem mocktail", "Sem suco natural", "Opções limitadas", "Outra"],
  c9_1: ["Só uma proteína", "Sem opção de peixe", "Pouca diversidade", "Menu repetitivo", "Falta opções", "Outra"],
  c9_2: ["Sem opção vegana", "Sem opção sem glúten", "Não atende restrições", "Sem informação de alérgenos", "Cardápio excludente", "Outra"],
  c9_3: ["Só frituras", "Sem opção leve", "Menu desequilibrado", "Falta saladas", "Sem opção saudável", "Outra"],
  c10_1: ["Carta não combina com comida", "Sem sinergia", "Bebidas desconectadas", "Falta coerência", "Não pensaram junto", "Outra"],
  c10_2: ["Sem sugestão de harmonização", "Garçom não sabe sugerir", "Sem indicação no cardápio", "Falta orientação", "Nenhuma recomendação", "Outra"],
};

function isRatableItem(item: MenuItem):
  boolean {
  return ["entrada", "petisco", "salgado", "prato", "hamburguer", "pizza", "lanche", "sanduiche", "sushi", "temaki", "ramen", "salada", "sopa", "focaccia", "sobremesa", "doce", "torta", "drink", "vinho", "pão", "padaria"].includes(item.category);
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function ScoreButtons({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <label className="text-sm font-medium text-foreground mb-2 block">{label}</label>}
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg font-numbers text-sm font-bold transition-all ${
              value === n
                ? n <= 6
                  ? "bg-red-500/80 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : "bg-primary text-primary-foreground glow-amber"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function LowScoreReasons({
  reasons,
  selectedReasons,
  onToggleReason,
  comment,
  onCommentChange,
  maxSelections = 3,
  showError = false,
}: {
  reasons: string[];
  selectedReasons: string[];
  onToggleReason: (reason: string) => void;
  comment: string;
  onCommentChange: (c: string) => void;
  maxSelections?: number;
  showError?: boolean;
}) {
  const showComment = selectedReasons.includes("Outra") || selectedReasons.includes("Outros");
  const atMax = selectedReasons.length >= maxSelections;
  const needsSelection = showError && selectedReasons.length === 0;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`mt-3 p-3 rounded-lg bg-red-500/5 border ${needsSelection ? 'border-red-500 ring-2 ring-red-500/30 animate-pulse' : 'border-red-500/20'}`}
    >
      {needsSelection && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 font-bold mb-2 flex items-center gap-1"
        >
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full" /> Selecione pelo menos 1 motivo abaixo para continuar
        </motion.p>
      )}
      <p className="text-xs text-red-400 mb-2 font-medium">
        O que poderia melhorar? <span className="text-red-400/60">(selecione de 1 a {maxSelections})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {reasons.map((reason) => {
          const isSelected = selectedReasons.includes(reason);
          const isDisabled = !isSelected && atMax;
          return (
            <button
              key={reason}
              onClick={() => !isDisabled && onToggleReason(reason)}
              disabled={isDisabled}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                isSelected
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : isDisabled
                    ? "bg-secondary/20 text-muted-foreground/30 border border-border/10 cursor-not-allowed"
                    : "bg-secondary/50 text-muted-foreground border border-border/30 hover:border-border/60"
              }`}
            >
              {reason}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {showComment && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <textarea
              value={comment}
              onChange={(e) => onCommentChange(e.target.value.slice(0, 100))}
              placeholder="Descreva o motivo (máx. 100 caracteres)"
              maxLength={100}
              className="mt-2 w-full p-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none h-16 focus:outline-none focus:border-primary/40"
            />
            <p className="text-[10px] text-muted-foreground/50 text-right">{comment.length}/100</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function RatingPage() {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const { user, isAuthenticated } = useAuth();
  const saveRatingMutation = trpc.ratings.save.useMutation();
  
  const { data: estData, isLoading: estLoading } = trpc.establishments.getWithMenu.useQuery(
    { slug: establishmentId || "" },
    { enabled: !!establishmentId }
  );

  // Transform DB data to match the expected format
  const establishment = estData ? {
    id: estData.slug,
    name: estData.name,
    menu: (estData.menu || []).map((m: any) => ({
      id: String(m.id),
      name: m.name,
      description: m.description || "",
      price: Number(m.price),
      category: m.category || "outro",
    })),
    rating: Number(estData.rating) || 0,
    reviewCount: estData.reviewCount || 0,
    image: estData.image || "",
    address: estData.address || "",
    neighborhood: estData.neighborhood || "",
    hours: estData.hours || "",
    phone: estData.phone || "",
    instagram: estData.instagram || "",
    lat: estData.lat || 0,
    lng: estData.lng || 0,
  } : null;

  const backHref = estData?.category ? `/categoria/${estData.category.slug}` : "/#categorias";
  const parentCategory = estData?.category ? { id: estData.category.slug, name: estData.category.name } : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [savedReviewData, setSavedReviewData] = useState<{ score: number; items: string[]; mode: string; date?: string } | null>(null);
  const [step, setStep] = useState<Step>("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<RatingMode>("direto");
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);
  const [spendData, setSpendData] = useState<SpendData>({
    servicePercent: "none",
    couvertEnabled: false,
    couvertValue: "",
    valetEnabled: false,
    valetValue: "",
    parkingEnabled: false,
    parkingValue: "",
  });
  const [directRatings, setDirectRatings] = useState<DirectRating[]>([]);
  const [currentDirectIdx, setCurrentDirectIdx] = useState(0);

  const [analyticItemRatings, setAnalyticItemRatings] = useState<AnalyticItemRating[]>([]);
  const [currentAnalyticItemIdx, setCurrentAnalyticItemIdx] = useState(0);

  // Beverages-only direct ratings for analytic mode
  const [bevDirectRatings, setBevDirectRatings] = useState<BevDirectRating[]>([]);
  const [currentBevDirectIdx, setCurrentBevDirectIdx] = useState(0);

  // Determine if harmonização should be included (need both food AND beverage)
  const hasFood = useMemo(() => {
    if (!establishment) return false;
    return selectedItems.some((id) => {
      const item = establishment.menu.find((m) => m.id === id);
      return item && isFoodItem(item);
    });
  }, [selectedItems, establishment]);

  const hasBeverage = useMemo(() => {
    if (!establishment) return false;
    return selectedItems.some((id) => {
      const item = establishment.menu.find((m) => m.id === id);
      return item && isBeverageItem(item);
    });
  }, [selectedItems, establishment]);

  const showHarmonizacao = hasFood && hasBeverage;

  // Global criteria: exclude c1, c2, and conditionally c10
  const globalCriteria = useMemo(() => {
    return PUB_CRITERIA.filter((c) => {
      if (c.id === "c1" || c.id === "c2") return false;
      if (c.id === "c10" && !showHarmonizacao) return false;
      return true;
    });
  }, [showHarmonizacao]);

  const [analyticGlobalRatings, setAnalyticGlobalRatings] = useState<AnalyticGlobalRating[]>([]);

  // Re-initialize global ratings when globalCriteria changes
  const initGlobalRatings = () => {
    return globalCriteria.map((c) => ({
      criterionId: c.id,
      subScores: Object.fromEntries(c.subcriteria.map((s) => [s.id, 0])),
      lowReasons: Object.fromEntries(c.subcriteria.map((s) => [s.id, []])),
      lowComments: Object.fromEntries(c.subcriteria.map((s) => [s.id, ""])),
    }));
  };

  const [bonuses, setBonuses] = useState<string[]>([]);

  // Qualify step state
  const [itemComments, setItemComments] = useState<ItemComment[]>([]);
  const [photos, setPhotos] = useState<PhotoWithTags[]>([]);
  const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);
  const [photoTaggingId, setPhotoTaggingId] = useState<string | null>(null); // which photo is being tagged

  // Track if user attempted to advance without completing required fields
  const [validationAttempted, setValidationAttempted] = useState(false);

  // NOTE: No early returns allowed here — all hooks must be called unconditionally.
  // Loading and empty states are handled in the JSX below.

  const menuItems = establishment?.menu || [];
  const selectedMenuItems = menuItems.filter((m) => selectedItems.includes(m.id));
  const ratableSelectedItems = selectedMenuItems.filter(isRatableItem);

  // Check if user selected ONLY beverages (no food items at all)
  const onlyBeverages = selectedMenuItems.length > 0 && selectedMenuItems.every((m) => isBeverageItem(m));

  const entradas = menuItems.filter((m) => m.category === "entrada" || m.category === "petisco" || m.category === "salgado");
  const pratos = menuItems.filter((m) => m.category === "prato" || m.category === "hamburguer" || m.category === "pizza" || m.category === "lanche" || m.category === "sanduiche" || m.category === "sushi" || m.category === "temaki" || m.category === "ramen" || m.category === "salada" || m.category === "sopa" || m.category === "focaccia");
  const sobremesas = menuItems.filter((m) => m.category === "sobremesa" || m.category === "doce" || m.category === "torta");
  const cervejas = menuItems.filter((m) => m.category === "cerveja" || m.category === "chopp");
  const bebidas = menuItems.filter((m) => m.category === "bebida" || m.category === "café");
  const destilados = menuItems.filter((m) => m.category === "destilado");
  const drinks = menuItems.filter((m) => m.category === "drink" || m.category === "vinho");
  const paes = menuItems.filter((m) => m.category === "pão" || m.category === "padaria");

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const startRating = () => {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos um item que você consumiu.");
      return;
    }
    // Direct ratings for all items
    setDirectRatings(
      selectedItems.map((id) => ({ itemId: id, serves: 0, recommend: null, taste: 0, lowReasons: [], lowComment: "" }))
    );
    // Beverage direct ratings for analytic beverages-only flow
    const bevItems = menuItems.filter((m) => selectedItems.includes(m.id) && isBeverageItem(m));
    setBevDirectRatings(
      bevItems.map((m) => ({ itemId: m.id, serves: 0, recommend: null, taste: 0, lowReasons: [], lowComment: "" }))
    );
    // Analytic item ratings for ratable items (food + drinks, not beer/chopp)
    const ratableItems = menuItems.filter((m) => selectedItems.includes(m.id) && isRatableItem(m));
    const c1 = PUB_CRITERIA.find((c) => c.id === "c1")!;
    const c2 = PUB_CRITERIA.find((c) => c.id === "c2")!;
    setAnalyticItemRatings(
      ratableItems.map((m) => ({
        itemId: m.id,
        subScores: {
          ...Object.fromEntries(c1.subcriteria.map((s) => [s.id, 0])),
          ...Object.fromEntries(c2.subcriteria.map((s) => [s.id, 0])),
        },
        lowReasons: {
          ...Object.fromEntries(c1.subcriteria.map((s) => [s.id, []])),
          ...Object.fromEntries(c2.subcriteria.map((s) => [s.id, []])),
        },
        lowComments: {
          ...Object.fromEntries(c1.subcriteria.map((s) => [s.id, ""])),
          ...Object.fromEntries(c2.subcriteria.map((s) => [s.id, ""])),
        },
      }))
    );
    setCurrentAnalyticItemIdx(0);
    setCurrentBevDirectIdx(0);
    setStep("visitDate");
  };

  const handleModeSelect = (selectedMode: RatingMode) => {
    setMode(selectedMode);
    // Initialize global ratings based on current selection
    const newGlobalRatings = initGlobalRatings();
    setAnalyticGlobalRatings(newGlobalRatings);

    if (selectedMode === "direto") {
      setCurrentDirectIdx(0);
      setStep("rating");
    } else {
      // Analytic mode
      if (onlyBeverages) {
        // Beverages-only: go to direct-style step first
        setCurrentBevDirectIdx(0);
        setStep("analyticBevDirect");
      } else {
        setCurrentAnalyticItemIdx(0);
        setStep("analyticItems");
      }
    }
  };

  // Direct mode helpers
  const updateDirectField = (idx: number, field: keyof DirectRating, value: number | boolean | null | string[] | string) => {
    setDirectRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const toggleDirectLowReason = (idx: number, reason: string) => {
    setDirectRatings((prev) => {
      const next = [...prev];
      const current = next[idx].lowReasons;
      if (current.includes(reason)) {
        next[idx] = { ...next[idx], lowReasons: current.filter((r) => r !== reason) };
      } else if (current.length < 3) {
        next[idx] = { ...next[idx], lowReasons: [...current, reason] };
      }
      return next;
    });
  };

  // Beverage direct rating helpers (for analytic beverages-only)
  const updateBevDirectField = (idx: number, field: keyof BevDirectRating, value: number | boolean | null | string[] | string) => {
    setBevDirectRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const toggleBevDirectLowReason = (idx: number, reason: string) => {
    setBevDirectRatings((prev) => {
      const next = [...prev];
      const current = next[idx].lowReasons;
      if (current.includes(reason)) {
        next[idx] = { ...next[idx], lowReasons: current.filter((r) => r !== reason) };
      } else if (current.length < 3) {
        next[idx] = { ...next[idx], lowReasons: [...current, reason] };
      }
      return next;
    });
  };

  // Analytic item helpers
  const updateAnalyticItemSubScore = (idx: number, subId: string, value: number) => {
    setAnalyticItemRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], subScores: { ...next[idx].subScores, [subId]: value } };
      return next;
    });
  };

  const toggleAnalyticItemLowReason = (idx: number, subId: string, reason: string) => {
    setAnalyticItemRatings((prev) => {
      const next = [...prev];
      const current = next[idx].lowReasons[subId] || [];
      if (current.includes(reason)) {
        next[idx] = {
          ...next[idx],
          lowReasons: { ...next[idx].lowReasons, [subId]: current.filter((r) => r !== reason) },
        };
      } else if (current.length < 3) {
        next[idx] = {
          ...next[idx],
          lowReasons: { ...next[idx].lowReasons, [subId]: [...current, reason] },
        };
      }
      return next;
    });
  };

  const updateAnalyticItemLowComment = (idx: number, subId: string, comment: string) => {
    setAnalyticItemRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], lowComments: { ...next[idx].lowComments, [subId]: comment } };
      return next;
    });
  };

  // Analytic global helpers
  const updateGlobalSubScore = (criterionId: string, subId: string, value: number) => {
    setAnalyticGlobalRatings((prev) =>
      prev.map((r) =>
        r.criterionId === criterionId
          ? { ...r, subScores: { ...r.subScores, [subId]: value } }
          : r
      )
    );
  };

  const toggleGlobalLowReason = (criterionId: string, subId: string, reason: string) => {
    setAnalyticGlobalRatings((prev) =>
      prev.map((r) => {
        if (r.criterionId !== criterionId) return r;
        const current = r.lowReasons[subId] || [];
        if (current.includes(reason)) {
          return { ...r, lowReasons: { ...r.lowReasons, [subId]: current.filter((x) => x !== reason) } };
        } else if (current.length < 3) {
          return { ...r, lowReasons: { ...r.lowReasons, [subId]: [...current, reason] } };
        }
        return r;
      })
    );
  };

  const updateGlobalLowComment = (criterionId: string, subId: string, comment: string) => {
    setAnalyticGlobalRatings((prev) =>
      prev.map((r) =>
        r.criterionId === criterionId
          ? { ...r, lowComments: { ...r.lowComments, [subId]: comment } }
          : r
      )
    );
  };

  const toggleBonus = (id: string) => {
    setBonuses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // ============================================================
  // VALIDATION: all fields mandatory, low-score reasons 1-3 required
  // ============================================================

  const hasValidLowReasons = (score: number, reasons: string[], comment: string): boolean => {
    if (score > 0 && score <= 6) {
      if (reasons.length === 0) return false;
      if (reasons.length > 3) return false;
      // If "Outra"/"Outros" is selected, comment must not be empty
      if ((reasons.includes("Outra") || reasons.includes("Outros")) && comment.trim().length === 0) return false;
    }
    return true;
  };

  const isDirectItemComplete = (rating: DirectRating): boolean => {
    if (rating.serves <= 0 || rating.recommend === null || rating.taste <= 0) return false;
    if (!hasValidLowReasons(rating.taste, rating.lowReasons, rating.lowComment)) return false;
    return true;
  };

  const isBevDirectItemComplete = (rating: BevDirectRating): boolean => {
    if (rating.serves <= 0 || rating.recommend === null || rating.taste <= 0) return false;
    if (!hasValidLowReasons(rating.taste, rating.lowReasons, rating.lowComment)) return false;
    return true;
  };

  const isAnalyticItemComplete = (rating: AnalyticItemRating): boolean => {
    const item = menuItems.find((m) => m.id === rating.itemId);
    const itemType = item ? getItemType(item) : "outro";
    const isBev = itemType === "cerveja" || itemType === "drink" || itemType === "destilado" || itemType === "bebida";
    const saborSubs = ["c1_1", "c1_2", "c1_3", "c1_4"];
    const apresSubs = isBev ? ["c2_4", "c2_5", "c2_6"] : ["c2_1", "c2_2", "c2_3"];
    const requiredSubs = [...saborSubs, ...apresSubs];
    for (const subId of requiredSubs) {
      const score = rating.subScores[subId] || 0;
      if (score <= 0) return false;
      if (!hasValidLowReasons(score, rating.lowReasons[subId] || [], rating.lowComments[subId] || "")) return false;
    }
    return true;
  };

  const areAllGlobalCriteriaComplete = (): boolean => {
    return analyticGlobalRatings.every((r) => {
      const criterion = globalCriteria.find((c) => c.id === r.criterionId);
      if (!criterion) return true;
      return criterion.subcriteria.every((sub) => {
        const score = r.subScores[sub.id] || 0;
        if (score <= 0) return false;
        if (!hasValidLowReasons(score, r.lowReasons[sub.id] || [], r.lowComments[sub.id] || "")) return false;
        return true;
      });
    });
  };

  // ============================================================
  // SCORE CALCULATION
  // ============================================================

  const finalScore = useMemo(() => {
    let base = 0;
    if (mode === "direto") {
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      base = (avgTaste / 10) * 25;
    } else {
      // Analytic mode
      if (onlyBeverages) {
        // Beverages-only: use bevDirectRatings for Sabor score
        const avgTaste = bevDirectRatings.reduce((s, r) => s + r.taste, 0) / (bevDirectRatings.length || 1);
        const c1 = PUB_CRITERIA.find((c) => c.id === "c1")!;
        base = (avgTaste / 10) * c1.weight;
        // No c2 (Apresentação) score for beverages-only in this flow
        // c2 weight is redistributed or zeroed — we skip it
      } else {
        const c1 = PUB_CRITERIA.find((c) => c.id === "c1")!;
        let avgSabor = 0;
        if (analyticItemRatings.length > 0) {
          const itemAvgs = analyticItemRatings.map((ir) => {
            const subs = c1.subcriteria.map((s) => ir.subScores[s.id] || 0);
            return subs.reduce((a, b) => a + b, 0) / subs.length;
          });
          avgSabor = itemAvgs.reduce((a, b) => a + b, 0) / itemAvgs.length;
        }
        const c1Score = (avgSabor / 10) * c1.weight;

        const c2 = PUB_CRITERIA.find((c) => c.id === "c2")!;
        let avgApres = 0;
        if (analyticItemRatings.length > 0) {
          const itemAvgs = analyticItemRatings.map((ir) => {
            const item = menuItems.find((m) => m.id === ir.itemId);
            const iType = item ? getItemType(item) : "outro";
            const isBev = iType === "cerveja" || iType === "drink";
            const relevantIds = isBev ? ["c2_4", "c2_5", "c2_6"] : ["c2_1", "c2_2", "c2_3"];
            const subs = relevantIds.map((sid) => ir.subScores[sid] || 0);
            return subs.reduce((a, b) => a + b, 0) / subs.length;
          });
          avgApres = itemAvgs.reduce((a, b) => a + b, 0) / itemAvgs.length;
        }
        const c2Score = (avgApres / 10) * c2.weight;
        base = c1Score + c2Score;
      }

      // Global criteria score (already filtered to exclude c10 if no harmonização)
      const globalScore = analyticGlobalRatings.reduce((sum, r) => {
        const criterion = PUB_CRITERIA.find((c) => c.id === r.criterionId);
        if (!criterion) return sum;
        const subs = criterion.subcriteria.map((s) => r.subScores[s.id] || 0);
        const avg = subs.length > 0 ? subs.reduce((a, b) => a + b, 0) / subs.length : 0;
        return sum + (avg / 10) * criterion.weight;
      }, 0);

      base += globalScore;
    }
    const bonusPoints = BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).reduce((s, b) => s + b.points, 0);
    return Math.min(115, Math.round(base + bonusPoints));
  }, [mode, directRatings, analyticItemRatings, analyticGlobalRatings, bonuses, bevDirectRatings, onlyBeverages]);

  // Classification
  const getClassification = (score: number, isDirectMode: boolean) => {
    if (isDirectMode) {
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      if (avgTaste >= 9) return { label: "Excepcional", color: "text-green-400" };
      if (avgTaste >= 8) return { label: "Excelente", color: "text-green-400" };
      if (avgTaste >= 7) return { label: "Muito Bom", color: "text-primary" };
      if (avgTaste >= 6) return { label: "Bom", color: "text-primary" };
      if (avgTaste >= 5) return { label: "Regular", color: "text-yellow-400" };
      return { label: "Abaixo da Média", color: "text-red-400" };
    }
    if (score >= 90) return { label: "Excepcional", color: "text-green-400" };
    if (score >= 80) return { label: "Excelente", color: "text-green-400" };
    if (score >= 70) return { label: "Muito Bom", color: "text-primary" };
    if (score >= 60) return { label: "Bom", color: "text-primary" };
    if (score >= 50) return { label: "Regular", color: "text-yellow-400" };
    return { label: "Abaixo da Média", color: "text-red-400" };
  };

  const classification = getClassification(finalScore, mode === "direto");
  const scoreColor = classification.color;
  const scoreLabel = classification.label;

  const muitoBomDescription = mode === "direto"
    ? "No modo Direto, a classificação é baseada exclusivamente na sua nota de Sabor para cada item consumido. Recomendação e quantidade de pessoas são registros qualitativos sem peso na nota."
    : "Para alcançar \"Muito Bom\", o estabelecimento precisa de boa execução em Sabor, Custo-Benefício e Ambiente — os três critérios de maior impacto na nota final.";

  const ItemSelector = ({ items, title }: { items: MenuItem[]; title: string }) => (
    items.length > 0 ? (
      <div className="mb-6">
        <h4 className="font-display text-lg tracking-wider text-primary mb-3">{title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                selectedItems.includes(item.id)
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/30 bg-secondary/30 hover:border-border/60"
              }`}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                selectedItems.includes(item.id) ? "bg-primary border-primary" : "border-muted-foreground/40"
              }`}>
                {selectedItems.includes(item.id) && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
              </div>
              <span className="font-numbers text-xs text-primary shrink-0">R${item.price.toFixed(0)}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null
  );

  // ============================================================
  // STEP NUMBERING: items and mode are NOT numbered
  // Only evaluation steps get numbers
  // ============================================================

  const getNumberedSteps = (): { step: Step; label: string }[] => {
    if (mode === "direto") {
      return [
        { step: "rating", label: "Avaliação" },
        { step: "bonus", label: "Bônus" },
        { step: "result", label: "Resultado" },
      ];
    }
    // Analytic mode
    if (onlyBeverages) {
      return [
        { step: "analyticBevDirect", label: "Avaliação" },
        { step: "analyticGlobal", label: "Critérios Gerais" },
        { step: "bonus", label: "Bônus" },
        { step: "result", label: "Resultado" },
      ];
    }
    return [
      { step: "analyticItems", label: "Sabor e Apresentação" },
      { step: "analyticGlobal", label: "Critérios Gerais" },
      { step: "bonus", label: "Bônus" },
      { step: "result", label: "Resultado" },
    ];
  };

  const numberedSteps = getNumberedSteps();
  const currentNumberedIdx = numberedSteps.findIndex((s) => s.step === step);
  const isNumberedStep = currentNumberedIdx >= 0;

  // Helper to render a direct-style rating card (used in both Direct mode and Analytic beverages-only)
  const renderDirectStyleCard = (
    rating: { itemId: string; serves: number; recommend: boolean | null; taste: number; lowReasons: string[]; lowComment: string },
    idx: number,
    total: number,
    updateField: (idx: number, field: string, value: any) => void,
    toggleLow: (idx: number, reason: string) => void,
  ) => {
    const item = menuItems.find((m) => m.id === rating.itemId);
    const itemType = item ? getItemType(item) : "outro";
    const tasteReasons = DIRECT_TASTE_REASONS[itemType] || DIRECT_TASTE_REASONS.outro;
    return (
      <div className="p-6 rounded-xl bg-card border border-border/50">
        <h4 className="font-display text-xl tracking-wider text-foreground">{item?.name}</h4>
        <p className="text-xs text-muted-foreground/60 mb-1 uppercase tracking-wide">
          {itemType === "cerveja" ? "Cerveja / Chopp" : itemType === "bebida" ? "Bebida" : itemType === "drink" ? "Drink / Coquetel" : itemType === "destilado" ? "Destilado / Highball" : itemType === "entrada" ? "Entrada / Porção" : itemType === "prato" ? "Prato / Lanche" : itemType === "sobremesa" ? "Sobremesa" : "Item"}
        </p>
        <p className="text-sm text-muted-foreground mb-6">{item?.description}</p>

        {/* Serves */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" /> Serve quantas pessoas?
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => updateField(idx, "serves", n)}
                className={`w-12 h-12 rounded-lg font-numbers text-lg font-bold transition-all ${
                  rating.serves === n ? "bg-primary text-primary-foreground glow-amber" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {n}{n === 5 ? "+" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Recommend */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-3 block">Recomendaria?</label>
          <div className="flex gap-3">
            <button
              onClick={() => updateField(idx, "recommend", true)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                rating.recommend === true ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-secondary text-muted-foreground border border-border/30"
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> Sim
            </button>
            <button
              onClick={() => updateField(idx, "recommend", false)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                rating.recommend === false ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-secondary text-muted-foreground border border-border/30"
              }`}
            >
              <ThumbsDown className="w-4 h-4" /> Não
            </button>
          </div>
        </div>

        {/* Taste */}
        <div>
          <ScoreButtons
            value={rating.taste}
            onChange={(v) => updateField(idx, "taste", v)}
            label="Nota de Sabor"
          />
          <AnimatePresence>
            {rating.taste > 0 && rating.taste <= 6 && (
              <LowScoreReasons
                reasons={tasteReasons}
                selectedReasons={rating.lowReasons}
                onToggleReason={(r) => toggleLow(idx, r)}
                comment={rating.lowComment}
                onCommentChange={(c) => updateField(idx, "lowComment", c)}
                showError={validationAttempted}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (estLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!establishment) return <Redirect to="/" />;

  return (
    <div className="min-h-screen">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref={backHref} onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-24 pb-16">
        <div className="container max-w-2xl">
          {/* Progress bar — only shown for numbered steps */}
          {isNumberedStep && (
            <div className="flex items-center gap-2 mb-8">
              {numberedSteps.map((s, i) => (
                <div key={s.step} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s.step ? "bg-primary text-primary-foreground glow-amber" :
                    currentNumberedIdx > i ? "bg-primary/30 text-primary" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  {i < numberedSteps.length - 1 && <div className={`flex-1 h-0.5 ${currentNumberedIdx > i ? "bg-primary/40" : "bg-border/30"}`} />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Item Selection — NO number */}
            {step === "items" && (
              <motion.div key="items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h3 className="font-display text-2xl tracking-wider text-primary">O QUE VOCÊ CONSUMIU?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Olá <span className="text-foreground font-medium">{user?.username || user?.name || 'visitante'}</span>, que bom que veio ao <span className="text-foreground font-medium">{establishment.name}</span>! Selecione apenas os itens que você consumiu e nos fale da sua experiência.
                  </p>
                </div>
                <ItemSelector items={entradas} title={
                  parentCategory?.id === "cozinha-brasileira" || parentCategory?.id === "cozinha-internacional" || parentCategory?.id === "autoral" ? "ENTRADAS" :
                  parentCategory?.id === "confeitaria" || parentCategory?.id === "cafeteria" || parentCategory?.id === "padaria" ? "SALGADOS" : "PETISCOS & PORÇÕES"
                } />
                <ItemSelector items={pratos} title={
                  parentCategory?.id === "cozinha-brasileira" || parentCategory?.id === "cozinha-internacional" || parentCategory?.id === "autoral" ? "PRATOS PRINCIPAIS" : "PRATOS & SANDUÍCHES"
                } />
                <ItemSelector items={sobremesas} title="DOCES & SOBREMESAS" />
                <ItemSelector items={cervejas} title="CERVEJAS & CHOPP" />
                <ItemSelector items={bebidas} title={
                  parentCategory?.id === "confeitaria" || parentCategory?.id === "cafeteria" || parentCategory?.id === "padaria" ? "CAFÉS & BEBIDAS" : "BEBIDAS"
                } />
                <ItemSelector items={destilados} title="DESTILADOS" />
                <ItemSelector items={drinks} title={
                  parentCategory?.id === "cozinha-brasileira" || parentCategory?.id === "cozinha-internacional" || parentCategory?.id === "autoral" ? "VINHOS & DRINKS" : "DRINKS & COQUETÉIS"
                } />
                <ItemSelector items={paes} title="PÃES & PADARIA" />
                <div className="flex justify-end mt-6">
                  <Button onClick={startRating} className="font-display tracking-wider glow-amber">
                    CONTINUAR <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Visit Date Selection — NO number */}
            {step === "visitDate" && (
              <motion.div key="visitDate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <CalendarIcon className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">DATA DA VISITA</h3>
                    <p className="text-sm text-muted-foreground">Quando você visitou o {establishment.name}?</p>
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        visitDate ? "border-primary/60 bg-primary/10" : "border-border/30 bg-secondary/30 hover:border-border/60"
                      }`}>
                        <CalendarIcon className="w-5 h-5 text-primary shrink-0" />
                        <span className={`text-sm font-medium ${
                          visitDate ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {visitDate
                            ? visitDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
                            : "Selecione a data (dd/mm/aaaa)"
                          }
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={visitDate}
                        onSelect={setVisitDate}
                        locale={ptBR}
                        defaultMonth={new Date(2026, 0, 1)}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("items")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      if (!visitDate) {
                        toast.error("Selecione a data da sua visita.");
                        return;
                      }
                      setStep("mode");
                    }}
                    className="font-display tracking-wider glow-amber"
                  >
                    CONTINUAR <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Mode Selection — NO number — Analítica first, Direta second */}
            {step === "mode" && (
              <motion.div key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <ClipboardCheck className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">MODO DE AVALIAÇÃO</h3>
                    <p className="text-sm text-muted-foreground">Escolha como deseja avaliar</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleModeSelect("analitico")}
                    className="p-6 rounded-xl border text-left transition-all hover:border-accent/60 border-border/30 bg-card"
                  >
                    <BarChart3 className="w-8 h-8 text-accent mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">ANALÍTICO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação detalhada com subcritérios individuais. Para quem quer uma análise profunda.
                    </p>
                  </button>
                  <button
                    onClick={() => handleModeSelect("direto")}
                    className="p-6 rounded-xl border text-left transition-all hover:border-primary/60 border-border/30 bg-card"
                  >
                    <Zap className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">DIRETO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação rápida: nota de sabor, se recomenda e para quantas pessoas serve.
                    </p>
                  </button>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("visitDate")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Direct Mode: Per-item rating */}
            {step === "rating" && mode === "direto" && (
              <motion.div key="rating-direct" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">AVALIAÇÃO DIRETA</h3>
                    <p className="text-sm text-muted-foreground">Item {currentDirectIdx + 1} de {directRatings.length}</p>
                  </div>
                </div>
                {directRatings[currentDirectIdx] && renderDirectStyleCard(
                  directRatings[currentDirectIdx],
                  currentDirectIdx,
                  directRatings.length,
                  (idx, field, value) => updateDirectField(idx, field as keyof DirectRating, value),
                  toggleDirectLowReason,
                )}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => currentDirectIdx > 0 ? setCurrentDirectIdx(currentDirectIdx - 1) : setStep("mode")}
                    className="font-display tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      const rating = directRatings[currentDirectIdx];
                      if (!isDirectItemComplete(rating)) {
                        setValidationAttempted(true);
                        return;
                      }
                      setValidationAttempted(false);
                      if (currentDirectIdx < directRatings.length - 1) {
                        setCurrentDirectIdx(currentDirectIdx + 1);
                      } else {
                        setStep("bonus");
                      }
                    }}
                    className="font-display tracking-wider glow-amber"
                  >
                    {currentDirectIdx < directRatings.length - 1 ? "PRÓXIMO ITEM" : "BÔNUS"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Analytic Beverages-Only: Direct-style step */}
            {step === "analyticBevDirect" && mode === "analitico" && (
              <motion.div key="analytic-bev-direct" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">AVALIAÇÃO DE BEBIDAS</h3>
                    <p className="text-sm text-muted-foreground">Item {currentBevDirectIdx + 1} de {bevDirectRatings.length}</p>
                  </div>
                </div>
                {bevDirectRatings[currentBevDirectIdx] && renderDirectStyleCard(
                  bevDirectRatings[currentBevDirectIdx],
                  currentBevDirectIdx,
                  bevDirectRatings.length,
                  (idx, field, value) => updateBevDirectField(idx, field as keyof BevDirectRating, value),
                  toggleBevDirectLowReason,
                )}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => currentBevDirectIdx > 0 ? setCurrentBevDirectIdx(currentBevDirectIdx - 1) : setStep("mode")}
                    className="font-display tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      const rating = bevDirectRatings[currentBevDirectIdx];
                      if (!isBevDirectItemComplete(rating)) {
                        setValidationAttempted(true);
                        return;
                      }
                      setValidationAttempted(false);
                      if (currentBevDirectIdx < bevDirectRatings.length - 1) {
                        setCurrentBevDirectIdx(currentBevDirectIdx + 1);
                      } else {
                        setStep("analyticGlobal");
                      }
                    }}
                    className="font-display tracking-wider glow-amber"
                  >
                    {currentBevDirectIdx < bevDirectRatings.length - 1 ? "PRÓXIMO ITEM" : "CRITÉRIOS GERAIS"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Analytic: Per-item Sabor + Apresentação subcriteria */}
            {step === "analyticItems" && mode === "analitico" && (
              <motion.div key="analytic-items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">SABOR E APRESENTAÇÃO</h3>
                    <p className="text-sm text-muted-foreground">
                      {ratableSelectedItems.length > 0
                        ? `Item ${currentAnalyticItemIdx + 1} de ${ratableSelectedItems.length}`
                        : "Nenhum alimento ou drink selecionado"}
                    </p>
                  </div>
                </div>

                {ratableSelectedItems.length > 0 && analyticItemRatings[currentAnalyticItemIdx] && (() => {
                  const itemRating = analyticItemRatings[currentAnalyticItemIdx];
                  const item = menuItems.find((m) => m.id === itemRating.itemId);
                  const itemType = item ? getItemType(item) : "outro";
                  const c1 = PUB_CRITERIA.find((c) => c.id === "c1")!;
                  const c2 = PUB_CRITERIA.find((c) => c.id === "c2")!;

                  return (
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                      <h4 className="font-display text-xl tracking-wider text-foreground mb-1">{item?.name}</h4>
                      <p className="text-xs text-muted-foreground/60 mb-1 uppercase tracking-wide">
                        {itemType === "cerveja" ? "Cerveja / Chopp" : itemType === "bebida" ? "Bebida" : itemType === "drink" ? "Drink / Coquetel" : itemType === "destilado" ? "Destilado / Highball" : itemType === "entrada" ? "Entrada / Porção" : itemType === "prato" ? "Prato / Lanche" : itemType === "sobremesa" ? "Sobremesa" : "Item"}
                      </p>
                      <p className="text-sm text-muted-foreground mb-6">{item?.description}</p>

                      {/* Sabor e Execução subcriteria */}
                      <div className="mb-8">
                        <h5 className="text-base font-semibold text-foreground mb-4">Sabor e Execução</h5>
                        <div className="space-y-5">
                          {c1.subcriteria.map((sub) => (
                            <div key={sub.id} className="pl-3 border-l-2 border-primary/20">
                              <p className="text-sm font-medium text-foreground mb-1">{sub.name}</p>
                              <p className="text-xs text-muted-foreground mb-2">{sub.description}</p>
                              <ScoreButtons
                                value={itemRating.subScores[sub.id] || 0}
                                onChange={(v) => updateAnalyticItemSubScore(currentAnalyticItemIdx, sub.id, v)}
                              />
                              <AnimatePresence>
                                {(itemRating.subScores[sub.id] || 0) > 0 && (itemRating.subScores[sub.id] || 0) <= 6 && (
                                  <LowScoreReasons
                                    reasons={getAnalyticItemReasons(sub.id, itemType)}
                                    selectedReasons={itemRating.lowReasons[sub.id] || []}
                                    onToggleReason={(r) => toggleAnalyticItemLowReason(currentAnalyticItemIdx, sub.id, r)}
                                    comment={itemRating.lowComments[sub.id] || ""}
                                    onCommentChange={(c) => updateAnalyticItemLowComment(currentAnalyticItemIdx, sub.id, c)}
                                    showError={validationAttempted}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Apresentação subcriteria — split by COMIDA vs BEBIDA */}
                      {(() => {
                        const isBev = itemType === "cerveja" || itemType === "drink" || itemType === "destilado" || itemType === "bebida";
                        const foodSubs = c2.subcriteria.filter(s => ["c2_1", "c2_2", "c2_3"].includes(s.id));
                        const bevSubs = c2.subcriteria.filter(s => ["c2_4", "c2_5", "c2_6"].includes(s.id));
                        const subsToShow = isBev ? bevSubs : foodSubs;
                        const sectionTitle = isBev ? "Apresentação — Bebidas" : "Apresentação — Comidas";

                        return (
                          <div>
                            <h5 className="text-base font-semibold text-foreground mb-4">{sectionTitle}</h5>
                            <div className="space-y-5">
                              {subsToShow.map((sub) => (
                                <div key={sub.id} className="pl-3 border-l-2 border-accent/20">
                                  <p className="text-sm font-medium text-foreground mb-1">{sub.name}</p>
                                  <p className="text-xs text-muted-foreground mb-2">{sub.description}</p>
                                  <ScoreButtons
                                    value={itemRating.subScores[sub.id] || 0}
                                    onChange={(v) => updateAnalyticItemSubScore(currentAnalyticItemIdx, sub.id, v)}
                                  />
                                  <AnimatePresence>
                                    {(itemRating.subScores[sub.id] || 0) > 0 && (itemRating.subScores[sub.id] || 0) <= 6 && (
                                      <LowScoreReasons
                                        reasons={getAnalyticItemReasons(sub.id, itemType)}
                                        selectedReasons={itemRating.lowReasons[sub.id] || []}
                                        onToggleReason={(r) => toggleAnalyticItemLowReason(currentAnalyticItemIdx, sub.id, r)}
                                        comment={itemRating.lowComments[sub.id] || ""}
                                        onCommentChange={(c) => updateAnalyticItemLowComment(currentAnalyticItemIdx, sub.id, c)}
                                        showError={validationAttempted}
                                      />
                                    )}
                                  </AnimatePresence>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {ratableSelectedItems.length === 0 && (
                  <div className="p-8 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-muted-foreground">Você selecionou apenas cervejas/chopps. Sabor e Apresentação são avaliados nos critérios gerais.</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentAnalyticItemIdx > 0) setCurrentAnalyticItemIdx(currentAnalyticItemIdx - 1);
                      else setStep("mode");
                    }}
                    className="font-display tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      if (ratableSelectedItems.length > 0 && analyticItemRatings[currentAnalyticItemIdx]) {
                        if (!isAnalyticItemComplete(analyticItemRatings[currentAnalyticItemIdx])) {
                          setValidationAttempted(true);
                          return;
                        }
                      }
                      setValidationAttempted(false);
                      if (ratableSelectedItems.length > 0 && currentAnalyticItemIdx < ratableSelectedItems.length - 1) {
                        setCurrentAnalyticItemIdx(currentAnalyticItemIdx + 1);
                      } else {
                        setStep("analyticGlobal");
                      }
                    }}
                    className="font-display tracking-wider glow-amber"
                  >
                    {ratableSelectedItems.length > 0 && currentAnalyticItemIdx < ratableSelectedItems.length - 1
                      ? "PRÓXIMO ITEM"
                      : "CRITÉRIOS GERAIS"
                    } <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Analytic: Global criteria */}
            {step === "analyticGlobal" && mode === "analitico" && (
              <motion.div key="analytic-global" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">CRITÉRIOS GERAIS</h3>
                    <p className="text-sm text-muted-foreground">Avalie cada subcritério individualmente</p>
                  </div>
                </div>
                <div className="space-y-6">
                  {globalCriteria.map((criterion) => {
                    const gRating = analyticGlobalRatings.find((r) => r.criterionId === criterion.id);
                    if (!gRating) return null;
                    return (
                      <div key={criterion.id} className="p-5 rounded-xl bg-card border border-border/50">
                        <h4 className="font-display text-lg tracking-wider text-foreground mb-1">{criterion.name}</h4>
                        <p className="text-xs text-muted-foreground mb-4">{criterion.description}</p>

                        <div className="space-y-5">
                          {criterion.subcriteria.map((sub) => (
                            <div key={sub.id} className="pl-3 border-l-2 border-primary/20">
                              <p className="text-sm font-medium text-foreground mb-1">{sub.name}</p>
                              <p className="text-xs text-muted-foreground mb-2">{sub.description}</p>
                              <ScoreButtons
                                value={gRating.subScores[sub.id] || 0}
                                onChange={(v) => updateGlobalSubScore(criterion.id, sub.id, v)}
                              />
                              <AnimatePresence>
                                {(gRating.subScores[sub.id] || 0) > 0 && (gRating.subScores[sub.id] || 0) <= 6 && (
                                  <LowScoreReasons
                                    reasons={GLOBAL_LOW_SCORE_REASONS[sub.id] || ["Poderia melhorar", "Abaixo do esperado", "Outra"]}
                                    selectedReasons={gRating.lowReasons[sub.id] || []}
                                    onToggleReason={(r) => toggleGlobalLowReason(criterion.id, sub.id, r)}
                                    comment={gRating.lowComments[sub.id] || ""}
                                    onCommentChange={(c) => updateGlobalLowComment(criterion.id, sub.id, c)}
                                    showError={validationAttempted}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => {
                    if (onlyBeverages) setStep("analyticBevDirect");
                    else setStep("analyticItems");
                  }} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      if (!areAllGlobalCriteriaComplete()) {
                        setValidationAttempted(true);
                        return;
                      }
                      setValidationAttempted(false);
                      setStep("bonus");
                    }}
                    className="font-display tracking-wider glow-amber"
                  >
                    BÔNUS <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Bonus Step */}
            {step === "bonus" && (
              <motion.div key="bonus" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">PONTOS BÔNUS</h3>
                    <p className="text-sm text-muted-foreground">Marque os diferenciais que o estabelecimento oferece</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {BONUS_CRITERIA.map((bonus) => (
                    <button
                      key={bonus.id}
                      onClick={() => toggleBonus(bonus.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        bonuses.includes(bonus.id)
                          ? "border-primary/60 bg-primary/10"
                          : "border-border/30 bg-card hover:border-border/60"
                      }`}
                    >
                      <Checkbox checked={bonuses.includes(bonus.id)} />
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-foreground">{bonus.name}</h5>
                        <p className="text-xs text-muted-foreground">{bonus.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(mode === "analitico" ? "analyticGlobal" : "rating")}
                    className="font-display tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button onClick={() => setStep("spend")} className="font-display tracking-wider glow-amber">
                    CONTA <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Spend Summary Step */}
            {step === "spend" && (() => {
              // Calculate subtotal from selected items
              const itemsSubtotal = selectedMenuItems.reduce((sum, item) => sum + item.price, 0);
              const serviceAmount = spendData.servicePercent === "10" ? itemsSubtotal * 0.10
                : spendData.servicePercent === "13" ? itemsSubtotal * 0.13 : 0;
              const couvertAmount = spendData.couvertEnabled ? parseFloat(spendData.couvertValue.replace(",", ".")) || 0 : 0;
              const valetAmount = spendData.valetEnabled ? parseFloat(spendData.valetValue.replace(",", ".")) || 0 : 0;
              const parkingAmount = spendData.parkingEnabled ? parseFloat(spendData.parkingValue.replace(",", ".")) || 0 : 0;
              const totalSpend = itemsSubtotal + serviceAmount + couvertAmount + valetAmount + parkingAmount;

              return (
                <motion.div key="spend" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <Receipt className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-display text-2xl tracking-wider text-primary">RESUMO DA CONTA</h3>
                      <p className="text-sm text-muted-foreground">Quanto você gastou nessa visita?</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-card border border-border/50 space-y-5">
                    {/* Items subtotal */}
                    <div className="flex items-center justify-between pb-4 border-b border-border/30">
                      <span className="text-sm text-muted-foreground">Subtotal dos itens ({selectedMenuItems.length})</span>
                      <span className="font-numbers text-lg text-foreground font-bold">R$ {itemsSubtotal.toFixed(2).replace(".", ",")}</span>
                    </div>

                    {/* Service charge */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Taxa de serviço</label>
                      <div className="flex gap-2">
                        {(["none", "10", "13"] as const).map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setSpendData(prev => ({ ...prev, servicePercent: opt }))}
                            className={`flex-1 py-3 rounded-lg font-numbers text-sm font-bold transition-all ${
                              spendData.servicePercent === opt
                                ? "bg-primary text-primary-foreground glow-amber"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {opt === "none" ? "Sem" : `${opt}%`}
                          </button>
                        ))}
                      </div>
                      {spendData.servicePercent !== "none" && (
                        <p className="text-xs text-muted-foreground/60 mt-1 text-right">
                          + R$ {serviceAmount.toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </div>

                    {/* Couvert artístico */}
                    <div>
                      <button
                        onClick={() => setSpendData(prev => ({ ...prev, couvertEnabled: !prev.couvertEnabled }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          spendData.couvertEnabled ? "border-primary/60 bg-primary/10" : "border-border/30 bg-secondary/30 hover:border-border/60"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          spendData.couvertEnabled ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {spendData.couvertEnabled && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">Couvert artístico</span>
                      </button>
                      {spendData.couvertEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={spendData.couvertValue}
                            onChange={(e) => setSpendData(prev => ({ ...prev, couvertValue: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground font-numbers placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                          />
                        </div>
                      )}
                    </div>

                    {/* Valet */}
                    <div>
                      <button
                        onClick={() => setSpendData(prev => ({ ...prev, valetEnabled: !prev.valetEnabled }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          spendData.valetEnabled ? "border-primary/60 bg-primary/10" : "border-border/30 bg-secondary/30 hover:border-border/60"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          spendData.valetEnabled ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {spendData.valetEnabled && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">Valet</span>
                      </button>
                      {spendData.valetEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={spendData.valetValue}
                            onChange={(e) => setSpendData(prev => ({ ...prev, valetValue: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground font-numbers placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                          />
                        </div>
                      )}
                    </div>

                    {/* Estacionamento */}
                    <div>
                      <button
                        onClick={() => setSpendData(prev => ({ ...prev, parkingEnabled: !prev.parkingEnabled }))}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          spendData.parkingEnabled ? "border-primary/60 bg-primary/10" : "border-border/30 bg-secondary/30 hover:border-border/60"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          spendData.parkingEnabled ? "bg-primary border-primary" : "border-muted-foreground/40"
                        }`}>
                          {spendData.parkingEnabled && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm font-medium text-foreground">Estacionamento</span>
                      </button>
                      {spendData.parkingEnabled && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={spendData.parkingValue}
                            onChange={(e) => setSpendData(prev => ({ ...prev, parkingValue: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground font-numbers placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                          />
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-4 border-t border-primary/30">
                      <span className="font-display text-lg tracking-wider text-primary">TOTAL</span>
                      <span className="font-numbers text-2xl text-primary font-bold text-glow-amber">
                        R$ {totalSpend.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep("bonus")}
                      className="font-display tracking-wider"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                    </Button>
                    <Button onClick={() => {
                      // Initialize item comments if not already done
                      if (itemComments.length === 0) {
                        setItemComments(selectedMenuItems.map(m => ({ itemId: m.id, comment: "" })));
                      }
                      setStep("qualify");
                    }} className="font-display tracking-wider glow-amber">
                      QUALIFICAR <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })()}

            {/* Qualify Step - Item Comments, Photos with Tags, Receipt */}
            {step === "qualify" && (
              <motion.div key="qualify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Camera className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">QUALIFICAR AVALIAÇÃO</h3>
                    <p className="text-sm text-muted-foreground">Adicione fotos e comentários para ganhar pontos extras!</p>
                  </div>
                </div>

                {/* Qualification criteria info */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                  <p className="text-xs text-primary/80 leading-relaxed">
                    <strong>Avaliação qualificada = 2x pontos para badges!</strong> Adicione comentários nos itens (mín. 20 caracteres), fotos marcando os itens, e a foto da notinha para bonificação extra.
                  </p>
                </div>

                {/* Item Comments Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h4 className="font-display text-lg tracking-wider text-foreground">COMENTÁRIOS POR ITEM</h4>
                  </div>
                  <div className="space-y-3">
                    {itemComments.map((ic) => {
                      const item = menuItems.find(m => m.id === ic.itemId);
                      if (!item) return null;
                      return (
                        <div key={ic.itemId} className="p-4 rounded-xl bg-card border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            <span className={`text-[10px] font-numbers ${ic.comment.length >= 20 ? 'text-green-400' : 'text-muted-foreground/50'}`}>
                              {ic.comment.length}/200 {ic.comment.length >= 20 && '✓'}
                            </span>
                          </div>
                          <textarea
                            value={ic.comment}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 200);
                              setItemComments(prev => prev.map(c => c.itemId === ic.itemId ? { ...c, comment: val } : c));
                            }}
                            placeholder="Como foi esse item? (mín. 20 caracteres para qualificar)"
                            className="w-full p-3 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none h-20 focus:outline-none focus:border-primary/40"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photos Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Image className="w-4 h-4 text-primary" />
                    <h4 className="font-display text-lg tracking-wider text-foreground">FOTOS DOS ITENS</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Tire fotos e marque quais itens aparecem em cada uma.</p>

                  {/* Photo grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group">
                        <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => setPhotoTaggingId(photo.id)}
                            className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                          >
                            Editar tags
                          </button>
                        </div>
                        <button
                          onClick={() => setPhotos(prev => prev.filter(p => p.id !== photo.id))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {photo.taggedItemIds.length > 0 && (
                          <div className="absolute bottom-1 left-1 bg-green-500/80 text-white text-[9px] px-1.5 py-0.5 rounded">
                            {photo.taggedItemIds.length} {photo.taggedItemIds.length === 1 ? 'item' : 'itens'}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add photo button */}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors">
                      <Camera className="w-6 h-6 text-primary/60 mb-1" />
                      <span className="text-[10px] text-primary/60">Adicionar</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const newPhoto: PhotoWithTags = {
                              id: `photo_${Date.now()}`,
                              dataUrl: ev.target?.result as string,
                              taggedItemIds: [],
                            };
                            setPhotos(prev => [...prev, newPhoto]);
                            setPhotoTaggingId(newPhoto.id);
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  {/* Photo tagging modal */}
                  {photoTaggingId && (() => {
                    const photo = photos.find(p => p.id === photoTaggingId);
                    if (!photo) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-card border border-primary/30 mb-3"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-foreground">Quais itens estão nesta foto?</h5>
                          <button onClick={() => setPhotoTaggingId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <img src={photo.dataUrl} alt="" className="w-16 h-16 rounded-lg object-cover border border-border/30" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Selecione os itens que aparecem nesta foto:</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedMenuItems.map((item) => {
                            const isTagged = photo.taggedItemIds.includes(item.id);
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setPhotos(prev => prev.map(p => {
                                    if (p.id !== photoTaggingId) return p;
                                    const newTags = isTagged
                                      ? p.taggedItemIds.filter(id => id !== item.id)
                                      : [...p.taggedItemIds, item.id];
                                    return { ...p, taggedItemIds: newTags };
                                  }));
                                }}
                                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                                  isTagged
                                    ? "bg-primary/20 text-primary border border-primary/40"
                                    : "bg-secondary/50 text-muted-foreground border border-border/30 hover:border-border/60"
                                }`}
                              >
                                {isTagged && <Check className="w-3 h-3 inline mr-1" />}
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setPhotoTaggingId(null)}
                          className="mt-3 font-display tracking-wider text-xs"
                        >
                          CONFIRMAR
                        </Button>
                      </motion.div>
                    );
                  })()}
                </div>

                {/* Receipt Photo Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-4 h-4 text-primary" />
                    <h4 className="font-display text-lg tracking-wider text-foreground">FOTO DA NOTINHA</h4>
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">BÔNUS</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Opcional — valida os itens pedidos e dá bonificação extra.</p>

                  {receiptPhoto ? (
                    <div className="relative w-full max-w-[200px] aspect-[3/4] rounded-lg overflow-hidden border border-border/50">
                      <img src={receiptPhoto} alt="Notinha" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setReceiptPhoto(null)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full max-w-[200px] aspect-[3/4] rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors">
                      <Receipt className="w-8 h-8 text-primary/60 mb-2" />
                      <span className="text-xs text-primary/60">Fotografar notinha</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setReceiptPhoto(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Qualification summary */}
                {(() => {
                  const commentsOk = itemComments.filter(c => c.comment.length >= 20).length;
                  const photosOk = photos.filter(p => p.taggedItemIds.length > 0).length;
                  const hasReceipt = !!receiptPhoto;
                  const isQualified = commentsOk === selectedMenuItems.length && photosOk > 0;
                  return (
                    <div className={`p-4 rounded-xl border mb-6 ${isQualified ? 'bg-green-500/5 border-green-500/30' : 'bg-secondary/30 border-border/30'}`}>
                      <h5 className={`text-sm font-semibold mb-2 ${isQualified ? 'text-green-400' : 'text-muted-foreground'}`}>
                        {isQualified ? '✓ Avaliação Qualificada!' : 'Status da Qualificação'}
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={commentsOk === selectedMenuItems.length ? 'text-green-400' : 'text-muted-foreground'}>
                            {commentsOk === selectedMenuItems.length ? '✓' : '○'}
                          </span>
                          <span className="text-muted-foreground">Comentários: {commentsOk}/{selectedMenuItems.length} itens</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={photosOk > 0 ? 'text-green-400' : 'text-muted-foreground'}>
                            {photosOk > 0 ? '✓' : '○'}
                          </span>
                          <span className="text-muted-foreground">Fotos com itens marcados: {photosOk}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={hasReceipt ? 'text-green-400' : 'text-muted-foreground/50'}>
                            {hasReceipt ? '✓' : '○'}
                          </span>
                          <span className="text-muted-foreground">Foto da notinha {hasReceipt ? '' : '(opcional, bônus)'}</span>
                        </div>
                      </div>
                      {isQualified && (
                        <p className="text-[10px] text-green-400/80 mt-2">Esta avaliação valerá 2x pontos para o próximo badge{hasReceipt ? ' + bônus da notinha' : ''}!</p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep("spend")}
                    className="font-display tracking-wider"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep("result")}
                      className="font-display tracking-wider text-muted-foreground"
                    >
                      PULAR
                    </Button>
                    <Button onClick={() => setStep("result")} className="font-display tracking-wider glow-amber">
                      VER RESULTADO <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Result Step */}
            {step === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center py-8">
                  <h3 className="font-display text-2xl tracking-wider text-muted-foreground mb-2">RESULTADO DA AVALIAÇÃO</h3>
                  <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-8">
                    {establishment.name.toUpperCase()}
                  </h2>

                  <div className="relative inline-flex items-center justify-center w-48 h-48 rounded-full border-4 border-primary/30 glow-amber mb-6">
                    <div className="text-center px-4">
                      <span className={`font-display text-2xl tracking-wider font-bold leading-tight ${scoreColor}`}>
                        {scoreLabel.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Classification */}
                  <div className="text-left p-6 rounded-xl bg-card border border-border/50 mb-6">
                    <h4 className="font-display text-lg tracking-wider text-primary mb-4">CLASSIFICAÇÃO</h4>
                    <div className="space-y-2">
                      {[
                        { label: "Excepcional", active: scoreLabel === "Excepcional" },
                        { label: "Excelente", active: scoreLabel === "Excelente" },
                        { label: "Muito Bom", active: scoreLabel === "Muito Bom" },
                        { label: "Bom", active: scoreLabel === "Bom" },
                        { label: "Regular", active: scoreLabel === "Regular" },
                        { label: "Abaixo da Média", active: scoreLabel === "Abaixo da Média" },
                      ].map((tier) => (
                        <div
                          key={tier.label}
                          className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
                            tier.active ? "bg-primary/10 border border-primary/30" : "opacity-40"
                          }`}
                        >
                          <span className={`text-sm font-medium ${tier.active ? "text-primary" : "text-muted-foreground"}`}>
                            {tier.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What matters */}
                  <div className="text-left p-6 rounded-xl bg-card border border-border/50 mb-6">
                    <h4 className="font-display text-lg tracking-wider text-primary mb-3">
                      {mode === "direto" ? "COMO FUNCIONA" : "O QUE PESA MAIS?"}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{muitoBomDescription}</p>
                  </div>

                  {/* Items summary */}
                  <div className="text-left p-6 rounded-xl bg-card border border-border/50 mb-6">
                    <h4 className="font-display text-lg tracking-wider text-primary mb-4">ITENS AVALIADOS</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMenuItems.map((item) => (
                        <span key={item.id} className="text-xs bg-secondary/50 text-foreground/80 px-3 py-1.5 rounded-lg border border-border/30">
                          {item.name}
                        </span>
                      ))}
                    </div>
                    {(mode === "direto" || (mode === "analitico" && onlyBeverages)) && (
                      <div className="mt-4 pt-3 border-t border-border/20">
                        <div className="flex flex-wrap gap-3">
                          {(mode === "direto" ? directRatings : bevDirectRatings).map((r) => {
                            const item = menuItems.find((m) => m.id === r.itemId);
                            return (
                              <div key={r.itemId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{item?.name}</span>
                                <span>•</span>
                                <span>Serve {r.serves}</span>
                                <span>•</span>
                                {r.recommend
                                  ? <ThumbsUp className="w-3 h-3 text-green-400" />
                                  : <ThumbsDown className="w-3 h-3 text-red-400" />
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {bonuses.length > 0 && (
                    <div className="text-left p-6 rounded-xl bg-card border border-border/50 mb-6">
                      <h4 className="font-display text-lg tracking-wider text-primary mb-3">BÔNUS APLICADOS</h4>
                      <div className="flex flex-wrap gap-2">
                        {BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).map((b) => (
                          <span key={b.id} className="text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg border border-green-500/20">
                            {b.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    disabled={saveRatingMutation.isPending}
                    onClick={async () => {
                      // Check authentication
                      if (!isAuthenticated || !user) {
                        toast.error("Faça login para salvar sua avaliação", {
                          action: { label: "Entrar", onClick: () => { window.location.href = getLoginUrl(); } },
                        });
                        return;
                      }

                      // Determine qualification status
                      const commentsOk = itemComments.filter(c => c.comment.length >= 20).length;
                      const photosOk = photos.filter(p => p.taggedItemIds.length > 0).length;
                      const hasReceipt = !!receiptPhoto;
                      const isQualified = commentsOk === selectedMenuItems.length && photosOk > 0;

                      // Calculate badge points
                      let points = 1;
                      if (isQualified) points = 2;
                      if (isQualified && hasReceipt) points = 2.5;

                      // Streak bonus: check last 2 reviews from localStorage
                      const existingRaw = localStorage.getItem("avalyarin_reviews");
                      const existing = existingRaw ? JSON.parse(existingRaw) : [];
                      if (isQualified && existing.length >= 2) {
                        const last2 = existing.slice(-2);
                        const allQualified = last2.every((r: { isQualified?: boolean }) => r.isQualified === true);
                        if (allQualified) {
                          points = 3;
                          if (hasReceipt) points = 3.5;
                        }
                      }

                      // Calculate spend values
                      const itemsSubtotal = selectedMenuItems.reduce((sum, item) => sum + item.price, 0);
                      const serviceAmount = spendData.servicePercent === "10" ? itemsSubtotal * 0.10
                        : spendData.servicePercent === "13" ? itemsSubtotal * 0.13 : 0;
                      const couvertAmount = spendData.couvertEnabled ? parseFloat(spendData.couvertValue.replace(",", ".")) || 0 : 0;
                      const valetAmount = spendData.valetEnabled ? parseFloat(spendData.valetValue.replace(",", ".")) || 0 : 0;
                      const parkingAmount = spendData.parkingEnabled ? parseFloat(spendData.parkingValue.replace(",", ".")) || 0 : 0;
                      const totalCost = itemsSubtotal + serviceAmount + couvertAmount + valetAmount + parkingAmount;

                      // Save to database via tRPC
                      try {
                        await saveRatingMutation.mutateAsync({
                          establishmentId: estData!.id,
                          type: mode === "direto" ? "direct" : "analytic",
                          visitDate: visitDate ? visitDate.toISOString() : undefined,
                          overallScore: finalScore,
                          subtotal: itemsSubtotal > 0 ? itemsSubtotal : undefined,
                          servicePercent: serviceAmount > 0 ? (spendData.servicePercent === "10" ? 10 : 13) : undefined,
                          couvert: couvertAmount > 0 ? couvertAmount : undefined,
                          valet: valetAmount > 0 ? valetAmount : undefined,
                          parking: parkingAmount > 0 ? parkingAmount : undefined,
                          totalCost: totalCost > 0 ? totalCost : undefined,
                          criteriaScores: mode === "analitico" ? {
                            globalRatings: analyticGlobalRatings,
                            itemRatings: analyticItemRatings,
                          } : undefined,
                          bonusScores: bonuses.length > 0 ? bonuses : undefined,
                          items: selectedMenuItems.map(m => {
                            const dr = directRatings.find(r => r.itemId === m.id);
                            const comment = itemComments.find(c => c.itemId === m.id)?.comment || "";
                            return {
                              menuItemId: parseInt(m.id) || undefined,
                              itemName: m.name,
                              score: dr?.taste || finalScore,
                              comment: comment || undefined,
                              quantity: dr?.serves || undefined,
                              price: m.price > 0 ? m.price : undefined,
                            };
                          }),
                        });

                        // Also persist to localStorage for badge/survey tracking
                        const newReview = {
                          establishmentId: establishment.id,
                          establishmentName: establishment.name,
                          categoryId: parentCategory?.id || "",
                          score: finalScore,
                          mode: mode,
                          date: visitDate ? visitDate.toISOString() : new Date().toISOString(),
                          savedAt: new Date().toISOString(),
                          items: selectedMenuItems.map(m => m.name),
                          isQualified,
                          hasReceipt,
                          points,
                          comments: itemComments.filter(c => c.comment.length > 0),
                          photoCount: photos.length,
                          taggedPhotos: photos.filter(p => p.taggedItemIds.length > 0).length,
                        };
                        existing.push(newReview);
                        localStorage.setItem("avalyarin_reviews", JSON.stringify(existing));

                        // Update badge points
                        const currentPoints = parseFloat(localStorage.getItem("avalyarin_badge_points") || "0");
                        const newPoints = currentPoints + points;
                        localStorage.setItem("avalyarin_badge_points", JSON.stringify(newPoints));

                        // Check badge level up
                        const currentBadge = parseInt(localStorage.getItem("avalyarin_badge_level") || "0");
                        const newBadge = Math.floor(newPoints);
                        if (newBadge > currentBadge) {
                          localStorage.setItem("avalyarin_badge_level", JSON.stringify(newBadge));
                          localStorage.setItem("avalyarin_badge_just_earned", JSON.stringify(newBadge));
                        }

                        // Check if a survey phase should trigger
                        const reviewCount = existing.length;
                        const phase2Done = localStorage.getItem("avalyarin_survey_phase2_completed") === "true";
                        const phase3Done = localStorage.getItem("avalyarin_survey_phase3_completed") === "true";
                        if (reviewCount >= 5 && !phase2Done) {
                          localStorage.removeItem("avalyarin_survey_phase2_skipped");
                        }
                        if (reviewCount >= 10 && !phase3Done) {
                          localStorage.removeItem("avalyarin_survey_phase3_skipped");
                        }

                        const pointsMsg = isQualified
                          ? `+${points} pontos para badge! ${points >= 3 ? '(Streak bonus!)' : ''}`
                          : "+1 ponto para badge";
                        toast.success("Avaliação salva com sucesso!", {
                          description: pointsMsg,
                        });

                        // Show share card instead of immediate redirect
                        setSavedReviewData({
                          score: finalScore,
                          items: selectedMenuItems.map(m => m.name),
                          mode,
                          date: visitDate ? visitDate.toISOString() : undefined,
                        });
                        setShowShareCard(true);
                      } catch (e: any) {
                        console.error("Failed to save review", e);
                        toast.error("Erro ao salvar avaliação", {
                          description: e?.message || "Tente novamente",
                        });
                      }
                    }}
                    size="lg"
                    className="font-display text-lg tracking-wider glow-amber"
                  >
                    {saveRatingMutation.isPending ? "SALVANDO..." : "SALVAR AVALIAÇÃO"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Story Card */}
      {showShareCard && savedReviewData && (
        <ShareStoryCard
          isOpen={showShareCard}
          onClose={() => {
            setShowShareCard(false);
            // Navigate after closing share card
            const justEarned = localStorage.getItem("avalyarin_badge_just_earned");
            if (justEarned) {
              window.location.href = "/badges";
            } else {
              window.location.href = "/";
            }
          }}
          establishmentName={establishment.name}
          categoryName={parentCategory?.name}
          neighborhood={establishment.neighborhood || undefined}
          score={savedReviewData.score}
          items={savedReviewData.items}
          mode={savedReviewData.mode as "direto" | "analitico"}
          date={savedReviewData.date}
        />
      )}
    </div>
  );
}
