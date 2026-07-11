// Fullscreen survey with dynamic questions from DB + location step presented one at a time
// Progress bar at top, smooth transitions, gamified badge reward
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Award, MapPin, Clock, DollarSign, Utensils, Heart, Compass, Cake, Navigation, Loader2, Star, Zap, Users, Calendar, Wine, AlertTriangle, MessageSquare, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BirthdateRoulette from "@/components/BirthdateRoulette";
import { trpc } from "@/lib/trpc";

export interface SurveyAnswer {
  birthdate: string; // ISO date YYYY-MM-DD
  region: string;
  frequency: string;
  avgSpend: string;
  categories: string[];
  priorities: string[];
  discovery: string[];
  selectedEstablishmentId?: string; // ID do estab selecionado (para fluxo business)
}

// Icon mapping from string name to React component
const ICON_MAP: Record<string, React.ReactNode> = {
  Cake: <Cake className="w-6 h-6" />,
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
  Navigation: <Navigation className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  Store: <Store className="w-6 h-6" />,
  Search: <Search className="w-6 h-6" />,
};

interface OnboardingSurveyProps {
  onComplete: (answers: SurveyAnswer) => void;
}

export default function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showBadge, setShowBadge] = useState(false);
  const [birthdateValid, setBirthdateValid] = useState(false);

  // Location step state
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [estabSearch, setEstabSearch] = useState("");

  const saveLocationMutation = trpc.profile.saveLocation.useMutation();

  // Fetch all establishments for 'establishment' type questions
  const { data: allEstablishments } = trpc.survey.allEstablishments.useQuery(undefined, {
    staleTime: 60_000,
  });

  // Fetch questions dynamically from the database
  const { data: dbQuestions, isLoading: questionsLoading } = trpc.survey.questions.useQuery(
    { phase: "onboarding" },
    { staleTime: 0, refetchOnMount: true }
  );

  // Map DB questions to usable format, including conditional sub-questions
  const QUESTIONS = useMemo(() => {
    if (!dbQuestions || dbQuestions.length === 0) return [];

    const mainQuestions = dbQuestions.filter(q => !q.parentQuestionId);
    const childQuestions = dbQuestions.filter(q => !!q.parentQuestionId);

    // Build the ordered list: main question, then any triggered children
    const result: Array<{
      id: string;
      dbId: number;
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      type: "single" | "multi" | "birthdate" | "score" | "text" | "establishment";
      maxSelect?: number;
      options: { label: string; value: string }[];
      parentQuestionId?: number | null;
      triggerOption?: string | null;
    }> = [];

    for (const q of mainQuestions) {
      result.push({
        id: q.questionId,
        dbId: q.id,
        icon: ICON_MAP[q.icon || "Star"] || <Star className="w-6 h-6" />,
        title: q.title,
        subtitle: (q.subtitle as string) || "",
        type: q.type as any,
        maxSelect: q.maxSelect || undefined,
        options: (q.options as { label: string; value: string }[] | null) || [],
        parentQuestionId: null,
        triggerOption: null,
      });
      // Insert children right after their parent
      const children = childQuestions.filter(c => c.parentQuestionId === q.id);
      for (const child of children) {
        result.push({
          id: child.questionId,
          dbId: child.id,
          icon: ICON_MAP[child.icon || "Star"] || <Star className="w-6 h-6" />,
          title: child.title,
          subtitle: (child.subtitle as string) || "",
          type: child.type as any,
          maxSelect: child.maxSelect || undefined,
          options: (child.options as { label: string; value: string }[] | null) || [],
          parentQuestionId: child.parentQuestionId,
          triggerOption: child.triggerOption,
        });
      }
    }
    return result;
  }, [dbQuestions]);

  // Filter visible questions based on conditional logic (answers determine which children show)
  const VISIBLE_QUESTIONS = useMemo(() => {
    return QUESTIONS.filter(q => {
      // Main questions always visible
      if (!q.parentQuestionId || !q.triggerOption) return true;
      // Find parent question's ID (questionId string) by dbId
      const parent = QUESTIONS.find(p => p.dbId === q.parentQuestionId);
      if (!parent) return false;
      // Check if user's answer to parent matches the trigger
      const parentAnswer = answers[parent.id];
      if (typeof parentAnswer === "string") return parentAnswer === q.triggerOption;
      if (Array.isArray(parentAnswer)) return parentAnswer.includes(q.triggerOption);
      return false;
    });
  }, [QUESTIONS, answers]);

  // Total steps = VISIBLE_QUESTIONS + 1 (location step)
  const TOTAL_STEPS = VISIBLE_QUESTIONS.length + 1;

  const isLocationStep = currentStep >= VISIBLE_QUESTIONS.length;
  const question = isLocationStep ? null : VISIBLE_QUESTIONS[currentStep];
  const progress = TOTAL_STEPS > 0 ? ((currentStep + 1) / TOTAL_STEPS) * 100 : 0;

  const currentAnswer = question ? answers[question.id] : undefined;
  const isAnswered = (() => {
    if (isLocationStep) return locationGranted;
    if (!question) return false;
    if (question.type === "birthdate") {
      return typeof currentAnswer === "string" && currentAnswer !== "" && birthdateValid;
    }
    if (question.type === "single" || question.type === "establishment") {
      return typeof currentAnswer === "string" && currentAnswer !== "";
    }
    return Array.isArray(currentAnswer) && currentAnswer.length > 0;
  })();

  const handleSingleSelect = useCallback((value: string) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question?.id]);

  const handleMultiToggle = useCallback((value: string) => {
    if (!question) return;
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) || [];
      const maxSelect = question.type === "multi" ? (question.maxSelect || 99) : 99;
      if (current.includes(value)) {
        return { ...prev, [question.id]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [question.id]: [...current, value] };
    });
  }, [question?.id, question?.type, question?.maxSelect]);

  const handleBirthdateChange = useCallback((date: string) => {
    setAnswers(prev => ({ ...prev, birthdate: date }));
    // Validate: check if date makes user at least 18
    const [y, m, d] = date.split("-").map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    setBirthdateValid(birthDate <= minDate);
  }, []);

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada neste navegador");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        // Save to localStorage for immediate use
        localStorage.setItem("avalyarin_user_location", JSON.stringify({
          lat, lng, timestamp: Date.now(),
        }));
        // Save to DB
        saveLocationMutation.mutate({ lat, lng });
        setLocationGranted(true);
        setLocationLoading(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Permissão negada. Você pode ativar depois nas configurações do navegador.");
        } else {
          setLocationError("Não foi possível obter sua localização. Tente novamente.");
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [saveLocationMutation]);

  const finishSurvey = useCallback(() => {
    setShowBadge(true);
    setTimeout(() => {
      // Find any answer to an 'establishment' type question
      const estabQuestion = VISIBLE_QUESTIONS.find(q => q.type === "establishment");
      const estabId = estabQuestion ? (answers[estabQuestion.id] as string) : undefined;
      const surveyAnswers: SurveyAnswer = {
        birthdate: (answers.birthdate as string) || "",
        region: (answers.region as string) || "",
        frequency: (answers.frequency as string) || "",
        avgSpend: (answers.spend as string) || "",
        categories: (answers.categories as string[]) || [],
        priorities: (answers.priorities as string[]) || [],
        discovery: (answers.discovery as string[]) || [],
        selectedEstablishmentId: estabId || undefined,
      };
      onComplete(surveyAnswers);
    }, 2500);
  }, [answers, onComplete, VISIBLE_QUESTIONS]);

  const handleNext = () => {
    if (isLocationStep) {
      // Location step — proceed to finish
      finishSurvey();
      return;
    }
    if (!isAnswered) return;
    if (currentStep < VISIBLE_QUESTIONS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    const estabQuestion = VISIBLE_QUESTIONS.find(q => q.type === "establishment");
    const estabId = estabQuestion ? (answers[estabQuestion.id] as string) : undefined;
    const surveyAnswers: SurveyAnswer = {
      birthdate: (answers.birthdate as string) || "",
      region: (answers.region as string) || "",
      frequency: (answers.frequency as string) || "",
      avgSpend: (answers.spend as string) || "",
      categories: (answers.categories as string[]) || [],
      priorities: (answers.priorities as string[]) || [],
      discovery: (answers.discovery as string[]) || [],
      selectedEstablishmentId: estabId || undefined,
    };
    onComplete(surveyAnswers);
  };

  // Loading state while fetching questions from DB
  if (questionsLoading || VISIBLE_QUESTIONS.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando pesquisa...</p>
        </div>
      </div>
    );
  }

  // Badge celebration screen
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
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 12, delay: 0.2 }}
            className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 border-2 border-primary/40 flex items-center justify-center mb-6"
          >
            <Award className="w-12 h-12 text-primary" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-display text-3xl tracking-wider text-primary text-glow-amber mb-2"
          >
            EXPLORADOR
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground text-lg"
          >
            Parabéns! Você desbloqueou filtros personalizados.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Entrando no AvaLyarin...
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
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="container flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden p-0.5">
              <img
                src="/storage/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
                alt="AvaLyarin"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display text-lg tracking-wider text-primary">AVALYARIN</span>
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLocationStep ? "location" : question!.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground/60 font-medium">
                  {currentStep + 1} de {TOTAL_STEPS}
                </span>
              </div>

              {isLocationStep ? (
                /* ═══════ LOCATION STEP ═══════ */
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                      <Navigation className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                        SUA LOCALIZAÇÃO
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Permita o acesso para encontrar bares perto de você
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
                        <MapPin className="w-10 h-10 text-primary" />
                      </div>

                      {locationGranted ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-green-500">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">Localização ativada!</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Agora você verá bares e restaurantes próximos a você.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Com sua localização, mostramos estabelecimentos próximos, calculamos distâncias e personalizamos suas recomendações.
                          </p>

                          <Button
                            onClick={handleRequestLocation}
                            disabled={locationLoading}
                            className="w-full font-display tracking-wider glow-amber"
                            size="lg"
                          >
                            {locationLoading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> OBTENDO...</>
                            ) : (
                              <><Navigation className="w-4 h-4 mr-2" /> ATIVAR LOCALIZAÇÃO</>
                            )}
                          </Button>

                          {locationError && (
                            <p className="text-xs text-destructive">{locationError}</p>
                          )}

                          <p className="text-xs text-muted-foreground/50">
                            Você pode pular esta etapa e ativar depois.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* ═══════ REGULAR QUESTION STEPS ═══════ */
                <>
                  {/* Question header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                      {question!.icon}
                    </div>
                    <div>
                      <h2 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                        {question!.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">{question!.subtitle}</p>
                    </div>
                  </div>

                  {/* Content: birthdate roulette, establishment picker, or options */}
                  {question!.type === "birthdate" ? (
                    <BirthdateRoulette
                      value={answers.birthdate as string | undefined}
                      onChange={handleBirthdateChange}
                      minAge={18}
                    />
                  ) : question!.type === "establishment" ? (
                    /* ═══════ ESTABLISHMENT PICKER ═══════ */
                    <div className="space-y-3">
                      {/* Search input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar estabelecimento..."
                          value={estabSearch}
                          onChange={(e) => setEstabSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {/* Establishments list */}
                      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                        {(allEstablishments || []).filter(e =>
                          !estabSearch || e.name.toLowerCase().includes(estabSearch.toLowerCase()) ||
                          (e.neighborhood || "").toLowerCase().includes(estabSearch.toLowerCase())
                        ).map((estab) => {
                          const isSelected = currentAnswer === String(estab.id);
                          return (
                            <button
                              key={estab.id}
                              onClick={() => handleSingleSelect(String(estab.id))}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-primary/60 bg-primary/10 shadow-sm"
                                  : "border-border/30 bg-card hover:border-border/60 hover:bg-card/80"
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "border-primary" : "border-muted-foreground/40"
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <div className="min-w-0">
                                <span className={`text-sm font-medium block truncate ${
                                  isSelected ? "text-foreground" : "text-muted-foreground"
                                }`}>
                                  {estab.name}
                                </span>
                                {estab.neighborhood && (
                                  <span className="text-xs text-muted-foreground/60 block truncate">
                                    {estab.neighborhood}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {(allEstablishments || []).filter(e =>
                          !estabSearch || e.name.toLowerCase().includes(estabSearch.toLowerCase()) ||
                          (e.neighborhood || "").toLowerCase().includes(estabSearch.toLowerCase())
                        ).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum estabelecimento encontrado
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Options */}
                      <div className={`grid gap-2.5 ${
                        (question!.options?.length || 0) > 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                      }`}>
                        {question!.options?.map((opt) => {
                          const isSelected = question!.type === "single"
                            ? currentAnswer === opt.value
                            : Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);

                          return (
                            <button
                              key={opt.value}
                              onClick={() => question!.type === "single" ? handleSingleSelect(opt.value) : handleMultiToggle(opt.value)}
                              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-primary/60 bg-primary/10 shadow-sm"
                                  : "border-border/30 bg-card hover:border-border/60 hover:bg-card/80"
                              }`}
                            >
                              {question!.type === "multi" ? (
                                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? "border-primary" : "border-muted-foreground/40"
                                }`}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                </div>
                              )}
                              <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Multi-select counter */}
                      {question!.type === "multi" && question!.maxSelect && question!.maxSelect < 7 && (
                        <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                          {Array.isArray(currentAnswer) ? currentAnswer.length : 0} de {question!.maxSelect} selecionados
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border/30">
        <div className="container max-w-2xl flex items-center justify-between h-16">
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
            disabled={isLocationStep ? false : !isAnswered}
            className="font-display tracking-wider glow-amber"
          >
            {isLocationStep ? (
              locationGranted ? (
                <>CONCLUIR <Check className="w-4 h-4 ml-1" /></>
              ) : (
                <>PULAR <ChevronRight className="w-4 h-4 ml-1" /></>
              )
            ) : currentStep < VISIBLE_QUESTIONS.length - 1 ? (
              <>PRÓXIMA <ChevronRight className="w-4 h-4 ml-1" /></>
            ) : (
              <>PRÓXIMA <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
