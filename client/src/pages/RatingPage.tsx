// Design: Neon Urbano — Rating page with Direct/Analytic modes
import Navbar from "@/components/Navbar";
import { categories, PUB_CRITERIA, BONUS_CRITERIA } from "@/lib/data";
import type { MenuItem, RatingCriterion } from "@/lib/data";
import { useParams, Redirect } from "wouter";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Check, ChevronRight, ChevronLeft, Star, Zap, BarChart3,
  ShoppingBag, ClipboardCheck, Award, ThumbsUp, ThumbsDown, Users
} from "lucide-react";

type RatingMode = "direto" | "analitico";
type Step = "items" | "mode" | "rating" | "bonus" | "result";

interface DirectRating {
  itemId: string;
  serves: number;
  recommend: boolean;
  taste: number;
}

interface AnalyticRating {
  criterionId: string;
  score: number;
}

export default function RatingPage() {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const establishment = categories.flatMap((c) => c.establishments).find((e) => e.id === establishmentId);

  const [step, setStep] = useState<Step>("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [mode, setMode] = useState<RatingMode>("direto");
  const [directRatings, setDirectRatings] = useState<DirectRating[]>([]);
  const [analyticRatings, setAnalyticRatings] = useState<AnalyticRating[]>(
    PUB_CRITERIA.map((c) => ({ criterionId: c.id, score: 5 }))
  );
  const [bonuses, setBonuses] = useState<string[]>([]);
  const [currentDirectIdx, setCurrentDirectIdx] = useState(0);

  if (!establishment) return <Redirect to="/" />;

  const menuItems = establishment.menu;
  const selectedMenuItems = menuItems.filter((m) => selectedItems.includes(m.id));

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
      selectedItems.map((id) => ({ itemId: id, serves: 1, recommend: true, taste: 7 }))
    );
    setStep("mode");
  };

  const updateDirectRating = (idx: number, field: keyof DirectRating, value: number | boolean) => {
    setDirectRatings((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateAnalyticRating = (criterionId: string, score: number) => {
    setAnalyticRatings((prev) =>
      prev.map((r) => (r.criterionId === criterionId ? { ...r, score } : r))
    );
  };

  const toggleBonus = (id: string) => {
    setBonuses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const finalScore = useMemo(() => {
    let base = 0;
    if (mode === "direto") {
      const avgTaste = directRatings.reduce((s, r) => s + r.taste, 0) / (directRatings.length || 1);
      base = avgTaste * 10; // 0-100
    } else {
      base = analyticRatings.reduce((sum, r) => {
        const criterion = PUB_CRITERIA.find((c) => c.id === r.criterionId);
        return sum + (r.score / 10) * (criterion?.weight || 0);
      }, 0);
    }
    const bonusPoints = BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).reduce((s, b) => s + b.points, 0);
    return Math.min(115, Math.round(base + bonusPoints));
  }, [mode, directRatings, analyticRatings, bonuses]);

  const scoreColor = finalScore >= 80 ? "text-green-400" : finalScore >= 60 ? "text-primary" : finalScore >= 40 ? "text-yellow-400" : "text-red-400";
  const scoreLabel = finalScore >= 90 ? "Excepcional" : finalScore >= 80 ? "Excelente" : finalScore >= 70 ? "Muito Bom" : finalScore >= 60 ? "Bom" : finalScore >= 50 ? "Regular" : "Abaixo da Média";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="container max-w-2xl">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {(["items", "mode", "rating", "bonus", "result"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground glow-amber" :
                  (["items", "mode", "rating", "bonus", "result"].indexOf(step) > i) ? "bg-primary/30 text-primary" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < 4 && <div className={`flex-1 h-0.5 ${(["items", "mode", "rating", "bonus", "result"].indexOf(step) > i) ? "bg-primary/40" : "bg-border/30"}`} />}
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
                    onClick={() => { setMode("direto"); setStep("rating"); }}
                    className={`p-6 rounded-xl border text-left transition-all hover:border-primary/60 ${
                      mode === "direto" ? "border-primary/60 bg-primary/5" : "border-border/30 bg-card"
                    }`}
                  >
                    <Zap className="w-8 h-8 text-primary mb-3" />
                    <h4 className="font-display text-xl tracking-wider text-foreground">DIRETO</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      Avaliação rápida: nota de sabor, se recomenda e para quantas pessoas serve. Ideal para quem quer avaliar rapidamente.
                    </p>
                  </button>
                  <button
                    onClick={() => { setMode("analitico"); setStep("rating"); }}
                    className={`p-6 rounded-xl border text-left transition-all hover:border-accent/60 ${
                      mode === "analitico" ? "border-accent/60 bg-accent/5" : "border-border/30 bg-card"
                    }`}
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

            {/* Step 3: Rating */}
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

                      {/* Taste */}
                      <div>
                        <label className="text-sm font-medium text-foreground flex items-center justify-between mb-3">
                          <span>Nota de Sabor</span>
                          <span className="font-numbers text-3xl font-bold text-primary text-glow-amber">{rating.taste}</span>
                        </label>
                        <Slider
                          value={[rating.taste]}
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

            {step === "rating" && mode === "analitico" && (
              <motion.div key="rating-analytic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-accent" />
                  <div>
                    <h3 className="font-display text-2xl tracking-wider text-accent text-glow-pink">AVALIAÇÃO ANALÍTICA</h3>
                    <p className="text-sm text-muted-foreground">10 critérios com pesos dinâmicos para Pub</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {PUB_CRITERIA.map((criterion) => {
                    const rating = analyticRatings.find((r) => r.criterionId === criterion.id);
                    return (
                      <div key={criterion.id} className="p-4 rounded-xl bg-card border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-foreground">{criterion.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Peso: {criterion.weight}</span>
                            <span className="font-numbers text-xl font-bold text-primary">{rating?.score || 5}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{criterion.description}</p>
                        <Slider
                          value={[rating?.score || 5]}
                          onValueChange={([v]) => updateAnalyticRating(criterion.id, v)}
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
                  <Button variant="outline" onClick={() => setStep("mode")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button onClick={() => setStep("bonus")} className="font-display tracking-wider glow-amber">
                    BÔNUS <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Bonus */}
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
                      <span className="font-numbers text-lg font-bold text-primary">+{bonus.points}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep("rating")} className="font-display tracking-wider">
                    <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
                  </Button>
                  <Button onClick={() => setStep("result")} className="font-display tracking-wider glow-amber">
                    VER RESULTADO <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Result */}
            {step === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center py-8">
                  <h3 className="font-display text-2xl tracking-wider text-muted-foreground mb-2">RESULTADO DA AVALIAÇÃO</h3>
                  <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-8">
                    {establishment.name.toUpperCase()}
                  </h2>

                  <div className="relative inline-flex items-center justify-center w-48 h-48 rounded-full border-4 border-primary/30 glow-amber mb-6">
                    <div className="text-center">
                      <span className={`font-numbers text-6xl font-bold ${scoreColor}`}>{finalScore}</span>
                      <span className="block text-sm text-muted-foreground">/115</span>
                    </div>
                  </div>

                  <p className={`font-display text-2xl tracking-wider ${scoreColor} mb-8`}>{scoreLabel.toUpperCase()}</p>

                  {/* Breakdown */}
                  <div className="text-left p-6 rounded-xl bg-card border border-border/50 mb-6">
                    <h4 className="font-display text-lg tracking-wider text-primary mb-4">DETALHAMENTO</h4>
                    {mode === "direto" ? (
                      <div className="space-y-3">
                        {directRatings.map((r) => {
                          const item = menuItems.find((m) => m.id === r.itemId);
                          return (
                            <div key={r.itemId} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-foreground">{item?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Serve {r.serves} | {r.recommend ? "Recomenda" : "Não recomenda"}
                                </p>
                              </div>
                              <span className="font-numbers text-xl font-bold text-primary">{r.taste}/10</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analyticRatings.map((r) => {
                          const criterion = PUB_CRITERIA.find((c) => c.id === r.criterionId);
                          const weighted = ((r.score / 10) * (criterion?.weight || 0)).toFixed(1);
                          return (
                            <div key={r.criterionId} className="flex items-center justify-between py-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">{criterion?.name}</span>
                                <span className="text-xs text-muted-foreground">(peso {criterion?.weight})</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{r.score}/10</span>
                                <span className="font-numbers text-sm font-bold text-primary">{weighted} pts</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {bonuses.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <h5 className="text-xs font-medium text-muted-foreground mb-2">BÔNUS APLICADOS</h5>
                        {BONUS_CRITERIA.filter((b) => bonuses.includes(b.id)).map((b) => (
                          <div key={b.id} className="flex items-center justify-between py-1">
                            <span className="text-sm text-foreground">{b.name}</span>
                            <span className="font-numbers text-sm font-bold text-green-400">+{b.points}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

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
