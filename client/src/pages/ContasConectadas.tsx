// Design: AvaLyarin — Contas Conectadas page
// Login with Facebook, Instagram, Google
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { toast } from "@/components/ui/sonner";
import { Link2, Check } from "lucide-react";

interface ConnectedAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
}

export default function ContasConectadas() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
    { id: "google", name: "Google", icon: "G", color: "bg-red-500/10 text-red-400 border-red-500/30", connected: false },
    { id: "facebook", name: "Facebook", icon: "f", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", connected: false },
    { id: "instagram", name: "Instagram", icon: "IG", color: "bg-pink-500/10 text-pink-400 border-pink-500/30", connected: false },
  ]);

  const toggleAccount = (id: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        const newState = !acc.connected;
        toast(newState ? `${acc.name} conectado!` : `${acc.name} desconectado`, {
          description: newState ? "Sua conta foi vinculada com sucesso." : "Sua conta foi desvinculada.",
        });
        return { ...acc, connected: newState };
      }
      return acc;
    }));
  };

  return (
    <div className="min-h-screen">
      <Navbar  />
      <div className="pt-28 pb-24">
        <div className="container max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">CONTAS CONECTADAS</h2>
              <p className="text-sm text-muted-foreground">Vincule suas redes sociais</p>
            </div>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => toggleAccount(acc.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-lg ${acc.color}`}>
                  {acc.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{acc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {acc.connected ? "Conta vinculada" : "Clique para conectar"}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  acc.connected ? "bg-green-500/20 text-green-400" : "bg-secondary text-muted-foreground"
                }`}>
                  {acc.connected ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-6">
            Ao conectar suas contas, você poderá fazer login de forma mais rápida e ter prioridade na escolha do seu @.
          </p>
        </div>
      </div>
    </div>
  );
}
