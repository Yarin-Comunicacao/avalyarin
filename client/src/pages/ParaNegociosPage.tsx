/**
 * ParaNegociosPage — Sub-página pública para donos de estabelecimentos
 * Mostra benefícios do plano free, funcionalidades do painel, e comparação com plano pago
 */
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowRight, Check, X, Crown, Store, QrCode, Bell, BarChart3,
  Ticket, Megaphone, Calendar, Users, Shield, Star, Building2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: "easeOut" as const },
  }),
};

const freeFeatures = [
  { icon: Store, title: "Perfil do Estabelecimento", description: "Página completa com endereço, horários, fotos e descrição do seu local." },
  { icon: QrCode, title: "QR Code Personalizado", description: "QR Code exclusivo para seus clientes avaliarem diretamente pelo app." },
  { icon: Bell, title: "Notificações", description: "Receba alertas quando clientes avaliarem seu local ou fizerem reservas." },
  { icon: Ticket, title: "1 Código Promocional", description: "Crie um código de desconto ativo para atrair novos clientes." },
  { icon: Calendar, title: "Reservas & Eventos", description: "Aceite reservas de grupos e gerencie eventos no seu estabelecimento." },
  { icon: Users, title: "Gestão de Cardápio", description: "Cadastre e atualize seu cardápio digital com preços e descrições." },
];

const premiumFeatures = [
  { icon: Ticket, title: "Códigos Promocionais Ilimitados", description: "Crie quantos códigos de desconto quiser para diferentes campanhas." },
  { icon: BarChart3, title: "Analytics & Métricas", description: "Dashboard completo com dados de avaliações, visitas e tendências." },
  { icon: Star, title: "Destaque no App", description: "Seu estabelecimento aparece em destaque nas buscas e recomendações." },
  { icon: Megaphone, title: "Lista de Transmissão", description: "Envie mensagens para todos os seus seguidores e clientes frequentes." },
  { icon: Shield, title: "Suporte Prioritário", description: "Atendimento prioritário para resolver qualquer questão rapidamente." },
  { icon: Zap, title: "Cardápio Especial para Eventos", description: "Sugira menus especiais para grupos que reservarem no seu local." },
];

const comparisonTable = [
  { feature: "Perfil do estabelecimento", free: true, premium: true },
  { feature: "QR Code personalizado", free: true, premium: true },
  { feature: "Notificações de avaliações", free: true, premium: true },
  { feature: "Aceitar reservas e eventos", free: true, premium: true },
  { feature: "Gestão de cardápio digital", free: true, premium: true },
  { feature: "Códigos promocionais", free: "1 ativo", premium: "Ilimitados" },
  { feature: "Analytics e métricas", free: false, premium: true },
  { feature: "Destaque nas buscas", free: false, premium: true },
  { feature: "Lista de transmissão", free: false, premium: true },
  { feature: "Suporte prioritário", free: false, premium: true },
  { feature: "Cardápio especial para eventos", free: false, premium: true },
  { feature: "Selo verificado", free: false, premium: true },
];

export default function ParaNegociosPage() {
  const [, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const goToGoogle = () => {
    const origin = window.location.origin;
    localStorage.setItem("avalyarin_auth_flow", "business");
    localStorage.setItem("avalyarin_business_register", "true");
    window.location.href = `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
  };

  const goToFacebook = () => {
    const origin = window.location.origin;
    localStorage.setItem("avalyarin_auth_flow", "business");
    localStorage.setItem("avalyarin_business_register", "true");
    window.location.href = `${origin}/api/auth/facebook?origin=${encodeURIComponent(origin)}`;
  };

  const goToEmail = () => {
    localStorage.setItem("avalyarin_auth_flow", "business");
    localStorage.setItem("avalyarin_business_register", "true");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-[#2D1B0E] overflow-x-hidden">
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowAuthModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FDF8F0] rounded-2xl p-8 max-w-sm w-full mx-4 border border-[#EDE5D8] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <img src="/storage/logo-oficial-transparente-v4_bbd5c26e.png" alt="Avalyarin" className="w-16 h-16 mx-auto mb-3 object-contain" />
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2D1B0E]">Cadastro para Negócios</h3>
              <p className="text-sm text-[#6B4D3A] mt-1">Cadastre seu estabelecimento na Avalyarin</p>
            </div>
            <div className="space-y-3">
              <button onClick={goToGoogle} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#EDE5D8] bg-white hover:bg-[#F7F0E5] transition-colors text-[#2D1B0E] font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continuar com Google
              </button>
              <button onClick={goToFacebook} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors text-white font-medium">
                <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Continuar com Facebook
              </button>
              <button onClick={goToEmail} className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#EDE5D8] bg-white hover:bg-[#F7F0E5] transition-colors text-[#2D1B0E] font-medium">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                Continuar com E-mail
              </button>
            </div>
            <button onClick={() => setShowAuthModal(false)} className="w-full mt-4 text-sm text-[#6B4D3A] hover:text-[#2D1B0E] transition-colors">Cancelar</button>
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FDF8F0]/90 backdrop-blur-md border-b border-[#EDE5D8]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/storage/logo-oficial-transparente-v4_bbd5c26e.png" alt="Avalyarin" className="w-8 h-8 object-contain" />
            <span className="font-display text-lg tracking-wider text-[#D9A64E]">AVALYARIN</span>
          </Link>
          <Button className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold" onClick={() => setShowAuthModal(true)}>
            Cadastrar meu Negócio
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-28 pb-20 bg-gradient-to-b from-[#2B132A] to-[#1a0c1a]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D9A64E]/10 border border-[#D9A64E]/30 mb-6">
              <Building2 className="w-4 h-4 text-[#D9A64E]" />
              <span className="text-sm text-[#D9A64E] font-medium">Para Estabelecimentos</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-['Playfair_Display'] font-bold text-white leading-tight mb-6">
              Seu Negócio na<br /><span className="text-[#D9A64E]">Maior Rede de Avaliações</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Cadastre seu estabelecimento gratuitamente e receba avaliações detalhadas, gerencie reservas e aumente sua visibilidade na comunidade gastronômica de São Paulo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold text-base px-8" onClick={() => setShowAuthModal(true)}>
                Começar Grátis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a href="#planos">
                <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 text-base">
                  Ver Planos
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FREE PLAN FEATURES */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#D9A64E] font-medium text-sm tracking-widest uppercase mb-3">Plano Gratuito</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E] mb-4">Tudo que Você Precisa para Começar</h2>
            <p className="text-[#6B4D3A] max-w-xl mx-auto">Sem cartão de crédito, sem compromisso. Cadastre seu estabelecimento e comece a receber avaliações hoje.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeFeatures.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="p-6 rounded-2xl bg-white border border-[#EDE5D8] hover:border-[#D9A64E]/50 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#D9A64E]/10 border border-[#D9A64E]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#D9A64E]" />
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#2D1B0E] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B4D3A] leading-relaxed">{feature.description}</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Grátis</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PREMIUM FEATURES */}
      <section className="py-24 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-[#2B132A] font-medium text-sm tracking-widest uppercase mb-3">Plano Premium</p>
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E] mb-4">Leve seu Negócio ao Próximo Nível</h2>
            <p className="text-[#6B4D3A] max-w-xl mx-auto">Ferramentas avançadas para quem quer se destacar e atrair mais clientes.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, i) => (
              <motion.div key={feature.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="p-6 rounded-2xl bg-white border border-[#2B132A]/20 hover:border-[#2B132A]/40 transition-all shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-[#2B132A]/10 border border-[#2B132A]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-[#2B132A]" />
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#2D1B0E] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B4D3A] leading-relaxed">{feature.description}</p>
                <span className="inline-block mt-3 px-2 py-0.5 rounded text-xs bg-[#2B132A]/10 text-[#2B132A] font-medium">Premium</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="planos" className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-[#2D1B0E] mb-4">Compare os Planos</h2>
            <p className="text-[#6B4D3A]">Escolha o melhor para o seu negócio.</p>
          </motion.div>

          <div className="bg-white rounded-2xl border border-[#EDE5D8] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-[#EDE5D8]">
              <div className="p-5 font-['Playfair_Display'] font-bold text-[#2D1B0E]">Funcionalidade</div>
              <div className="p-5 text-center border-l border-[#EDE5D8]">
                <p className="font-['Playfair_Display'] font-bold text-[#2D1B0E]">Básico</p>
                <p className="text-sm text-[#6B4D3A]">Grátis</p>
              </div>
              <div className="p-5 text-center border-l border-[#EDE5D8] bg-[#D9A64E]/5">
                <p className="font-['Playfair_Display'] font-bold text-[#D9A64E]">Premium</p>
                <p className="text-sm text-[#6B4D3A]">R$ 29,90/mês</p>
              </div>
            </div>
            {/* Rows */}
            {comparisonTable.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 ${i < comparisonTable.length - 1 ? "border-b border-[#EDE5D8]" : ""}`}>
                <div className="p-4 text-sm text-[#2D1B0E]">{row.feature}</div>
                <div className="p-4 text-center border-l border-[#EDE5D8] flex items-center justify-center">
                  {row.free === true ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : row.free === false ? (
                    <X className="w-5 h-5 text-[#EDE5D8]" />
                  ) : (
                    <span className="text-xs text-[#6B4D3A]">{row.free}</span>
                  )}
                </div>
                <div className="p-4 text-center border-l border-[#EDE5D8] bg-[#D9A64E]/5 flex items-center justify-center">
                  {row.premium === true ? (
                    <Check className="w-5 h-5 text-[#D9A64E]" />
                  ) : (
                    <span className="text-xs text-[#6B4D3A]">{row.premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#2B132A] to-[#1a0c1a]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Crown className="w-12 h-12 text-[#D9A64E] mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-['Playfair_Display'] font-bold text-white mb-4">Pronto para Crescer?</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">Cadastre seu estabelecimento gratuitamente e comece a receber avaliações da comunidade Avalyarin.</p>
            <Button size="lg" className="bg-[#D9A64E] hover:bg-[#C4922F] text-white font-semibold text-base px-10" onClick={() => setShowAuthModal(true)}>
              Cadastrar meu Negócio — É Grátis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-[#EDE5D8]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <img src="/storage/logo-oficial-transparente-v4_bbd5c26e.png" alt="Avalyarin" className="w-6 h-6 object-contain" />
              <span className="font-display text-sm tracking-wider text-[#D9A64E]">AVALYARIN</span>
            </Link>
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
