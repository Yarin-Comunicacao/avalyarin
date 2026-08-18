import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { Contacts } from "@capacitor-community/contacts";
import { trpc } from "@/lib/trpc";
import {
  Loader2, User, Pencil, Check, X, MapPin, Camera as CameraIcon,
  Users, Mic, Bell, Activity, ShieldCheck, ExternalLink
} from "lucide-react";
import { toast } from "sonner";

// Helper to parse options from DB (same as OnboardingSurvey)
function parseOptions(raw: any): { label: string; value: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((o: any) => {
      if (typeof o === "string") return { label: o, value: o };
      return { label: o.label || o.value || "", value: o.value || o.label || "" };
    });
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parseOptions(parsed);
    } catch {
      return raw.split(",").map((s: string) => ({ label: s.trim(), value: s.trim() }));
    }
  }
  return [];
}

// Map questionId from DB to the key used in surveyData JSON
const QUESTION_TO_FIELD: Record<string, string> = {
  frequency: "frequency",
  spend: "avgSpend",
  categories: "categories",
  priorities: "priorities",
  discovery: "discovery",
};

// Display labels for field names
const FIELD_LABELS: Record<string, string> = {
  frequency: "Frequência",
  avgSpend: "Gasto Médio",
  categories: "Categorias Favoritas",
  priorities: "Prioridades",
  discovery: "Como Descobre",
};

type SocialPreferenceKey = "photos" | "contacts" | "microphone" | "notifications" | "activity";

type SocialPreferences = Record<SocialPreferenceKey, boolean>;

const SOCIAL_PREFERENCES_STORAGE_KEY = "avalyarin_social_privacy_preferences";
const DEFAULT_SOCIAL_PREFERENCES: SocialPreferences = {
  photos: false,
  contacts: false,
  microphone: false,
  notifications: false,
  activity: false,
};

interface SocialPreferenceRowProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  enabled: boolean;
  pending?: boolean;
  onToggle: () => void;
}

function SocialPreferenceRow({ icon: Icon, title, description, enabled, pending, onToggle }: SocialPreferenceRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/30">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Desativar" : "Ativar"} ${title}`}
        onClick={onToggle}
        disabled={pending}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
          enabled ? "bg-primary" : "bg-secondary border border-border/50"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
        {pending && <Loader2 className="absolute inset-0 m-auto w-3 h-3 text-primary animate-spin" />}
      </button>
    </div>
  );
}

function CentralPrivacidadeSocial() {
  const { data: profile } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();
  const [preferences, setPreferences] = useState<SocialPreferences>(DEFAULT_SOCIAL_PREFERENCES);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const updateLocationSharing = trpc.profile.updateLocationSharing.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar localização"),
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SOCIAL_PREFERENCES_STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_SOCIAL_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // Mantém os padrões quando o armazenamento local estiver indisponível.
    }
  }, []);

  useEffect(() => {
    setLocationEnabled(Boolean(profile?.locationSharing));
  }, [profile?.locationSharing]);

  const persistPreference = (key: SocialPreferenceKey, value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem(SOCIAL_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const requestPermission = async (key: SocialPreferenceKey): Promise<boolean> => {
    if (key === "photos") {
      if (Capacitor.isNativePlatform()) {
        const result = await Camera.requestPermissions();
        return result.camera === "granted" || result.photos === "granted";
      }
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return true;
    }

    if (key === "microphone") {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    }

    if (key === "notifications") {
      if (Capacitor.isNativePlatform()) {
        const result = await PushNotifications.requestPermissions();
        return result.receive === "granted";
      }
      if ("Notification" in window) {
        return (await Notification.requestPermission()) === "granted";
      }
      return false;
    }

    if (key === "contacts") {
      if (Capacitor.isNativePlatform()) {
        const permission = await Contacts.checkPermissions();
        if (permission.contacts === "granted" || permission.contacts === "limited") return true;
        const requested = await Contacts.requestPermissions();
        return requested.contacts === "granted" || requested.contacts === "limited";
      }
      // Na versão web, a agenda só será acessada por um fluxo explícito quando disponível.
      return true;
    }

    // O reconhecimento de atividade fica desativado até o recurso de check-in automático ser usado.
    if (key === "activity") return true;

    return false;
  };

  const toggleLocation = async () => {
    setPendingKey("location");
    try {
      if (locationEnabled) {
        updateLocationSharing.mutate({ sharing: false });
        setLocationEnabled(false);
        toast.success("Visibilidade no mapa desativada");
        return;
      }

      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== "granted") {
          const requested = await Geolocation.requestPermissions();
          if (requested.location !== "granted") throw new Error("PERMISSION_DENIED");
        }
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      updateLocationSharing.mutate({
        sharing: true,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setLocationEnabled(true);
      localStorage.setItem("avalyarin_user_location", JSON.stringify({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
      }));
      toast.success("Visibilidade no mapa ativada");
    } catch (error: any) {
      setLocationEnabled(false);
      if (error?.message === "PERMISSION_DENIED" || error?.code === 1) {
        toast.error("Permissão negada. Habilite a localização nas configurações do celular.");
      } else {
        toast.error("Não foi possível obter sua localização.");
      }
    } finally {
      setPendingKey(null);
    }
  };

  const togglePreference = async (key: SocialPreferenceKey) => {
    const enabled = preferences[key];
    if (enabled) {
      persistPreference(key, false);
      toast.success(`${key === "photos" ? "Fotos" : key === "contacts" ? "Encontrar amigos" : key === "microphone" ? "Mensagens de voz" : key === "notifications" ? "Alertas" : "Check-in automático"} desativado`);
      return;
    }

    setPendingKey(key);
    try {
      const allowed = await requestPermission(key);
      if (!allowed) {
        throw new Error("PERMISSION_DENIED");
      }
      persistPreference(key, true);
      if (key === "contacts") {
        toast.success("Encontrar amigos ativado. Seus contatos só serão usados quando você iniciar a busca.");
      } else if (key === "activity") {
        toast.success("Check-in automático ativado para quando o recurso estiver disponível.");
      } else {
        toast.success("Preferência ativada");
      }
    } catch {
      persistPreference(key, false);
      toast.error("Permissão não concedida. Você pode alterar isso nas configurações do celular.");
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section className="p-4 rounded-xl bg-card border border-primary/25 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Central de Privacidade Social</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            Controle como os recursos sociais do Avalyarin usam as permissões do seu dispositivo. Desligar uma chave interrompe o uso do recurso pelo app, mesmo que a permissão do sistema continue concedida.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <SocialPreferenceRow
          icon={MapPin}
          title="Visibilidade no mapa"
          description="Permite compartilhar sua localização com a rede e exibir locais próximos. A localização não é captada quando esta chave está desligada."
          enabled={locationEnabled}
          pending={pendingKey === "location" || updateLocationSharing.isPending}
          onToggle={toggleLocation}
        />
        <SocialPreferenceRow
          icon={CameraIcon}
          title="Fotos e avaliações"
          description="Autoriza câmera e galeria para publicar fotos de pratos, drinks e momentos gastronômicos."
          enabled={preferences.photos}
          pending={pendingKey === "photos"}
          onToggle={() => togglePreference("photos")}
        />
        <SocialPreferenceRow
          icon={Users}
          title="Encontrar amigos"
          description="Guarda sua preferência para usar a agenda somente quando você iniciar a busca por amigos."
          enabled={preferences.contacts}
          pending={pendingKey === "contacts"}
          onToggle={() => togglePreference("contacts")}
        />
        <SocialPreferenceRow
          icon={Mic}
          title="Mensagens de voz"
          description="Permite usar o microfone para gravar áudios. Com a chave desligada, o Avalyarin não inicia a captação."
          enabled={preferences.microphone}
          pending={pendingKey === "microphone"}
          onToggle={() => togglePreference("microphone")}
        />
        <SocialPreferenceRow
          icon={Bell}
          title="Alertas de reservas e promoções"
          description="Controla notificações de reservas, promoções e interações. Você também pode alterar isso nas configurações do sistema."
          enabled={preferences.notifications}
          pending={pendingKey === "notifications"}
          onToggle={() => togglePreference("notifications")}
        />
        <SocialPreferenceRow
          icon={Activity}
          title="Check-in automático"
          description="Guarda sua preferência para facilitar check-ins quando essa função for utilizada; nenhum movimento é monitorado enquanto estiver desligado."
          enabled={preferences.activity}
          pending={pendingKey === "activity"}
          onToggle={() => togglePreference("activity")}
        />
      </div>

      <button
        type="button"
        onClick={() => toast.info("Abra as configurações do celular para gerenciar permissões do Avalyarin.")}
        className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:underline pt-1"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Gerenciar permissões nas configurações do celular
      </button>
    </section>
  );
}

export default function PreferenciasTab() {
  const { data: surveyData, isLoading, error } = trpc.survey.get.useQuery();
  const { data: dbQuestions, isLoading: questionsLoading } = trpc.survey.questions.useQuery({ phase: "onboarding" });
  const utils = trpc.useUtils();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[]>("");

  const saveSurveyMutation = trpc.survey.save.useMutation({
    onSuccess: () => {
      toast.success("Preferência atualizada!");
      setEditingField(null);
      utils.survey.get.invalidate();
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  // Build question options map from DB
  const questionOptionsMap = useMemo(() => {
    if (!dbQuestions) return {};
    const map: Record<string, { type: "single" | "multi"; maxSelect?: number; options: { label: string; value: string }[] }> = {};
    for (const q of dbQuestions) {
      const fieldKey = QUESTION_TO_FIELD[q.questionId];
      if (fieldKey) {
        map[fieldKey] = {
          type: q.type as "single" | "multi",
          maxSelect: q.maxSelect || undefined,
          options: parseOptions(q.options),
        };
      }
    }
    return map;
  }, [dbQuestions]);

  if (isLoading || questionsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Erro ao carregar suas preferências</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Tente novamente mais tarde</p>
      </div>
    );
  }

  if (!surveyData || !surveyData.surveyData) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhuma preferência registrada</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Complete a pesquisa inicial para ver suas preferências aqui</p>
        <div className="pt-4">
          <button
            onClick={() => {
              localStorage.removeItem("avalyarin_survey_completed");
              localStorage.removeItem("avalyarin_survey_answers");
              toast.info("Redirecionando para a pesquisa...");
              window.location.href = "/";
            }}
            className="w-full py-3 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            Fazer Pesquisa
          </button>
        </div>
      </div>
    );
  }

  const data = surveyData.surveyData as Record<string, any>;

  // Fields to display (Região removed - now in EditarTab > Dados Pessoais)
  const preferenceFields = [
    { key: "frequency", value: data.frequency },
    { key: "avgSpend", value: data.avgSpend },
    { key: "categories", value: data.categories },
    { key: "priorities", value: data.priorities },
    { key: "discovery", value: data.discovery },
  ];

  const getDisplayValue = (key: string, value: any): string => {
    if (!value) return "Não informado";
    const qInfo = questionOptionsMap[key];
    if (Array.isArray(value)) {
      if (qInfo?.options) {
        return value.map(v => qInfo.options.find(o => o.value === v)?.label || v).join(", ");
      }
      return value.join(", ");
    }
    if (qInfo?.options) {
      return qInfo.options.find(o => o.value === value)?.label || value;
    }
    return value;
  };

  const startEditing = (key: string) => {
    const currentValue = data[key];
    setEditValue(currentValue || (questionOptionsMap[key]?.type === "multi" ? [] : ""));
    setEditingField(key);
  };

  const handleSingleSelect = (value: string) => {
    setEditValue(value);
  };

  const handleMultiToggle = (value: string) => {
    const current = Array.isArray(editValue) ? editValue : [];
    const qInfo = questionOptionsMap[editingField!];
    if (current.includes(value)) {
      setEditValue(current.filter(v => v !== value));
    } else {
      if (qInfo?.maxSelect && current.length >= qInfo.maxSelect) {
        toast.error(`Máximo de ${qInfo.maxSelect} opções`);
        return;
      }
      setEditValue([...current, value]);
    }
  };

  const handleSave = () => {
    if (!editingField) return;
    // Merge with existing data to avoid losing other fields
    const mergedData: Record<string, any> = { ...data };
    mergedData[editingField] = editValue;
    // Map back to the format expected by survey.save
    saveSurveyMutation.mutate({
      region: mergedData.region,
      frequency: mergedData.frequency,
      avgSpend: mergedData.avgSpend,
      categories: mergedData.categories,
      priorities: mergedData.priorities,
      discovery: mergedData.discovery,
    });
  };

  const hasChanges = () => {
    if (!editingField) return false;
    const currentValue = data[editingField];
    if (Array.isArray(editValue) && Array.isArray(currentValue)) {
      return JSON.stringify([...editValue].sort()) !== JSON.stringify([...currentValue].sort());
    }
    return editValue !== currentValue;
  };

  return (
    <div className="space-y-3">
      <CentralPrivacidadeSocial />

      <p className="text-xs text-muted-foreground mb-4">
        Suas preferências gastronômicas — toque em <Pencil className="w-3 h-3 inline" /> para editar
      </p>

      {preferenceFields.map(({ key, value }) => {
        const isEditing = editingField === key;
        const qInfo = questionOptionsMap[key];
        const label = FIELD_LABELS[key] || key;

        return (
          <div key={key} className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              {!isEditing && (
                <button
                  onClick={() => startEditing(key)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Editar
                </button>
              )}
              {isEditing && (
                <button
                  onClick={() => setEditingField(null)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              )}
            </div>

            {!isEditing ? (
              <p className="text-sm text-foreground">{getDisplayValue(key, value)}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {qInfo?.options && qInfo.options.length > 0 ? (
                  <>
                    <div className={`grid gap-1.5 ${qInfo.options.length > 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                      {qInfo.options.map((opt) => {
                        const isSelected = qInfo.type === "single"
                          ? editValue === opt.value
                          : Array.isArray(editValue) && editValue.includes(opt.value);

                        return (
                          <button
                            key={opt.value}
                            onClick={() => qInfo.type === "single" ? handleSingleSelect(opt.value) : handleMultiToggle(opt.value)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                              isSelected
                                ? "border-primary/60 bg-primary/10"
                                : "border-border/30 bg-card hover:border-border/60"
                            }`}
                          >
                            {qInfo.type === "multi" ? (
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </div>
                            ) : (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? "border-primary" : "border-muted-foreground/40"
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                              </div>
                            )}
                            <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {qInfo.type === "multi" && qInfo.maxSelect && (
                      <p className="text-[11px] text-muted-foreground/60 text-center">
                        {Array.isArray(editValue) ? editValue.length : 0} de {qInfo.maxSelect} selecionados
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Opções não disponíveis. Refaça a pesquisa.</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={!hasChanges() || saveSurveyMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-primary/20 border border-primary/40 text-sm text-primary font-medium disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {saveSurveyMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            )}
          </div>
        );
      })}


    </div>
  );
}
