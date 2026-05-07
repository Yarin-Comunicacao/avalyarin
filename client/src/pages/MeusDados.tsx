// Design: AvaLyarin — Meus Dados page (read-only, sensitive data)
// Now includes: birthdate, region, average spend from survey
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { toast } from "sonner";
import {
  User, Mail, Phone, Shield, Calendar, MapPin, DollarSign, Cake,
  Upload, AlertCircle, CheckCircle, Clock, Loader2
} from "lucide-react";
import BirthdateRoulette from "@/components/BirthdateRoulette";

// Label maps for display
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

export default function MeusDados() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const [showBirthdateEdit, setShowBirthdateEdit] = useState(false);
  const [newBirthdate, setNewBirthdate] = useState("");
  const [birthdateValid, setBirthdateValid] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Get survey data from DB
  const { data: surveyData } = trpc.survey.get.useQuery(undefined, {
    enabled: !!user,
  });

  // Get age verification status
  const { data: verificationStatus } = trpc.ageVerification.status.useQuery(undefined, {
    enabled: !!user,
  });

  const saveSurveyMutation = trpc.survey.save.useMutation({
    onSuccess: () => {
      toast.success("Data de nascimento atualizada!");
      setShowBirthdateEdit(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const submitVerification = trpc.ageVerification.submit.useMutation({
    onSuccess: () => {
      toast.success("Documento enviado para análise! Você será notificado quando for aprovado.");
      setShowDocUpload(false);
    },
    onError: () => toast.error("Erro ao enviar documento"),
  });

  // Load saved data from localStorage as fallback
  const savedData = useMemo(() => {
    try {
      const raw = localStorage.getItem("avalyarin_survey_answers");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  const localUserData = useMemo(() => {
    try {
      const raw = localStorage.getItem("avalyarin_user_data");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }, []);

  // Derive display values
  const displayName = user?.name || localUserData.nome || "—";
  const displayEmail = user?.email || localUserData.email || "—";
  const displayPhone = localUserData.telefone || "—";
  const displayCreatedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  // Birthdate from DB or localStorage
  const birthdate = (surveyData as any)?.birthdate || savedData.birthdate || "";
  const displayBirthdate = birthdate
    ? birthdate.split("-").reverse().join("/")
    : "—";

  // Region and spend from surveyData JSON or localStorage
  const surveyJson = (surveyData as any)?.surveyData || savedData;
  const region = surveyJson?.region || "";
  const avgSpend = surveyJson?.avgSpend || "";
  const displayRegion = REGION_LABELS[region] || region || "—";
  const displaySpend = SPEND_LABELS[avgSpend] || avgSpend || "—";

  // Check if birthdate change requires verification (under 16)
  const handleBirthdateChange = useCallback((date: string) => {
    setNewBirthdate(date);
    const [y, m, d] = date.split("-").map(Number);
    const birth = new Date(y, m - 1, d);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    setBirthdateValid(birth <= minDate);
  }, []);

  const handleSaveBirthdate = () => {
    if (!birthdateValid) {
      // Need document verification
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
        headers: {
          "Content-Type": file.type,
          "X-File-Name": file.name,
        },
        body: buffer,
      });

      if (!response.ok) throw new Error("Upload failed");
      const { url, key } = await response.json();

      // Submit verification request
      submitVerification.mutate({
        documentUrl: url,
        documentKey: key,
        requestedBirthdate: newBirthdate,
      });
    } catch {
      toast.error("Erro ao enviar documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Navbar backHref="/" onMenuOpen={() => setMenuOpen(true)} />
      <div className="pt-20 pb-16">
        <div className="container max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">MEUS DADOS</h2>
              <p className="text-sm text-muted-foreground">Informações pessoais da sua conta</p>
            </div>
          </div>

          {/* Info notice */}
          <div className="flex items-start gap-2 p-3 mb-6 rounded-lg bg-primary/5 border border-primary/20">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Seus dados pessoais são protegidos e não podem ser alterados diretamente por aqui.
              Para solicitar alterações, entre em contato com o suporte.
            </p>
          </div>

          <div className="space-y-4">
            {/* Nome */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5" /> Nome completo
              </label>
              <p className="text-base text-foreground">{displayName}</p>
            </div>

            {/* E-mail */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Mail className="w-3.5 h-3.5" /> E-mail de cadastro
              </label>
              <p className="text-base text-foreground">{displayEmail}</p>
            </div>

            {/* Telefone */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Phone className="w-3.5 h-3.5" /> Telefone de cadastro
              </label>
              <p className="text-base text-foreground">{displayPhone}</p>
            </div>

            {/* Data de Nascimento */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Cake className="w-3.5 h-3.5" /> Data de Nascimento
              </label>
              {!showBirthdateEdit ? (
                <div className="flex items-center justify-between">
                  <p className="text-base text-foreground">{displayBirthdate}</p>
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
                    minAge={16}
                  />

                  {newBirthdate && !birthdateValid && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-yellow-400 font-medium">Verificação necessária</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Para definir uma data que indica menos de 16 anos, é necessário enviar um documento
                          (RG ou CPF) comprovando a data de nascimento. O documento será analisado por um administrador.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Document upload for underage verification */}
                  {showDocUpload && (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-3">
                      <p className="text-xs text-foreground font-medium">Envie foto do RG ou CPF</p>
                      <label className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-sm text-primary">
                          {uploading ? "Enviando..." : "Selecionar documento"}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      <p className="text-[10px] text-muted-foreground">
                        Formatos aceitos: JPG, PNG, PDF. Máximo 10MB.
                      </p>
                    </div>
                  )}

                  {/* Verification status */}
                  {verificationStatus && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                      verificationStatus.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : verificationStatus.status === "approved"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {verificationStatus.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                      {verificationStatus.status === "approved" && <CheckCircle className="w-3.5 h-3.5" />}
                      {verificationStatus.status === "rejected" && <AlertCircle className="w-3.5 h-3.5" />}
                      <span>
                        {verificationStatus.status === "pending" && "Verificação em análise..."}
                        {verificationStatus.status === "approved" && "Verificação aprovada!"}
                        {verificationStatus.status === "rejected" && `Verificação rejeitada${verificationStatus.adminNotes ? `: ${verificationStatus.adminNotes}` : ""}`}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowBirthdateEdit(false); setShowDocUpload(false); }}
                      className="flex-1 py-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveBirthdate}
                      disabled={!newBirthdate || saveSurveyMutation.isPending}
                      className="flex-1 py-2 rounded-lg bg-primary/20 border border-primary/40 text-sm text-primary font-medium hover:bg-primary/30 transition-colors disabled:opacity-50"
                    >
                      {!birthdateValid ? "Enviar Documento" : "Salvar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Região */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5" /> Região
              </label>
              <p className="text-base text-foreground">{displayRegion}</p>
            </div>

            {/* Média de Consumo */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <DollarSign className="w-3.5 h-3.5" /> Média de Consumo
              </label>
              <p className="text-base text-foreground">{displaySpend}</p>
            </div>

            {/* Data de cadastro */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5" /> Membro desde
              </label>
              <p className="text-base text-foreground">{displayCreatedAt}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
