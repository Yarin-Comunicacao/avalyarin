import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import BirthdateRoulette from "@/components/BirthdateRoulette";
import {
  Check, X, Loader2, Upload, AlertCircle, CheckCircle, Clock,
  Link2, LogOut, MapPin, DollarSign, Calendar, Shield, Pencil, Eye, EyeOff, Lock
} from "lucide-react";

const REGION_LABELS: Record<string, string> = {
  "zona-norte": "Zona Norte",
  "zona-sul": "Zona Sul",
  "zona-leste": "Zona Leste",
  "zona-oeste": "Zona Oeste",
  "centro": "Centro",
  "grande-sp": "Região Metropolitana de SP",
  "campinas": "Campinas e Região",
  "jundiai": "Jundiaí e Região",
  "fora-sp": "Fora de São Paulo",
};

const SPEND_LABELS: Record<string, string> = {
  "ate-50": "Até R$ 50",
  "51-100": "R$ 51 a R$ 100",
  "101-200": "R$ 101 a R$ 200",
  "201-300": "R$ 201 a R$ 300",
  "301-400": "R$ 301 a R$ 400",
  "400+": "Acima de R$ 400",
};

interface ConnectedAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  info: string;
}

// Password Section — only for user, specialist, critic
function PasswordSection() {
  const { user } = useAuth();
  const { data: passwordData } = trpc.profile.hasPassword.useQuery();
  const setPasswordMutation = trpc.profile.setPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha definida com sucesso!");
      setShowPasswordForm(false);
      setNewPassword("");
      setCurrentPassword("");
    },
    onError: (err) => toast.error(err.message || "Erro ao definir senha"),
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Only show for user, specialist, critic
  const allowedRoles = ["user", "specialist", "critic"];
  const effectiveRole = (window as any).__ownerViewingAs || user?.role || "user";
  if (!allowedRoles.includes(effectiveRole)) return null;

  const hasPassword = passwordData?.hasPassword || false;
  const isValidNewPassword = newPassword.length >= 9;

  const handleSubmit = () => {
    if (!isValidNewPassword) {
      toast.error("Senha deve ter no m\u00ednimo 9 caracteres");
      return;
    }
    setPasswordMutation.mutate({
      currentPassword: hasPassword ? currentPassword : undefined,
      newPassword,
    });
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
      {!showPasswordForm ? (
        <div className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-card/50 border border-border/30">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground/80">
              {hasPassword ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "N\u00e3o definida"}
            </span>
          </div>
          <button
            onClick={() => setShowPasswordForm(true)}
            className="text-xs text-primary hover:underline"
          >
            {hasPassword ? "Alterar" : "Definir"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 p-3 rounded-lg bg-card border border-border/50">
          {hasPassword && (
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Senha atual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Sua senha atual"
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">
              {hasPassword ? "Nova senha" : "Definir senha"}
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="M\u00ednimo 9 caracteres"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 9 && (
              <p className="text-[11px] text-red-400 mt-1">M\u00ednimo 9 caracteres ({newPassword.length}/9)</p>
            )}
            {isValidNewPassword && (
              <p className="text-[11px] text-green-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> Senha v\u00e1lida
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowPasswordForm(false); setNewPassword(""); setCurrentPassword(""); }}
              className="flex-1 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValidNewPassword || setPasswordMutation.isPending}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {setPasswordMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditarTab() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: surveyData } = trpc.survey.get.useQuery(undefined, { enabled: !!user });
  const { data: verificationStatus } = trpc.ageVerification.status.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<string>("");

  // Birthdate editing
  const [showBirthdateEdit, setShowBirthdateEdit] = useState(false);
  const [newBirthdate, setNewBirthdate] = useState("");
  const [birthdateValid, setBirthdateValid] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Region editing
  const [showRegionEdit, setShowRegionEdit] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");

  // Connected accounts (mock for now)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { id: "google", name: "Google", icon: "G", color: "bg-red-500/10 text-red-400 border-red-500/30", connected: false, info: "Não conectado" },
    { id: "facebook", name: "Facebook", icon: "f", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", connected: false, info: "Não conectado" },
    { id: "instagram", name: "Instagram", icon: "IG", color: "bg-pink-500/10 text-pink-400 border-pink-500/30", connected: false, info: "Não conectado" },
  ]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setDescription((profile as any).description || "");
      setGender((profile as any).gender || "");
    }
  }, [profile]);

  // Set google as connected if user has email
  useEffect(() => {
    if (user?.email) {
      setAccounts(prev => prev.map(acc =>
        acc.id === "google" ? { ...acc, connected: true, info: user.email || "" } : acc
      ));
    }
  }, [user?.email]);

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar"),
  });

  const saveSurveyMutation = trpc.survey.save.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados!");
      setShowBirthdateEdit(false);
      setShowRegionEdit(false);
      utils.survey.get.invalidate();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const submitVerification = trpc.ageVerification.submit.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado para análise!");
      setShowDocUpload(false);
    },
    onError: () => toast.error("Erro ao enviar documento"),
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

  const hasValidUsername = username.length >= 3 && !/\s/.test(username);
  const usernameAvailable = usernameCheck?.available !== false || username === profile?.username;

  const hasChanges = profile && (
    username !== (profile.username || "") ||
    email !== (profile.email || "") ||
    phone !== (profile.phone || "") ||
    description !== ((profile as any).description || "") ||
    gender !== ((profile as any).gender || "")
  );

  const canSave = hasChanges && hasValidUsername && usernameAvailable;

  const handleSave = () => {
    const data: { username?: string; email?: string; phone?: string; description?: string; gender?: any } = {};
    if (username !== (profile?.username || "")) data.username = username;
    if (email !== (profile?.email || "")) data.email = email.trim();
    if (phone !== (profile?.phone || "")) data.phone = phone.trim();
    if (description !== ((profile as any)?.description || "")) data.description = description.trim();
    if (gender !== ((profile as any)?.gender || "")) data.gender = gender;
    updateProfile.mutate(data);
  };

  // Birthdate logic
  const birthdate = (surveyData as any)?.birthdate || "";
  const displayBirthdate = birthdate ? birthdate.split("-").reverse().join("/") : "Não informada";

  const surveyJson = (surveyData as any)?.surveyData || {};
  const parsedSurvey = typeof surveyJson === "string" ? (() => { try { return JSON.parse(surveyJson); } catch { return {}; } })() : surveyJson;
  const region = parsedSurvey?.region || "";
  const avgSpend = parsedSurvey?.avgSpend || "";
  const displayRegion = REGION_LABELS[region] || region || "Não informada";
  const displaySpend = SPEND_LABELS[avgSpend] || avgSpend || "Não informado";

  const displayCreatedAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  const handleBirthdateChange = useCallback((date: string) => {
    setNewBirthdate(date);
    const [y, m, d] = date.split("-").map(Number);
    const birth = new Date(y, m - 1, d);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    setBirthdateValid(birth <= minDate);
  }, []);

  const handleSaveBirthdate = () => {
    if (!birthdateValid) {
      setShowDocUpload(true);
      return;
    }
    saveSurveyMutation.mutate({ birthdate: newBirthdate });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const response = await fetch("/api/upload/document", {
        method: "POST",
        headers: { "Content-Type": file.type, "X-File-Name": file.name },
        body: buffer,
      });
      if (!response.ok) throw new Error("Upload failed");
      const { url, key } = await response.json();
      submitVerification.mutate({ documentUrl: url, documentKey: key, requestedBirthdate: newBirthdate });
    } catch {
      toast.error("Erro ao enviar documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const toggleAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const newState = !acc.connected;
        toast(newState ? `${acc.name} conectado!` : `${acc.name} desconectado`);
        return { ...acc, connected: newState, info: newState ? "Conta vinculada" : "Não conectado" };
      }
      return acc;
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/perfil";
    } catch {
      toast.error("Erro ao sair");
    }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Foto de Perfil */}
      <div className="flex flex-col items-center gap-3">
        <ProfilePhotoUploader size="lg" />
        <p className="text-xs text-muted-foreground">Toque para alterar a foto</p>
      </div>

      {/* Descrição */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 120))}
          placeholder="Uma breve descrição sobre você..."
          maxLength={120}
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
        />
        <p className="text-xs text-muted-foreground/60 mt-1 text-right">{description.length}/120</p>
      </div>

      {/* Nome — somente visualização */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
        <div className="w-full px-3 py-2.5 rounded-lg bg-card/50 border border-border/30 text-sm text-foreground/80">
          {profile?.name || "Não informado"}
        </div>
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

      {/* Senha */}
      <PasswordSection />

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

      {/* Gênero */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Gênero</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-card border border-border/50 text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="">Selecione...</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="prefiro_nao_informar">Prefiro não informar</option>
        </select>
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

      {/* Separator */}
      <div className="border-t border-border/30 pt-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Dados Pessoais
        </h3>
        <p className="text-[11px] text-muted-foreground/60 mb-4">
          Informações protegidas da sua conta.
        </p>
      </div>

      {/* Data de Nascimento — com edição especial */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Data de Nascimento</label>
        {!showBirthdateEdit ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{displayBirthdate}</p>
            <button
              onClick={() => setShowBirthdateEdit(true)}
              className="text-xs text-primary hover:underline"
            >
              Alterar
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <BirthdateRoulette
              value={newBirthdate || birthdate}
              onChange={handleBirthdateChange}
              minAge={18}
            />
            {newBirthdate && !birthdateValid && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-yellow-400 font-medium">Verificação necessária</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Para menores de 18 anos, envie um documento (RG ou CPF) para análise.
                  </p>
                </div>
              </div>
            )}
            {showDocUpload && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-3">
                <p className="text-xs text-foreground font-medium">Envie foto do RG ou CPF</p>
                <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Upload className="w-4 h-4 text-primary" />}
                  <span className="text-sm text-primary">{uploading ? "Enviando..." : "Selecionar documento"}</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleDocumentUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            )}
            {verificationStatus && (
              <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                verificationStatus.status === "pending" ? "bg-yellow-500/10 text-yellow-400"
                  : verificationStatus.status === "approved" ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {verificationStatus.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                {verificationStatus.status === "approved" && <CheckCircle className="w-3.5 h-3.5" />}
                {verificationStatus.status === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
                <span>
                  {verificationStatus.status === "pending" && "Verificação em análise..."}
                  {verificationStatus.status === "approved" && "Verificação aprovada!"}
                  {verificationStatus.status === "rejected" && `Rejeitada${(verificationStatus as any).adminNotes ? `: ${(verificationStatus as any).adminNotes}` : ""}`}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowBirthdateEdit(false); setShowDocUpload(false); }} className="flex-1 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-muted-foreground">
                Cancelar
              </button>
              <button onClick={handleSaveBirthdate} disabled={!newBirthdate || saveSurveyMutation.isPending} className="flex-1 py-2 rounded-lg bg-primary/20 border border-primary/40 text-sm text-primary font-medium disabled:opacity-50">
                {!birthdateValid ? "Enviar Documento" : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Região — editável */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
          <MapPin className="w-3.5 h-3.5" /> Região
        </label>
        {!showRegionEdit ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">{displayRegion}</p>
            <button
              onClick={() => { setShowRegionEdit(true); setSelectedRegion(region); }}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" /> Alterar
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="grid gap-1.5">
              {Object.entries(REGION_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setSelectedRegion(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                    selectedRegion === value
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/30 bg-card hover:border-border/60"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedRegion === value ? "border-primary" : "border-muted-foreground/40"
                  }`}>
                    {selectedRegion === value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className={selectedRegion === value ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowRegionEdit(false)}
                className="flex-1 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const currentData = parsedSurvey || {};
                  saveSurveyMutation.mutate({ ...currentData, region: selectedRegion });
                }}
                disabled={!selectedRegion || selectedRegion === region || saveSurveyMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-primary/20 border border-primary/40 text-sm text-primary font-medium disabled:opacity-50"
              >
                {saveSurveyMutation.isPending ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Média de Consumo */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
          <DollarSign className="w-3.5 h-3.5" /> Média de Consumo
        </label>
        <p className="text-sm text-foreground">{displaySpend}</p>
      </div>

      {/* Membro desde */}
      <div className="p-4 rounded-xl bg-card border border-border/50">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
          <Calendar className="w-3.5 h-3.5" /> Membro desde
        </label>
        <p className="text-sm text-foreground">{displayCreatedAt}</p>
      </div>

      {/* Contas Conectadas */}
      <div className="border-t border-border/30 pt-4">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Contas Conectadas
        </h3>
        <div className="space-y-2">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => toggleAccount(acc.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm ${acc.color}`}>
                {acc.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{acc.name}</p>
                <p className="text-[11px] text-muted-foreground">{acc.info}</p>
              </div>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                acc.connected ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
              }`}>
                {acc.connected ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              </div>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-3">
          Ao conectar, você poderá fazer login mais rápido e ter prioridade na escolha do @.
        </p>
      </div>

      {/* Botão Sair */}
      <div className="border-t border-border/30 pt-4">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-medium text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

