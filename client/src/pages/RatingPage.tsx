// Design: Neon Urbano — Rating page with Direct/Analytic modes
// Scores 1-10 via number buttons, low score reasons for <=6, per-subcriterion scoring
import Navbar from "@/components/Navbar";
import { categories, PUB_CRITERIA, BONUS_CRITERIA } from "@/lib/data";
import type { MenuItem, RatingCriterion } from "@/lib/data";
import { useParams, Redirect } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Check, ChevronRight, ChevronLeft, Star, Zap, BarChart3,
  ShoppingBag, ClipboardCheck, Award, ThumbsUp, ThumbsDown, Users
} from "lucide-react";

type RatingMode = "direto" | "analitico";
type Step = "items" | "mode" | "rating" | "analyticItems" | "analyticGlobal" | "bonus" | "result";

interface DirectRating {
  itemId: string;
  serves: number;
  recommend: boolean;
  taste: number; // 0 = not rated, 1-10 = rated
  lowReasons: string[];
  lowComment: string;
}

interface AnalyticItemRating {
  itemId: string;
  subScores: Record<string, number>; // subcriterionId -> 1-10 (0 = not rated)
  lowReasons: Record<string, string[]>; // subcriterionId -> reasons
  lowComments: Record<string, string>; // subcriterionId -> custom comment
}

interface AnalyticGlobalRating {
  criterionId: string;
  subScores: Record<string, number>; // subcriterionId -> 1-10
  lowReasons: Record<string, string[]>;
  lowComments: Record<string, string>;
}

// Low score reason options by context
const LOW_SCORE_REASONS: Record<string, string[]> = {
  // Sabor subcriteria
  c1_1: ["Ingredientes sem frescor", "Qualidade abaixo do esperado", "Gosto de requentado", "Ingrediente estragado", "Porção com aparência ruim", "Outra"],
  c1_2: ["Cozimento excessivo", "Cru demais", "Sem crocância", "Textura borrachuda", "Fritura encharcada", "Outra"],
  c1_3: ["Falta de sal", "Excesso de sal", "Sem tempero", "Tempero artificial", "Desequilíbrio de sabores", "Outra"],
  c1_4: ["Comida fria", "Comida morna", "Bebida quente", "Sorvete derretido", "Prato queimando", "Outra"],
  // Apresentação subcriteria
  c2_1: ["Prato sem cor", "Visual desleixado", "Porção espalhada", "Sem apetite visual", "Parece industrializado", "Outra"],
  c2_2: ["Marcas de dedos no prato", "Molho derramado", "Montagem torta", "Ingredientes caídos", "Sem capricho", "Outra"],
  c2_3: ["Prato inadequado", "Copo errado", "Recipiente sujo", "Louça lascada", "Tamanho desproporcional", "Outra"],
  c2_4: ["Sem garnish", "Gelo ruim", "Copo inadequado", "Drink sem apresentação", "Temperatura errada", "Outra"],
  // Atendimento
  c3_1: ["Recepção fria", "Ignorado na entrada", "Sem cumprimento", "Demora para ser recebido", "Atitude grosseira", "Outra"],
  c3_2: ["Não soube explicar o prato", "Informação errada", "Sem sugestões", "Desconhece ingredientes", "Não sabe harmonizar", "Outra"],
  c3_3: ["Demora excessiva", "Pedido esquecido", "Pratos em tempos diferentes", "Bebida demorou", "Conta demorou", "Outra"],
  c3_4: ["Não repôs água", "Não retirou pratos", "Sem atenção", "Precisei chamar várias vezes", "Mesa suja", "Outra"],
  // Ambiente
  c4_1: ["Música muito alta", "Sem música", "Música inadequada", "Acústica ruim (eco)", "Barulho da cozinha", "Outra"],
  c4_2: ["Banheiro sujo", "Sem papel", "Cheiro ruim", "Fila grande", "Sem sabonete", "Outra"],
  c4_3: ["Cadeira desconfortável", "Calor excessivo", "Frio excessivo", "Mesa instável", "Iluminação ruim", "Outra"],
  c4_4: ["Sem cobertura para chuva", "Assédio de ambulantes", "Barulho de trânsito", "Calçada irregular", "Sem ventilação", "Outra"],
  // Custo-Benefício
  c5_1: ["Porção muito pequena", "Não serve nem uma pessoa", "Desproporcional ao preço", "Quantidade inconsistente", "Menos do que no cardápio", "Outra"],
  c5_2: ["Preço abusivo", "Ingredientes baratos por preço alto", "Não vale o que cobra", "Concorrente melhor e mais barato", "Qualidade não justifica", "Outra"],
  c5_3: ["Couvert não informado", "Taxa de serviço abusiva", "Preço diferente do cardápio", "Cobrança surpresa", "Água cobrada sem avisar", "Outra"],
  // Consistência
  c6_1: ["Prato diferente da última vez", "Sabor inconsistente", "Porção menor que antes", "Qualidade caiu", "Receita mudou", "Outra"],
  c6_2: ["Qualidade caiu com lotação", "Demora muito mais cheio", "Atendimento pior lotado", "Comida pior no horário de pico", "Desorganização", "Outra"],
  // Originalidade
  c7_1: ["Cardápio genérico", "Nada diferente", "Cópia de outros bares", "Sem identidade", "Falta criatividade", "Outra"],
  c7_2: ["Sem prato exclusivo", "Nada memorável", "Sem drink autoral", "Cardápio padrão", "Falta personalidade", "Outra"],
  // Carta de Bebidas
  c8_1: ["Só cerveja industrial", "Pouca variedade", "Sem opções artesanais", "Carta limitada", "Sem novidades", "Outra"],
  c8_2: ["Drink mal feito", "Desequilibrado", "Sem gelo adequado", "Ingredientes ruins", "Sem técnica", "Outra"],
  c8_3: ["Sem opção sem álcool", "Só refrigerante", "Sem mocktail", "Sem suco natural", "Opções limitadas", "Outra"],
  // Variedade
  c9_1: ["Só uma proteína", "Sem opção de peixe", "Pouca diversidade", "Menu repetitivo", "Falta opções", "Outra"],
  c9_2: ["Sem opção vegana", "Sem opção sem glúten", "Não atende restrições", "Sem informação de alérgenos", "Cardápio excludente", "Outra"],
  c9_3: ["Só frituras", "Sem opção leve", "Menu desequilibrado", "Falta saladas", "Sem opção saudável", "Outra"],
  // Harmonização
  c10_1: ["Carta não combina com comida", "Sem sinergia", "Bebidas desconectadas", "Falta coerência", "Não pensaram junto", "Outra"],
  c10_2: ["Sem sugestão de harmonização", "Garçom não sabe sugerir", "Sem indicação no cardápio", "Falta orientação", "Nenhuma recomendação", "Outra"],
  // Direct mode taste
  taste: ["Falta de sal", "Excesso de sal", "Sem tempero", "Comida fria", "Textura ruim", "Outra"],
};

function isRatableItem(item: MenuItem): boolean {
  return ["entrada", "prato", "sobremesa", "drink"].includes(item.category);
}

// Reusable score button row (1-10)
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

// Low score reasons component
function LowScoreReasons({
  reasons,
  selectedReasons,
  onToggleReason,
  comment,
  onCommentChange,
}: {
  reasons: string[];
  selectedReasons: string[];
  onToggleReason: (reason: string) => void;
  comment: string;
  onCommentChange: (c: string) => void;
}) {
  const showComment = selectedReasons.includes("Outra");
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20"
    >
      <p className="text-xs text-red-400 mb-2 font-medium">O que poderia melhorar?</p>
      <div className="flex flex-wrap gap-1.5">
        {reasons.map((reason) => (
          <button
            key={reason}
            onClick={() => onToggleReason(reason)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${
              selectedReasons.includes(reason)
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-secondary/50 text-muted-foreground border border-border/30 hover:border-border/60"
            }`}
          >
            {reason}
          </button>
        ))}
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

export default function RatingPage() {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const establishment = categories.flatMap((c) => c.establishments).find((e) => e.id === establishmentId);

  const [step, setStep] = useState<Step>("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<RatingMode>("direto");
  const [directRatings, setDirectRatings] = useState<DirectRating[]>([]);
  const [currentDirectIdx, setCurrentDirectIdx] = useState(0);

  const [analyticItemRatings, setAnalyticItemRatings] = useState<AnalyticItemRating[]>([]);
  const [currentAnalyticItemIdx, setCurrentAnalyticItemIdx] = useState(0);

  const globalCriteria = PUB_CRITERIA.filter((c) => c.id !== "c1" && c.id !== "c2");
  const [analyticGlobalRatings, setAnalyticGlobalRatings] = useState<AnalyticGlobalRating[]>(
    globalCriteria.map((c) => ({
      criterionId: c.id,
      subScores: Object.fromEntries(c.subcriteria.map((s) => [s.id, 0])),
      lowReasons: Object.fromEntries(c.subcriteria.map((s) => [s.id, []])),
      lowComments: Object.fromEntries(c.subcriteria.map((s) => [s.id, ""])),
    }))
  );

  const [bonuses, setBonuses] = useState<string[]>([]);

  if (!establishment) return <Redirect to="/" />;

  const menuItems = establishment.menu;
  const selectedMenuItems = menuItems.filter((m) => selectedItems.includes(m.id));
  const ratableSelectedItems = selectedMenuItems.filter(isRatableItem);

  const entradas = menuItems.filter((m) => m.category === "entrada");
  const pratos = menuItems.filter((m) => m.category === "prato");
  const bebidas = menuItems.filter((m) => ["bebida", "chopp", "drink"].includes(m.category));

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const startRating = () => {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos um item que você consumiu.");
      return;
    }
    setDirectRatings(
      selectedItems.map((id) => ({ itemId: id, serves: 1, recommend: true, taste: 0, lowReasons: [], lowComment: "" }))
    );
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
    setStep("mode");
  };

  // Direct mode helpers
  const updateDirectField = (idx: number, field: keyof DirectRating, value: number | boolean | string[] | string) => {
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
      next[idx] = {
        ...next[idx],
        lowReasons: current.includes(reason) ? current.filter((r) => r !== reason) : [...current, reason],
      };
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
      next[idx] = {
        ...next[idx],
        lowReasons: {
          ...next[idx].lowReasons,
          [subId]: current.includes(reason) ? current.filter((r) => r !== reason) : [...current, reason],
        },
      };
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
        return {
          ...r,
          lowReasons: {
            ...r.lowReasons,
            [subId]: current.includes(reason) ? current.filter((x) => x !== reason) : [...current, reason],
          },
        };
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

  // Calculate final score
  const finalScore = useMemo(() => {
    let base = 0;
    if (mode === "direto") {
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      base = (avgTaste / 10) * 25;
    } else {
      // Sabor (c1): average of per-item subcriterion averages
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

      // Apresentação (c2): average of per-item subcriterion averages
      const c2 = PUB_CRITERIA.find((c) => c.id === "c2")!;
      let avgApres = 0;
      if (analyticItemRatings.length > 0) {
        const itemAvgs = analyticItemRatings.map((ir) => {
          const subs = c2.subcriteria.map((s) => ir.subScores[s.id] || 0);
          return subs.reduce((a, b) => a + b, 0) / subs.length;
        });
        avgApres = itemAvgs.reduce((a, b) => a + b, 0) / itemAvgs.length;
      }
      const c2Score = (avgApres / 10) * c2.weight;

      // Global criteria (c3-c10): average of subcriteria scores per criterion
      const globalScore = analyticGlobalRatings.reduce((sum, r) => {
        const criterion = PUB_CRITERIA.find((c) => c.id === r.criterionId);
        if (!criterion) return sum;
        const subs = criterion.subcriteria.map((s) => r.subScores[s.id] || 0);
        const avg = subs.length > 0 ? subs.reduce((a, b) => a + b, 0) / subs.length : 0;
        return sum + (avg / 10) * criterion.weight;
      }, 0);

      base = c1Score + c2Score + globalScore;
    }
    const bonusPoints = BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).reduce((s, b) => s + b.points, 0);
    return Math.min(115, Math.round(base + bonusPoints));
  }, [mode, directRatings, analyticItemRatings, analyticGlobalRatings, bonuses]);

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
    : "Para alcançar \"Muito Bom\", o estabelecimento precisa de boa execução em Sabor (peso 25), Custo-Benefício (peso 15) e Ambiente (peso 15) — os três critérios de maior peso somam 55% da nota.";

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

  const allSteps: Step[] = mode === "analitico"
    ? ["items", "mode", "analyticItems", "analyticGlobal", "bonus", "result"]
    : ["items", "mode", "rating", "bonus", "result"];

  const currentStepIdx = allSteps.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container max-w-2xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {allSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground glow-amber" :
                  currentStepIdx > i ? "bg-primary/30 text-primary" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < allSteps.length - 1 && <div className={`flex-1 h-0.5 ${currentStepIdx > i ? "bg-primary/40" : "bg-border/30"}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Item Selection */}
            {step === "items" && (
              <motion.div key="items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">O QUE VOCÊ CONSUMIU?</h3>
                    <p className="text-sm text-muted-foreground">Selecione os itens do cardápio do {establishment.name}</p>
                  </div>
                </div>
                <ItemSelector items={entradas} title="PORÇÕES" />
                <ItemSelector items={pratos} title="BURGERS & SANDWICHES" />
                <ItemSelector items={bebidas} title="BEBIDAS" />
                <div className="flex justify-end mt-6">
                  <Button onClick={startRating} className="font-display tracking-wider glow-amber">
                    CONTINUAR <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Mode Selection */}
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
                    onClick={() => { setMode("direto"); setCurrentDirectIdx(0); setStep("rating"); }}
                    className="p-6 rounded-xl border text-left transition-all hover:border-primary/60 border-border/30 bg-card"
                  >
                    <Zap className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">DIRETO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação rápida: nota de sabor, se recomenda e para quantas pessoas serve.
                    </p>
                  </button>
                  <button
                    onClick={() => { setMode("analitico"); setCurrentAnalyticItemIdx(0); setStep("analyticItems"); }}
                    className="p-6 rounded-xl border text-left transition-all hover:border-accent/60 border-border/30 bg-card"
                  >
                    <BarChart3 className="w-8 h-8 text-accent mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">ANALÍTICO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação detalhada com subcritérios individuais. Para quem quer uma análise profunda.
                    </p>
                  </button>
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("items")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 (Direct): Per-item rating with 1-10 buttons */}
            {step === "rating" && mode === "direto" && (
              <motion.div key="rating-direct" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">AVALIAÇÃO DIRETA</h3>
                    <p className="text-sm text-muted-foreground">Item {currentDirectIdx + 1} de {directRatings.length}</p>
                  </div>
                </div>
                {directRatings[currentDirectIdx] && (() => {
                  const item = menuItems.find((m) => m.id === directRatings[currentDirectIdx].itemId);
                  const rating = directRatings[currentDirectIdx];
                  return (
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                      <h4 className="font-display text-xl tracking-wider text-foreground">{item?.name}</h4>
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
                              onClick={() => updateDirectField(currentDirectIdx, "serves", n)}
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
                            onClick={() => updateDirectField(currentDirectIdx, "recommend", true)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                              rating.recommend ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-secondary text-muted-foreground border border-border/30"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" /> Sim
                          </button>
                          <button
                            onClick={() => updateDirectField(currentDirectIdx, "recommend", false)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                              !rating.recommend ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-secondary text-muted-foreground border border-border/30"
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" /> Não
                          </button>
                        </div>
                      </div>

                      {/* Taste - 1-10 buttons */}
                      <div>
                        <ScoreButtons
                          value={rating.taste}
                          onChange={(v) => updateDirectField(currentDirectIdx, "taste", v)}
                          label="Nota de Sabor"
                        />
                        <AnimatePresence>
                          {rating.taste > 0 && rating.taste <= 6 && (
                            <LowScoreReasons
                              reasons={LOW_SCORE_REASONS.taste}
                              selectedReasons={rating.lowReasons}
                              onToggleReason={(r) => toggleDirectLowReason(currentDirectIdx, r)}
                              comment={rating.lowComment}
                              onCommentChange={(c) => updateDirectField(currentDirectIdx, "lowComment", c)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })()}
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

            {/* Step 3 (Analytic): Per-item Sabor subcriteria + Apresentação subcriteria */}
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
                  const c1 = PUB_CRITERIA.find((c) => c.id === "c1")!;
                  const c2 = PUB_CRITERIA.find((c) => c.id === "c2")!;

                  return (
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                      <h4 className="font-display text-xl tracking-wider text-foreground mb-1">{item?.name}</h4>
                      <p className="text-sm text-muted-foreground mb-6">{item?.description}</p>

                      {/* Sabor e Execução subcriteria */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <h5 className="text-base font-semibold text-foreground">Sabor e Execução</h5>
                          <span className="text-xs text-muted-foreground">(Peso 25)</span>
                        </div>
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
                                    reasons={LOW_SCORE_REASONS[sub.id] || LOW_SCORE_REASONS.taste}
                                    selectedReasons={itemRating.lowReasons[sub.id] || []}
                                    onToggleReason={(r) => toggleAnalyticItemLowReason(currentAnalyticItemIdx, sub.id, r)}
                                    comment={itemRating.lowComments[sub.id] || ""}
                                    onCommentChange={(c) => updateAnalyticItemLowComment(currentAnalyticItemIdx, sub.id, c)}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Apresentação subcriteria */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <h5 className="text-base font-semibold text-foreground">Apresentação</h5>
                          <span className="text-xs text-muted-foreground">(Peso 10)</span>
                        </div>
                        <div className="space-y-5">
                          {c2.subcriteria.map((sub) => (
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
                                    reasons={LOW_SCORE_REASONS[sub.id] || LOW_SCORE_REASONS.taste}
                                    selectedReasons={itemRating.lowReasons[sub.id] || []}
                                    onToggleReason={(r) => toggleAnalyticItemLowReason(currentAnalyticItemIdx, sub.id, r)}
                                    comment={itemRating.lowComments[sub.id] || ""}
                                    onCommentChange={(c) => updateAnalyticItemLowComment(currentAnalyticItemIdx, sub.id, c)}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {ratableSelectedItems.length === 0 && (
                  <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-muted-foreground">Você selecionou apenas cervejas/chopps. Sabor e Apresentação não se aplicam.</p>
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

            {/* Step 4 (Analytic): Global criteria with per-subcriterion scoring */}
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
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-display text-lg tracking-wider text-foreground">{criterion.name}</h4>
                          <span className="text-xs text-muted-foreground">Peso: {criterion.weight}</span>
                        </div>
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
                                    reasons={LOW_SCORE_REASONS[sub.id] || LOW_SCORE_REASONS.taste}
                                    selectedReasons={gRating.lowReasons[sub.id] || []}
                                    onToggleReason={(r) => toggleGlobalLowReason(criterion.id, sub.id, r)}
                                    comment={gRating.lowComments[sub.id] || ""}
                                    onCommentChange={(c) => updateGlobalLowComment(criterion.id, sub.id, c)}
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
                  <Button variant="outline" onClick={() => setStep("analyticItems")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button onClick={() => setStep("bonus")} className="font-display tracking-wider glow-amber">
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
                  <Button onClick={() => setStep("result")} className="font-display tracking-wider glow-amber">
                    VER RESULTADO <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
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
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{muitoBomDescription}</p>
                    {mode === "analitico" && (
                      <div className="space-y-2">
                        {PUB_CRITERIA.filter((c) => c.weight >= 10).map((c) => (
                          <div key={c.id} className="flex items-center justify-between py-1.5">
                            <span className="text-sm text-foreground">{c.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${c.weight}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{c.weight}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    {mode === "direto" && (
                      <div className="mt-4 pt-3 border-t border-border/20">
                        <div className="flex flex-wrap gap-3">
                          {directRatings.map((r) => {
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
                    onClick={() => {
                      toast.success("Avaliação salva com sucesso!", { description: "Obrigado por contribuir!" });
                    }}
                    size="lg"
                    className="font-display text-lg tracking-wider glow-amber"
                  >
                    SALVAR AVALIAÇÃO
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
