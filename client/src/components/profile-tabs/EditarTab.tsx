import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import BirthdateRoulette from "@/components/BirthdateRoulette";
import {
  Check, X, Loader2, Upload, AlertCircle, CheckCircle, Clock,
  Link2, LogOut, MapPin, DollarSign, Calendar, Shield, Pencil, Navigation
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

export default function EditarTab() {
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const { data: surveyData } = trpc.survey.get.useQuery(undefined, { enabled: !!user });
  const { data: verificationStatus } = trpc.ageVerification.status.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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
    phone !== (profile.phone || "")
  );

  const canSave = hasChanges && hasValidUsername && usernameAvailable;

  const handleSave = () => {
    const data: { username?: string; email?: string; phone?: string } = {};
    if (username !== (profile?.username || "")) data.username = username;
    if (email !== (profile?.email || "")) data.email = email.trim();
    if (phone !== (profile?.phone || "")) data.phone = phone.trim();
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
      window.location.href = "/conta";
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

      {/* Localização — toggle on/off */}
      <LocationCard />

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

/** Location sharing card with toggle */
function LocationCard() {
  const { data: profile } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();
  const [requesting, setRequesting] = useState(false);

  const locationSharing = profile?.locationSharing ?? false;
  const hasCoords = profile?.lat != null && profile?.lng != null;

  const updateLocationSharing = trpc.profile.updateLocationSharing.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar localização"),
  });

  const handleToggle = async () => {
    if (locationSharing) {
      // Turn OFF — clear location from DB
      updateLocationSharing.mutate({ sharing: false });
      toast.success("Localização desativada");
      return;
    }

    // Turn ON — request browser geolocation and save
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada neste navegador");
      return;
    }

    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocationSharing.mutate({
          sharing: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        // Also update localStorage cache
        localStorage.setItem("avalyarin_user_location", JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        }));
        toast.success("Localização ativada e salva!");
        setRequesting(false);
      },
      (error) => {
        setRequesting(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Permissão de localização negada. Habilite nas configurações do navegador.");
        } else {
          toast.error("Não foi possível obter sua localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isPending = updateLocationSharing.isPending || requesting;

  return (
    <div className="p-4 rounded-xl bg-card border border-border/50">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
        <Navigation className="w-3.5 h-3.5" /> Localização
      </label>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-foreground">
            {locationSharing && hasCoords
              ? "Compartilhando localização"
              : "Localização desativada"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {locationSharing
              ? "Usada para mostrar bares próximos automaticamente"
              : "Ative para ver bares próximos sem pedir permissão toda vez"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
            locationSharing ? "bg-primary" : "bg-secondary border border-border/50"
          } ${isPending ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              locationSharing ? "translate-x-5" : "translate-x-0"
            }`}
          />
          {isPending && (
            <Loader2 className="absolute inset-0 m-auto w-3 h-3 text-primary animate-spin" />
          )}
        </button>
      </div>
    </div>
  );
}
