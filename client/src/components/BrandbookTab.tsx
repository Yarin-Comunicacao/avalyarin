import { useState } from "react";
import { BookOpen, MessageSquare, Palette, Layout, Shield, ChevronRight } from "lucide-react";

type BrandbookSection = "roadmap" | "estrategia" | "verbal" | "visual" | "aplicacoes" | "governanca";

const sections = [
  { id: "roadmap" as const, label: "Roadmap", icon: BookOpen },
  { id: "estrategia" as const, label: "Estratégia", icon: ChevronRight },
  { id: "verbal" as const, label: "Identidade Verbal", icon: MessageSquare },
  { id: "visual" as const, label: "Identidade Visual", icon: Palette },
  { id: "aplicacoes" as const, label: "Aplicações", icon: Layout },
  { id: "governanca" as const, label: "Governança", icon: Shield },
];

export default function BrandbookTab() {
  const [activeSection, setActiveSection] = useState<BrandbookSection>("roadmap");

  return (
    <div className="brandbook-page">
      {/* Section Navigation */}
      <div className="flex gap-2 flex-wrap mb-8 pb-4 border-b border-border/30">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              activeSection === s.id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "roadmap" && <RoadmapSection onNavigate={setActiveSection} />}
      {activeSection === "estrategia" && <EstrategiaSection />}
      {activeSection === "verbal" && <VerbalSection />}
      {activeSection === "visual" && <VisualSection />}
      {activeSection === "aplicacoes" && <AplicacoesSection />}
      {activeSection === "governanca" && <GovernancaSection />}
    </div>
  );
}

/* ===== ROADMAP ===== */
function RoadmapSection({ onNavigate }: { onNavigate: (s: BrandbookSection) => void }) {
  const timeline = [
    { num: "01", period: "Semana 1-2", title: "Workshop de Estratégia", desc: "Definir propósito, missão, visão, valores, posicionamento e arquétipo da marca.", tag: "Fase 1 — Estratégia" },
    { num: "02", period: "Semana 2-3", title: "Pesquisa de Mercado", desc: "Análise competitiva, mapeamento de concorrentes e validação de personas.", tag: "Fase 1 — Estratégia" },
    { num: "03", period: "Semana 3-4", title: "Definição de Tom de Voz", desc: "Guia de tom de voz, vocabulário de marca e nomenclatura interna.", tag: "Fase 2 — Identidade Verbal" },
    { num: "04", period: "Semana 4", title: "Briefing Visual", desc: "Moodboard, referências visuais e direção criativa.", tag: "Fase 3 — Identidade Visual" },
    { num: "05", period: "Semana 5-7", title: "Design de Identidade", desc: "Logo, paleta de cores, tipografia, iconografia e sistema visual completo.", tag: "Fase 3 — Identidade Visual" },
    { num: "06", period: "Semana 7-8", title: "Direção de Arte", desc: "Estilo fotográfico, tratamento de imagem e templates base.", tag: "Fase 3 — Identidade Visual" },
    { num: "07", period: "Semana 8-10", title: "Aplicações da Marca", desc: "Templates digitais, redes sociais, materiais físicos e co-branding.", tag: "Fase 4 — Aplicações" },
    { num: "08", period: "Semana 10-12", title: "Compilação do Brandbook", desc: "Documento final em PDF e Figma com todas as diretrizes consolidadas.", tag: "Fase 5 — Governança" },
    { num: "09", period: "Semana 12", title: "Lançamento Interno", desc: "Apresentação para equipe e onboarding de colaboradores.", tag: "Fase 5 — Governança" },
    { num: "10", period: "Mês 3", title: "Revisão Pós-Lançamento", desc: "Ajustes baseados em feedback do mercado e métricas de marca.", tag: "Fase 5 — Governança" },
  ];

  const phases = [
    { id: "estrategia" as const, num: "01", title: "Estratégia de Marca", desc: "Propósito, posicionamento, personas e arquétipo" },
    { id: "verbal" as const, num: "02", title: "Identidade Verbal", desc: "Tom de voz, vocabulário e nomenclatura" },
    { id: "visual" as const, num: "03", title: "Identidade Visual", desc: "Logo, cores, tipografia e direção de arte" },
    { id: "aplicacoes" as const, num: "04", title: "Aplicações", desc: "Digital, redes sociais e materiais físicos" },
    { id: "governanca" as const, num: "05", title: "Governança", desc: "Regras, métricas e evolução da marca" },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12 pb-8 border-b border-border/30">
        <p className="text-xs uppercase tracking-[4px] text-primary mb-4">Guia de Construção de Marca</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">
          Brandbook <span className="text-primary text-glow-amber">Avalyarin</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Roadmap completo para criação, entendimento e solidificação da marca Avalyarin — 
          a rede social de avaliação gastronômica com foco no centro expandido de São Paulo.
        </p>
      </div>

      {/* O que é */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12 pb-8 border-b border-border/30">
        <div className="lg:col-span-3">
          <h2 className="font-display text-2xl text-primary mb-4">O que é a Avalyarin</h2>
          <p className="text-muted-foreground text-sm mb-3">
            A Avalyarin é uma <strong className="text-foreground">rede social gratuita</strong> focada no usuário, onde frequentadores de bares e restaurantes 
            avaliam suas experiências com um sistema analítico de pesos dinâmicos por categoria de estabelecimento.
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            Mais do que um app de avaliação, é uma plataforma de <strong className="text-foreground">memórias gastronômicas</strong>: 
            os usuários guardam fotos dos pedidos, interagem em grupos, organizam eventos (jantares, aniversários, jogos) 
            e fazem reservas diretamente com os estabelecimentos.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "📍", text: "Centro expandido de SP (expandindo para toda a cidade)" },
              { icon: "📱", text: "Rede social gratuita para o usuário" },
              { icon: "📊", text: "Sistema analítico com critérios adaptados por categoria" },
              { icon: "👥", text: "Grupos, chat, eventos e reservas" },
            ].map(h => (
              <div key={h.text} className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border/50 text-xs">
                <span className="text-base">{h.icon}</span>
                <span className="text-muted-foreground">{h.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <img
            src="/manus-storage/brand-process_c8d59082.jpg"
            alt="Processo de identidade de marca"
            className="w-full rounded-xl border border-border/50 object-contain"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-12">
        <h2 className="font-display text-2xl text-center mb-2">Roadmap de Execução</h2>
        <p className="text-center text-muted-foreground text-sm mb-8">12 semanas para construir uma marca sólida e reconhecível</p>
        
        <div className="relative pl-14">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-[#8B2252] to-primary/50 opacity-40" />
          
          {timeline.map(item => (
            <div key={item.num} className="relative mb-6">
              {/* Number circle */}
              <div className="absolute -left-14 top-1 w-9 h-9 flex items-center justify-center">
                <span className="font-mono text-xs font-semibold text-primary bg-card border-2 border-primary rounded-full w-8 h-8 flex items-center justify-center">
                  {item.num}
                </span>
              </div>
              {/* Content */}
              <div className="bg-card border border-border/50 rounded-xl p-4 hover:border-primary/30 transition-colors">
                <span className="text-[10px] uppercase tracking-[2px] text-primary">{item.period}</span>
                <h3 className="text-sm font-semibold mt-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary/80">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phases Grid */}
      <div className="pt-8 border-t border-border/30">
        <h2 className="font-display text-2xl text-center mb-6">As 5 Fases do Processo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {phases.map(p => (
            <button
              key={p.id}
              onClick={() => onNavigate(p.id)}
              className="text-left p-4 bg-card border border-border/50 rounded-xl hover:border-primary hover:-translate-y-0.5 transition-all"
            >
              <span className="font-mono text-2xl font-bold text-primary/30">{p.num}</span>
              <h3 className="text-sm font-semibold mt-2">{p.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== ESTRATÉGIA ===== */
function EstrategiaSection() {
  return (
    <div>
      <SectionHeader phase="01" title="Estratégia de Marca" subtitle="A fundação que guia todas as decisões de comunicação e design." />

      {/* 1.1 Propósito */}
      <ContentBlock number="1.1" title="Propósito (Why)">
        <p className="text-muted-foreground text-sm mb-4">O propósito é a razão de existir da marca além do lucro. Para a Avalyarin, precisa responder:</p>
        <table className="w-full text-sm border-collapse mb-4">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Pergunta</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Direcionamento</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Qual problema resolve?</td><td className="p-3 text-muted-foreground">Avaliações genéricas (5 estrelas) não ajudam a escolher um bar. Falta critério real e memória das experiências.</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Qual mundo queremos criar?</td><td className="p-3 text-muted-foreground">Um onde as pessoas vivem experiências gastronômicas com confiança, guardam memórias e compartilham com quem importa.</td></tr>
            <tr><td className="p-3 text-muted-foreground">O que nos move?</td><td className="p-3 text-muted-foreground">A crença de que cada bar tem uma identidade e merece ser avaliado pelos critérios certos — e que as melhores noites merecem ser lembradas.</td></tr>
          </tbody>
        </table>
        <Callout>Declaração de propósito em 1-2 frases que capture a essência da marca.</Callout>
      </ContentBlock>

      {/* 1.2 Posicionamento */}
      <ContentBlock number="1.2" title="Posicionamento de Marca">
        <div className="bg-card border-l-2 border-primary p-4 rounded-r-lg mb-6">
          <p className="text-xs text-muted-foreground mb-2">Framework de Posicionamento:</p>
          <blockquote className="text-sm text-foreground/90 italic">
            Para <strong>frequentadores de bares e restaurantes do centro expandido de SP</strong> que estão cansados de avaliações genéricas e querem guardar suas experiências, 
            a <strong>Avalyarin</strong> é a <strong>rede social gastronômica gratuita</strong> que oferece avaliações precisas com critérios adaptados, 
            memórias dos pedidos, grupos para organizar eventos e reservas diretas — porque cada tipo de lugar merece sua própria régua.
          </blockquote>
        </div>
        <h3 className="text-base font-semibold mb-3">Mapa Competitivo</h3>
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Concorrente</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Posicionamento</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Fraqueza</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Google Reviews</td><td className="p-3 text-muted-foreground">Volume + conveniência</td><td className="p-3 text-muted-foreground">Notas genéricas, sem critério</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">TripAdvisor</td><td className="p-3 text-muted-foreground">Turismo + viajantes</td><td className="p-3 text-muted-foreground">Pouco relevante para local</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">iFood</td><td className="p-3 text-muted-foreground">Delivery + praticidade</td><td className="p-3 text-muted-foreground">Não avalia experiência presencial</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Get In</td><td className="p-3 text-muted-foreground">Reservas + descoberta</td><td className="p-3 text-muted-foreground">Sem sistema de avaliação profundo</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Influencers</td><td className="p-3 text-muted-foreground">Entretenimento + opinião</td><td className="p-3 text-muted-foreground">Subjetivo, pago, sem método</td></tr>
            <tr><td className="p-3 font-semibold text-primary">Avalyarin</td><td className="p-3 font-semibold text-primary">Rede social + método + memórias</td><td className="p-3 font-semibold text-primary">A construir</td></tr>
          </tbody>
        </table>
      </ContentBlock>

      {/* 1.3 Personas */}
      <ContentBlock number="1.3" title="Público-Alvo e Personas">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { avatar: "🏄", name: "O Explorador Gastronômico", age: "25-32 anos | Tech | Centro expandido", desc: "Sai 3-4x por semana, adora descobrir lugares novos. Quer ser reconhecido como referência entre amigos.", frustration: "Confio mais em amigos que em Google Reviews" },
            { avatar: "👫", name: "O Casal Decidido", age: "28-38 anos | Busca experiências a dois", desc: "Quer certeza de que vai ter uma boa experiência sem perder 30 min decidindo no Google.", frustration: "Toda vez fico perdido entre opções genéricas" },
            { avatar: "🍻", name: "O Grupo de Amigos", age: "24-35 anos | Vida social ativa", desc: "Precisa organizar saídas em grupo, marcar eventos e ter um histórico compartilhado dos lugares.", frustration: "Organizar uma saída em grupo é caótico no WhatsApp" },
            { avatar: "👨‍🍳", name: "O Dono de Bar", age: "35-50 anos | Empreendedor gastronômico", desc: "Quer feedback qualificado e visibilidade para o público certo, não avaliações injustas.", frustration: "Recebo notas de gente que não entende meu conceito" },
          ].map(p => (
            <div key={p.name} className="p-4 bg-card border border-border/50 rounded-xl">
              <span className="text-2xl">{p.avatar}</span>
              <h3 className="text-sm font-semibold mt-2">{p.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">{p.age}</p>
              <p className="text-xs text-muted-foreground mt-2">{p.desc}</p>
              <p className="text-xs text-[#A83D6B] italic mt-2"><strong>Frustração:</strong> "{p.frustration}"</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 1.4 Arquétipo */}
      <ContentBlock number="1.4" title="Arquétipo de Marca">
        <p className="text-muted-foreground text-sm mb-4">Os 12 arquétipos de Jung aplicados a marcas definem a personalidade:</p>
        <table className="w-full text-sm border-collapse mb-4">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Arquétipo</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Característica</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Fit</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/30"><td className="p-3 font-semibold">O Explorador</td><td className="p-3 text-muted-foreground">Liberdade, descoberta, aventura</td><td className="p-3 text-green-500 font-semibold">Alto</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 font-semibold">O Sábio</td><td className="p-3 text-muted-foreground">Conhecimento, verdade, análise</td><td className="p-3 text-green-500 font-semibold">Alto</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">O Criador</td><td className="p-3 text-muted-foreground">Inovação, expressão, originalidade</td><td className="p-3 text-primary">Médio</td></tr>
            <tr><td className="p-3 text-muted-foreground">O Fora da Lei</td><td className="p-3 text-muted-foreground">Disrupção, quebra de regras</td><td className="p-3 text-primary">Médio</td></tr>
          </tbody>
        </table>
        <Callout highlight>
          <strong>Recomendação:</strong> Combinação <strong>Explorador + Sábio</strong> — "Descubra com inteligência". 
          A marca convida a explorar a cidade, mas com método. Não é achismo, é análise. Não é genérico, é preciso.
        </Callout>
      </ContentBlock>

      {/* 1.5 MVV */}
      <ContentBlock number="1.5" title="Missão, Visão e Valores">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h3 className="font-display text-base text-primary mb-2">Missão</h3>
            <p className="text-xs text-muted-foreground">Oferecer a rede social gastronômica mais justa e completa do Brasil, onde cada experiência é avaliada com critérios adaptados e cada memória é preservada.</p>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h3 className="font-display text-base text-primary mb-2">Visão</h3>
            <p className="text-xs text-muted-foreground">Ser a referência nacional em avaliação e experiência gastronômica, conectando pessoas aos melhores momentos da cidade.</p>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h3 className="font-display text-base text-primary mb-2">Valores</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li><strong className="text-foreground">Precisão</strong> — Cada nota tem método</li>
              <li><strong className="text-foreground">Autenticidade</strong> — Experiências reais</li>
              <li><strong className="text-foreground">Comunidade</strong> — Juntos descobrimos mais</li>
              <li><strong className="text-foreground">Transparência</strong> — Critérios abertos</li>
              <li><strong className="text-foreground">Prazer</strong> — Celebrar os bons momentos</li>
            </ul>
          </div>
        </div>
      </ContentBlock>
    </div>
  );
}

/* ===== IDENTIDADE VERBAL ===== */
function VerbalSection() {
  return (
    <div>
      <SectionHeader phase="02" title="Identidade Verbal" subtitle="Como a marca fala, escreve e se expressa em todos os pontos de contato." />

      {/* 2.1 Tom de Voz */}
      <ContentBlock number="2.1" title="Tom de Voz">
        <table className="w-full text-sm border-collapse mb-4">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Dimensão</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">A Avalyarin É</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">A Avalyarin NÃO É</th></tr></thead>
          <tbody>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Formalidade</td><td className="p-3 text-muted-foreground">Descontraída mas inteligente</td><td className="p-3 text-muted-foreground">Formal / corporativa</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Humor</td><td className="p-3 text-muted-foreground">Espirituosa, com ironia leve</td><td className="p-3 text-muted-foreground">Palhaça ou forçada</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Expertise</td><td className="p-3 text-muted-foreground">Confiante, sabe do que fala</td><td className="p-3 text-muted-foreground">Pedante ou arrogante</td></tr>
            <tr className="border-b border-border/30"><td className="p-3 text-muted-foreground">Proximidade</td><td className="p-3 text-muted-foreground">Amiga que entende de bar</td><td className="p-3 text-muted-foreground">Distante ou fria</td></tr>
            <tr><td className="p-3 text-muted-foreground">Energia</td><td className="p-3 text-muted-foreground">Vibrante, noturna, urbana</td><td className="p-3 text-muted-foreground">Calma ou contemplativa</td></tr>
          </tbody>
        </table>

        <h3 className="text-base font-semibold mb-3">Exemplos Práticos</h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
            <span className="text-xs font-medium text-green-500">✅ Certo</span>
            <p className="text-sm text-muted-foreground mt-1">"O chopp do Mania de Churrasco tirou 9.2 — e olha que a gente é exigente com temperatura."</p>
          </div>
          <div className="p-3 rounded-lg border border-red-500/15 bg-red-500/5">
            <span className="text-xs font-medium text-red-500">❌ Errado (formal demais)</span>
            <p className="text-sm text-muted-foreground mt-1">"O estabelecimento obteve nota 9.2 na categoria de bebidas geladas."</p>
          </div>
          <div className="p-3 rounded-lg border border-red-500/15 bg-red-500/5">
            <span className="text-xs font-medium text-red-500">❌ Errado (informal demais)</span>
            <p className="text-sm text-muted-foreground mt-1">"MANO ESSE CHOPP É INSANO DEMAIS KKKKK"</p>
          </div>
        </div>
      </ContentBlock>

      {/* 2.2 Vocabulário */}
      <ContentBlock number="2.2" title="Vocabulário de Marca">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Usar</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Evitar</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Motivo</th></tr></thead>
          <tbody>
            {[
              ["Critério", "Opinião", "Reforça o método"],
              ["Nota", "Estrela", "Diferencia do Google"],
              ["Análise", "Review", "Posiciona como inteligente"],
              ["Descobrir", "Procurar", "Explorador, não passivo"],
              ["Experiência", "Serviço", "Emocional, não transacional"],
              ["Lugar / Estab", "Restaurante (genérico)", "Abrange bares, cafés, etc."],
              ["Avaliar", "Dar nota", "Ação ativa e consciente"],
              ["Memória", "Registro", "Emocional, pessoal"],
            ].map(([usar, evitar, motivo], i) => (
              <tr key={i} className="border-b border-border/30"><td className="p-3 text-foreground font-medium">{usar}</td><td className="p-3 text-muted-foreground line-through">{evitar}</td><td className="p-3 text-muted-foreground">{motivo}</td></tr>
            ))}
          </tbody>
        </table>
      </ContentBlock>

      {/* 2.3 Nomenclatura */}
      <ContentBlock number="2.3" title="Nomenclatura Interna">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { term: "Avalyarin", def: "Nome da marca (avaliar + identidade própria)" },
            { term: "Nota Avalyarin", def: "A pontuação oficial (0-10)" },
            { term: "Modo Direto", def: "Avaliação rápida por item" },
            { term: "Modo Analítico", def: "Avaliação detalhada por dimensão" },
            { term: "Insígnias", def: "Sistema de progressão (não \"badges\")" },
            { term: "Categorias", def: "Tipos de estabelecimento" },
            { term: "Grupos", def: "Comunidades de amigos/influencers" },
            { term: "Eventos", def: "Jantares, aniversários, jogos organizados pelo grupo" },
          ].map(n => (
            <div key={n.term} className="p-3 bg-card border border-border/50 rounded-lg">
              <span className="text-sm font-semibold text-primary">{n.term}</span>
              <span className="block text-xs text-muted-foreground mt-1">{n.def}</span>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 2.4 Tagline */}
      <ContentBlock number="2.4" title="Tagline / Slogan">
        <div className="flex flex-wrap gap-3">
          {[
            "Avalie com critério.",
            "Cada bar merece sua régua.",
            "Além das 5 estrelas.",
            "O método por trás da nota.",
            "Suas melhores noites, guardadas.",
          ].map(t => (
            <div key={t} className="px-4 py-3 bg-card border border-primary/20 rounded-xl text-sm font-medium text-foreground">
              "{t}"
            </div>
          ))}
        </div>
      </ContentBlock>
    </div>
  );
}

/* ===== IDENTIDADE VISUAL ===== */
function VisualSection() {
  return (
    <div>
      <SectionHeader phase="03" title="Identidade Visual" subtitle="O sistema visual que torna a marca reconhecível em qualquer contexto." />

      {/* 3.1 Logo */}
      <ContentBlock number="3.1" title="Logo e Variações">
        <p className="text-muted-foreground text-sm mb-4">O brandbook deve documentar todas as variações do logo:</p>
        <div className="space-y-2">
          {[
            "Logo principal (versão preferencial)",
            "Logo reduzido (ícone/símbolo para app)",
            "Logo monocromático (preto e branco)",
            "Área de proteção (espaço mínimo ao redor)",
            "Tamanho mínimo de aplicação",
            "Usos incorretos (o que NUNCA fazer)",
          ].map(item => (
            <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 rounded-full border border-primary/40 flex items-center justify-center text-[10px] text-primary">○</span>
              {item}
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 3.2 Paleta */}
      <ContentBlock number="3.2" title="Paleta de Cores">
        <p className="text-muted-foreground text-sm mb-4">Cores primárias, secundárias e de apoio com códigos para todas as mídias:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { color: "#D4A853", name: "Âmbar Dourado", hex: "#D4A853", use: "Primária — CTAs, notas, destaques" },
            { color: "#1A1A2E", name: "Escuro Profundo", hex: "#1A1A2E", use: "Background principal" },
            { color: "#F5F0E8", name: "Off-White", hex: "#F5F0E8", use: "Texto principal" },
            { color: "#8B2252", name: "Vinho Rosé", hex: "#8B2252", use: "Acento — categorias, feminino" },
            { color: "#2D2D44", name: "Cinza Noturno", hex: "#2D2D44", use: "Cards, superfícies elevadas" },
            { color: "#4CAF50", name: "Verde Sucesso", hex: "#4CAF50", use: "Confirmações, positivo" },
          ].map(c => (
            <div key={c.hex} className="text-center">
              <div className="w-full h-16 rounded-lg border border-border/50 mb-2" style={{ background: c.color }} />
              <p className="text-xs font-medium">{c.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{c.hex}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.use}</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 3.3 Tipografia */}
      <ContentBlock number="3.3" title="Tipografia">
        <div className="space-y-6">
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <span className="text-[10px] uppercase tracking-[2px] text-primary">Display / Títulos</span>
            <p className="font-display text-3xl tracking-wider mt-2">AVALYARIN</p>
            <p className="text-xs text-muted-foreground mt-2">Fonte display com tracking largo, caixa alta — personalidade urbana e noturna</p>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <span className="text-[10px] uppercase tracking-[2px] text-primary">Corpo / Interface</span>
            <p className="text-base mt-2">A experiência completa de um bar vai além do cardápio. Envolve ambiente, atendimento, drinks e aquele detalhe que faz você voltar.</p>
            <p className="text-xs text-muted-foreground mt-2">Inter ou DM Sans — legível, moderna, neutra</p>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <span className="text-[10px] uppercase tracking-[2px] text-primary">Dados / Notas</span>
            <p className="font-mono text-3xl mt-2">9.8 / 10</p>
            <p className="text-xs text-muted-foreground mt-2">JetBrains Mono ou fonte tabular — precisão numérica</p>
          </div>
        </div>
      </ContentBlock>

      {/* 3.4 Fotografia */}
      <ContentBlock number="3.4" title="Fotografia e Direção de Arte">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
            <h4 className="text-sm font-semibold text-green-500 mb-2">Fotografar</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Ambientes noturnos com iluminação quente</li>
              <li>• Drinks e pratos em contexto real (não estúdio)</li>
              <li>• Pessoas interagindo, brindando, rindo</li>
              <li>• Detalhes de decoração e atmosfera</li>
              <li>• Ruas de SP à noite (Pinheiros, Itaim, Jardins)</li>
            </ul>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl">
            <h4 className="text-sm font-semibold text-red-500 mb-2">Evitar</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• Fotos de stock genéricas</li>
              <li>• Iluminação fluorescente / fria</li>
              <li>• Pratos em fundo branco (estilo cardápio)</li>
              <li>• Imagens que pareçam geradas por IA</li>
              <li>• Filtros excessivos ou saturação artificial</li>
            </ul>
          </div>
        </div>
      </ContentBlock>
    </div>
  );
}

/* ===== APLICAÇÕES ===== */
function AplicacoesSection() {
  return (
    <div>
      <SectionHeader phase="04" title="Aplicações" subtitle="Como a marca se materializa em cada ponto de contato com o público." />

      {/* 4.1 Digital */}
      <ContentBlock number="4.1" title="Digital — App e Website">
        <p className="text-muted-foreground text-sm mb-4">O app é o coração da Avalyarin. Todas as funcionalidades devem refletir a identidade:</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: "📱", title: "Avaliação", desc: "Interface com Modo Direto e Analítico, notas 0-10 com critérios visuais" },
            { icon: "📸", title: "Memórias", desc: "Galeria pessoal com fotos dos pedidos, datas e notas" },
            { icon: "💬", title: "Grupos e Chat", desc: "Comunidades com chat para marcar próximos destinos" },
            { icon: "🎉", title: "Eventos", desc: "Criação de eventos com reserva e confirmação com o estab" },
            { icon: "📅", title: "Reservas", desc: "Integração direta entre criador do evento e estabelecimento" },
            { icon: "🏆", title: "Insígnias", desc: "Sistema de progressão que recompensa avaliações e engajamento" },
          ].map(f => (
            <div key={f.title} className="p-3 bg-card border border-border/50 rounded-xl text-center">
              <span className="text-2xl">{f.icon}</span>
              <h4 className="text-xs font-semibold mt-2">{f.title}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 4.2 Redes Sociais */}
      <ContentBlock number="4.2" title="Redes Sociais">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h4 className="text-sm font-semibold mb-2">Instagram</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Grid planejado com alternância de conteúdo</li>
              <li>• Templates: Nota do dia, Top 5, Descoberta da semana</li>
              <li>• Stories: bastidores, enquetes, avaliações rápidas</li>
              <li>• Reels: tours por bares, reações a notas</li>
            </ul>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h4 className="text-sm font-semibold mb-2">TikTok</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Conteúdo nativo: "Avaliei X e a nota foi..."</li>
              <li>• Séries: "Pior vs Melhor de [categoria]"</li>
              <li>• Duetos com criadores locais</li>
            </ul>
          </div>
          <div className="p-4 bg-card border border-border/50 rounded-xl">
            <h4 className="text-sm font-semibold mb-2">Hashtags Oficiais</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• #Avalyarin</li>
              <li>• #NotaAvalyarin</li>
              <li>• #AvalieComCritério</li>
              <li>• #DescubraComMétodo</li>
            </ul>
          </div>
        </div>
      </ContentBlock>

      {/* 4.3 Materiais Físicos */}
      <ContentBlock number="4.3" title="Materiais Físicos">
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "Selo \"Avaliado pela Avalyarin\"", desc: "Adesivo para vitrine de estabelecimentos parceiros com QR code para o perfil" },
            { title: "Cartão de Visita", desc: "Design premium com QR code para download do app" },
            { title: "Kit Evento", desc: "Materiais para eventos presenciais: banners, porta-copos, cardápios especiais" },
            { title: "Merchandise", desc: "Camisetas, bonés e acessórios para embaixadores e influencers parceiros" },
          ].map(m => (
            <div key={m.title} className="p-4 bg-card border border-border/50 rounded-xl">
              <h4 className="text-sm font-semibold">{m.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 4.4 Co-branding */}
      <ContentBlock number="4.4" title="Parcerias e Co-branding">
        <p className="text-muted-foreground text-sm mb-3">Diretrizes para quando a marca aparece ao lado de parceiros:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Logo Avalyarin sempre com área de proteção respeitada</li>
          <li>• Nunca alterar cores ou proporções do logo em co-branding</li>
          <li>• Em parcerias com estabelecimentos, usar template "Selo Avalyarin"</li>
          <li>• Em collabs com influencers, fornecer kit de assets padronizado</li>
          <li>• Aprovação prévia obrigatória para qualquer material com a marca</li>
        </ul>
      </ContentBlock>
    </div>
  );
}

/* ===== GOVERNANÇA ===== */
function GovernancaSection() {
  return (
    <div>
      <SectionHeader phase="05" title="Governança e Evolução" subtitle="Como proteger, medir e evoluir a marca ao longo do tempo." />

      {/* 5.1 Regras */}
      <ContentBlock number="5.1" title="Regras de Uso">
        <div className="grid grid-cols-2 gap-4">
          {[
            { title: "Quem pode usar", desc: "Equipe interna, parceiros aprovados e influencers com contrato ativo. Uso externo requer aprovação." },
            { title: "Processo de Aprovação", desc: "Todo material com a marca passa por revisão antes de publicação. Prazo: 48h úteis." },
            { title: "Versionamento", desc: "Brandbook versionado (v1.0, v1.1...). Toda atualização é comunicada e documentada." },
            { title: "Violações", desc: "Uso indevido da marca deve ser reportado. Parceiros em violação perdem direito de uso." },
          ].map(r => (
            <div key={r.title} className="p-4 bg-card border border-border/50 rounded-xl">
              <h4 className="text-sm font-semibold">{r.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 5.2 Métricas */}
      <ContentBlock number="5.2" title="Métricas de Marca">
        <table className="w-full text-sm border-collapse">
          <thead><tr className="bg-muted/30"><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Métrica</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">O que mede</th><th className="text-left p-3 text-primary/80 font-semibold border-b border-border/50">Frequência</th></tr></thead>
          <tbody>
            {[
              ["Brand Awareness", "% do público-alvo que conhece a marca", "Trimestral"],
              ["NPS", "Satisfação e recomendação dos usuários", "Mensal"],
              ["Share of Voice", "Presença nas conversas sobre bares em SP", "Semanal"],
              ["Sentimento", "Positivo/negativo nas menções sociais", "Contínuo"],
              ["Recall", "\"Quando pensa em avaliar bar, pensa em...\"", "Trimestral"],
              ["Engajamento", "Interações por post / taxa de abertura", "Semanal"],
            ].map(([m, o, f], i) => (
              <tr key={i} className="border-b border-border/30"><td className="p-3 text-muted-foreground">{m}</td><td className="p-3 text-muted-foreground">{o}</td><td className="p-3 text-muted-foreground">{f}</td></tr>
            ))}
          </tbody>
        </table>
      </ContentBlock>

      {/* 5.3 Evolução */}
      <ContentBlock number="5.3" title="Evolução Planejada">
        <div className="space-y-4">
          {[
            { period: "A cada 12-18 meses", title: "Revisão do Brandbook", desc: "Atualizar com aprendizados do mercado, feedback de usuários e evolução do produto." },
            { period: "Expansão geográfica", title: "Novas Cidades", desc: "Adaptar comunicação para contexto local mantendo a essência. Cada cidade pode ter sub-identidade visual." },
            { period: "Expansão de produto", title: "Novas Features", desc: "Eventos, reservas e marketplace de experiências devem seguir as mesmas diretrizes visuais e verbais." },
            { period: "Maturidade", title: "Rebranding Evolutivo", desc: "Quando a marca atingir massa crítica, considerar refinamento visual (não revolução) para acompanhar o crescimento." },
          ].map(e => (
            <div key={e.title} className="p-4 bg-card border border-border/50 rounded-xl">
              <span className="text-[10px] uppercase tracking-[2px] text-primary">{e.period}</span>
              <h4 className="text-sm font-semibold mt-1">{e.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{e.desc}</p>
            </div>
          ))}
        </div>
      </ContentBlock>

      {/* 5.4 Próximos Passos */}
      <ContentBlock number="5.4" title="Próximos Passos Imediatos">
        <div className="space-y-3">
          {[
            { priority: "Urgente", title: "Formalizar a estratégia", desc: "Propósito, posicionamento e arquétipo — guia TUDO o que vem depois." },
            { priority: "Urgente", title: "Definir tom de voz", desc: "Essencial para redes sociais e comunicação no app." },
            { priority: "Importante", title: "Padronizar identidade visual", desc: "O app já tem estética forte — documentar e expandir para fora do digital." },
            { priority: "Importante", title: "Criar templates de redes sociais", desc: "Começar a construir presença de marca consistente no Instagram e TikTok." },
          ].map(s => (
            <div key={s.title} className="flex items-start gap-3 p-3 bg-card border border-border/50 rounded-xl">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                s.priority === "Urgente" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-primary/10 text-primary border border-primary/20"
              }`}>{s.priority}</span>
              <div>
                <h4 className="text-sm font-semibold">{s.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ContentBlock>
    </div>
  );
}

/* ===== SHARED COMPONENTS ===== */
function SectionHeader({ phase, title, subtitle }: { phase: string; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-10 pb-6 border-b border-border/30">
      <span className="text-[10px] uppercase tracking-[4px] text-primary">Fase {phase}</span>
      <h1 className="font-display text-3xl font-bold mt-2">{title}</h1>
      <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
    </div>
  );
}

function ContentBlock({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="py-8 border-b border-border/30 last:border-b-0">
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-mono text-sm text-primary/60">{number}</span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Callout({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-4 border-l-2 border-primary rounded-r-lg text-sm text-muted-foreground ${highlight ? "bg-primary/5" : "bg-card"}`}>
      {children}
    </div>
  );
}
