// Design: AvaLyarin — Onboarding Survey (Phase 1)
// Fullscreen survey with 7 questions presented one at a time
// Progress bar at top, smooth transitions, gamified badge reward
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Award, MapPin, Clock, DollarSign, Utensils, Heart, Compass, Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import BirthdateRoulette from "@/components/BirthdateRoulette";

export interface SurveyAnswer {
  birthdate: string; // ISO date YYYY-MM-DD
  region: string;
  frequency: string;
  avgSpend: string;
  categories: string[];
  priorities: string[];
  discovery: string[];
}

const QUESTIONS = [
  {
    id: "birthdate",
    icon: <Cake className="w-6 h-6" />,
    title: "DATA DE NASCIMENTO",
    subtitle: "Selecione sua data de nascimento (mínimo 16 anos)",
    type: "birthdate" as const,
  },
  {
    id: "region",
    icon: <MapPin className="w-6 h-6" />,
    title: "ONDE VOCÊ MORA",
    subtitle: "Em qual região de São Paulo você mora?",
    type: "single" as const,
    options: [
      { label: "Zona Norte", value: "zona-norte" },
      { label: "Zona Sul", value: "zona-sul" },
      { label: "Zona Leste", value: "zona-leste" },
      { label: "Zona Oeste", value: "zona-oeste" },
      { label: "Centro", value: "centro" },
      { label: "Região Metropolitana de São Paulo (ABC, Guarulhos, Osasco..)", value: "grande-sp" },
      { label: "Campinas e Região Metropolitana de Campinas", value: "campinas" },
      { label: "Jundiaí e Região Metropolitana de Jundiaí", value: "jundiai" },
      { label: "Não moro em São Paulo", value: "fora-sp" },
    ],
  },
  {
    id: "frequency",
    icon: <Clock className="w-6 h-6" />,
    title: "FREQUÊNCIA",
    subtitle: "Com que frequência você sai para comer ou beber fora?",
    type: "single" as const,
    options: [
      { label: "Quase todos os dias", value: "diariamente" },
      { label: "2 a 3 vezes por semana", value: "2-3x-semana" },
      { label: "1 vez por semana", value: "1x-semana" },
      { label: "2 a 3 vezes por mês", value: "2-3x-mes" },
      { label: "1 vez por mês ou menos", value: "1x-mes" },
      { label: "Raramente", value: "raramente" },
    ],
  },
  {
    id: "spend",
    icon: <DollarSign className="w-6 h-6" />,
    title: "TICKET MÉDIO",
    subtitle: "Dos lugares que você costuma ir, quanto você costuma gastar?",
    type: "single" as const,
    options: [
      { label: "Até R$ 50 por pessoa", value: "ate-50" },
      { label: "R$ 51 a R$ 100", value: "51-100" },
      { label: "R$ 101 a R$ 200", value: "101-200" },
      { label: "R$ 201 a R$ 300", value: "201-300" },
      { label: "R$ 301 a R$ 400", value: "301-400" },
      { label: "Acima de R$ 400", value: "400+" },
    ],
  },
  {
    id: "categories",
    icon: <Utensils className="w-6 h-6" />,
    title: "SEUS FAVORITOS",
    subtitle: "Quais tipos de estabelecimento mais te interessam? (Até 5)",
    type: "multi" as const,
    maxSelect: 5,
    options: [
      { label: "Boteco Tradicional", value: "boteco-tradicional" },
      { label: "Boteco Moderno", value: "boteco-moderno" },
      { label: "Pub", value: "pub" },
      { label: "Cervejaria", value: "cervejaria" },
      { label: "Coquetelaria", value: "coquetelaria" },
      { label: "Bar Musical", value: "bar-musical" },
      { label: "Balada", value: "balada" },
      { label: "Pizzaria", value: "pizzaria" },
      { label: "Hamburgueria", value: "hamburgueria" },
      { label: "Cozinha Brasileira", value: "cozinha-brasileira" },
      { label: "Cozinha Internacional", value: "cozinha-internacional" },
      { label: "Cafeteria", value: "cafeteria" },
      { label: "Padaria", value: "padaria" },
      { label: "Confeitaria", value: "confeitaria" },
      { label: "Restaurante Autoral", value: "autoral" },
      { label: "Saudável", value: "saudavel" },
    ],
  },
  {
    id: "priorities",
    icon: <Heart className="w-6 h-6" />,
    title: "O QUE IMPORTA",
    subtitle: "O que mais pesa na sua decisão? (Selecione até 3)",
    type: "multi" as const,
    maxSelect: 3,
    options: [
      { label: "Qualidade da comida/bebida", value: "qualidade" },
      { label: "Preço / custo-benefício", value: "preco" },
      { label: "Ambiente e decoração", value: "ambiente" },
      { label: "Localização / proximidade", value: "localizacao" },
      { label: "Avaliações de outros clientes", value: "avaliacoes" },
      { label: "Atendimento", value: "atendimento" },
      { label: "Variedade do cardápio", value: "variedade" },
    ],
  },
  {
    id: "discovery",
    icon: <Compass className="w-6 h-6" />,
    title: "COMO DESCOBRE",
    subtitle: "Como você costuma descobrir novos bares e restaurantes?",
    type: "multi" as const,
    maxSelect: 7,
    options: [
      { label: "Indicação de amigos/família", value: "indicacao" },
      { label: "Instagram / TikTok", value: "redes-sociais" },
      { label: "Google Maps / Google Search", value: "google" },
      { label: "Apps de avaliação (TripAdvisor, Yelp)", value: "apps-avaliacao" },
      { label: "Apps de delivery (iFood, Rappi)", value: "delivery" },
      { label: "Blogs e sites especializados", value: "blogs" },
      { label: "Passando na rua / por acaso", value: "acaso" },
    ],
  },
];

interface OnboardingSurveyProps {
  onComplete: (answers: SurveyAnswer) => void;
}

export default function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showBadge, setShowBadge] = useState(false);
  const [birthdateValid, setBirthdateValid] = useState(false);

  const question = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const currentAnswer = answers[question.id];
  const isAnswered = (() => {
    if (question.type === "birthdate") {
      return typeof currentAnswer === "string" && currentAnswer !== "" && birthdateValid;
    }
    if (question.type === "single") {
      return typeof currentAnswer === "string" && currentAnswer !== "";
    }
    return Array.isArray(currentAnswer) && currentAnswer.length > 0;
  })();

  const handleSingleSelect = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question.id]);

  const handleMultiToggle = useCallback((value: string) => {
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) || [];
      const maxSelect = question.type === "multi" ? (question.maxSelect || 99) : 99;
      if (current.includes(value)) {
        return { ...prev, [question.id]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [question.id]: [...current, value] };
    });
  }, [question.id, question.type, question.maxSelect]);

  const handleBirthdateChange = useCallback((date: string) => {
    setAnswers(prev => ({ ...prev, birthdate: date }));
    // Validate: check if date makes user at least 16
    const [y, m, d] = date.split("-").map(Number);
    const birthDate = new Date(y, m - 1, d);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    setBirthdateValid(birthDate <= minDate);
  }, []);

  const handleNext = () => {
    if (!isAnswered) return;
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Survey complete — show badge animation then redirect
      setShowBadge(true);
      setTimeout(() => {
        const surveyAnswers: SurveyAnswer = {
          birthdate: (answers.birthdate as string) || "",
          region: (answers.region as string) || "",
          frequency: (answers.frequency as string) || "",
          avgSpend: (answers.spend as string) || "",
          categories: (answers.categories as string[]) || [],
          priorities: (answers.priorities as string[]) || [],
          discovery: (answers.discovery as string[]) || [],
        };
        onComplete(surveyAnswers);
      }, 2500);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => {
    const surveyAnswers: SurveyAnswer = {
      birthdate: (answers.birthdate as string) || "",
      region: (answers.region as string) || "",
      frequency: (answers.frequency as string) || "",
      avgSpend: (answers.spend as string) || "",
      categories: (answers.categories as string[]) || [],
      priorities: (answers.priorities as string[]) || [],
      discovery: (answers.discovery as string[]) || [],
    };
    onComplete(surveyAnswers);
  };

  // Badge celebration screen
  if (showBadge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary/20 border-2 border-primary/40 mb-6 glow-amber"
          >
            <Award className="w-14 h-14 text-primary" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-4xl tracking-wider text-primary text-glow-amber mb-3"
          >
            PRIMEIRO PASSO
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
    <div className="min-h-screen bg-background flex flex-col">
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
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/avalyarin-icon-green-Wax4Z5TjBNDkcesjXd93cC.webp"
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
              key={question.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground/60 font-medium">
                  {currentStep + 1} de {QUESTIONS.length}
                </span>
              </div>

              {/* Question header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  {question.icon}
                </div>
                <div>
                  <h2 className="font-display text-2xl tracking-wider text-primary text-glow-amber">
                    {question.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{question.subtitle}</p>
                </div>
              </div>

              {/* Content: birthdate roulette or options */}
              {question.type === "birthdate" ? (
                <BirthdateRoulette
                  value={answers.birthdate as string | undefined}
                  onChange={handleBirthdateChange}
                  minAge={16}
                />
              ) : (
                <>
                  {/* Options */}
                  <div className={`grid gap-2.5 ${
                    (question.options?.length || 0) > 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                  }`}>
                    {question.options?.map((opt) => {
                      const isSelected = question.type === "single"
                        ? currentAnswer === opt.value
                        : Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);

                      return (
                        <button
                          key={opt.value}
                          onClick={() => question.type === "single" ? handleSingleSelect(opt.value) : handleMultiToggle(opt.value)}
                          className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-primary/60 bg-primary/10 shadow-sm"
                              : "border-border/30 bg-card hover:border-border/60 hover:bg-card/80"
                          }`}
                        >
                          {question.type === "multi" ? (
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
                  {question.type === "multi" && question.maxSelect && question.maxSelect < 7 && (
                    <p className="text-xs text-muted-foreground/60 mt-3 text-center">
                      {Array.isArray(currentAnswer) ? currentAnswer.length : 0} de {question.maxSelect} selecionados
                    </p>
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
            disabled={!isAnswered}
            className="font-display tracking-wider glow-amber"
          >
            {currentStep < QUESTIONS.length - 1 ? (
              <>PRÓXIMA <ChevronRight className="w-4 h-4 ml-1" /></>
            ) : (
              <>CONCLUIR <Check className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
