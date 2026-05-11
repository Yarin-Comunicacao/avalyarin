// Design: AvaLyarin — Explorer Survey (Phase 2)
// Fullscreen survey with 8 standard questions + 2 personalized questions based on visited places
// Triggered after 5 evaluations
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Award, Users, Calendar, Clock,
  Zap, Wine, AlertTriangle, Star, DollarSign, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { categories } from "@/lib/data";

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

interface ExplorerSurveyProps {
  onComplete: (answers: Record<string, string | string[] | number>) => void;
}

// ============================================================
// PERSONALIZED QUESTIONS GENERATOR
// ============================================================

function generatePersonalizedQuestions(completedReviews: { establishmentId: string; score: number; date: string }[]): SurveyQuestion[] {
  const questions: SurveyQuestion[] = [];

  // Get category breakdown from visited places
  const categoryVisits: Record<string, { count: number; names: string[]; avgScore: number }> = {};

  completedReviews.forEach((review) => {
    const cat = categories.find((c) => c.establishments.some((e) => e.id === review.establishmentId));
    const est = categories.flatMap((c) => c.establishments).find((e) => e.id === review.establishmentId);
    if (cat && est) {
      if (!categoryVisits[cat.id]) {
        categoryVisits[cat.id] = { count: 0, names: [], avgScore: 0 };
      }
      categoryVisits[cat.id].count++;
      categoryVisits[cat.id].names.push(est.name);
      categoryVisits[cat.id].avgScore += review.score;
    }
  });

  // Calculate averages
  Object.keys(categoryVisits).forEach((catId) => {
    categoryVisits[catId].avgScore = categoryVisits[catId].avgScore / categoryVisits[catId].count;
  });

  // Sort categories by visit count
  const sortedCategories = Object.entries(categoryVisits).sort((a, b) => b[1].count - a[1].count);

  // Get the most visited category
  const topCategory = sortedCategories[0];
  const topCatObj = topCategory ? categories.find((c) => c.id === topCategory[0]) : null;

  // Get neighborhoods from visited places
  const neighborhoods: Record<string, number> = {};
  completedReviews.forEach((review) => {
    const est = categories.flatMap((c) => c.establishments).find((e) => e.id === review.establishmentId);
    if (est && est.neighborhood) {
      neighborhoods[est.neighborhood] = (neighborhoods[est.neighborhood] || 0) + 1;
    }
  });
  const topNeighborhoods = Object.entries(neighborhoods).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // PERSONALIZED QUESTION 1: Based on most visited category
  if (topCatObj) {
    const visitedNames = categoryVisits[topCatObj.id]?.names.slice(0, 3).join(", ") || "";
    questions.push({
      id: "personal_category",
      icon: <Star className="w-6 h-6" />,
      title: `SOBRE ${topCatObj.name.toUpperCase()}`,
      subtitle: `Você visitou ${visitedNames}${categoryVisits[topCatObj.id]?.count > 3 ? " e outros" : ""}. O que mais te atrai nesse tipo de estabelecimento?`,
      type: "multi",
      maxSelect: 3,
      options: getCategorySpecificOptions(topCatObj.id),
    });
  } else {
    // Fallback if no category data
    questions.push({
      id: "personal_category",
      icon: <Star className="w-6 h-6" />,
      title: "O QUE TE ATRAI",
      subtitle: "Nos lugares que você visitou, o que mais te chamou atenção?",
      type: "multi",
      maxSelect: 3,
      options: [
        { label: "Cardápio criativo e diferenciado", value: "cardapio-criativo" },
        { label: "Ambiente acolhedor", value: "ambiente-acolhedor" },
        { label: "Preço justo pelo que oferece", value: "preco-justo" },
        { label: "Atendimento atencioso", value: "atendimento" },
        { label: "Localização conveniente", value: "localizacao" },
        { label: "Indicação de amigos", value: "indicacao" },
      ],
    });
  }

  // PERSONALIZED QUESTION 2: Based on neighborhoods visited
  if (topNeighborhoods.length > 0) {
    const neighborhoodNames = topNeighborhoods.map(([n]) => n).join(", ");
    questions.push({
      id: "personal_neighborhood",
      icon: <MessageSquare className="w-6 h-6" />,
      title: "SEUS BAIRROS",
      subtitle: `Você frequentou lugares em ${neighborhoodNames}. Qual aspecto mais influencia sua escolha de bairro?`,
      type: "single",
      options: [
        { label: "Proximidade de casa ou trabalho", value: "proximidade" },
        { label: "Variedade de opções no bairro", value: "variedade" },
        { label: "Segurança e facilidade de acesso", value: "seguranca" },
        { label: "Vida noturna e agito do bairro", value: "vida-noturna" },
        { label: "Charme e atmosfera do bairro", value: "charme" },
        { label: "Estacionamento fácil", value: "estacionamento" },
        { label: "Não ligo para o bairro, vou onde é bom", value: "nao-importa" },
      ],
    });
  } else {
    questions.push({
      id: "personal_neighborhood",
      icon: <MessageSquare className="w-6 h-6" />,
      title: "ESCOLHA DE BAIRRO",
      subtitle: "O que mais influencia sua escolha de bairro para sair?",
      type: "single",
      options: [
        { label: "Proximidade de casa ou trabalho", value: "proximidade" },
        { label: "Variedade de opções no bairro", value: "variedade" },
        { label: "Segurança e facilidade de acesso", value: "seguranca" },
        { label: "Vida noturna e agito do bairro", value: "vida-noturna" },
        { label: "Charme e atmosfera do bairro", value: "charme" },
        { label: "Estacionamento fácil", value: "estacionamento" },
        { label: "Não ligo para o bairro, vou onde é bom", value: "nao-importa" },
      ],
    });
  }

  return questions;
}

function getCategorySpecificOptions(categoryId: string): { label: string; value: string }[] {
  const baseOptions: Record<string, { label: string; value: string }[]> = {
    "pizzaria": [
      { label: "Massa artesanal e forno a lenha", value: "massa-artesanal" },
      { label: "Variedade de sabores", value: "variedade-sabores" },
      { label: "Ambiente familiar e aconchegante", value: "ambiente-familiar" },
      { label: "Rodízio com bom custo-benefício", value: "rodizio" },
      { label: "Pizzas gourmet e diferenciadas", value: "gourmet" },
      { label: "Entrega rápida e boa embalagem", value: "delivery" },
    ],
    "boteco-tradicional": [
      { label: "Petiscos clássicos bem feitos", value: "petiscos-classicos" },
      { label: "Cerveja gelada e chopp cremoso", value: "cerveja-gelada" },
      { label: "Ambiente descontraído e informal", value: "ambiente-informal" },
      { label: "Preço acessível", value: "preco-acessivel" },
      { label: "Música ao vivo ou ambiente animado", value: "musica-ao-vivo" },
      { label: "Tradição e história do lugar", value: "tradicao" },
    ],
    "cozinha-brasileira": [
      { label: "Pratos regionais autênticos", value: "pratos-regionais" },
      { label: "Porções generosas", value: "porcoes-generosas" },
      { label: "Tempero caseiro e sabor de comida de mãe", value: "tempero-caseiro" },
      { label: "Variedade de carnes e proteínas", value: "variedade-carnes" },
      { label: "Feijoada, moqueca e clássicos", value: "classicos" },
      { label: "Ambiente com identidade brasileira", value: "identidade-brasileira" },
    ],
    "cozinha-internacional": [
      { label: "Autenticidade da culinária estrangeira", value: "autenticidade" },
      { label: "Ingredientes importados e de qualidade", value: "ingredientes-importados" },
      { label: "Chef com experiência internacional", value: "chef-internacional" },
      { label: "Ambiente temático e imersivo", value: "ambiente-tematico" },
      { label: "Carta de vinhos ou saquê especial", value: "carta-bebidas" },
      { label: "Curiosidade por sabores novos", value: "curiosidade" },
    ],
    "cafeteria": [
      { label: "Café especial e métodos diferenciados", value: "cafe-especial" },
      { label: "Bolos e doces artesanais", value: "doces-artesanais" },
      { label: "Ambiente para trabalhar ou estudar", value: "coworking" },
      { label: "Brunch e opções de café da manhã", value: "brunch" },
      { label: "Wi-Fi e tomadas disponíveis", value: "wifi" },
      { label: "Decoração instagramável", value: "instagramavel" },
    ],
    "padaria": [
      { label: "Pães artesanais frescos", value: "paes-artesanais" },
      { label: "Café da manhã completo", value: "cafe-da-manha" },
      { label: "Salgados e lanches rápidos", value: "salgados" },
      { label: "Bolos e confeitaria de qualidade", value: "confeitaria" },
      { label: "Atendimento rápido no balcão", value: "atendimento-rapido" },
      { label: "Tradição e confiança do bairro", value: "tradicao-bairro" },
    ],
    "bar-lanchonete": [
      { label: "Lanches e hambúrgueres artesanais", value: "lanches-artesanais" },
      { label: "Cerveja gelada e drinks", value: "cerveja-drinks" },
      { label: "Ambiente casual e descontraído", value: "casual" },
      { label: "Porções para compartilhar", value: "porcoes" },
      { label: "Preço acessível e bom custo-benefício", value: "preco-acessivel" },
      { label: "Transmissão de jogos e esportes", value: "esportes" },
    ],
  };

  return baseOptions[categoryId] || [
    { label: "Cardápio criativo e diferenciado", value: "cardapio-criativo" },
    { label: "Ambiente acolhedor e bem decorado", value: "ambiente-acolhedor" },
    { label: "Preço justo pelo que oferece", value: "preco-justo" },
    { label: "Atendimento atencioso e profissional", value: "atendimento" },
    { label: "Localização conveniente", value: "localizacao" },
    { label: "Indicação de amigos ou redes sociais", value: "indicacao" },
  ];
}

// ============================================================
// STANDARD QUESTIONS (Phase 2)
// ============================================================

const STANDARD_QUESTIONS: SurveyQuestion[] = [
  {
    id: "companion",
    icon: <Users className="w-6 h-6" />,
    title: "COM QUEM COSTUMA SAIR",
    subtitle: "Quando sai para comer ou beber, geralmente está com quem?",
    type: "single",
    options: [
      { label: "Sozinho(a)", value: "sozinho" },
      { label: "Com parceiro(a) / cônjuge", value: "casal" },
      { label: "Com amigos", value: "amigos" },
      { label: "Com família", value: "familia" },
      { label: "Com colegas de trabalho", value: "trabalho" },
      { label: "Varia bastante", value: "varia" },
    ],
  },
  {
    id: "preferredDays",
    icon: <Calendar className="w-6 h-6" />,
    title: "DIAS PREFERIDOS",
    subtitle: "Em quais dias da semana você mais costuma sair?",
    type: "multi",
    maxSelect: 6,
    options: [
      { label: "Segunda a quinta", value: "semana" },
      { label: "Sexta-feira", value: "sexta" },
      { label: "Sábado", value: "sabado" },
      { label: "Domingo", value: "domingo" },
      { label: "Feriados", value: "feriados" },
      { label: "Não tenho preferência", value: "sem-preferencia" },
    ],
  },
  {
    id: "preferredTime",
    icon: <Clock className="w-6 h-6" />,
    title: "HORÁRIO PREFERIDO",
    subtitle: "Qual horário você mais frequenta bares e restaurantes?",
    type: "multi",
    maxSelect: 5,
    options: [
      { label: "Almoço (11h-14h)", value: "almoco" },
      { label: "Tarde / Happy Hour (14h-18h)", value: "happy-hour" },
      { label: "Jantar (18h-21h)", value: "jantar" },
      { label: "Noite (21h-00h)", value: "noite" },
      { label: "Madrugada (após 00h)", value: "madrugada" },
    ],
  },
  {
    id: "motivation",
    icon: <Zap className="w-6 h-6" />,
    title: "MOTIVAÇÃO PARA AVALIAR",
    subtitle: "O que te motiva a avaliar um estabelecimento no AvaLyarin?",
    type: "multi",
    maxSelect: 3,
    options: [
      { label: "Ajudar outras pessoas a escolherem melhor", value: "ajudar-outros" },
      { label: "Registrar minhas experiências gastronômicas", value: "registro-pessoal" },
      { label: "Reconhecer um lugar que merece destaque", value: "reconhecimento" },
      { label: "Alertar sobre uma experiência ruim", value: "alerta-negativo" },
      { label: "Ganhar badges e subir no ranking", value: "gamificacao" },
      { label: "Contribuir para a comunidade", value: "comunidade" },
    ],
  },
  {
    id: "preferredDrink",
    icon: <Wine className="w-6 h-6" />,
    title: "BEBIDA PREFERIDA",
    subtitle: "Qual sua bebida preferida quando sai? (Selecione até 3)",
    type: "multi",
    maxSelect: 3,
    options: [
      { label: "Cerveja artesanal", value: "cerveja-artesanal" },
      { label: "Cerveja comercial (Brahma, Skol, etc.)", value: "cerveja-comercial" },
      { label: "Chopp", value: "chopp" },
      { label: "Drinks / Coquetéis", value: "drinks" },
      { label: "Vinho", value: "vinho" },
      { label: "Whisky / Destilados", value: "destilados" },
      { label: "Refrigerante / Suco", value: "nao-alcoolico" },
      { label: "Café / Chá", value: "cafe-cha" },
      { label: "Não bebo álcool", value: "sem-alcool" },
    ],
  },
  {
    id: "dietaryRestrictions",
    icon: <AlertTriangle className="w-6 h-6" />,
    title: "RESTRIÇÕES ALIMENTARES",
    subtitle: "Você possui alguma restrição ou preferência alimentar?",
    type: "multi",
    maxSelect: 8,
    options: [
      { label: "Nenhuma", value: "nenhuma" },
      { label: "Vegetariano(a)", value: "vegetariano" },
      { label: "Vegano(a)", value: "vegano" },
      { label: "Sem glúten (celíaco)", value: "sem-gluten" },
      { label: "Sem lactose", value: "sem-lactose" },
      { label: "Low carb / Keto", value: "low-carb" },
      { label: "Alergia a frutos do mar", value: "alergia-frutos-mar" },
    ],
  },
  {
    id: "appExperience",
    icon: <Star className="w-6 h-6" />,
    title: "SUA EXPERIÊNCIA",
    subtitle: "De 1 a 10, como você avalia sua experiência com o AvaLyarin até agora?",
    type: "score",
    lowScoreThreshold: 6,
    lowScoreReasons: [
      { label: "Poucos estabelecimentos cadastrados", value: "poucos-locais" },
      { label: "Difícil de usar / navegação confusa", value: "usabilidade" },
      { label: "Informações desatualizadas", value: "info-desatualizada" },
      { label: "Não encontrei o que procurava", value: "nao-encontrou" },
      { label: "O app é lento ou trava", value: "performance" },
    ],
  },
  {
    id: "willPay",
    icon: <DollarSign className="w-6 h-6" />,
    title: "FUNCIONALIDADES PREMIUM",
    subtitle: "Você pagaria por funcionalidades premium no AvaLyarin? (Ex: reservas prioritárias, descontos exclusivos, avaliações de sommeliers)",
    type: "single",
    options: [
      { label: "Sim, com certeza", value: "sim-certeza" },
      { label: "Talvez, dependendo do preço", value: "talvez" },
      { label: "Provavelmente não", value: "provavelmente-nao" },
      { label: "Não, prefiro usar gratuitamente", value: "nao" },
    ],
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function ExplorerSurvey({ onComplete }: ExplorerSurveyProps) {
  // Load completed reviews from localStorage
  const completedReviews = useMemo(() => {
    try {
      const raw = localStorage.getItem("avalyarin_reviews");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  // Generate personalized questions
  const personalizedQuestions = useMemo(
    () => generatePersonalizedQuestions(completedReviews),
    [completedReviews]
  );

  // Combine: 8 standard + 2 personalized (inserted after question 6, before NPS)
  const allQuestions = useMemo(() => {
    const standard = [...STANDARD_QUESTIONS];
    // Insert personalized questions after index 5 (after dietary restrictions, before app experience)
    standard.splice(6, 0, ...personalizedQuestions);
    return standard;
  }, [personalizedQuestions]);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [lowReasons, setLowReasons] = useState<Record<string, string[]>>({});
  const [showBadge, setShowBadge] = useState(false);

  const question = allQuestions[currentStep];
  const progress = ((currentStep + 1) / allQuestions.length) * 100;

  const currentAnswer = answers[question.id];
  const isAnswered = (() => {
    if (question.type === "single") return typeof currentAnswer === "string" && currentAnswer !== "";
    if (question.type === "multi") return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    if (question.type === "score") return typeof currentAnswer === "number" && currentAnswer > 0;
    if (question.type === "text") return typeof currentAnswer === "string" && currentAnswer.trim().length > 0;
    return false;
  })();

  // For score questions with low score, check if reasons are provided
  const isLowScoreValid = (() => {
    if (question.type !== "score") return true;
    const score = currentAnswer as number;
    if (score > 0 && score <= (question.lowScoreThreshold || 6)) {
      const reasons = lowReasons[question.id] || [];
      return reasons.length > 0;
    }
    return true;
  })();

  const handleSingleSelect = useCallback((value: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question.id]);

  const handleMultiToggle = useCallback((value: string) => {
    setAnswers(prev => {
      const current = (prev[question.id] as string[]) || [];
      const maxSelect = question.maxSelect || 99;
      if (current.includes(value)) {
        return { ...prev, [question.id]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [question.id]: [...current, value] };
    });
  }, [question.id, question.maxSelect]);

  const handleScoreSelect = useCallback((value: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }, [question.id]);

  const toggleLowReason = useCallback((reason: string) => {
    setLowReasons(prev => {
      const current = prev[question.id] || [];
      if (current.includes(reason)) {
        return { ...prev, [question.id]: current.filter(r => r !== reason) };
      }
      if (current.length >= 3) return prev;
      return { ...prev, [question.id]: [...current, reason] };
    });
  }, [question.id]);

  const handleNext = () => {
    if (!isAnswered) return;
    if (!isLowScoreValid) return;
    if (currentStep < allQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Survey complete
      setShowBadge(true);
      setTimeout(() => {
        const finalAnswers: Record<string, string | string[] | number> = { ...answers };
        // Include low score reasons
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
            EXPLORADOR
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground text-lg"
          >
            Parabéns! Você desbloqueou o ranking regional.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="container flex items-center justify-between h-14 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display text-sm tracking-wider text-primary">EXPLORADOR</span>
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
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  {question.icon}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/60 tracking-wider">
                    PERGUNTA {currentStep + 1} DE {allQuestions.length}
                  </p>
                  <h3 className="font-display text-2xl tracking-wider text-primary">{question.title}</h3>
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
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/30 bg-secondary/30 hover:border-border/60"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      currentAnswer === opt.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {currentAnswer === opt.value && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
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
                          ? "border-primary/60 bg-primary/10"
                          : !selected && atMax
                            ? "border-border/10 bg-secondary/10 opacity-40 cursor-not-allowed"
                            : "border-border/30 bg-secondary/30 hover:border-border/60"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                      }`}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
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
                                : "bg-primary text-primary-foreground glow-amber"
                              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                          }`}
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
                  <textarea
                    value={(currentAnswer as string) || ""}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value.slice(0, 300) }))}
                    placeholder="Escreva aqui..."
                    maxLength={300}
                    className="w-full p-4 rounded-xl bg-secondary/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none h-32 focus:outline-none focus:border-primary/40"
                  />
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
            className="font-display tracking-wider glow-amber"
          >
            {currentStep < allQuestions.length - 1 ? "PRÓXIMA" : "CONCLUIR"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
