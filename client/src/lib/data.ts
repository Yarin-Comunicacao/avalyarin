// Design: Neon Urbano — Data layer for Avalia Bar
// All categories, establishments, menus, and rating criteria

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "entrada" | "prato" | "sobremesa" | "bebida" | "chopp" | "drink" | "destilado";
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  image: string;
  hours: string;
  phone: string;
  instagram?: string;
  menu: MenuItem[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
  establishments: Establishment[];
}

export interface RatingCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  subcriteria: { id: string; name: string; description: string }[];
}

export const PUB_CRITERIA: RatingCriterion[] = [
  {
    id: "c1",
    name: "Sabor e Execução",
    weight: 25,
    description: "Qualidade intrínseca da comida servida",
    subcriteria: [
      { id: "c1_1", name: "Qualidade dos Insumos", description: "Frescor e qualidade dos ingredientes" },
      { id: "c1_2", name: "Cocção e Técnica", description: "Texturas corretas, crocância, ponto ideal" },
      { id: "c1_3", name: "Temperos e Equilíbrio", description: "Sal na medida, equilíbrio de sabores" },
      { id: "c1_4", name: "Temperatura de Serviço", description: "Temperatura ideal ao chegar à mesa" },
    ],
  },
  {
    id: "c2",
    name: "Apresentação",
    weight: 10,
    description: "Estética e funcionalidade visual",
    subcriteria: [
      { id: "c2_1", name: "Apetite Visual", description: "Cores vivas e prato fresco" },
      { id: "c2_2", name: "Cuidado na Montagem", description: "Sem marcas de dedos, molhos organizados" },
      { id: "c2_3", name: "Adequação da Louça", description: "Recipiente valoriza a comida" },
      { id: "c2_4", name: "Estética da Bebida", description: "Copo adequado, gelo bom, garnish" },
    ],
  },
  {
    id: "c3",
    name: "Atendimento",
    weight: 10,
    description: "Qualidade do serviço e atenção",
    subcriteria: [
      { id: "c3_1", name: "Recepção", description: "Cordialidade na chegada" },
      { id: "c3_2", name: "Conhecimento", description: "Equipe conhece o cardápio" },
      { id: "c3_3", name: "Timing", description: "Tempo de entrega adequado" },
      { id: "c3_4", name: "Proatividade", description: "Repor água, retirar pratos" },
    ],
  },
  {
    id: "c4",
    name: "Ambiente e Infra",
    weight: 15,
    description: "Conforto físico, acústico e visual",
    subcriteria: [
      { id: "c4_1", name: "Acústica", description: "Nível de ruído e música" },
      { id: "c4_2", name: "Banheiros", description: "Limpeza e estrutura" },
      { id: "c4_3", name: "Conforto", description: "Mobiliário e climatização" },
      { id: "c4_4", name: "Espaço Aberto", description: "Quintal, jardim, calçada, rooftop" },
    ],
  },
  {
    id: "c5",
    name: "Custo-Benefício",
    weight: 15,
    description: "Valor entregue vs. preço cobrado",
    subcriteria: [
      { id: "c5_1", name: "Tamanho das Porções", description: "Quantidade satisfatória" },
      { id: "c5_2", name: "Qualidade vs. Preço", description: "Ingredientes justificam o valor" },
      { id: "c5_3", name: "Transparência", description: "Taxas e cobranças claras" },
    ],
  },
  {
    id: "c6",
    name: "Consistência",
    weight: 5,
    description: "Mesma qualidade sempre",
    subcriteria: [
      { id: "c6_1", name: "Padronização", description: "Mesmo prato, mesma qualidade" },
      { id: "c6_2", name: "Salão Cheio", description: "Qualidade mantida na lotação" },
    ],
  },
  {
    id: "c7",
    name: "Originalidade",
    weight: 5,
    description: "Capacidade de surpreender",
    subcriteria: [
      { id: "c7_1", name: "Criatividade", description: "Combinações inesperadas" },
      { id: "c7_2", name: "Assinatura", description: "Pratos/drinks exclusivos" },
    ],
  },
  {
    id: "c8",
    name: "Carta de Bebidas",
    weight: 5,
    description: "Variedade e qualidade das bebidas",
    subcriteria: [
      { id: "c8_1", name: "Curadoria", description: "Opções além do industrial" },
      { id: "c8_2", name: "Execução de Coquetéis", description: "Equilíbrio e temperatura" },
      { id: "c8_3", name: "Opções Não Alcoólicas", description: "Mocktails e sodas artesanais" },
    ],
  },
  {
    id: "c9",
    name: "Variedade",
    weight: 5,
    description: "Atender diferentes desejos e restrições",
    subcriteria: [
      { id: "c9_1", name: "Opções de Proteínas", description: "Diversidade de carnes e peixes" },
      { id: "c9_2", name: "Inclusão Alimentar", description: "Vegano, celíaco, etc." },
      { id: "c9_3", name: "Equilíbrio do Menu", description: "Frituras, frescos e assados" },
    ],
  },
  {
    id: "c10",
    name: "Harmonização",
    weight: 5,
    description: "Sinergia entre comida e bebida",
    subcriteria: [
      { id: "c10_1", name: "Diálogo Comida-Bebida", description: "Carta pensada para a comida" },
      { id: "c10_2", name: "Sugestões da Casa", description: "Combinações recomendadas" },
    ],
  },
];

export const BONUS_CRITERIA = [
  { id: "b1", name: "Segurança", description: "Seguranças profissionais", points: 3 },
  { id: "b2", name: "Valet / Estacionamento", description: "Valet ou estacionamento próprio", points: 3 },
  { id: "b3", name: "Higiene no Mictório", description: "Papel toalha junto aos mictórios", points: 3 },
  { id: "b4", name: "Transporte Público", description: "Até 1,5 km de metrô/terminal", points: 1 },
  { id: "b5", name: "Fator Wow", description: "Algo extraordinariamente memorável", points: 3 },
  { id: "b6", name: "Acessibilidade", description: "Cardápio em braille, rampas", points: 1 },
  { id: "b7", name: "Sustentabilidade", description: "Gestão de resíduos, ingredientes éticos", points: 1 },
];

const stPaulsMenu: MenuItem[] = [
  // Entradas / Porções
  { id: "sp1", name: "The G.O.A.T. Fries", description: "Batatas rústicas temperadas com alecrim", price: 26, category: "entrada" },
  { id: "sp2", name: "The G.O.A.T. Fries Fondue", description: "Rústica com Molho de Provolone", price: 36, category: "entrada" },
  { id: "sp3", name: "Frangooooooool!!!!", description: "Filé de Frango Grelhado com Maionese da Casa", price: 35, category: "entrada" },
  { id: "sp4", name: "Monstarwings", description: "Wings de Frango Frito Empanadas com Molho Bluecheese (10 un)", price: 45, category: "entrada" },
  { id: "sp5", name: "Brasil 82 Pastéis", description: "Carne, Queijo, Palmito e Pizza (10 un)", price: 48, category: "entrada" },
  { id: "sp6", name: "Peter Crouch", description: "Coxinhas de Frango (10 un)", price: 48, category: "entrada" },
  { id: "sp7", name: "Boom Shakalaka Cheeseballs", description: "Bolinhas de Queijo (10 un)", price: 43, category: "entrada" },
  { id: "sp8", name: "Gunther Schweitzerbolinhos", description: "Bolinhos de Mandioca com Carne Seca (10 un)", price: 46, category: "entrada" },
  { id: "sp9", name: "CR7", description: "Bolinho de Bacalhau (10 un)", price: 45, category: "entrada" },
  { id: "sp10", name: "Red Zone Cheese Fries", description: "Batata Palito Gratinada com queijo e bacon", price: 58, category: "entrada" },
  { id: "sp11", name: "BBQ Touchdown", description: "Costela Suína no Molho Barbecue com batata frita", price: 39, category: "entrada" },
  { id: "sp12", name: "All In Dadinhos", description: "Dadinhos de Tapioca com Geleia de Pimenta", price: 44, category: "entrada" },
  { id: "sp13", name: "Bolinho do Ancelotti", description: "Provolone aperitivo empanado (10 un)", price: 42, category: "entrada" },
  { id: "sp14", name: "É Teeetra! Calabresa", description: "Linguiça Calabresa, cebola e pãozinho", price: 36, category: "entrada" },
  { id: "sp15", name: "Balboa Stripes", description: "Alcatra em Tiras e Cebola em Molho de Provolone", price: 49, category: "entrada" },
  // Pratos (Burgers)
  { id: "sp16", name: "El Clasico", description: "Hambúrguer de Fraldinha e Queijo Prato no Pão Francês", price: 36, category: "prato" },
  { id: "sp17", name: "The Home Run Burguer", description: "Fraldinha, Queijo Prato, Alface, Tomate e Maionese", price: 44, category: "prato" },
  { id: "sp18", name: "Allejo Burguer", description: "Fraldinha, Queijo Prato, Cebola Caramelizada, Bacon e Maionese Temperada", price: 48, category: "prato" },
  { id: "sp19", name: "Foles Philly Steak", description: "Alcatra em Tiras, Pimentão, Cebola, Provolone na Baguete", price: 49, category: "prato" },
  { id: "sp20", name: "Oliver Kahn Chicken Sandwich", description: "Filé de Frango, Queijo Prato, Cebola Caramelizada, Rúcula e Mostarda", price: 44, category: "prato" },
  { id: "sp21", name: "Flying 'V' Veggie", description: "Abobrinha, Tomate e Cebola Pérola com Shimeji e Rúcula", price: 44, category: "prato" },
  { id: "sp22", name: "Puck", description: "Smash de Fraldinha e Queijo Prato no Pão de Brioche", price: 30, category: "prato" },
  { id: "sp23", name: "O Da Casa", description: "Smash duplo, cheddar, bacon crocante, alface, tomate e cebola roxa", price: 58, category: "prato" },
  // Bebidas
  { id: "sp24", name: "Heineken", description: "Lager Holandesa 330ml", price: 19, category: "bebida" },
  { id: "sp25", name: "Stella Artois", description: "Lager Belga 330ml", price: 18, category: "bebida" },
  { id: "sp26", name: "Corona", description: "Lager Mexicana 330ml", price: 22, category: "bebida" },
  { id: "sp27", name: "Goose Island IPA", description: "IPA Americana 330ml", price: 27, category: "bebida" },
  { id: "sp28", name: "Guinness", description: "Stout Irlandesa Lata 440ml", price: 66, category: "bebida" },
  { id: "sp29", name: "Paulaner Hefe Weiss", description: "Weissbier Alemã 500ml", price: 43, category: "bebida" },
  { id: "sp30", name: "Blue Moon", description: "Belgian White 330ml", price: 26, category: "bebida" },
  { id: "sp31", name: "Lagunitas", description: "IPA Americana 330ml", price: 26, category: "bebida" },
  // Chopp
  { id: "sp32", name: "Pilsen Schornstein", description: "Chopp Pint 473ml", price: 21, category: "chopp" },
  { id: "sp33", name: "IPA Schornstein", description: "Chopp Pint 473ml", price: 28, category: "chopp" },
  { id: "sp34", name: "Heineken Chopp", description: "Chopp Pint 473ml", price: 24, category: "chopp" },
  // Drinks
  { id: "sp35", name: "Moscow Mule Ketel One", description: "Vodka Ketel One, Limão, Espuma de Gengibre", price: 45, category: "drink" },
  { id: "sp36", name: "Negroni", description: "Gin, Vermute Rosso, Campari e casca de laranja", price: 45, category: "drink" },
  { id: "sp37", name: "Old Fashioned", description: "Bourbon, Angostura, Água e Laranja", price: 45, category: "drink" },
  { id: "sp38", name: "Aperol Spritz", description: "Aperol com espumante", price: 45, category: "drink" },
  { id: "sp39", name: "Caipirinha Cachaça", description: "Limão, Abacaxi, Morango, Kiwi ou Maracujá", price: 29, category: "drink" },
  { id: "sp40", name: "Gin Tônica Tanqueray", description: "Gin Tanqueray com tônica", price: 46, category: "drink" },
  { id: "sp41", name: "Irish Car Bomb", description: "Pint de Guinness com shot de Baileys e Jameson", price: 96, category: "drink" },
  { id: "sp42", name: "Jager Bomb", description: "Jägermeister com energético", price: 48, category: "drink" },
  // Soft drinks
  { id: "sp43", name: "Água", description: "Com e Sem Gás", price: 8, category: "bebida" },
  { id: "sp44", name: "Refrigerante", description: "Coca-Cola, Guaraná, etc.", price: 10, category: "bebida" },
  { id: "sp45", name: "Red Bull", description: "Energético 250ml", price: 25, category: "bebida" },
];

const partisansMenu: MenuItem[] = [
  // Entradas / Porções
  { id: "pp1", name: "Brown Eyed Girl", description: "Queijo coalho coberto por melaço", price: 37.9, category: "entrada" },
  { id: "pp2", name: "Burn'em All", description: "Queijos provolone e parmesão empanados e fritos", price: 59.9, category: "entrada" },
  { id: "pp3", name: "Batata Frita", description: "Palitos de batata dourados e crocantes (veggie/vegana)", price: 36.9, category: "entrada" },
  { id: "pp4", name: "Batata Frita com Bacon e Cheddar", description: "Clássica porção com bacon e cheddar", price: 47.9, category: "entrada" },
  { id: "pp5", name: "Dadinho de Tapioca", description: "Cubinhos de tapioca com queijo coalho e molho caramelo apimentado", price: 40.9, category: "entrada" },
  { id: "pp6", name: "Bolinho de Bacalhau", description: "Autêntico bolinho de bacalhau (8 un)", price: 48.9, category: "entrada" },
  { id: "pp7", name: "Coxinha de Frango", description: "Clássica coxinha paulista com requeijão (8 un)", price: 35.9, category: "entrada" },
  { id: "pp8", name: "Sure Shot", description: "Empanados crocantes de carne caseira (8 un)", price: 46.9, category: "entrada" },
  { id: "pp9", name: "Jimmy Jazz", description: "Frango marinado em curry, empanado e frito", price: 46.9, category: "entrada" },
  { id: "pp10", name: "Coxinha de Cogumelo", description: "Versão vegetariana/vegana (8 un)", price: 42.9, category: "entrada" },
  { id: "pp11", name: "Pastéis", description: "Queijo, carne ou porção mista", price: 45.9, category: "entrada" },
  { id: "pp12", name: "Nacho Libre", description: "Nachos com salsa brava, sour cream e chili", price: 39.9, category: "entrada" },
  { id: "pp13", name: "Buffalo Wings", description: "Asinhas de frango picantes com molho Blue Cheese", price: 49.9, category: "entrada" },
  { id: "pp14", name: "Fish & Chips", description: "Iscas de peixe empanadas com batatas fritas", price: 54.9, category: "entrada" },
  { id: "pp15", name: "God Save The Queen", description: "Batata, anéis de cebola e polenta frita", price: 57.9, category: "entrada" },
  { id: "pp16", name: "Onion Rings", description: "Anéis de cebola empanados e fritos", price: 40.9, category: "entrada" },
  { id: "pp17", name: "Bolinho de Costela", description: "Bolinhos recheados com costela (8 un)", price: 42.9, category: "entrada" },
  { id: "pp18", name: "Bolinho de Falafel", description: "Receita de grão-de-bico (8 un)", price: 39.9, category: "entrada" },
  // Burgers
  { id: "pp19", name: "Funky Stuff", description: "Burger com cogumelos", price: 45, category: "prato" },
  { id: "pp20", name: "Sweet Tender Hooligan", description: "Burger vegetariano", price: 42, category: "prato" },
  // Bebidas (estimativas)
  { id: "pp21", name: "Chopp Pilsen", description: "Chopp artesanal", price: 24, category: "chopp" },
  { id: "pp22", name: "Chopp Red Ale", description: "Chopp artesanal Red Ale", price: 26, category: "chopp" },
  { id: "pp23", name: "Chopp Paulaner", description: "Chopp Paulaner Weiss", price: 35, category: "chopp" },
  { id: "pp24", name: "Heineken", description: "Long Neck 330ml", price: 19, category: "bebida" },
  { id: "pp25", name: "Corona", description: "Long Neck 330ml", price: 22, category: "bebida" },
];

export const categories: Category[] = [
  {
    id: "bar-lanchonete",
    name: "Bar & Lanchonete",
    description: "Do café da manhã à noite",
    icon: "Coffee",
    active: false,
    establishments: [],
  },
  {
    id: "restaurante-tradicional",
    name: "Restaurante Tradicional",
    description: "Cardápio fixo de bairro",
    icon: "UtensilsCrossed",
    active: false,
    establishments: [],
  },
  {
    id: "autoral",
    name: "Autoral / Contemporâneo",
    description: "Cozinha de autor",
    icon: "ChefHat",
    active: false,
    establishments: [],
  },
  {
    id: "boteco-tradicional",
    name: "Boteco Tradicional",
    description: "Pé-sujo, cerveja gelada",
    icon: "Beer",
    active: false,
    establishments: [],
  },
  {
    id: "boteco-moderno",
    name: "Boteco Moderno",
    description: "Gastrobar, petiscos autorais",
    icon: "Sparkles",
    active: false,
    establishments: [],
  },
  {
    id: "pub",
    name: "Pub",
    description: "Cervejas artesanais e porções",
    icon: "Beer",
    active: true,
    establishments: [
      {
        id: "st-pauls-pub",
        name: "St. Paul's Pub",
        address: "R. Ferreira de Araújo, 358 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.5,
        reviewCount: 3200,
        image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/st-pauls-pub-nxEpy7J52ioHrXBUHDQbmv.webp",
        hours: "Ter-Sex 17h-01h | Sáb 12h-02h | Dom 12h-00h",
        phone: "(11) 3814-7008",
        instagram: "@stpaulspub",
        menu: stPaulsMenu,
      },
      {
        id: "partisans-pub",
        name: "Partisans Pub",
        address: "R. Wisard, 309 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.6,
        reviewCount: 2800,
        image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663452670122/WG3U3sVg2ZrW6m8T99FRdE/partisans-pub-Cr52fFSZ9tVgnHquNtWLGo.webp",
        hours: "Ter-Sex 17h-01h | Sáb 12h-02h | Dom 12h-00h",
        phone: "(11) 3032-6696",
        instagram: "@partisanspub",
        menu: partisansMenu,
      },
    ],
  },
  {
    id: "confeitaria",
    name: "Confeitaria",
    description: "Doces, bolos, sobremesas",
    icon: "Cake",
    active: false,
    establishments: [],
  },
  {
    id: "coquetelaria",
    name: "Coquetelaria",
    description: "Speakeasy, drinks autorais",
    icon: "Wine",
    active: false,
    establishments: [],
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Café especial, brunch",
    icon: "CupSoda",
    active: false,
    establishments: [],
  },
  {
    id: "padaria",
    name: "Padaria",
    description: "Pães, salgados e almoço",
    icon: "Croissant",
    active: false,
    establishments: [],
  },
  {
    id: "bar-balada",
    name: "Bar Balada",
    description: "Música, drinks e pista",
    icon: "Music",
    active: false,
    establishments: [],
  },
];
