// Design: AvaLyarin — Cadastro page
// User ID, @username (default by order, paid to customize, Instagram priority)
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Settings, AtSign, Hash, Instagram, Crown, Lock } from "lucide-react";

export default function Cadastro() {

  // Mock user data
  const userId = "AVL-000001";
  const defaultUsername = "usuario_000001";
  const [customUsername, setCustomUsername] = useState("");
  const [instagramConnected] = useState(false);

  const handleRequestChange = () => {
    if (!customUsername.trim()) {
      toast.error("Digite o nome de usuário desejado.");
      return;
    }
    toast("Funcionalidade em breve", {
      description: "A alteração de nome de usuário estará disponível em breve. Usuários com Instagram conectado terão prioridade.",
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar  />
      <div className="pt-28 pb-24">
        <div className="container max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl tracking-wider text-primary">CADASTRO</h2>
              <p className="text-sm text-muted-foreground">Seu perfil de avaliador</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* User ID */}
            <div className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <Hash className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">ID do Usuário</span>
              </div>
              <p className="font-numbers text-2xl text-primary font-bold tracking-wider">{userId}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Identificador único gerado automaticamente</p>
            </div>

            {/* Username */}
            <div className="p-5 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-3 mb-3">
                <AtSign className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Nome de Usuário</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary/50 border border-border/30 mb-4">
                <AtSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-numbers text-foreground">{defaultUsername}</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/30">
                  Padrão
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Seu nome de usuário padrão é gerado pela ordem de cadastro. Para personalizar, escolha um nome abaixo.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                    placeholder="seu_nome_personalizado"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-secondary/50 border border-border/30 text-sm text-foreground font-numbers placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40"
                  />
                </div>

                <Button
                  onClick={handleRequestChange}
                  variant="outline"
                  className="w-full font-display tracking-wider"
                >
                  <Crown className="w-4 h-4 mr-2 text-primary" />
                  ALTERAR NOME — PREMIUM
                  <Lock className="w-3 h-3 ml-2 text-muted-foreground" />
                </Button>
              </div>

              {/* Instagram priority notice */}
              <div className={`mt-4 p-3 rounded-lg border ${instagramConnected ? "border-green-500/30 bg-green-500/10" : "border-border/30 bg-secondary/30"}`}>
                <div className="flex items-center gap-2">
                  <Instagram className={`w-4 h-4 ${instagramConnected ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium text-foreground">
                    {instagramConnected ? "Instagram conectado — prioridade ativa" : "Conecte seu Instagram para ter prioridade sobre seu @"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
