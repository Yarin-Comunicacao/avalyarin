import { ArrowLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicyPage() {
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
            <h1 className="font-display text-lg tracking-wider">POLÍTICA DE PRIVACIDADE</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24 max-w-3xl mx-auto space-y-8">
        <section>
          <p className="text-xs text-muted-foreground mb-4">Última atualização: 20 de julho de 2026</p>
          <h2 className="font-display text-2xl tracking-wider text-primary mb-3">Política de Privacidade — Avalyarin</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Yarin Agência ("nós", "nosso") opera o aplicativo Avalyarin ("Serviço"). Esta página informa sobre nossas políticas 
            relativas à coleta, uso e divulgação de dados pessoais quando você utiliza nosso Serviço.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">1. Dados que Coletamos</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><strong className="text-foreground">1.1 Dados de Conta:</strong> Ao fazer login via Facebook ou outro provedor OAuth, coletamos seu nome, e-mail e foto de perfil pública.</p>
            <p><strong className="text-foreground">1.2 Dados de Uso:</strong> Avaliações, comentários, fotos enviadas, preferências de categoria e histórico de interações no aplicativo.</p>
            <p><strong className="text-foreground">1.3 Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional, páginas visitadas e horários de acesso para fins de segurança e análise.</p>
            <p><strong className="text-foreground">1.4 Dados de Localização:</strong> Quando autorizado, coletamos dados de geolocalização para verificação de presença em estabelecimentos (check-in via QR Code).</p>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">2. Como Usamos seus Dados</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer e manter o Serviço</li>
              <li>Personalizar sua experiência de avaliação</li>
              <li>Gerar insights e estatísticas para estabelecimentos parceiros (dados agregados e anonimizados)</li>
              <li>Enviar notificações relevantes sobre o Serviço</li>
              <li>Detectar e prevenir fraudes, spam e uso abusivo</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">3. Compartilhamento de Dados</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p><strong className="text-foreground">3.1</strong> Não vendemos seus dados pessoais a terceiros.</p>
            <p><strong className="text-foreground">3.2</strong> Avaliações e comentários são públicos dentro da plataforma, associados ao seu nome de usuário.</p>
            <p><strong className="text-foreground">3.3</strong> Dados agregados e anonimizados podem ser compartilhados com estabelecimentos parceiros para fins de melhoria de serviço.</p>
            <p><strong className="text-foreground">3.4</strong> Podemos compartilhar dados com prestadores de serviço (hospedagem, análise) sob contratos de confidencialidade.</p>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">4. Segurança dos Dados</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados, incluindo criptografia 
            em trânsito (HTTPS/TLS), controle de acesso baseado em roles, e moderação automática de conteúdo. No entanto, 
            nenhum método de transmissão pela Internet é 100% seguro.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">5. Retenção de Dados</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Mantemos seus dados pessoais enquanto sua conta estiver ativa. Após exclusão da conta:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados de perfil são removidos em até 30 dias</li>
              <li>Avaliações podem ser anonimizadas (desvinculadas do perfil) para manter a integridade dos dados agregados</li>
              <li>Logs de segurança são mantidos por até 90 dias</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">6. Seus Direitos (LGPD)</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Obter informações sobre compartilhamento com terceiros</li>
            </ul>
            <p>Para exercer esses direitos, entre em contato pelo e-mail: <strong className="text-foreground">yarinagencia@gmail.com</strong></p>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">7. Exclusão de Dados (Facebook)</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              Se você fez login usando o Facebook e deseja excluir seus dados, pode solicitar a exclusão diretamente 
              pelo nosso endpoint de exclusão de dados ou entrando em contato conosco.
            </p>
            <p>
              URL de exclusão de dados: <code className="text-xs bg-card px-2 py-0.5 rounded border border-border">
                https://avalyarin.com.br/api/facebook/data-deletion
              </code>
            </p>
            <p>
              Após a solicitação, seus dados serão excluídos em até 30 dias e você receberá uma confirmação.
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">8. Cookies e Tecnologias</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Utilizamos cookies de sessão para manter sua autenticação e preferências. Não utilizamos cookies de rastreamento 
            de terceiros para publicidade. Cookies analíticos são usados apenas para melhorar o Serviço.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">9. Menores de Idade</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O Avalyarin é destinado a maiores de 18 anos, conforme verificação de idade na entrada do aplicativo. 
            Não coletamos intencionalmente dados de menores de 18 anos. Se tomarmos conhecimento de que coletamos 
            dados de um menor, excluiremos imediatamente.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">10. Alterações nesta Política</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Podemos atualizar esta Política periodicamente. Notificaremos sobre alterações significativas por meio do 
            aplicativo. O uso continuado do Serviço após alterações constitui aceitação da política atualizada.
          </p>
        </section>

        <section>
          <h3 className="font-display text-lg tracking-wider text-foreground mb-2">11. Contato</h3>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
            <p><strong className="text-foreground">Controlador:</strong> Yarin Agência</p>
            <p><strong className="text-foreground">E-mail:</strong> yarinagencia@gmail.com</p>
            <p><strong className="text-foreground">Aplicativo:</strong> Avalyarin — Sistema de Avaliação para Bares e Restaurantes</p>
          </div>
        </section>
      </main>
    </div>
  );
}
