/**
 * LandingPage — Public marketing page with Creme/Warm theme
 * Features: Auth modal (Google/Facebook), "Tenho um Negócio" button
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Star, Users, BarChart3, Calendar, MapPin, ChefHat,
  ArrowRight, Sparkles, Shield, Wine, Coffee, PartyPopper, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" as const },
  }),
};

const stats = [
  { value: "270+", label: "Estabelecimentos" },
  { value: "24", label: "Categorias" },
  { value: "17", label: "Bairros" },
  { value: "100%", label: "Gratuito" },
];

const features = [
  {
    icon: Star,
    title: "Avaliação Inteligente",
    description: "Sistema de pesos dinâmicos que calcula notas precisas por categoria. Avalie no modo Direto ou Analítico.",
  },
  {
    icon: Users,
    title: "Grupos & Social",
    description: "Crie grupos com amigos, compartilhe avaliações, organize eventos e reservas em locais juntos.",
  },
  {
    icon: BarChart3,
    title: "Rankings Pessoais",
    description: "Monte seu top 10 por categoria. Compare com amigos e descubra novos favoritos.",
  },
  {
    icon: Calendar,
    title: "Eventos & Reservas",
    description: "Organize saídas em grupo com votação de local e data. O local recebe a reserva automaticamente.",
  },
];

const steps = [
  { number: "01", title: "Escolha a Categoria", description: "Cervejaria, coquetelaria, boteco, pizzaria... selecione o tipo de estabelecimento." },
  { number: "02", title: "Avalie o que Consumiu", description: "Selecione os itens do cardápio e dê sua nota — rápido no modo Direto ou detalhado no Analítico." },
  { number: "03", title: "Veja sua Nota", description: "O sistema calcula automaticamente com pesos por categoria. Acompanhe sua evolução." },
  { number: "04", title: "Compartilhe & Compare", description: "Envie para grupos, monte rankings e ganhe insígnias conforme avalia mais lugares." },
];

const categoryPreviews = [
  { name: "Cervejaria", icon: Wine },
  { name: "Coquetelaria", icon: Sparkles },
  { name: "Cafeteria", icon: Coffee },
  { name: "Gastronomia", icon: ChefHat },
  { name: "Vida Noturna", icon: PartyPopper },
  { name: "Boteco", icon: MapPin },
];

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps = {}) {
  const [, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState<"login" | "register" | "business" | null>(null);

  const handleEnter = () => setShowAuthModal("register");
  const handleLogin = () => navigate("/login");
  const handleBusiness = () => navigate("/para-negocios");

  const goToGoogle = () => {
    const origin = window.location.origin;
    localStorage.setItem("avalyarin_auth_flow", showAuthModal === "business" ? "business" : showAuthModal === "login" ? "login" : "register");
    if (showAuthModal === "business") localStorage.setItem("avalyarin_business_register", "true");
    window.location.href = `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
  };

  const goToFacebook = () => {
    const origin = window.location.origin;
    localStorage.setItem("avalyarin_auth_flow", showAuthModal === "business" ? "business" : showAuthModal === "login" ? "login" : "register");
    if (showAuthModal === "business") localStorage.setItem("avalyarin_business_register", "true");
    window.location.href = `${origin}/api/auth/facebook?origin=${encodeURIComponent(origin)}`;
  };

  const goToEmail = () => {
    localStorage.setItem("avalyarin_auth_flow", showAuthModal === "business" ? "business" : showAuthModal === "login" ? "login" : "register");
    if (showAuthModal === "business") localStorage.setItem("avalyarin_business_register", "true");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-[#2D1B0E] overflow-x-hidden">
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAuthModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDF8F0] rounded-2xl p-8 max-w-sm w-full mx-4 border border-[#EDE5D8] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <img src="/logo-brand.png" alt="Avalyarin" className="w-16 h-16 mx-auto mb-3 object-contain" />
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2D1B0E]">
                {showAuthModal === "login" ? "Entrar" : showAuthModal === "business" ? "Cadastro para Negócios" : "Criar Conta"}
              </h3>
              <p className="text-sm text-[#6B4D3A] mt-1">
                {showAuthModal === "business" ? "Cadastre seu estabelecimento na Avalyarin" : showAuthModal === "login" ? "Acesse sua conta" : "Escolha como deseja se cadastrar"}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={goToGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#EDE5D8] bg-white hover:bg-[#F7F0E5] transition-colors text-[#2D1B0E] font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuar com Google
              </button>
              <button
                onClick={goToFacebook}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors text-white font-medium"
              >
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Continuar com Facebook
              </button>
              <button
                onClick={goToEmail}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#EDE5D8] bg-white hover:bg-[#F7F0E5] transition-colors text-[#2D1B0E] font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Continuar com E-mail
              </button>
            </div>
            <button onClick={() => setShowAuthModal(null)} className="w-full mt-4 text-sm text-[#6B4D3A] hover:text-[#2D1B0E] transition-colors">
              Cancelar
            </button>
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <header className="safe-area-header fixed top-0 left-0 right-0 z-50 bg-[#FDF8F0]/95 backdrop-blur-md border-b border-[#EDE5D8]">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <img src="/logo-brand.png" alt="Avalyarin" className="w-8 h-8 object-contain" />
            <span className="hidden sm:inline font-display text-lg tracking-wider text-[#D9A64E] whitespace-nowrap">AVALYARIN</span>
          </div>
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3 text-xs sm:text-sm text-[#6B4D3A] hover:text-[#2D1B0E] whitespace-nowrap" onClick={handleLogin}>
              Entrar
            </Button>
            <Button size="sm" className="h-9 px-2.5 sm:px-3 text-xs sm:text-sm bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold whitespace-nowrap" onClick={handleEnter}>
              Criar Conta
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Tenho um Negócio"
              title="Tenho um Negócio"
              className="h-9 px-2 sm:px-3 border-[#2B132A] text-[#2B132A] hover:bg-[#2B132A] hover:text-white font-semibold whitespace-nowrap"
              onClick={handleBusiness}
            >
              <Building2 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Tenho um Negócio</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="safe-area-page-top relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F0] via-[#F7F0E5] to-[#FDF8F0]" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#D9A64E]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-[#2B132A]/3 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
              <p className="text-[#D9A64E] font-medium text-sm tracking-widest uppercase mb-4">A rede social de avaliações</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-['Playfair_Display'] font-bold tracking-wide leading-tight mb-6">
                <span className="text-[#2D1B0E]">Avalie Seu</span><br />
                <span className="text-[#D9A64E]">Local Favorito</span>
              </h1>
              <p className="text-lg text-[#6B4D3A] max-w-lg leading-relaxed mb-8">
                O sistema de avaliação mais completo para locais gastronômicos de São Paulo. Avalie, compare, organize eventos e descubra novos lugares com seus amigos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <Button size="lg" className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold text-base px-8" onClick={handleEnter}>
                  Começar Agora — É Grátis <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="border-[#2B132A] text-[#2B132A] hover:bg-[#2B132A] hover:text-white text-base" onClick={handleBusiness}>
                  <Building2 className="w-4 h-4 mr-2" /> Tenho um Negócio
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }} className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} custom={i} initial="hidden" animate="visible" variants={fadeUp} className="p-6 rounded-2xl bg-white border border-[#EDE5D8] shadow-sm text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-[#D9A64E] mb-1">{stat.value}</p>
                  <p className="text-sm text-[#6B4D3A]">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 relative bg-white/50">
        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D9A64E] font-medium text-sm tracking-widest uppercase mb-3">Por que usar o Avalyarin?</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E]">Mais que uma Avaliação</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="p-6 rounded-2xl bg-white border border-[#EDE5D8] hover:border-[#D9A64E]/50 transition-all group shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#D9A64E]/10 border border-[#D9A64E]/20 flex items-center justify-center mb-4 group-hover:bg-[#D9A64E]/20 transition-all">
                  <feature.icon className="w-6 h-6 text-[#D9A64E]" />
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#2D1B0E] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B4D3A] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#FDF8F0]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D9A64E] font-medium text-sm tracking-widest uppercase mb-3">Simples e rápido</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E]">Como Funciona</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.number} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative">
                <span className="text-6xl font-bold text-[#D9A64E]/15 absolute -top-2 -left-1">{step.number}</span>
                <div className="pt-10">
                  <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#2D1B0E] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#6B4D3A] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D9A64E] font-medium text-sm tracking-widest uppercase mb-3">Explore</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E]">Categorias</h2>
            <p className="text-[#6B4D3A] mt-3 max-w-md mx-auto">24 categorias com critérios de avaliação adaptados para cada tipo de experiência.</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoryPreviews.map((cat, i) => (
              <motion.div key={cat.name} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="p-5 rounded-2xl bg-white border border-[#EDE5D8] text-center hover:border-[#D9A64E]/50 transition-all cursor-pointer shadow-sm" onClick={handleEnter}>
                <cat.icon className="w-8 h-8 mx-auto mb-3 text-[#D9A64E]" />
                <p className="text-sm font-medium text-[#2D1B0E]">{cat.name}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" className="border-[#EDE5D8] text-[#6B4D3A] hover:text-[#2D1B0E] hover:border-[#D9A64E]/40 bg-transparent" onClick={handleEnter}>
              Ver todas as 24 categorias <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES - CTA linking to /para-negocios */}
      <section className="py-16 bg-gradient-to-b from-[#2B132A] to-[#1a0c1a]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Building2 className="w-10 h-10 text-[#D9A64E] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-['Playfair_Display'] font-bold text-white mb-3">Tem um Estabelecimento?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">Cadastre grátis e receba avaliações, gerencie reservas e aumente sua visibilidade.</p>
            <Button size="lg" className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold" onClick={handleBusiness}>
              Saiba Mais <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-[#FDF8F0]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E] mb-4">Pronto para Avaliar?</h2>
            <p className="text-[#6B4D3A] mb-8 max-w-md mx-auto">Crie sua conta gratuita e comece a avaliar seus locais favoritos de São Paulo.</p>
            <Button size="lg" className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold text-base px-10" onClick={handleEnter}>
              Criar Conta Grátis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-[#EDE5D8]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-brand.png" alt="Avalyarin" className="w-6 h-6 object-contain" />
              <span className="font-display text-sm tracking-wider text-[#D9A64E]">AVALYARIN</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#6B4D3A]/60">
              <Link href="/termos" className="hover:text-[#2D1B0E] transition-colors">Termos de Uso</Link>
              <Link href="/privacidade" className="hover:text-[#2D1B0E] transition-colors">Privacidade</Link>
              <a href="https://instagram.com/avalyarin" target="_blank" rel="noopener noreferrer" className="hover:text-[#2D1B0E] transition-colors">Instagram</a>
            </div>
            <p className="text-xs text-[#6B4D3A]/40">Pinheiros & Vila Madalena, SP</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
