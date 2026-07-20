import { ArrowLeft, Shield, AlertTriangle, Ban, Eye, Lock, Users, Scale } from "lucide-react";
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
            <h1 className="font-display text-lg tracking-wider">TERMOS E DIRETRIZES</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24 max-w-3xl mx-auto space-y-8">
        {/* Intro */}
        <section>
          <h2 className="font-display text-2xl tracking-wider text-primary mb-3">Diretrizes da Comunidade Avalyarin</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Avalyarin é uma plataforma de avaliação de bares e restaurantes. Para manter um ambiente seguro, 
            respeitoso e confiável para todos os usuários, estabelecemos as seguintes diretrizes. A violação 
            dessas regras pode resultar em remoção de conteúdo, suspensão temporária ou banimento permanente da conta.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Última atualização: 20 de julho de 2026
          </p>
        </section>

        {/* 1. Conteúdo Sexual e Nudez */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            <h3 className="font-display text-xl tracking-wider">1. Conteúdo Sexual e Nudez</h3>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">1.1 — Nudez Adulta e Atividade Sexual</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido publicar fotos, vídeos ou descrições contendo nudez, atividade sexual explícita ou 
              implícita, ou conteúdo sexualmente sugestivo. Isso inclui fotos de avaliações que contenham 
              nudez parcial ou total, mesmo que em segundo plano.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">1.2 — Exploração Sexual de Adultos</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conteúdo que promova, glorifique ou facilite exploração sexual de qualquer pessoa é 
              estritamente proibido. Isso inclui ofertas de serviços sexuais, solicitação ou coerção.
            </p>
          </div>

          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 space-y-3">
            <h4 className="font-semibold text-sm text-red-400">1.3 — Tolerância Zero: Exploração Infantil</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Qualquer conteúdo que envolva exploração sexual de menores resultará em banimento imediato 
              e permanente, além de denúncia às autoridades competentes. Não há exceções.
            </p>
          </div>
        </section>

        {/* 2. Conteúdo Ofensivo */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-display text-xl tracking-wider">2. Conteúdo Ofensivo</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">2.1 — Discurso de Ódio</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido conteúdo que ataque, desumanize ou incite violência contra indivíduos ou grupos 
              com base em raça, etnia, nacionalidade, religião, orientação sexual, identidade de gênero, 
              deficiência, condição médica ou qualquer outra característica protegida. Avaliações que 
              contenham linguagem discriminatória serão removidas.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">2.2 — Bullying e Assédio</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comportamento que intimide, humilhe ou persiga outros usuários, funcionários de 
              estabelecimentos ou proprietários não será tolerado. Isso inclui ameaças, doxxing 
              (exposição de dados pessoais), campanhas de difamação e assédio coordenado.
            </p>
          </div>
        </section>

        {/* 3. Conteúdo com Risco à Vida */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-display text-xl tracking-wider">3. Conteúdo com Risco à Vida</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">3.1 — Violência e Incitação</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conteúdo que promova, glorifique ou incite violência contra qualquer pessoa ou grupo é 
              proibido. Ameaças de violência, mesmo que "em tom de brincadeira", serão tratadas com 
              seriedade.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">3.2 — Organizações Perigosas</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido usar a plataforma para recrutar, promover ou apoiar organizações terroristas, 
              criminosas ou de ódio organizado.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">3.3 — Suicídio e Automutilação</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Conteúdo que promova, glorifique ou instrua sobre suicídio ou automutilação é proibido. 
              Se você ou alguém que conhece está em crise, ligue para o CVV: 188.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">3.4 — Atividades Criminosas e Bens Restritos</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido usar a plataforma para facilitar atividades ilegais, incluindo venda de 
              drogas, armas, documentos falsos ou qualquer bem restrito por lei.
            </p>
          </div>
        </section>

        {/* 4. Golpes Financeiros */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-yellow-500" />
            <h3 className="font-display text-xl tracking-wider">4. Golpes Financeiros e de Investimento</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">4.1 — Esquemas de Enriquecimento Rápido</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Promoção de esquemas pirâmide, marketing multinível fraudulento ou promessas de retorno 
              financeiro garantido é proibida em qualquer área da plataforma.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">4.2 — Produtos Financeiros Proibidos</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Não é permitido promover criptomoedas fraudulentas, tokens sem lastro, apostas ilegais 
              ou qualquer produto financeiro não regulamentado.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">4.3 — Empréstimos Predatórios</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ofertas de empréstimos com taxas abusivas, cobranças ocultas ou práticas predatórias 
              são proibidas.
            </p>
          </div>
        </section>

        {/* 5. Roubo de Dados e Phishing */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-500" />
            <h3 className="font-display text-xl tracking-wider">5. Roubo de Dados e Phishing</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">5.1 — Links Enganosos</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido compartilhar links que redirecionem para páginas falsas de login, formulários 
              de captura de dados ou sites que imitem o Avalyarin ou outros serviços.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">5.2 — Softwares Maliciosos</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Distribuição de malware, spyware, ransomware ou qualquer software malicioso através 
              da plataforma resultará em banimento imediato.
            </p>
          </div>
        </section>

        {/* 6. Falsidade Ideológica */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-display text-xl tracking-wider">6. Falsidade Ideológica e Impostores</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">6.1 — Personas Falsas</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Criar perfis falsos para manipular avaliações, inflar notas de estabelecimentos ou 
              prejudicar concorrentes é proibido. Cada pessoa deve ter apenas uma conta ativa.
            </p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">6.2 — Impostores de Celebridades/Influencers</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fingir ser uma celebridade, influenciador, crítico gastronômico reconhecido ou 
              representante de um estabelecimento sem autorização é proibido.
            </p>
          </div>
        </section>

        {/* 7. Cloaking */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-500" />
            <h3 className="font-display text-xl tracking-wider">7. Práticas Enganosas (Cloaking)</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estabelecimentos que utilizem práticas enganosas para manipular sua presença na plataforma 
              — como oferecer incentivos por avaliações positivas, criar avaliações falsas, ou usar bots 
              para inflar métricas — terão seu perfil suspenso ou removido.
            </p>
          </div>
        </section>

        {/* 8. Integridade da Conta */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="font-display text-xl tracking-wider">8. Integridade da Conta</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cada usuário deve manter uma identidade autêntica. É proibido: criar múltiplas contas, 
              compartilhar credenciais de acesso, usar automação para interagir com a plataforma, 
              ou comprar/vender contas. Contas que violem a integridade serão suspensas.
            </p>
          </div>
        </section>

        {/* 9. Desinformação */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-display text-xl tracking-wider">9. Desinformação e Integridade</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Avaliações devem refletir experiências reais. É proibido publicar informações 
              deliberadamente falsas sobre estabelecimentos, como alegações infundadas sobre 
              higiene, segurança alimentar ou práticas ilegais. Desinformação que possa causar 
              dano real a negócios ou pessoas será removida e a conta poderá ser suspensa.
            </p>
          </div>
        </section>

        {/* 10. Bens e Serviços Restritos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            <h3 className="font-display text-xl tracking-wider">10. Bens e Serviços Restritos</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              A plataforma não pode ser usada para comercializar, promover ou facilitar a venda de: 
              drogas ilícitas, medicamentos controlados sem prescrição, armas, explosivos, documentos 
              falsificados, produtos contrabandeados ou qualquer item cuja venda seja proibida por lei.
            </p>
          </div>
        </section>

        {/* 11. Cibersegurança e Privacidade */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-display text-xl tracking-wider">11. Cibersegurança e Privacidade</h3>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              É proibido: coletar dados de outros usuários sem consentimento, publicar informações 
              pessoais de terceiros (doxxing), tentar acessar contas alheias, explorar vulnerabilidades 
              da plataforma, ou violar a privacidade de funcionários e clientes de estabelecimentos 
              através de fotos ou informações não autorizadas.
            </p>
          </div>
        </section>

        {/* Consequências */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl tracking-wider">Consequências</h3>
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              As violações são tratadas com base na gravidade e recorrência:
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold">1°</span>
                <span><strong>Aviso:</strong> Remoção do conteúdo + notificação ao usuário</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">2°</span>
                <span><strong>Suspensão temporária:</strong> 7 a 30 dias sem acesso à plataforma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">3°</span>
                <span><strong>Banimento permanente:</strong> Remoção definitiva da conta</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Violações graves (itens 1.3, 3.1, 3.2, 5.2) resultam em banimento imediato, sem aviso prévio.
            </p>
          </div>
        </section>

        {/* Denúncias */}
        <section className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border/30 space-y-3">
            <h4 className="font-semibold text-sm">Como denunciar</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se você encontrar conteúdo que viole estas diretrizes, use o botão "Reportar" disponível 
              em cada avaliação. Nossa equipe de moderação analisará a denúncia em até 48 horas. 
              Denúncias falsas ou abusivas também são passíveis de sanção.
            </p>
          </div>
        </section>

        {/* Termos de Uso resumidos */}
        <section className="space-y-4 mt-8 pt-8 border-t border-border/30">
          <h2 className="font-display text-2xl tracking-wider text-primary">Termos de Uso</h2>
          
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2">
              <h4 className="font-semibold text-sm">Elegibilidade</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O uso do Avalyarin é restrito a maiores de 18 anos, conforme legislação brasileira 
                sobre conteúdo relacionado a bebidas alcoólicas.
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2">
              <h4 className="font-semibold text-sm">Propriedade do Conteúdo</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao publicar avaliações, fotos e comentários, você concede ao Avalyarin uma licença 
                não exclusiva para exibir, distribuir e promover esse conteúdo dentro da plataforma. 
                Você mantém a propriedade intelectual do seu conteúdo original.
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2">
              <h4 className="font-semibold text-sm">Responsabilidade</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As avaliações representam opiniões pessoais dos usuários. O Avalyarin não se 
                responsabiliza pela precisão das informações publicadas por terceiros, mas se 
                compromete a remover conteúdo que viole estas diretrizes quando identificado.
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2">
              <h4 className="font-semibold text-sm">Privacidade e LGPD</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (LGPD). 
                Coletamos apenas dados necessários para o funcionamento do serviço. Você pode 
                solicitar acesso, correção ou exclusão dos seus dados a qualquer momento através 
                das configurações da conta.
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 border border-border/30 space-y-2">
              <h4 className="font-semibold text-sm">Modificações</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Estes termos podem ser atualizados periodicamente. Alterações significativas serão 
                comunicadas através de notificação no aplicativo. O uso continuado da plataforma 
                após alterações constitui aceitação dos novos termos.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
