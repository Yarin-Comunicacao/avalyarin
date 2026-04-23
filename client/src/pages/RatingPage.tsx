// Design: Neon Urbano — Rating page with Direct/Analytic modes
// Fix 3: Analytic mode now iterates item-by-item for Sabor e Execução and Apresentação (excluding beer/chopp)
// Fix 4: No intermediate scores visible; only final score shown
import Navbar from "@/components/Navbar";
import { categories, PUB_CRITERIA, BONUS_CRITERIA } from "@/lib/data";
import type { MenuItem, RatingCriterion } from "@/lib/data";
import { useParams, Redirect } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  taste: number;
}

// Per-item analytic rating for Sabor (c1) and Apresentação (c2)
interface AnalyticItemRating {
  itemId: string;
  saborScore: number; // 0-10
  apresentacaoScore: number; // 0-10
}

interface AnalyticGlobalRating {
  criterionId: string;
  score: number;
}

// Items that should be rated item-by-item in analytic mode (food + drinks, NOT beer/chopp)
function isRatableItem(item: MenuItem): boolean {
  return ["entrada", "prato", "sobremesa", "drink"].includes(item.category);
}

export default function RatingPage() {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const establishment = categories.flatMap((c) => c.establishments).find((e) => e.id === establishmentId);

  const [step, setStep] = useState<Step>("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<RatingMode>("direto");
  const [directRatings, setDirectRatings] = useState<DirectRating[]>([]);
  const [currentDirectIdx, setCurrentDirectIdx] = useState(0);

  // Analytic: per-item ratings for Sabor and Apresentação
  const [analyticItemRatings, setAnalyticItemRatings] = useState<AnalyticItemRating[]>([]);
  const [currentAnalyticItemIdx, setCurrentAnalyticItemIdx] = useState(0);

  // Analytic: global criteria (c3-c10, excluding c1 and c2 which are per-item)
  const globalCriteria = PUB_CRITERIA.filter((c) => c.id !== "c1" && c.id !== "c2");
  const [analyticGlobalRatings, setAnalyticGlobalRatings] = useState<AnalyticGlobalRating[]>(
    globalCriteria.map((c) => ({ criterionId: c.id, score: 0 }))
  );

  const [bonuses, setBonuses] = useState<string[]>([]);

  if (!establishment) return <Redirect to="/" />;

  const menuItems = establishment.menu;
  const selectedMenuItems = menuItems.filter((m) => selectedItems.includes(m.id));

  // Items that go through per-item analytic rating (food + drinks, not beer/chopp)
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
      selectedItems.map((id) => ({ itemId: id, serves: 1, recommend: true, taste: 0 }))
    );
    // Initialize analytic item ratings for ratable items only
    const ratableItems = menuItems.filter((m) => selectedItems.includes(m.id) && isRatableItem(m));
    setAnalyticItemRatings(
      ratableItems.map((m) => ({ itemId: m.id, saborScore: 0, apresentacaoScore: 0 }))
    );
    setCurrentAnalyticItemIdx(0);
    setStep("mode");
  };

  const updateDirectRating = (idx: number, field: keyof DirectRating, value: number | boolean) => {
    setDirectRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateAnalyticItemRating = (idx: number, field: "saborScore" | "apresentacaoScore", value: number) => {
    setAnalyticItemRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateAnalyticGlobalRating = (criterionId: string, score: number) => {
    setAnalyticGlobalRatings((prev) =>
      prev.map((r) => (r.criterionId === criterionId ? { ...r, score } : r))
    );
  };

  const toggleBonus = (id: string) => {
    setBonuses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Calculate final score
  const finalScore = useMemo(() => {
    let base = 0;
    if (mode === "direto") {
      // DIRECT MODE: Only Sabor (taste) is scored. No other criteria are evaluated.
      // Taste is 0-10, we scale to 0-100 proportionally based on Sabor weight (25/100)
      // But since direct mode only evaluates Sabor, the max base from taste alone is 25 pts.
      // We scale: avgTaste/10 * 25 (Sabor weight) = max 25 pts from direct mode
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      base = (avgTaste / 10) * 25; // Only Sabor weight, max 25 pts
    } else {
      // ANALYTIC MODE: All criteria are explicitly evaluated by the user
      // Sabor e Execução (c1, weight 25): average of per-item sabor scores
      const c1 = PUB_CRITERIA.find((c) => c.id === "c1");
      const avgSabor = analyticItemRatings.length > 0
        ? analyticItemRatings.reduce((s, r) => s + r.saborScore, 0) / analyticItemRatings.length
        : 0;
      const c1Score = (avgSabor / 10) * (c1?.weight || 25);

      // Apresentação (c2, weight 10): average of per-item apresentação scores
      const c2 = PUB_CRITERIA.find((c) => c.id === "c2");
      const avgApres = analyticItemRatings.length > 0
        ? analyticItemRatings.reduce((s, r) => s + r.apresentacaoScore, 0) / analyticItemRatings.length
        : 0;
      const c2Score = (avgApres / 10) * (c2?.weight || 10);

      // Global criteria (c3-c10)
      const globalScore = analyticGlobalRatings.reduce((sum, r) => {
        const criterion = PUB_CRITERIA.find((c) => c.id === r.criterionId);
        return sum + (r.score / 10) * (criterion?.weight || 0);
      }, 0);

      base = c1Score + c2Score + globalScore;
    }
    const bonusPoints = BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).reduce((s, b) => s + b.points, 0);
    return Math.min(115, Math.round(base + bonusPoints));
  }, [mode, directRatings, analyticItemRatings, analyticGlobalRatings, bonuses]);

  // Classification labels and colors
  const getClassification = (score: number, isDirectMode: boolean) => {
    if (isDirectMode) {
      // Direct mode max is ~25 + 15 bonus = 40. Scale classification accordingly.
      // Sabor only: 0-25 base. We classify based on taste average (0-10).
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      if (avgTaste >= 9) return { label: "Excepcional", color: "text-green-400" };
      if (avgTaste >= 8) return { label: "Excelente", color: "text-green-400" };
      if (avgTaste >= 7) return { label: "Muito Bom", color: "text-primary" };
      if (avgTaste >= 6) return { label: "Bom", color: "text-primary" };
      if (avgTaste >= 5) return { label: "Regular", color: "text-yellow-400" };
      return { label: "Abaixo da Média", color: "text-red-400" };
    }
    // Analytic mode: full 0-115 scale
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

  // Explanation of what matters for "Muito Bom"
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
              <span className="font-numbers text-xs text-primary shrink-0">
                R${item.price.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      </div>
    ) : null
  );

  // Determine which steps are active for progress bar
  const allSteps: Step[] = mode === "analitico"
    ? ["items", "mode", "analyticItems", "analyticGlobal", "bonus", "result"]
    : ["items", "mode", "rating", "bonus", "result"];

  const stepLabels: Record<Step, string> = {
    items: "Itens",
    mode: "Modo",
    rating: "Avaliação",
    analyticItems: "Sabor",
    analyticGlobal: "Critérios",
    bonus: "Bônus",
    result: "Resultado",
  };

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
                      Avaliação rápida: nota de sabor, se recomenda e para quantas pessoas serve. Ideal para quem quer avaliar rapidamente.
                    </p>
                  </button>
                  <button
                    onClick={() => { setMode("analitico"); setCurrentAnalyticItemIdx(0); setStep("analyticItems"); }}
                    className="p-6 rounded-xl border text-left transition-all hover:border-accent/60 border-border/30 bg-card"
                  >
                    <BarChart3 className="w-8 h-8 text-accent mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">ANALÍTICO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação detalhada: 10 critérios com pesos dinâmicos e subcritérios técnicos. Para quem quer uma análise profunda.
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

            {/* Step 3 (Direct): Per-item rating */}
            {step === "rating" && mode === "direto" && (
              <motion.div key="rating-direct" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-primary">AVALIAÇÃO DIRETA</h3>
                    <p className="text-sm text-muted-foreground">
                      Item {currentDirectIdx + 1} de {directRatings.length}
                    </p>
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
                              onClick={() => updateDirectRating(currentDirectIdx, "serves", n)}
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
                            onClick={() => updateDirectRating(currentDirectIdx, "recommend", true)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                              rating.recommend ? "bg-green-500/20 text-green-400 border border-green-500/40" : "bg-secondary text-muted-foreground border border-border/30"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" /> Sim
                          </button>
                          <button
                            onClick={() => updateDirectRating(currentDirectIdx, "recommend", false)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                              !rating.recommend ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-secondary text-muted-foreground border border-border/30"
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" /> Não
                          </button>
                        </div>
                      </div>

                      {/* Taste - slider only, no visible number */}
                      <div>
                        <label className="text-sm font-medium text-foreground flex items-center justify-between mb-3">
                          <span>Nota de Sabor</span>
                        </label>
                        <Slider
                          value={[rating.taste ?? 0]}
                          onValueChange={([v]) => updateDirectRating(currentDirectIdx, "taste", v)}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 — Péssimo</span>
                          <span>10 — Excepcional</span>
                        </div>
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

            {/* Step 3 (Analytic): Per-item Sabor e Execução + Apresentação */}
            {step === "analyticItems" && mode === "analitico" && (
              <motion.div key="analytic-items" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">SABOR E APRESENTAÇÃO</h3>
                    <p className="text-sm text-muted-foreground">
                      {ratableSelectedItems.length > 0
                        ? `Item ${currentAnalyticItemIdx + 1} de ${ratableSelectedItems.length} (alimentos e drinks)`
                        : "Nenhum alimento ou drink selecionado"}
                    </p>
                  </div>
                </div>

                {ratableSelectedItems.length > 0 && analyticItemRatings[currentAnalyticItemIdx] && (() => {
                  const itemRating = analyticItemRatings[currentAnalyticItemIdx];
                  const item = menuItems.find((m) => m.id === itemRating.itemId);
                  return (
                    <div className="p-6 rounded-xl bg-card border border-border/50">
                      <h4 className="font-display text-xl tracking-wider text-foreground mb-1">{item?.name}</h4>
                      <p className="text-sm text-muted-foreground mb-6">{item?.description}</p>

                      {/* Sabor e Execução */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="text-sm font-semibold text-foreground">Sabor e Execução</h5>
                          <span className="text-xs text-muted-foreground">(Peso 25)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Qualidade dos insumos, cocção, temperos e temperatura</p>
                        <Slider
                          value={[itemRating.saborScore]}
                          onValueChange={([v]) => updateAnalyticItemRating(currentAnalyticItemIdx, "saborScore", v)}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 — Péssimo</span>
                          <span>10 — Excepcional</span>
                        </div>
                      </div>

                      {/* Apresentação */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="text-sm font-semibold text-foreground">Apresentação</h5>
                          <span className="text-xs text-muted-foreground">(Peso 10)</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Apetite visual, montagem, louça e estética</p>
                        <Slider
                          value={[itemRating.apresentacaoScore]}
                          onValueChange={([v]) => updateAnalyticItemRating(currentAnalyticItemIdx, "apresentacaoScore", v)}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0 — Péssimo</span>
                          <span>10 — Excepcional</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {ratableSelectedItems.length === 0 && (
                  <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-muted-foreground">Você selecionou apenas cervejas/chopps. Os critérios de Sabor e Apresentação serão calculados com nota padrão.</p>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentAnalyticItemIdx > 0) {
                        setCurrentAnalyticItemIdx(currentAnalyticItemIdx - 1);
                      } else {
                        setStep("mode");
                      }
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

            {/* Step 4 (Analytic): Global criteria (c3-c10) */}
            {step === "analyticGlobal" && mode === "analitico" && (
              <motion.div key="analytic-global" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">CRITÉRIOS GERAIS</h3>
                    <p className="text-sm text-muted-foreground">Avalie o estabelecimento como um todo</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {globalCriteria.map((criterion) => {
                    const rating = analyticGlobalRatings.find((r) => r.criterionId === criterion.id);
                    return (
                      <div key={criterion.id} className="p-4 rounded-xl bg-card border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground">{criterion.name}</h4>
                          <span className="text-xs text-muted-foreground">Peso: {criterion.weight}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{criterion.description}</p>
                        <Slider
                          value={[rating?.score ?? 0]}
                          onValueChange={([v]) => updateAnalyticGlobalRating(criterion.id, v)}
                          min={0}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                          {criterion.subcriteria.map((sub) => (
                            <span key={sub.id} className="text-[10px] text-muted-foreground/60 bg-secondary/50 px-2 py-0.5 rounded">
                              {sub.name}
                            </span>
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

                  {/* Classification explanation */}
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

                  {/* What matters for classification */}
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
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${c.weight}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">{c.weight}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Items summary (no scores, just what was consumed) */}
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
