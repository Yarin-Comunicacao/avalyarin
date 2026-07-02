// Notificações — Badges alcançados, Pesquisas de Preferência, Atualizações de Grupos
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useParams, Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Trophy, Star, Users, ChevronRight, ChevronLeft,
  ArrowLeft, CheckCircle2, Circle, Sparkles, MessageSquare,
  ClipboardCheck, UserPlus, Check, X, Loader2, Crown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Badge definitions (same as badges page)
const BADGE_LEVELS = [
  { level: 1, name: "Curioso", minPoints: 1, icon: "🔍", desc: "Fez sua primeira avaliação" },
  { level: 2, name: "Explorador", minPoints: 3, icon: "🧭", desc: "3 avaliações realizadas" },
  { level: 3, name: "Frequentador", minPoints: 5, icon: "🍻", desc: "5 avaliações realizadas" },
  { level: 4, name: "Conhecedor", minPoints: 10, icon: "🎯", desc: "10 avaliações realizadas" },
  { level: 5, name: "Crítico", minPoints: 20, icon: "✍️", desc: "20 avaliações realizadas" },
  { level: 6, name: "Sommelier", minPoints: 35, icon: "🍷", desc: "35 avaliações realizadas" },
  { level: 7, name: "Mestre", minPoints: 50, icon: "👨‍🍳", desc: "50 avaliações realizadas" },
  { level: 8, name: "Lenda", minPoints: 100, icon: "🏆", desc: "100 avaliações realizadas" },
];

// Preference survey questions (migrated from bonus questions)
const PREFERENCE_SURVEYS = [
  {
    id: "survey-1",
    title: "Suas Preferências Gastronômicas",
    description: "Nos ajude a personalizar suas recomendações",
    questions: [
      {
        id: "q1",
        text: "Qual tipo de culinária você mais aprecia?",
        options: ["Brasileira", "Italiana", "Japonesa", "Mexicana", "Árabe", "Francesa", "Asiática", "Americana"],
        multiSelect: true,
      },
      {
        id: "q2",
        text: "O que mais importa para você em um restaurante?",
        options: ["Sabor da comida", "Ambiente/Decoração", "Atendimento", "Custo-benefício", "Localização", "Variedade do cardápio"],
        multiSelect: true,
      },
      {
        id: "q3",
        text: "Com que frequência você sai para comer fora?",
        options: ["Todos os dias", "3-5x por semana", "1-2x por semana", "Quinzenalmente", "Mensalmente"],
        multiSelect: false,
      },
    ],
    unlockAfter: 1, // Available after 1st review
  },
  {
    id: "survey-2",
    title: "Seu Perfil de Bar",
    description: "Descubra que tipo de frequentador você é",
    questions: [
      {
        id: "q4",
        text: "Qual é a sua vibe ideal para um bar?",
        options: ["Agitado com música ao vivo", "Tranquilo para conversar", "Rooftop com vista", "Intimista e escuro", "Esportivo com telão", "Ao ar livre"],
        multiSelect: true,
      },
      {
        id: "q5",
        text: "Qual sua bebida favorita?",
        options: ["Cerveja artesanal", "Drinks clássicos", "Vinho", "Caipirinha", "Whiskey", "Não alcoólico", "Chopp"],
        multiSelect: true,
      },
      {
        id: "q6",
        text: "Qual horário você prefere sair?",
        options: ["Happy hour (17h-20h)", "Jantar (20h-22h)", "Noite (22h-00h)", "Madrugada (00h+)", "Almoço de fim de semana"],
        multiSelect: false,
      },
    ],
    unlockAfter: 5, // Available after 5th review
  },
  {
    id: "survey-3",
    title: "Explorador de Bairros",
    description: "Quais regiões de SP você mais frequenta?",
    questions: [
      {
        id: "q7",
        text: "Quais bairros você mais frequenta para comer/beber?",
        options: ["Pinheiros", "Vila Madalena", "Itaim Bibi", "Jardins", "Vila Mariana", "Moema", "Perdizes", "Bela Vista", "Liberdade", "Outros"],
        multiSelect: true,
      },
      {
        id: "q8",
        text: "Você toparia explorar bairros novos baseado em recomendações?",
        options: ["Sim, adoro descobrir lugares novos!", "Talvez, se for bem avaliado", "Prefiro ficar nos meus bairros", "Só se amigos recomendarem"],
        multiSelect: false,
      },
    ],
    unlockAfter: 10, // Available after 10th review
  },
];

type Tab = "badges" | "pesquisas" | "grupos";

// ─── Group Notifications Tab ─────────────────────────────────────────────────
function GroupNotificationsTab() {
  const { data: invites, isLoading } = trpc.groups.pendingInvites.useQuery();
  const utils = trpc.useUtils();

  const acceptMutation = trpc.groups.respondInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite aceito! Você agora faz parte do grupo.");
      utils.groups.pendingInvites.invalidate();
      utils.groups.myGroups.invalidate();
    },
    onError: () => toast.error("Erro ao aceitar convite"),
  });

  const declineMutation = trpc.groups.respondInvite.useMutation({
    onSuccess: () => {
      toast("Convite recusado");
      utils.groups.pendingInvites.invalidate();
    },
    onError: () => toast.error("Erro ao recusar convite"),
  });

  return (
    <motion.div
      key="grupos"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Pending invites */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Convites Pendentes
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !invites || invites.length === 0 ? (
          <div className="text-center py-10 bg-secondary/20 rounded-xl border border-border/20">
            <UserPlus className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite: any) => (
              <div
                key={invite.id}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {invite.groupType === "influencer" ? (
                        <Crown className="w-4 h-4 text-primary" />
                      ) : (
                        <Users className="w-4 h-4 text-primary" />
                      )}
                      <p className="text-sm font-medium text-foreground">{invite.groupName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Convidado por @{invite.inviterUsername}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMutation.mutate({ inviteId: invite.id, accept: true })}
                      disabled={acceptMutation.isPending}
                      className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => declineMutation.mutate({ inviteId: invite.id, accept: false })}
                      disabled={declineMutation.isPending}
                      className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link to groups page */}
      <Link href="/grupos">
        <div className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Gerenciar Grupos</p>
                <p className="text-xs text-muted-foreground">Criar, convidar e ver seus grupos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function NotificacoesPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>((params.tab as Tab) || "badges");
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string[]>>({});

  // Load review count and badge data from localStorage
  const [reviewCount, setReviewCount] = useState(0);
  const [badgePoints, setBadgePoints] = useState(0);
  const [completedSurveys, setCompletedSurveys] = useState<string[]>([]);

  useEffect(() => {
    const reviews = JSON.parse(localStorage.getItem("avalyarin_reviews") || "[]");
    setReviewCount(reviews.length);
    setBadgePoints(parseFloat(localStorage.getItem("avalyarin_badge_points") || "0"));
    setCompletedSurveys(JSON.parse(localStorage.getItem("avalyarin_completed_surveys") || "[]"));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={getLoginUrl()} />;
  }

  const currentBadgeLevel = BADGE_LEVELS.filter(b => badgePoints >= b.minPoints).pop();
  const nextBadge = BADGE_LEVELS.find(b => badgePoints < b.minPoints);
  const earnedBadges = BADGE_LEVELS.filter(b => badgePoints >= b.minPoints);

  const handleSurveyAnswer = (questionId: string, option: string, multiSelect: boolean) => {
    setSurveyAnswers(prev => {
      const current = prev[questionId] || [];
      if (multiSelect) {
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        }
        return { ...prev, [questionId]: [...current, option] };
      }
      return { ...prev, [questionId]: [option] };
    });
  };

  const handleSubmitSurvey = (surveyId: string) => {
    const survey = PREFERENCE_SURVEYS.find(s => s.id === surveyId);
    if (!survey) return;

    // Check all questions answered
    const allAnswered = survey.questions.every(q => (surveyAnswers[q.id] || []).length > 0);
    if (!allAnswered) {
      toast.error("Responda todas as perguntas antes de enviar!");
      return;
    }

    // Save to localStorage
    const newCompleted = [...completedSurveys, surveyId];
    setCompletedSurveys(newCompleted);
    localStorage.setItem("avalyarin_completed_surveys", JSON.stringify(newCompleted));

    // Save answers
    const savedAnswers = JSON.parse(localStorage.getItem("avalyarin_survey_answers") || "{}");
    savedAnswers[surveyId] = surveyAnswers;
    localStorage.setItem("avalyarin_survey_answers", JSON.stringify(savedAnswers));

    toast.success("Pesquisa enviada! Obrigado pelo feedback 🎉");
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "badges", label: "Badges", icon: <Trophy className="w-4 h-4" /> },
    { id: "pesquisas", label: "Pesquisas", icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: "grupos", label: "Grupos", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar  />

      <div className="container pt-28 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg bg-secondary/50 border border-border/30 hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-2xl tracking-wider text-primary">NOTIFICAÇÕES</h1>
            <p className="text-sm text-muted-foreground">Badges, pesquisas e atualizações</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary/20 border border-primary/40 text-primary"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Current badge */}
              {currentBadgeLevel && (
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{currentBadgeLevel.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Seu badge atual</p>
                      <h3 className="font-display text-xl tracking-wider text-primary">{currentBadgeLevel.name}</h3>
                      <p className="text-sm text-muted-foreground">{currentBadgeLevel.desc}</p>
                    </div>
                  </div>
                  {nextBadge && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{Math.floor(badgePoints)} pts</span>
                        <span>{nextBadge.minPoints} pts para {nextBadge.name}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (badgePoints / nextBadge.minPoints) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Badge timeline */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Histórico de Badges</h3>
                {BADGE_LEVELS.map((badge, i) => {
                  const earned = badgePoints >= badge.minPoints;
                  return (
                    <div
                      key={badge.level}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        earned
                          ? "bg-primary/5 border-primary/20"
                          : "bg-secondary/20 border-border/20 opacity-50"
                      }`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-display tracking-wider text-foreground">{badge.name}</h4>
                        <p className="text-xs text-muted-foreground">{badge.desc}</p>
                      </div>
                      {earned ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "pesquisas" && (
            <motion.div
              key="pesquisas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {PREFERENCE_SURVEYS.map(survey => {
                const isUnlocked = reviewCount >= survey.unlockAfter;
                const isCompleted = completedSurveys.includes(survey.id);

                return (
                  <div
                    key={survey.id}
                    className={`rounded-xl border overflow-hidden ${
                      isCompleted
                        ? "bg-green-500/5 border-green-500/20"
                        : isUnlocked
                        ? "bg-primary/5 border-primary/20"
                        : "bg-secondary/20 border-border/20 opacity-60"
                    }`}
                  >
                    {/* Survey header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg tracking-wider text-foreground">{survey.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{survey.description}</p>
                        </div>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                            <CheckCircle2 className="w-3 h-3" /> Respondida
                          </span>
                        ) : !isUnlocked ? (
                          <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                            🔒 {survey.unlockAfter} avaliações
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-lg">
                            <Sparkles className="w-3 h-3" /> Nova
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Survey questions (only if unlocked and not completed) */}
                    {isUnlocked && !isCompleted && (
                      <div className="px-5 pb-5 space-y-5">
                        {survey.questions.map(q => (
                          <div key={q.id}>
                            <p className="text-sm font-medium text-foreground mb-3">{q.text}</p>
                            <div className="flex flex-wrap gap-2">
                              {q.options.map(opt => {
                                const selected = (surveyAnswers[q.id] || []).includes(opt);
                                return (
                                  <button
                                    key={opt}
                                    onClick={() => handleSurveyAnswer(q.id, opt, q.multiSelect)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                      selected
                                        ? "bg-primary/20 border border-primary/40 text-primary"
                                        : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {q.multiSelect && (
                              <p className="text-xs text-muted-foreground/50 mt-1">Selecione uma ou mais opções</p>
                            )}
                          </div>
                        ))}
                        <Button
                          onClick={() => handleSubmitSurvey(survey.id)}
                          className="w-full font-display tracking-wider glow-amber"
                        >
                          ENVIAR RESPOSTAS
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {reviewCount === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Faça sua primeira avaliação para desbloquear pesquisas!</p>
                  <Link href="/#categorias">
                    <Button variant="outline" className="mt-4">
                      Explorar Categorias
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "grupos" && (
            <GroupNotificationsTab />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
