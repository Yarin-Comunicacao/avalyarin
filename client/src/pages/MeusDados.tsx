// Design: AvaLyarin — Meus Dados page
// Fields: Nome, Sobrenome, E-mail de cadastro, Telefone de cadastro
import { useState } from "react";
import Navbar from "@/components/Navbar";
import AppMenu from "@/components/AppMenu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { User, Mail, Phone, Save } from "lucide-react";

export default function MeusDados() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
  });

  const handleSave = () => {
    localStorage.setItem("avalyarin_user_data", JSON.stringify(form));
    toast.success("Dados salvos com sucesso!");
  };

  // Load saved data on mount
  useState(() => {
    const saved = localStorage.getItem("avalyarin_user_data");
    if (saved) {
      try { setForm(JSON.parse(saved)); } catch {}
    }
  });

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

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Nome
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Sobrenome
              </label>
              <input
                type="text"
                value={form.sobrenome}
                onChange={(e) => setForm(prev => ({ ...prev, sobrenome: e.target.value }))}
                placeholder="Seu sobrenome"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> E-mail de cadastro
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> Telefone de cadastro
              </label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 rounded-xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>

            <Button onClick={handleSave} className="w-full font-display tracking-wider glow-amber mt-6">
              <Save className="w-4 h-4 mr-2" /> SALVAR DADOS
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
