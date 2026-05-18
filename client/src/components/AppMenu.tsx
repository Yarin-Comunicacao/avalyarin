// Design: AvaLyarin — Expandable side menu
// Pre-login: shows only ENTRAR/CRIAR CONTA button
// Post-login: shows Últimas Visitas, Minha Conta, Meu Usuário, Minhas Avaliações, Lista de Salvos, Insígnias
import { useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, User, Crown,
  Star, MapPin, Image, Bookmark, Heart, Users,
  ChevronRight, LogOut, LogIn, Trophy, Palette, Check,
  Shield, Building2, UserCog, Eye, Bell
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTheme, THEME_OPTIONS, ThemeName } from "@/contexts/ThemeContext";
import { useBackground, BACKGROUND_OPTIONS } from "@/contexts/BackgroundContext";

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
}


interface MenuSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string; href?: string; icon: React.ReactNode; badge?: string; isTheme?: boolean; isBackground?: boolean }[];
}

export default function AppMenu({ isOpen, onClose }: AppMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { background, setBackground } = useBackground();
  const [expandedSection, setExpandedSection] = useState<string | null>("conta");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  // Sections visible only when logged in
  const loggedInSections: MenuSection[] = [
    {
      id: "conta",
      title: "Minha Conta",
      icon: <User className="w-5 h-5" />,
      items: [
        { id: "dados", label: "Meus Dados", href: "/conta/dados", icon: <Eye className="w-4 h-4" /> },
        { id: "planos", label: "Planos", href: "/conta/planos", icon: <Crown className="w-4 h-4" />, badge: "Free" },
        { id: "temas", label: "Tema Visual", icon: <Palette className="w-4 h-4" />, isTheme: true },
        { id: "fundo", label: "Imagem de Fundo", icon: <Image className="w-4 h-4" />, isBackground: true },
      ],
    },
    {
      id: "usuario",
      title: "Meu Usuário",
      icon: <UserCog className="w-5 h-5" />,
      items: [
        { id: "perfil", label: "Nome de Usuário & Preferências", href: "/conta/usuario", icon: <UserCog className="w-4 h-4" /> },
      ],
    },
    {
      id: "notificacoes",
      title: "Notificações",
      icon: <Bell className="w-5 h-5" />,
      items: [
        { id: "notif-badges", label: "Insígnias Conquistadas", href: "/notificacoes/badges", icon: <Trophy className="w-4 h-4" /> },
        { id: "notif-pesquisas", label: "Pesquisas de Preferência", href: "/notificacoes/pesquisas", icon: <Star className="w-4 h-4" /> },
        { id: "notif-grupos", label: "Atualizações de Grupos", href: "/notificacoes/grupos", icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: "grupos",
      title: "Grupos",
      icon: <Users className="w-5 h-5" />,
      items: [
        { id: "meus-grupos", label: "Meus Grupos", href: "/grupos", icon: <Users className="w-4 h-4" /> },
        { id: "grupos-sigo", label: "Grupos que Sigo", href: "/grupos", icon: <Crown className="w-4 h-4" /> },
      ],
    },
    {
      id: "avaliacoes",
      title: "Minhas Avaliações",
      icon: <Star className="w-5 h-5" />,
      items: [
        { id: "avaliacoes-lista", label: "Avaliações", href: "/avaliacoes", icon: <Star className="w-4 h-4" /> },
        { id: "meu-ranking", label: "Meu Ranking", href: "/meu-ranking", icon: <Trophy className="w-4 h-4" /> },
        { id: "locais", label: "Locais Visitados", href: "/locais-visitados", icon: <MapPin className="w-4 h-4" /> },
        { id: "galeria", label: "Galeria", href: "/galeria", icon: <Image className="w-4 h-4" /> },
      ],
    },
    {
      id: "salvos",
      title: "Lista de Salvos",
      icon: <Bookmark className="w-5 h-5" />,
      items: [
        { id: "meus-locais", label: "Meus Locais", href: "/salvos/locais", icon: <Bookmark className="w-4 h-4" /> },
        { id: "influencers", label: "Influencers Favoritos", href: "/salvos/influencers", icon: <Heart className="w-4 h-4" /> },
        { id: "collab", label: "Listas Collab", href: "/salvos/collab", icon: <Users className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[70] w-[85%] sm:w-[40%] lg:w-[30%] bg-background border-r border-border/50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm tracking-wider text-foreground">
                      {user ? (user.name || "USUÁRIO") : "VISITANTE"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user ? (user.email || "Conectado") : "Faça login para salvar"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* NOT LOGGED IN: Show only login button */}
            {!user && (
              <div className="px-5 py-6">
                <a
                  href={getLoginUrl()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
                >
                  <LogIn className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-display tracking-wider">ENTRAR / CRIAR CONTA</span>
                </a>
                <p className="text-xs text-muted-foreground/60 text-center mt-3">
                  Faça login para acessar suas avaliações, rankings e preferências.
                </p>
              </div>
            )}

            {/* LOGGED IN: Show all content */}
            {user && (
              <>


                {/* Menu Sections */}
                <div className="px-3 py-3">
                  {loggedInSections.map((section) => (
                    <div key={section.id} className="mb-1">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="text-primary">{section.icon}</div>
                        <span className="flex-1 text-left font-display text-sm tracking-wider text-foreground">
                          {section.title.toUpperCase()}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          expandedSection === section.id ? "rotate-90" : ""
                        }`} />
                      </button>

                      {/* Section Items */}
                      <AnimatePresence>
                        {expandedSection === section.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-4 space-y-0.5 pb-2">
                              {section.items.map((item) => (
                                item.isTheme ? (
                                  <div key={item.id}>
                                    <button
                                      onClick={() => setShowThemePicker(!showThemePicker)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
                                    >
                                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                        {item.icon}
                                      </div>
                                      <span className="flex-1 text-left text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                        {item.label}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                                        {THEME_OPTIONS.find(t => t.id === theme)?.label || "Escuro"}
                                      </span>
                                    </button>
                                    {/* Theme Picker Inline */}
                                    <AnimatePresence>
                                      {showThemePicker && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="pl-4 pr-2 py-2 space-y-1.5">
                                            {THEME_OPTIONS.map((opt) => (
                                              <button
                                                key={opt.id}
                                                onClick={() => { setTheme(opt.id); setShowThemePicker(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                                  theme === opt.id
                                                    ? "bg-primary/15 border border-primary/30"
                                                    : "hover:bg-secondary/30 border border-transparent"
                                                }`}
                                              >
                                                <div
                                                  className="w-5 h-5 rounded-full border border-border/50 flex-shrink-0"
                                                  style={{ backgroundColor: getThemePreviewColor(opt.id) }}
                                                />
                                                <div className="flex-1 text-left">
                                                  <span className="text-sm text-foreground">{opt.label}</span>
                                                  <span className="text-[10px] text-muted-foreground ml-2">{opt.description}</span>
                                                </div>
                                                {theme === opt.id && (
                                                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                                )}
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ) : item.isBackground ? (
                                  <div key={item.id}>
                                    <button
                                      onClick={() => setShowBgPicker(!showBgPicker)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group"
                                    >
                                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                        {item.icon}
                                      </div>
                                      <span className="flex-1 text-left text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                        {item.label}
                                      </span>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                                        {BACKGROUND_OPTIONS.find(b => b.id === background)?.label || "Noturna"}
                                      </span>
                                    </button>
                                    {/* Background Picker Inline */}
                                    <AnimatePresence>
                                      {showBgPicker && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="pl-2 pr-2 py-2 grid grid-cols-3 gap-2">
                                            {BACKGROUND_OPTIONS.map((opt) => (
                                              <button
                                                key={opt.id}
                                                onClick={() => { setBackground(opt.id); setShowBgPicker(false); }}
                                                className={`relative rounded-lg overflow-hidden aspect-[9/16] border-2 transition-all ${
                                                  background === opt.id
                                                    ? "border-primary shadow-lg shadow-primary/20"
                                                    : "border-transparent hover:border-primary/40"
                                                }`}
                                              >
                                                <img
                                                  src={opt.thumbnail}
                                                  alt={opt.label}
                                                  className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1">
                                                  <span className="text-[9px] text-white font-medium">{opt.label}</span>
                                                </div>
                                                {background === opt.id && (
                                                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5 text-black" />
                                                  </div>
                                                )}
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ) : (
                                  <Link key={item.id} href={item.href || "/"} onClick={onClose}>
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer group">
                                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                        {item.icon}
                                      </div>
                                      <span className="flex-1 text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                          {item.badge}
                                        </span>
                                      )}
                                    </div>
                                  </Link>
                                )
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {/* Insígnias Link */}
                <div className="px-5 py-3 border-t border-border/30">
                  <Link href="/insignias" onClick={onClose}>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group cursor-pointer">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">Minhas Insígnias</span>
                    </div>
                  </Link>
                </div>

                {/* Admin & Business Links */}
                {(user.role === "admin" || user.role === "owner") && (
                  <div className="px-5 py-2">
                    <Link href="/admin" onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group cursor-pointer">
                        <Shield className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">Painel Admin</span>
                      </div>
                    </Link>
                  </div>
                )}
                {(user.role === "business" || user.role === "admin" || user.role === "owner") && (
                  <div className="px-5 py-2">
                    <Link href="/painel-empresarial" onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors group cursor-pointer">
                        <Building2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">Painel Empresarial</span>
                      </div>
                    </Link>
                  </div>
                )}

                {/* Footer - Logout */}
                <div className="px-5 py-4 mt-auto border-t border-border/30">
                  <button
                    onClick={async () => { await logout(); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-destructive transition-colors">Sair</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Named export for Navbar hamburger button
export function MenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-secondary transition-colors"
      aria-label="Abrir menu"
    >
      <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

function getThemePreviewColor(id: ThemeName): string {
  const colors: Record<ThemeName, string> = {
    escuro: "#D4A843",
    claro: "#2563eb",
    "azul-gelo": "#4A6FA5",
    "azul-cinza": "#9CB2D7",
    rosa: "#C4748A",
  };
  return colors[id];
}
