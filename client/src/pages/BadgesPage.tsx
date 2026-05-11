// Design: Neon Urbano — Badges page with progression system
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Award, Star, Flame, Trophy, Crown, Gem, Zap, Shield, Target, Medal } from "lucide-react";
import { Link } from "wouter";

// Badge definitions with names, icons, and descriptions
const BADGE_DEFINITIONS = [
  { level: 1, name: "Iniciante", description: "Primeira avaliação feita!", icon: Star, color: "text-zinc-400", bgColor: "bg-zinc-500/10", borderColor: "border-zinc-500/30" },
  { level: 2, name: "Curioso", description: "2 pontos acumulados", icon: Target, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
  { level: 3, name: "Explorador", description: "3 pontos acumulados", icon: Zap, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30" },
  { level: 4, name: "Frequentador", description: "4 pontos acumulados", icon: Shield, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/30" },
  { level: 5, name: "Conhecedor", description: "5 pontos acumulados", icon: Medal, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30" },
  { level: 6, name: "Especialista", description: "6 pontos acumulados", icon: Award, color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30" },
  { level: 7, name: "Crítico", description: "7 pontos acumulados", icon: Flame, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
  { level: 8, name: "Mestre", description: "8 pontos acumulados", icon: Trophy, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30" },
  { level: 9, name: "Lendário", description: "9 pontos acumulados", icon: Crown, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30" },
  { level: 10, name: "Diamante", description: "10 pontos acumulados", icon: Gem, color: "text-sky-300", bgColor: "bg-sky-500/10", borderColor: "border-sky-500/30" },
];

export default function BadgesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [badgeLevel, setBadgeLevel] = useState(0);
  const [badgePoints, setBadgePoints] = useState(0);
  const [justEarned, setJustEarned] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reviews, setReviews] = useState<Array<{ isQualified?: boolean; points?: number }>>([]);

  useEffect(() => {
    const level = parseInt(localStorage.getItem("avalyarin_badge_level") || "0");
    const points = parseFloat(localStorage.getItem("avalyarin_badge_points") || "0");
    const earned = localStorage.getItem("avalyarin_badge_just_earned");
    const reviewsRaw = localStorage.getItem("avalyarin_reviews");

    setBadgeLevel(level);
    setBadgePoints(points);
    setReviews(reviewsRaw ? JSON.parse(reviewsRaw) : []);

    if (earned) {
      setJustEarned(parseInt(earned));
      setShowCelebration(true);
      // Clear the flag
      localStorage.removeItem("avalyarin_badge_just_earned");
    }
  }, []);

  const currentBadge = BADGE_DEFINITIONS.find(b => b.level === badgeLevel);
  const nextBadge = BADGE_DEFINITIONS.find(b => b.level === badgeLevel + 1);
  const progressToNext = nextBadge ? ((badgePoints - badgeLevel) / 1) * 100 : 100;

  // Streak calculation
  const getStreak = () => {
    let streak = 0;
    for (let i = reviews.length - 1; i >= 0; i--) {
      if (reviews[i].isQualified) streak++;
      else break;
    }
    return streak;
  };
  const streak = getStreak();

  // Stats
  const totalReviews = reviews.length;
  const qualifiedReviews = reviews.filter(r => r.isQualified).length;
  const totalPoints = badgePoints;

  return (
    <div className="min-h-screen text-foreground">
      <Navbar onMenuOpen={() => setMenuOpen(true)} />
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="container max-w-lg mx-auto px-4 pt-24 pb-16">
        {/* Celebration Modal */}
        <AnimatePresence>
          {showCelebration && justEarned && (() => {
            const badge = BADGE_DEFINITIONS.find(b => b.level === justEarned);
            if (!badge) return null;
            const Icon = badge.icon;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => setShowCelebration(false)}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="text-center p-8 max-w-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${badge.bgColor} border-2 ${badge.borderColor} mb-6`}>
                      <Icon className={`w-16 h-16 ${badge.color}`} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-2">
                      NOVO BADGE!
                    </h2>
                    <h3 className={`font-display text-2xl tracking-wider ${badge.color} mb-2`}>
                      {badge.name.toUpperCase()}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">{badge.description}</p>
                    <p className="text-xs text-primary/60 mb-6">Nível {badge.level} desbloqueado!</p>
                  </motion.div>

                  <Button
                    onClick={() => setShowCelebration(false)}
                    className="font-display tracking-wider glow-amber"
                  >
                    CONTINUAR
                  </Button>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-2">BADGES</h1>
          <p className="text-sm text-muted-foreground">Avalie estabelecimentos e conquiste badges exclusivos</p>
        </div>

        {/* Current Badge + Progress */}
        <div className="p-6 rounded-2xl bg-card border border-border/50 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {currentBadge ? (() => {
              const Icon = currentBadge.icon;
              return (
                <div className={`w-16 h-16 rounded-full ${currentBadge.bgColor} border ${currentBadge.borderColor} flex items-center justify-center`}>
                  <Icon className={`w-8 h-8 ${currentBadge.color}`} />
                </div>
              );
            })() : (
              <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border/30 flex items-center justify-center">
                <Award className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-display text-xl tracking-wider text-foreground">
                {currentBadge ? currentBadge.name.toUpperCase() : "SEM BADGE"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentBadge ? `Nível ${currentBadge.level}` : "Faça sua primeira avaliação!"}
              </p>
            </div>
          </div>

          {/* Progress bar to next badge */}
          {nextBadge && (
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progresso para {nextBadge.name}</span>
                <span className="font-numbers">{badgePoints.toFixed(1)} / {nextBadge.level} pts</span>
              </div>
              <div className="h-3 rounded-full bg-secondary/50 border border-border/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, progressToNext)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                />
              </div>
            </div>
          )}
          {!nextBadge && badgeLevel >= 10 && (
            <p className="text-xs text-primary/80 text-center">Nível máximo atingido! Parabéns!</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <span className="font-numbers text-2xl text-foreground font-bold">{totalReviews}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Avaliações</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <span className="font-numbers text-2xl text-green-400 font-bold">{qualifiedReviews}</span>
            <p className="text-[10px] text-muted-foreground mt-1">Qualificadas</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className={`w-4 h-4 ${streak >= 3 ? 'text-orange-400' : 'text-muted-foreground/40'}`} />
              <span className={`font-numbers text-2xl font-bold ${streak >= 3 ? 'text-orange-400' : 'text-foreground'}`}>{streak}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Streak</p>
          </div>
        </div>

        {/* Streak info */}
        {streak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 mb-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">Streak Ativo!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {streak >= 3
                ? "Sua próxima avaliação qualificada valerá peso 3! Continue assim!"
                : `Mais ${3 - streak} avaliação qualificada para ativar o bônus de streak (peso 3)!`}
            </p>
          </motion.div>
        )}

        {/* How it works */}
        <div className="p-5 rounded-xl bg-card border border-border/50 mb-6">
          <h4 className="font-display text-lg tracking-wider text-primary mb-3">COMO FUNCIONA</h4>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center text-foreground font-bold">1</span>
              <p><strong className="text-foreground">Avaliação comum</strong> = 1 ponto. Basta fazer uma avaliação Direta ou Analítica.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</span>
              <p><strong className="text-foreground">Avaliação qualificada</strong> = 2 pontos. Comentários em todos os itens (mín. 20 chars) + pelo menos 1 foto com itens marcados.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">+</span>
              <p><strong className="text-foreground">Foto da notinha</strong> = bônus extra (+0.5 pts). Valida os itens pedidos.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</span>
              <p><strong className="text-foreground">Streak bonus</strong> = peso 3! Faça 3 avaliações qualificadas consecutivas e a 3ª vale peso 3.</p>
            </div>
          </div>
        </div>

        {/* All Badges Grid */}
        <div className="mb-8">
          <h4 className="font-display text-lg tracking-wider text-primary mb-4">TODOS OS BADGES</h4>
          <div className="grid grid-cols-2 gap-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const Icon = badge.icon;
              const isEarned = badgeLevel >= badge.level;
              return (
                <motion.div
                  key={badge.level}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: badge.level * 0.05 }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    isEarned
                      ? `${badge.bgColor} ${badge.borderColor}`
                      : "bg-secondary/20 border-border/20 opacity-50"
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                    isEarned ? badge.bgColor : "bg-secondary/30"
                  }`}>
                    <Icon className={`w-6 h-6 ${isEarned ? badge.color : "text-muted-foreground/30"}`} />
                  </div>
                  <h5 className={`text-sm font-semibold ${isEarned ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {badge.name}
                  </h5>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Nível {badge.level}</p>
                  {isEarned && (
                    <span className="inline-block mt-1 text-[9px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                      Conquistado
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline" className="font-display tracking-wider">
              VOLTAR AO INÍCIO
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
