// Design: AvaLyarin — Meus Dados page (read-only, sensitive data)
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { User, Mail, Phone, Shield, Calendar } from "lucide-react";

export default function MeusDados() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  // Load saved data from localStorage as fallback
  const savedData = (() => {
    try {
      const raw = localStorage.getItem("avalyarin_user_data");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const displayName = user?.name || savedData.nome || "—";
  const displayEmail = user?.email || savedData.email || "—";
  const displayPhone = savedData.telefone || "—";
  const displayCreatedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

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
