// Insígnias — Sistema de progressão Barão → Rei
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, Crown, MapPin, Store, ChevronRight, Lock, TrendingUp, Award, Compass } from "lucide-react";
import { Link } from "wouter";

// Insignia level colors and icons
const INSIGNIA_STYLES = [
  { level: 1, color: "text-amber-700", bgColor: "bg-amber-900/20", borderColor: "border-amber-700/40", gradient: "from-amber-900/30 to-amber-800/10", label: "Bronze" },
  { level: 2, color: "text-slate-300", bgColor: "bg-slate-500/15", borderColor: "border-slate-400/40", gradient: "from-slate-600/20 to-slate-500/10", label: "Prata" },
  { level: 3, color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-blue-400/40", gradient: "from-blue-600/20 to-blue-500/10", label: "Azul" },
  { level: 4, color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-400/40", gradient: "from-emerald-600/20 to-emerald-500/10", label: "Esmeralda" },
  { level: 5, color: "text-purple-400", bgColor: "bg-purple-500/15", borderColor: "border-purple-400/40", gradient: "from-purple-600/20 to-purple-500/10", label: "Púrpura" },
  { level: 6, color: "text-rose-400", bgColor: "bg-rose-500/15", borderColor: "border-rose-400/40", gradient: "from-rose-600/20 to-rose-500/10", label: "Rubi" },
  { level: 7, color: "text-yellow-300", bgColor: "bg-yellow-500/20", borderColor: "border-yellow-400/50", gradient: "from-yellow-600/30 to-yellow-500/10", label: "Ouro" },
];

type TabType = "categorias" | "bairros" | "estabelecimentos";

function getTitleForDisplay(titleMale: string, targetName: string, type: string) {
  const preposition = type === "neighborhood" ? "de" : type === "establishment" ? "do" : "da";
  return `${titleMale} ${preposition} ${targetName}`;
}

function ProgressBar({ current, max, label }: { current: number; max: number; label: string }) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function BadgeCard({ badge, type }: { badge: any; type: string }) {
  const style = INSIGNIA_STYLES[badge.level - 1] || INSIGNIA_STYLES[0];
  const title = getTitleForDisplay(badge.titleMale, badge.targetName, type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-xl border ${style.borderColor} bg-gradient-to-br ${style.gradient} backdrop-blur-sm`}
    >
      {/* Level indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className={`w-5 h-5 ${style.color}`} />
          <span className={`font-display text-lg tracking-wider ${style.color}`}>
            {badge.titleMale}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-numbers">Nv. {badge.level}/7</span>
      </div>

      {/* Target name */}
      <h4 className="text-sm font-medium text-foreground mb-3 truncate">{badge.targetName}</h4>

      {/* Stats */}
      <div className="flex gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {badge.ratingsCount} aval.
        </span>
        {type !== "establishment" && (
          <span className="flex items-center gap-1">
            <Store className="w-3 h-3" />
            {badge.uniqueEstablishments} locais
          </span>
        )}
      </div>

      {/* Next level progress */}
      {badge.nextLevel && (
        <div className="space-y-2">
          <ProgressBar
            current={badge.ratingsCount}
            max={badge.nextLevel.ratingsNeeded}
            label="Avaliações"
          />
          {type !== "establishment" && badge.nextLevel.uniqueEstablishmentsNeeded > 0 && (
            <ProgressBar
              current={badge.uniqueEstablishments}
              max={badge.nextLevel.uniqueEstablishmentsNeeded}
              label="Locais diferentes"
            />
          )}
        </div>
      )}

      {badge.level === 7 && (
        <div className="mt-2 text-center">
          <span className="text-xs font-display tracking-wider text-yellow-300/80">NÍVEL MÁXIMO</span>
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ type }: { type: TabType }) {
  const messages: Record<TabType, { title: string; desc: string }> = {
    categorias: {
      title: "Nenhuma insígnia de categoria",
      desc: "Avalie 3+ estabelecimentos de uma mesma categoria em 12 meses para conquistar sua primeira insígnia!",
    },
    bairros: {
      title: "Nenhuma insígnia de bairro",
      desc: "Avalie 5+ estabelecimentos em um mesmo bairro em 12 meses para começar sua jornada de exploração!",
    },
    estabelecimentos: {
      title: "Nenhuma insígnia de fidelidade",
      desc: "Visite o mesmo estabelecimento 3+ vezes em 12 meses para ganhar sua insígnia de habitué!",
    },
  };

  const msg = messages[type];
  return (
    <div className="text-center py-12 px-4">
      <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
      <h3 className="font-display text-xl tracking-wider text-foreground/70 mb-2">{msg.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{msg.desc}</p>
    </div>
  );
}

export default function BadgesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("categorias");
  const { user, loading: authLoading } = useAuth();

  const { data: summary, isLoading } = trpc.nobility.summary.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const tabs: { key: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { key: "categorias", label: "Categorias", icon: Crown, count: summary?.categoryBadges.length || 0 },
    { key: "bairros", label: "Bairros", icon: MapPin, count: summary?.neighborhoodBadges.length || 0 },
    { key: "estabelecimentos", label: "Locais", icon: Store, count: summary?.establishmentBadges.length || 0 },
  ];

  const currentBadges = activeTab === "categorias"
    ? summary?.categoryBadges || []
    : activeTab === "bairros"
    ? summary?.neighborhoodBadges || []
    : summary?.establishmentBadges || [];

  // Sort by level descending
  const sortedBadges = [...currentBadges].sort((a, b) => b.level - a.level);

  // Highest title across all types
  const highestBadge = summary?.highestTitle;

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar onMenuOpen={() => setMenuOpen(true)} />

      <div className="container pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider text-primary text-glow-amber mb-2">
            INSÍGNIAS
          </h1>
          <p className="text-sm text-muted-foreground">
            Conquiste insígnias avaliando estabelecimentos. Progressão: Barão → Visconde → Conde → Marquês → Duque → Príncipe → Rei
          </p>
        </div>

        {/* Highest title card */}
        {highestBadge && highestBadge.level > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-900/20 via-amber-900/10 to-transparent"
          >
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-7 h-7 text-yellow-300" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sua maior insígnia</p>
                <h2 className="font-display text-2xl tracking-wider text-yellow-300">
                  {highestBadge.title} {highestBadge.type === "neighborhood" ? "de" : highestBadge.type === "establishment" ? "do" : "da"} {highestBadge.targetName}
                </h2>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nível {highestBadge.level}/7 • {highestBadge.type === "category" ? "Categoria" : highestBadge.type === "neighborhood" ? "Bairro" : "Estabelecimento"}
            </p>
          </motion.div>
        )}

        {/* Rolling 12 months notice */}
        <div className="mb-6 p-3 rounded-lg bg-secondary/30 border border-border/30">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
            Insígnias baseadas em avaliações dos <strong className="text-foreground">últimos 12 meses</strong>. Mantenha a frequência para não perder sua insígnia!
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 border border-border/30 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs font-numbers px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sortedBadges.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {sortedBadges.map((badge, i) => (
                <motion.div
                  key={`${badge.type}-${badge.targetId}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BadgeCard badge={badge} type={activeTab} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Special Neighborhood Insígnias */}
        {summary?.specialInsignias && summary.specialInsignias.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-xl tracking-wider text-primary text-glow-amber mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5" />
              INSÍGNIAS ESPECIAIS
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Conquistas extraordinárias de exploração por São Paulo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary.specialInsignias.map((insignia) => (
                <motion.div
                  key={insignia.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${
                    insignia.earned
                      ? "border-yellow-400/40 bg-gradient-to-br from-yellow-900/20 to-amber-900/10"
                      : "border-border/30 bg-card/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Award className={`w-5 h-5 ${insignia.earned ? "text-yellow-300" : "text-muted-foreground/50"}`} />
                    <span className={`font-display text-sm tracking-wider ${
                      insignia.earned ? "text-yellow-300" : "text-muted-foreground"
                    }`}>
                      {insignia.titleMale}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{insignia.description}</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {insignia.earned ? "✓ Conquistada" : insignia.requirement}
                  </p>
                  {insignia.earned && insignia.neighborhoods.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {insignia.neighborhoods.slice(0, 5).map(n => (
                        <span key={n} className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300/80">
                          {n}
                        </span>
                      ))}
                      {insignia.neighborhoods.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{insignia.neighborhoods.length - 5}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Progression reference */}
        <div className="mt-10 p-5 rounded-xl border border-border/30 bg-card/50">
          <h3 className="font-display text-lg tracking-wider text-foreground mb-4">PROGRESSÃO DE INSÍGNIAS</h3>
          <div className="grid grid-cols-7 gap-1">
            {INSIGNIA_STYLES.map((style, i) => {
              const titles = ["Barão", "Visconde", "Conde", "Marquês", "Duque", "Príncipe", "Rei"];
              return (
                <div key={i} className="text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full ${style.bgColor} border ${style.borderColor} flex items-center justify-center mb-1`}>
                    <Crown className={`w-4 h-4 ${style.color}`} />
                  </div>
                  <span className={`text-[10px] ${style.color} font-medium block`}>{titles[i]}</span>
                </div>
              );
            })}
          </div>

          {/* Requirements table */}
          <div className="mt-5 space-y-3">
            <div className="p-3 rounded-lg bg-secondary/20">
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-primary" /> Por Categoria
              </p>
              <p className="text-xs text-muted-foreground">
                Rei = 52 avaliações + 15 locais diferentes (12 meses)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/20">
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Por Bairro
              </p>
              <p className="text-xs text-muted-foreground">
                Rei = 104 avaliações + 30 locais diferentes (12 meses)
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/20">
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-primary" /> Por Estabelecimento
              </p>
              <p className="text-xs text-muted-foreground">
                Rei = 52 visitas ao mesmo local (12 meses)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
