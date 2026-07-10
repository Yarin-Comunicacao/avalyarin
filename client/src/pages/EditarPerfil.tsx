// Editar Perfil — 5 abas: Editar, Minhas Preferências, Planos, Tema e Plano de Fundo, Lista de Salvos
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { Link } from "wouter";
import {
  User, Check, X, Loader2, ChevronLeft, Palette, Image as ImageIcon,
  Bookmark, MapPin, Star, Trash2, Crown, ArrowRight, ArrowLeft,
  Send, Clock, CheckCircle2, CreditCard, Zap, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { useBackground, BACKGROUND_OPTIONS } from "@/contexts/BackgroundContext";
import { FourPointStar } from "@/components/FourPointStar";
import { getCategoryCover } from "@/lib/categoryCoverImages";

type TabId = "editar" | "preferencias" | "planos" | "tema" | "salvos";

const TABS: { id: TabId; label: string }[] = [
  { id: "editar", label: "Editar" },
  { id: "preferencias", label: "Preferências" },
  { id: "planos", label: "Planos" },
  { id: "tema", label: "Tema e Fundo" },
  { id: "salvos", label: "Salvos" },
];

export default function EditarPerfil() {
  const [activeTab, setActiveTab] = useState<TabId>("editar");
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="pt-28 container max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/conta">
            <button className="p-2 rounded-lg hover:bg-card transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <h1 className="font-display text-xl tracking-wider text-primary">EDITAR PERFIL</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "editar" && <EditarTab />}
        {activeTab === "preferencias" && <PreferenciasTab />}
        {activeTab === "planos" && <PlanosTab />}
        {activeTab === "tema" && <TemaFundoTab />}
        {activeTab === "salvos" && <SalvosTab />}
      </div>
    </div>
  );
}

// ─── Aba 1: Editar ──────────────────────────────────────────────────────────
function EditarTab() {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBirthdate(profile.birthdate || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar"),
  });

  // Username availability check
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const { data: usernameCheck, isFetching: checkingUsername } = trpc.profile.checkUsername.useQuery(
    { username: debouncedUsername },
    { enabled: debouncedUsername.length >= 3 && debouncedUsername !== profile?.username && !/\s/.test(debouncedUsername) }
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUsername(username), 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleUsernameChange = (val: string) => {
    setUsername(val.toLowerCase().replace(/[^a-z0-9._]/g, ""));
  };

  const nameParts = name.trim().split(/\s+/);
  const hasValidName = nameParts.length >= 2 && nameParts[0].length >= 2;
  const hasValidUsername = username.length >= 3 && !/\s/.test(username);
  const usernameAvailable = usernameCheck?.available !== false || username === profile?.username;

  const hasChanges = profile && (
    name !== (profile.name || "") ||
    username !== (profile.username || "") ||
    birthdate !== (profile.birthdate || "") ||
    email !== (profile.email || "") ||
    phone !== (profile.phone || "")
  );

  const canSave = hasChanges && hasValidName && hasValidUsername && usernameAvailable;

  const handleSave = () => {
    const data: { name?: string; username?: string; birthdate?: string; email?: string; phone?: string } = {};
    if (name !== (profile?.name || "")) data.name = name.trim();
    if (username !== (profile?.username || "")) data.username = username;
    if (birthdate !== (profile?.birthdate || "")) data.birthdate = birthdate;
    if (email !== (profile?.email || "")) data.email = email.trim();
    if (phone !== (profile?.phone || "")) data.phone = phone.trim();
    updateProfile.mutate(data);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Foto de Perfil */}
      <div className="flex flex-col items-center gap-3">
        <ProfilePhotoUploader size="lg" />
        <p className="text-xs text-muted-foreground">Toque para alterar a foto</p>
      </div>

      {/* Nome Completo */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nome e Sobrenome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João Silva"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
        {name && !hasValidName && (
          <p className="text-xs text-red-400 mt-1">Informe nome e sobrenome (mínimo 2 palavras)</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Username *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="meu_username"
            className="w-full pl-7 pr-8 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
          />
          {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
          {!checkingUsername && hasValidUsername && usernameAvailable && username !== profile?.username && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
          )}
          {!checkingUsername && hasValidUsername && !usernameAvailable && username !== profile?.username && (
            <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          )}
        </div>
        {!usernameAvailable && username !== profile?.username && (
          <p className="text-xs text-red-400 mt-1">Username já em uso</p>
        )}
      </div>

      {/* Data de Nascimento */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Data de Nascimento</label>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Email */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Telefone */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Telefone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!canSave || updateProfile.isPending}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Salvar Alterações
      </button>
    </div>
  );
}

// ─── Aba 2: Minhas Preferências ─────────────────────────────────────────────
function PreferenciasTab() {
  const { data: surveyData, isLoading } = trpc.survey.get.useQuery();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (!surveyData || !surveyData.surveyData) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma preferência registrada</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Complete a pesquisa inicial para ver suas preferências aqui</p>
      </div>
    );
  }

  const data = surveyData.surveyData as Record<string, any>;

  const preferenceItems = [
    { label: "Região", value: data.region },
    { label: "Frequência", value: data.frequency },
    { label: "Gasto Médio", value: data.avgSpend },
    { label: "Categorias Favoritas", value: Array.isArray(data.categories) ? data.categories.join(", ") : data.categories },
    { label: "Prioridades", value: Array.isArray(data.priorities) ? data.priorities.join(", ") : data.priorities },
    { label: "Como Descobre", value: Array.isArray(data.discovery) ? data.discovery.join(", ") : data.discovery },
  ].filter(item => item.value);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-4">Suas respostas da pesquisa de preferências</p>
      {preferenceItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma preferência registrada ainda.</p>
      ) : (
        preferenceItems.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="text-sm text-foreground">{item.value}</p>
          </div>
        ))
      )}
      <div className="pt-4">
        <Link href="/survey/onboarding">
          <button className="w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
            Refazer Pesquisa
          </button>
        </Link>
      </div>
    </div>
  );
}

// ─── Aba 3: Planos ──────────────────────────────────────────────────────────
function PlanosTab() {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<"critic" | "specialist" | null>(null);
  const [formData, setFormData] = useState({ message: "", experience: "", portfolio: "", specialties: "" });

  const { data: myRequests, refetch: refetchRequests } = trpc.roleRequests.myRequests.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myPlan, refetch: refetchPlan } = trpc.plans.myPlan.useQuery(undefined, { enabled: isAuthenticated });

  const submitRequest = trpc.roleRequests.submit.useMutation({
    onSuccess: () => {
      toast.success("Solicitação enviada!", { description: "Sua solicitação será analisada pela equipe." });
      setFormData({ message: "", experience: "", portfolio: "", specialties: "" });
      refetchRequests();
    },
    onError: (err) => toast.error("Erro ao enviar solicitação", { description: err.message }),
  });

  const upgradeMutation = trpc.plans.upgrade.useMutation({
    onSuccess: () => {
      toast.success("Plano ativado!");
      refetchPlan();
    },
    onError: (err) => toast.error("Erro ao ativar plano", { description: err.message }),
  });

  // Check for pending/approved requests
  const pendingRequest = myRequests?.find((r: any) => r.status === "pending");
  const approvedRequest = myRequests?.find((r: any) => r.status === "approved");

  if (pendingRequest) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">SOLICITAÇÃO EM ANÁLISE</h3>
        <p className="text-sm text-muted-foreground">Sua solicitação para {pendingRequest.requestedRole === "critic" ? "Crítico" : "Especialista"} está sendo analisada.</p>
      </div>
    );
  }

  if (approvedRequest && !myPlan?.plan) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">APROVADO!</h3>
        <p className="text-sm text-muted-foreground mb-4">Sua solicitação foi aprovada. Ative seu plano abaixo.</p>
        <Button
          onClick={() => upgradeMutation.mutate({ plan: approvedRequest.requestedRole === "critic" ? "premium" : "embaixador" })}
          disabled={upgradeMutation.isPending}
          className="bg-primary text-primary-foreground"
        >
          {upgradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Ativar Plano
        </Button>
      </div>
    );
  }

  if (myPlan?.plan) {
    return (
      <div className="text-center py-8">
        <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="font-display text-lg text-foreground tracking-wider mb-2">PLANO ATIVO</h3>
        <p className="text-sm text-muted-foreground">Você possui o plano <span className="text-primary font-medium capitalize">{myPlan.plan}</span>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">Escolha o tipo de plano profissional:</p>
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedRole("critic"); setStep(2); }}
              className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-blue-400/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <FourPointStar variant="critic" className="w-8 h-8" />
                <div>
                  <p className="font-display text-base text-foreground tracking-wider group-hover:text-blue-400 transition-colors">CRÍTICO</p>
                  <p className="text-xs text-muted-foreground">Avaliações profissionais com peso diferenciado</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </button>
            <button
              onClick={() => { setSelectedRole("specialist"); setStep(2); }}
              className="w-full p-4 rounded-xl bg-card border border-border/50 hover:border-amber-400/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <FourPointStar variant="specialist" className="w-8 h-8" />
                <div>
                  <p className="font-display text-base text-foreground tracking-wider group-hover:text-amber-400 transition-colors">ESPECIALISTA</p>
                  <p className="text-xs text-muted-foreground">Especialista em categorias específicas</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </div>
            </button>
          </div>
        </>
      )}

      {step === 2 && selectedRole && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Voltar
          </button>
          <h3 className="font-display text-lg text-foreground tracking-wider">
            {selectedRole === "critic" ? "CRÍTICO" : "ESPECIALISTA"}
          </h3>
          <p className="text-sm text-muted-foreground">Preencha o formulário de solicitação:</p>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Mensagem / Motivação *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Por que deseja ser um profissional?"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Experiência</label>
              <input
                type="text"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="Sua experiência na área"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Portfólio / Link</label>
              <input
                type="text"
                value={formData.portfolio}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                placeholder="Link para seu trabalho"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Especialidades</label>
              <input
                type="text"
                value={formData.specialties}
                onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                placeholder="Ex: Cervejas artesanais, Coquetéis"
                className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <Button
            onClick={() => submitRequest.mutate({ requestedRole: selectedRole, message: formData.message, experience: formData.experience, portfolio: formData.portfolio, specialties: formData.specialties })}
            disabled={!formData.message || submitRequest.isPending}
            className="w-full bg-primary text-primary-foreground"
          >
            {submitRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Solicitação
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Aba 4: Tema e Plano de Fundo ──────────────────────────────────────────
function TemaFundoTab() {
  const { theme, setTheme } = useTheme();
  const { background, setBackground } = useBackground();

  return (
    <div className="space-y-6">
      {/* Tema Visual */}
      <div>
        <h3 className="font-display text-sm tracking-wider text-foreground mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" /> TEMA VISUAL
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-all ${
                theme === t.id
                  ? "bg-primary/10 border-2 border-primary text-primary"
                  : "bg-card border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <div className="w-5 h-5 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: t.preview }} />
              <div className="text-left">
                <span className="block text-xs font-medium">{t.label}</span>
                <span className="block text-[10px] text-muted-foreground">{t.description}</span>
              </div>
              {theme === t.id && <Check className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Imagem de Fundo */}
      <div>
        <h3 className="font-display text-sm tracking-wider text-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" /> PLANO DE FUNDO
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {BACKGROUND_OPTIONS.map(bg => (
            <button
              key={bg.id}
              onClick={() => setBackground(bg.id)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                background === bg.id ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/30"
              }`}
            >
              <img src={bg.thumbnail} alt={bg.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-1.5">
                <span className="text-[9px] text-white font-medium">{bg.label}</span>
              </div>
              {background === bg.id && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Aba 5: Lista de Salvos ─────────────────────────────────────────────────
function SalvosTab() {
  const utils = trpc.useUtils();
  const { data: savedPlaces, isLoading } = trpc.posts.savedEstablishments.useQuery();

  const toggleSave = trpc.posts.toggleSave.useMutation({
    onSuccess: () => {
      utils.posts.savedEstablishments.invalidate();
      utils.posts.savedIds.invalidate();
    },
  });

  const removePlace = (id: number, name: string) => {
    toggleSave.mutate({ establishmentId: id });
    toast(`${name} removido dos salvos`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  if (!savedPlaces || savedPlaces.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum local salvo ainda</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Salve locais que deseja visitar para encontrá-los aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">{savedPlaces.length} locais salvos</p>
      {savedPlaces.map((place) => (
        <div key={place.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group">
          <Link href={`/estabelecimento/${place.slug}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
              {place.imageUrl ? (
                <img src={place.imageUrl} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <img src={getCategoryCover(place.categorySlug || "")} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{place.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" /> {place.neighborhood || ""}
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => removePlace(place.id, place.name)}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            disabled={toggleSave.isPending}
          >
            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}

      {/* Novidades dos Salvos */}
      <BroadcastFeedMini />
    </div>
  );
}

function BroadcastFeedMini() {
  const { data: feed, isLoading } = trpc.posts.broadcastFeed.useQuery();
  if (isLoading || !feed || feed.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="w-4 h-4 text-primary" />
        <h3 className="font-display text-sm tracking-wider text-primary">NOVIDADES</h3>
      </div>
      <div className="space-y-2">
        {feed.slice(0, 5).map((item: any) => (
          <div key={item.id} className="p-3 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-3 h-3 text-primary/60" />
              <span className="text-xs font-medium text-foreground">{item.establishmentName || "Estabelecimento"}</span>
            </div>
            <p className="text-xs text-foreground/80 pl-5">{item.content}</p>
            <span className="text-[10px] text-muted-foreground/50 pl-5 mt-1 block">
              {new Date(item.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
