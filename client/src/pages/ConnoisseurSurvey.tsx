// Fullscreen survey with dynamic questions from DB for experienced users
// Triggered after 10 evaluations
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Award, BarChart3, Shield, Lightbulb,
  Star, GitCompare, Trophy, MessageSquare, Check, Loader2,
  Clock, DollarSign, Utensils, Heart, Compass, MapPin, Users,
  Calendar, Wine, AlertTriangle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

// ============================================================
// TYPES
// ============================================================

interface SurveyQuestion {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  type: "single" | "multi" | "score" | "text";
  maxSelect?: number;
  options?: { label: string; value: string }[];
  lowScoreReasons?: { label: string; value: string }[];
  lowScoreThreshold?: number;
}

interface ConnoisseurSurveyProps {
  onComplete: (answers: Record<string, string | string[] | number>) => void;
}

// Icon mapping from string name to React component
const ICON_MAP: Record<string, React.ReactNode> = {
  Cake: <Clock className="w-6 h-6" />,
  MapPin: <MapPin className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  DollarSign: <DollarSign className="w-6 h-6" />,
  Utensils: <Utensils className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
  Compass: <Compass className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Wine: <Wine className="w-6 h-6" />,
  AlertTriangle: <AlertTriangle className="w-6 h-6" />,
  MessageSquare: <MessageSquare className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  Shield: <Shield className="w-6 h-6" />,
  Lightbulb: <Lightbulb className="w-6 h-6" />,
  GitCompare: <GitCompare className="w-6 h-6" />,
  Trophy: <Trophy className="w-6 h-6" />,
  BarChart3: <BarChart3 className="w-6 h-6" />,
};

// ============================================================
// COMPONENT
// ============================================================

export default function ConnoisseurSurvey({ onComplete }: ConnoisseurSurveyProps) {
  // Fetch questions dynamically from the database
  const { data: dbQuestions, isLoading: questionsLoading } = trpc.survey.questions.useQuery(
    { phase: "connoisseur" },
    { staleTime: 0, refetchOnMount: true }
  );

  // Map DB questions to usable format
  const QUESTIONS: SurveyQuestion[] = useMemo(() => {
    if (!dbQuestions || dbQuestions.length === 0) return [];
    return dbQuestions
      .filter(q => !q.parentQuestionId)
      .map(q => ({
        id: q.questionId,
        icon: ICON_MAP[q.icon || "Star"] || <Star className="w-6 h-6" />,
        title: q.title,
        subtitle: q.subtitle || "",
        type: q.type as "single" | "multi" | "score" | "text",
        maxSelect: q.maxSelect || undefined,
        options: (q.options as { label: string; value: string }[] | null) || undefined,
        lowScoreReasons: (q.lowScoreReasons as { label: string; value: string }[] | null) || undefined,
        lowScoreThreshold: q.lowScoreThreshold || undefined,
      }));
  }, [dbQuestions]);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [lowReasons, setLowReasons] = useState<Record<string, string[]>>({});
  const [showBadge, setShowBadge] = useState(false);

  const question = QUESTIONS[currentStep];
  const progress = QUESTIONS.length > 0 ? ((currentStep + 1) / QUESTIONS.length) * 100 : 0;

  const currentAnswer = question ? answers[question.id] : undefined;
  const isAnswered = (() => {
    if (!question) return false;
    if (question.type === "single") return typeof currentAnswer === "string" && currentAnswer !== "";
    if (question.type === "multi") return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    if (question.type === "score") return typeof currentAnswer === "number" && currentAnswer > 0;
    if (question.type === "text") return typeof currentAnswer === "string" && currentAnswer.trim().length > 0;
    return false;
  })();

  const isLowScoreValid = (() => {
    if (!question || question.type !== "score") return true;
    const score = currentAnswer as number;
    if (score > 0 && score <= (question.lowScoreThreshold || 6)) {
      const reasons = lowReasons[question.id] || [];
      return reasons.length > 0;
    }
    return true;
  })();

  const handleSingleSelect = useCallback((value: string) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question?.id]);

  const handleMultiToggle = useCallback((value: string) => {
    if (!question) return;
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) || [];
      const maxSelect = question.maxSelect || 99;
      if (current.includes(value)) {
        return { ...prev, [question.id]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [question.id]: [...current, value] };
    });
  }, [question?.id, question?.maxSelect]);

  const handleScoreSelect = useCallback((value: number) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question?.id]);

  const toggleLowReason = useCallback((reason: string) => {
    if (!question) return;
    setLowReasons(prev => {
      const current = prev[question.id] || [];
      if (current.includes(reason)) {
        return { ...prev, [question.id]: current.filter(r => r !== reason) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, [question.id]: [...current, reason] };
    });
  }, [question?.id]);

  const handleNext = () => {
    if (!isAnswered) return;
    if (!isLowScoreValid) return;
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowBadge(true);
      setTimeout(() => {
        const finalAnswers: Record<string, string | string[] | number> = { ...answers };
        Object.entries(lowReasons).forEach(([qId, reasons]) => {
          if (reasons.length > 0) {
            finalAnswers[`${qId}_reasons`] = reasons;
          }
        });
        onComplete(finalAnswers);
      }, 2500);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    onComplete(answers);
  };

  // Loading state
  if (questionsLoading || QUESTIONS.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  // Badge celebration
  if (showBadge) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center px-6"
        >
          <motion.div
            initial={{ rotate: -20 }}
            animate={{ rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10, delay: 0.2 }}
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-accent/20 border-2 border-accent/40 mb-6"
            style={{ boxShadow: "0 0 30px rgba(236,72,153,0.3)" }}
          >
            <Award className="w-14 h-14 text-accent" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-4xl tracking-wider text-accent text-glow-pink mb-3"
          >
            CONHECEDOR
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground text-lg"
          >
            Parabéns! Você é um Avaliador Verificado.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground/60 text-sm mt-2"
          >
            Acesso antecipado a novos recursos desbloqueado.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Voltando ao AvaLyarin...
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="h-1 bg-secondary">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="container flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-accent" />
            </div>
            <span className="font-display text-sm tracking-wider text-accent">CONHECEDOR</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Responder depois
          </button>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Question header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  {question.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/60 tracking-wider">
                    PERGUNTA {currentStep + 1} DE {QUESTIONS.length}
                  </p>
                  <h3 className="font-display text-2xl tracking-wider text-accent">{question.title}</h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 ml-[52px]">{question.subtitle}</p>

              {/* Options */}
              <div className="space-y-2 ml-[52px]">
                {question.type === "single" && question.options?.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSingleSelect(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                      currentAnswer === opt.value
                        ? "border-accent/60 bg-accent/10"
                        : "border-border/30 bg-secondary/30 hover:border-border/60"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      currentAnswer === opt.value ? "border-accent bg-accent" : "border-muted-foreground/40"
                    }`}>
                      {currentAnswer === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-sm font-medium ${currentAnswer === opt.value ? "text-foreground" : "text-muted-foreground"}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}

                {question.type === "multi" && question.options?.map((opt) => {
                  const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);
                  const atMax = Array.isArray(currentAnswer) && currentAnswer.length >= (question.maxSelect || 99);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleMultiToggle(opt.value)}
                      disabled={!selected && atMax}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-accent/60 bg-accent/10"
                          : !selected && atMax
                            ? "border-border/10 bg-secondary/10 opacity-40 cursor-not-allowed"
                            : "border-border/30 bg-secondary/30 hover:border-border/60"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selected ? "bg-accent border-accent" : "border-muted-foreground/40"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}

                {question.type === "score" && (
                  <div>
                    <div className="flex gap-1.5 flex-wrap mb-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => handleScoreSelect(n)}
                          className={`w-11 h-11 rounded-lg font-numbers text-sm font-bold transition-all ${
                            currentAnswer === n
                              ? n <= (question.lowScoreThreshold || 6)
                                ? "bg-red-500/80 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                                : "bg-accent text-white"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          }`}
                          style={currentAnswer === n && n > (question.lowScoreThreshold || 6) ? { boxShadow: "0 0 12px rgba(236,72,153,0.4)" } : {}}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {/* Low score reasons */}
                    <AnimatePresence>
                      {typeof currentAnswer === "number" && currentAnswer > 0 && currentAnswer <= (question.lowScoreThreshold || 6) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                        >
                          <p className="text-xs text-red-400 mb-3 font-medium">
                            O que poderia melhorar? (selecione de 1 a 3)
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {question.lowScoreReasons?.map((reason) => {
                              const isSelected = (lowReasons[question.id] || []).includes(reason.value);
                              const atMax = (lowReasons[question.id] || []).length >= 3;
                              return (
                                <button
                                  key={reason.value}
                                  onClick={() => toggleLowReason(reason.value)}
                                  disabled={!isSelected && atMax}
                                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                                    isSelected
                                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                      : !isSelected && atMax
                                        ? "bg-secondary/20 text-muted-foreground/30 border border-border/10 cursor-not-allowed"
                                        : "bg-secondary/50 text-muted-foreground border border-border/30 hover:border-border/60"
                                  }`}
                                >
                                  {reason.label}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {question.type === "text" && (
                  <div>
                    <textarea
                      value={(currentAnswer as string) || ""}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value.slice(0, 300) }))}
                      placeholder="Escreva aqui sua sugestão..."
                      maxLength={300}
                      className="w-full p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:border-accent/40"
                    />
                    <p className="text-[10px] text-muted-foreground/50 text-right mt-1">
                      {((currentAnswer as string) || "").length}/300
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border/30 py-4">
        <div className="container max-w-2xl flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="font-display tracking-wider"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isAnswered || !isLowScoreValid}
            className="font-display tracking-wider"
            style={{ backgroundColor: "oklch(0.65 0.2 350)", color: "white" }}
          >
            {currentStep < QUESTIONS.length - 1 ? "PRÓXIMA" : "CONCLUIR"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
