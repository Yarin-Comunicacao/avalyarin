import { ArrowLeft, Shield, AlertTriangle, Ban, Lock, Users, Scale, CreditCard, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function TermosPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/30">
        <div className="container flex items-center gap-3 py-4">
          <button onClick={() => navigate(-1 as any)} className="p-2 rounded-lg hover:bg-card transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-lg tracking-wider">TERMOS DE USO E DIRETRIZES</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24 max-w-3xl mx-auto space-y-8">
        {/* Intro */}
        <section>
          <h2 className="font-display text-2xl tracking-wider text-primary mb-3">Termos de Serviço — Avalyarin</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Bem-vindo ao Avalyarin. Ao acessar ou utilizar nossa plataforma, você concorda expressamente com estes Termos de Serviço, abrangendo regras de uso, maioridade (+18), planos pagos, reservas, promoções e a moderação de mensagens e grupos.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Última atualização: 16 de agosto de 2026
          </p>
        </section>

        {/* 1. Maioridade */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display text-xl tracking-wider">1. Restrição de Idade (18+)</h3>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2 text-sm text-muted-foreground">
            <p>
              O Avalyarin é uma plataforma especializada em experiências gastronômicas e avaliações de bares e restaurantes que servem bebidas alcoólicas. 
              <strong> É obrigatório ter 18 anos ou mais</strong> para criar uma conta e utilizar o serviço. Menores de idade têm o acesso terminantemente proibido.
            </p>
          </div>
        </section>

        {/* 2. Planos Pagos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl tracking-wider">2. Planos Pagos e Assinaturas (Business e Usuários)</h3>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">2.1 Cobrança e Renovação:</strong> Planos pagos oferecem recursos avançados para usuários e estabelecimentos. As assinaturas são cobradas de forma recorrente e podem ser canceladas a qualquer momento.</p>
            <p><strong className="text-foreground">2.2 Direito de Arrependimento:</strong> Conforme o Código de Defesa do Consumidor, o reembolso por desistência pode ser solicitado em até 7 dias corridos após a contratação inicial.</p>
            <p><strong className="text-foreground">2.3 Imparcialidade de Avaliações:</strong> A aquisição de planos pagos ou pacotes de destaque por estabelecimentos concede ferramentas de gestão e visibilidade, mas <strong>não interfere</strong> na imparcialidade das notas e avaliações públicas feitas pelos usuários.</p>
          </div>
        </section>

        {/* 3. Reservas e Promoções */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl tracking-wider">3. Reservas e Promoções de Estabelecimentos</h3>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">3.1 Sistema de Reservas:</strong> O Avalyarin atua como intermediário tecnológico para facilitar solicitações de reservas. A confirmação da mesa, lotação e atendimento são de responsabilidade exclusiva do estabelecimento parceiro.</p>
            <p><strong className="text-foreground">3.2 Promoções e Cupons:</strong> Ofertas e promoções divulgadas por estabelecimentos são geridas pelos próprios parceiros. O Avalyarin não se responsabiliza caso o estabelecimento encerre uma promoção sem aviso prévio ou esgote o estoque de itens promocionais.</p>
          </div>
        </section>

        {/* 4. Grupos e Mensagens */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-display text-xl tracking-wider">4. Conduta em Grupos e Mensagens</h3>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3 text-sm text-muted-foreground">
            <p><strong className="text-foreground">4.1 Conteúdo de Usuários (UGC):</strong> Mensagens, fotos e interações enviadas em chats de grupos ou conversas diretas são de inteira responsabilidade de quem as envia.</p>
            <p><strong className="text-foreground">4.2 Moderação:</strong> É proibido o envio de spam, ofensas, conteúdo pornográfico ou ilegal nos grupos. O Avalyarin reserva-se o direito de remover mensagens denunciadas, suspender participantes ou fechar grupos que violem estas regras.</p>
          </div>
        </section>

        {/* 5. Isenção Geral */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-red-500" />
            <h3 className="font-display text-xl tracking-wider">5. Isenção de Responsabilidade Civil</h3>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3 text-sm text-muted-foreground">
            <p>
              O Avalyarin não se responsabiliza por intoxicações alimentares, reações alérgicas, falhas no atendimento, alteração de cardápios ou quaisquer danos materiais e morais ocorridos nas dependências dos estabelecimentos listados na plataforma.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
