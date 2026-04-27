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
      // Comidas (only shown when food items consumed)
      { id: "c2_1", name: "Apetite Visual", description: "Cores vivas e prato fresco" },
      { id: "c2_2", name: "Cuidado na Montagem", description: "Sem marcas de dedos, molhos organizados" },
      { id: "c2_3", name: "Adequação da Louça", description: "Recipiente valoriza a comida" },
      // Bebidas (only shown when beverage items consumed)
      { id: "c2_4", name: "Estética da Bebida", description: "Cor, garnish e visual do drink" },
      { id: "c2_5", name: "Cuidado na Montagem (Bebida)", description: "Capricho na preparação e entrega" },
      { id: "c2_6", name: "Adequação do Copo", description: "Tipo e estado do copo utilizado" },
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

const kofMenu: MenuItem[] = [
  // Cafés
  { id: "kof1", name: "Espresso", description: "Café espresso extraído com grãos especiais", price: 8, category: "bebida" },
  { id: "kof2", name: "Cappuccino", description: "Espresso com leite vaporizado e espuma", price: 14, category: "bebida" },
  { id: "kof3", name: "Flat White", description: "Espresso duplo com microespuma de leite", price: 14, category: "bebida" },
  { id: "kof4", name: "Cold Brew", description: "Café extraído a frio por 12h", price: 15, category: "bebida" },
  { id: "kof5", name: "Cold Brew Citrus", description: "Cold brew com toque cítrico refrescante", price: 15, category: "bebida" },
  { id: "kof6", name: "Café Gelado de Rapadura", description: "Café gelado adoçado com rapadura artesanal", price: 18, category: "bebida" },
  { id: "kof7", name: "Coffee Macunaíma", description: "Drink de café com cachaça artesanal (alcoólico)", price: 25, category: "drink" },
  { id: "kof8", name: "Chai Latte", description: "Chá especiado com leite vaporizado", price: 16, category: "bebida" },
  { id: "kof9", name: "Latte", description: "Espresso com leite vaporizado", price: 14, category: "bebida" },
  { id: "kof10", name: "Mocha", description: "Espresso com chocolate e leite vaporizado", price: 16, category: "bebida" },
  // Salgados
  { id: "kof11", name: "Pão de Queijo", description: "Tradicional mineiro quentinho", price: 8, category: "entrada" },
  { id: "kof12", name: "Pão de Mandioquinha", description: "Com batata-baroa, manteiga, queijo e ovos", price: 10, category: "entrada" },
  { id: "kof13", name: "Croissant", description: "Folhado amanteigado crocante", price: 12, category: "entrada" },
  { id: "kof14", name: "Sanduíche de Pesto", description: "Pesto fresco, queijo, tomate e alface no pão artesanal", price: 28, category: "prato" },
  { id: "kof15", name: "Panini de Lombo Canadense", description: "Lombo canadense, queijo, alface e tomate na ciabatta", price: 32, category: "prato" },
  { id: "kof16", name: "Croque Monsieur", description: "Presunto, queijo e molho béchamel gratinado", price: 30, category: "prato" },
  { id: "kof17", name: "Tuna Melt", description: "Pasta de atum e queijo meia cura no pão de forma", price: 32, category: "prato" },
  // Doces
  { id: "kof18", name: "Cinnamon Roll", description: "Rosca de canela com glacê", price: 16, category: "sobremesa" },
  { id: "kof19", name: "Banana Bread", description: "Bolo de banana com castanhas", price: 14, category: "sobremesa" },
  { id: "kof20", name: "Waffle", description: "Waffle artesanal com baunilha", price: 18, category: "sobremesa" },
  { id: "kof21", name: "Bolo de Banana com Castanha", description: "Fatia de bolo caseiro com castanha de caju", price: 12, category: "sobremesa" },
];

const foradaLeiMenu: MenuItem[] = [
  // Cafés
  { id: "fdl1", name: "Espresso", description: "Café espresso com grãos selecionados", price: 8, category: "bebida" },
  { id: "fdl2", name: "Cappuccino", description: "Espresso com espuma espessa de leite", price: 12, category: "bebida" },
  { id: "fdl3", name: "Flat White", description: "Espresso duplo com microespuma", price: 14, category: "bebida" },
  { id: "fdl4", name: "Coado Especial", description: "Café coado com grãos de origem única", price: 12, category: "bebida" },
  { id: "fdl5", name: "V60", description: "Café filtrado no método V60", price: 14, category: "bebida" },
  { id: "fdl6", name: "Café Gelado", description: "Café gelado refrescante", price: 14, category: "bebida" },
  { id: "fdl7", name: "Latte", description: "Espresso com leite vaporizado", price: 14, category: "bebida" },
  // Cervejas Fora da Lei
  { id: "fdl8", name: "Cerveja Fora da Lei Pilsen", description: "Cerveja artesanal da casa estilo Pilsen", price: 18, category: "bebida" },
  { id: "fdl9", name: "Cerveja Fora da Lei IPA", description: "Cerveja artesanal da casa estilo IPA", price: 22, category: "bebida" },
  { id: "fdl10", name: "Cerveja Fora da Lei Witbier", description: "Cerveja artesanal da casa estilo Witbier", price: 20, category: "bebida" },
  // Salgados
  { id: "fdl11", name: "Sanduíche da Casa", description: "Sanduíche artesanal com ingredientes frescos", price: 22, category: "prato" },
  { id: "fdl12", name: "Pão de Queijo", description: "Pão de queijo quentinho", price: 8, category: "entrada" },
  { id: "fdl13", name: "Quiche do Dia", description: "Quiche artesanal com recheio do dia", price: 14, category: "entrada" },
  // Doces
  { id: "fdl14", name: "Bolo de Maçã", description: "Com calda de caramelo e canela, massa úmida", price: 11, category: "sobremesa" },
  { id: "fdl15", name: "Brownie", description: "Brownie de chocolate intenso", price: 10, category: "sobremesa" },
  { id: "fdl16", name: "Torta de Limão", description: "Torta com creme de limão e merengue", price: 12, category: "sobremesa" },
  { id: "fdl17", name: "Brigadeiro Vegano", description: "Brigadeiro sem lactose artesanal", price: 6, category: "sobremesa" },
  { id: "fdl18", name: "Biscoito Artesanal", description: "Cookie caseiro crocante", price: 8, category: "sobremesa" },
];

const crioCafeMenu: MenuItem[] = [
  // Cafés
  { id: "cc1", name: "Espresso", description: "Café espresso com torrefação própria", price: 8, category: "bebida" },
  { id: "cc2", name: "Cappuccino", description: "Espresso com leite vaporizado e espuma", price: 14, category: "bebida" },
  { id: "cc3", name: "Coado Clássico", description: "Café coado com grãos clássicos da casa", price: 10, category: "bebida" },
  { id: "cc4", name: "Coado Sensorial", description: "Café coado com perfil sensorial diferenciado", price: 14, category: "bebida" },
  { id: "cc5", name: "Coado Exótico", description: "Café coado com grãos raros e exóticos", price: 18, category: "bebida" },
  { id: "cc6", name: "Coado Edição Especial", description: "Café coado com microlote exclusivo", price: 22, category: "bebida" },
  { id: "cc7", name: "Flat White", description: "Espresso duplo com microespuma", price: 14, category: "bebida" },
  { id: "cc8", name: "Cold Brew", description: "Café extraído a frio", price: 14, category: "bebida" },
  { id: "cc9", name: "Latte", description: "Espresso com leite vaporizado", price: 14, category: "bebida" },
  // Salgados
  { id: "cc10", name: "Enroladinho Misto", description: "Brioche recheado com queijo e presunto", price: 16, category: "entrada" },
  { id: "cc11", name: "Enroladinho de Queijo", description: "Brioche recheado com queijo", price: 16, category: "entrada" },
  { id: "cc12", name: "Pão de Queijo", description: "Pão de queijo artesanal quentinho", price: 8, category: "entrada" },
  // Doces
  { id: "cc13", name: "Cookie de Chocolate", description: "Cookie artesanal com gotas de chocolate", price: 10, category: "sobremesa" },
  { id: "cc14", name: "Brownie", description: "Brownie de chocolate com nozes", price: 12, category: "sobremesa" },
  { id: "cc15", name: "Queijada", description: "Queijada artesanal tradicional", price: 10, category: "sobremesa" },
];

const dePrimeiraMenu: MenuItem[] = [
  // Entradas
  { id: "dp1", name: "Porção de Moela", description: "Moela bem temperada", price: 28, category: "entrada" },
  { id: "dp2", name: "Empadinha de Siri", description: "Empadinha recheada com siri", price: 20, category: "entrada" },
  { id: "dp3", name: "Pastel de Carne Seca", description: "Com catupiry e vinagrete de feira", price: 25, category: "entrada" },
  { id: "dp4", name: "Lula à Dorê", description: "Com maionese de pimenta e limão cravo", price: 42, category: "entrada" },
  { id: "dp5", name: "Isca de Tilápia", description: "Frita com molho tártaro", price: 38, category: "entrada" },
  { id: "dp6", name: "Vinagrete de Polvo", description: "Com batata bolinha", price: 32, category: "entrada" },
  { id: "dp7", name: "Canudo de Batatonese", description: "Canudo de pastel com salada de batata e maionese", price: 12, category: "entrada" },
  { id: "dp8", name: "Risole de Rabada", description: "Com pimenta de cheiro e kimchi", price: 22, category: "entrada" },
  { id: "dp9", name: "Coxinha de Frango", description: "Com creme de milho", price: 22, category: "entrada" },
  { id: "dp10", name: "Croquete de Carne", description: "De panela e aioli", price: 20, category: "entrada" },
  // Pratos
  { id: "dp11", name: "Sanduíche de Milanesa", description: "Pão francês, bife de ancho à milanesa, aioli, mostarda e picles de abacaxi", price: 34, category: "prato" },
  { id: "dp12", name: "Sanduíche de Carne de Panela", description: "Pão de leite, carne de panela e conserva de cebola", price: 36, category: "prato" },
  // Drinks
  { id: "dp13", name: "Caju Amigo", description: "Compota de caju e cachaça", price: 28, category: "drink" },
  { id: "dp14", name: "Umbu Sour", description: "Cachaça envelhecida, compota de umbu e aquafaba", price: 30, category: "drink" },
  { id: "dp15", name: "Cambuci Sour", description: "Cachaça branca, compota de cambuci e aquafaba", price: 30, category: "drink" },
  { id: "dp16", name: "Batidinhas da Casa", description: "Maracujá, coco e paçoca", price: 13, category: "drink" },
  { id: "dp17", name: "Caipirinha", description: "Limão ou 3 limões", price: 22, category: "drink" },
  { id: "dp18", name: "Tubaína Libre", description: "Tubaína e rum envelhecido", price: 25, category: "drink" },
  { id: "dp19", name: "Aperol", description: "Aperol Spritz", price: 32, category: "drink" },
  { id: "dp20", name: "Negroni", description: "Gin, campari e vermute tinto", price: 30, category: "drink" },
  { id: "dp21", name: "Gin Tônica", description: "Gin com tônica", price: 30, category: "drink" },
  { id: "dp22", name: "Fitzgerald", description: "Gin, limão, xarope e bitter", price: 30, category: "drink" },
];

const barMoelaMenu: MenuItem[] = [
  { id: "bm1", name: "Bolovo de Rabada", description: "Bolovo com recheio de rabada", price: 26, category: "entrada" },
  { id: "bm2", name: "Bolinho de Mandioca com Carne Seca", description: "Bolinho de mandioca recheado com carne seca", price: 14, category: "entrada" },
  { id: "bm3", name: "Bolinho de Arroz com Moela", description: "Bolinho de arroz com moela", price: 10, category: "entrada" },
  { id: "bm4", name: "Almôndega de Frango", description: "Almôndega de frango", price: 15, category: "entrada" },
  { id: "bm5", name: "Porção Pão Francês", description: "Porção de pão francês", price: 3, category: "entrada" },
  { id: "bm6", name: "Croquete de Abóbora", description: "Croquete de abóbora", price: 14, category: "entrada" },
  { id: "bm7", name: "Bolinho de Calabresa com Catupiry", description: "Bolinho de calabresa com queijo catupiry", price: 13, category: "entrada" },
  { id: "bm8", name: "Pastel de Rabada", description: "Pastel recheado com rabada", price: 14, category: "entrada" },
  { id: "bm9", name: "Lanche do Zé", description: "Sanduíche da casa", price: 32, category: "prato" },
  { id: "bm10", name: "Cerveja Artesanal", description: "Cerveja artesanal da casa", price: 18, category: "bebida" },
  { id: "bm11", name: "Chopp Pilsen", description: "Chopp pilsen gelado", price: 14, category: "chopp" },
];

const saoConradoMenu: MenuItem[] = [
  { id: "sc1", name: "Chopp Brahma", description: "Chopp Brahma gelado", price: 14.5, category: "chopp" },
  { id: "sc2", name: "Chopp Stella Artois", description: "Chopp Stella Artois", price: 15.5, category: "chopp" },
  { id: "sc3", name: "Chopp Patagônia", description: "Chopp Patagônia premium", price: 19, category: "chopp" },
  { id: "sc4", name: "Franguinho Frito", description: "Sobrecoxa desossada marinada no iogurte, com molho picante e sour cream", price: 62.9, category: "entrada" },
  { id: "sc5", name: "Dadinho de Tapioca c/ Steak Tartare", description: "Bem temperadinho, cortado na ponta da faca", price: 79.9, category: "entrada" },
  { id: "sc6", name: "Ribs Fries", description: "Batatinha e costelinha juntas, com creme azedo de limão", price: 73.9, category: "entrada" },
  { id: "sc7", name: "Linguiçada!", description: "Três tipos de linguiça: clássica, com queijo e apimentada", price: 82.9, category: "entrada" },
  { id: "sc8", name: "Pastéis", description: "Carne picadinha e mix de queijos, com maionese de rapadura", price: 54.9, category: "entrada" },
  { id: "sc9", name: "Coxinha", description: "Clássica com frango e catupiry, com ketchup de goiabada", price: 57.9, category: "entrada" },
  { id: "sc10", name: "Bolinho de Costela", description: "Bem molhadinha, com maionese de pimenta de cheiro", price: 64.9, category: "entrada" },
  { id: "sc11", name: "Bolinho de Feijoada", description: "Com couve e bacon, maionese de pimenta sriracha", price: 55.9, category: "entrada" },
  { id: "sc12", name: "Oswaldo Aranha", description: "Filé mignon grelhado com alho crocante, arroz, farofa, couve e batata chips", price: 89.9, category: "prato" },
  { id: "sc13", name: "Chapa do Chef", description: "Fraldinha, linguiça e batata bolinha recheada com queijo e bacon", price: 139, category: "prato" },
  { id: "sc14", name: "Pão Carne e Queijo", description: "Pão tostado na manteiga, blend de carne e american cheese", price: 52.9, category: "prato" },
  { id: "sc15", name: "Choripán da Casa", description: "Pão francês com linguiça, queijo gratinado e tomate ralado", price: 49.9, category: "prato" },
  { id: "sc16", name: "Tropical Gin", description: "Gin com frutas tropicais", price: 45.9, category: "drink" },
];

const quitandinhaMenu: MenuItem[] = [
  { id: "qt1", name: "Cerveja Brahma 600ml", description: "Cerveja Brahma garrafa", price: 13, category: "bebida" },
  { id: "qt2", name: "Cerveja Heineken 600ml", description: "Cerveja Heineken garrafa", price: 18, category: "bebida" },
  { id: "qt3", name: "Cerveja Original 600ml", description: "Cerveja Original garrafa", price: 15, category: "bebida" },
  { id: "qt4", name: "Heineken Latão 473ml", description: "Heineken em lata grande", price: 10, category: "bebida" },
  { id: "qt5", name: "Caipirinha Tradicional", description: "O clássico nacional", price: 16, category: "drink" },
  { id: "qt6", name: "Caipiroska de Morango", description: "Doce na medida", price: 18, category: "drink" },
  { id: "qt7", name: "Gin Tônica", description: "Elegante, aromático e refrescante", price: 20, category: "drink" },
  { id: "qt8", name: "Negroni", description: "Amargo e elegante", price: 22, category: "drink" },
  { id: "qt9", name: "Mojito do Sítio", description: "Refrescância com toque de roça", price: 18, category: "drink" },
  { id: "qt10", name: "Batida de Coco", description: "Cremosa, tropical e irresistível", price: 16, category: "drink" },
  { id: "qt11", name: "Picado Misto Pequeno", description: "Queijo, salaminho, azeitona, pepino e presunto", price: 45, category: "entrada" },
  { id: "qt12", name: "Picado Especial", description: "Filé, calabresa, fritas, queijo e azeitona", price: 70, category: "entrada" },
  { id: "qt13", name: "Pastel Pequeno", description: "Diversos sabores", price: 20, category: "entrada" },
  { id: "qt14", name: "Pastel Grande", description: "Diversos sabores", price: 30, category: "entrada" },
  { id: "qt15", name: "Lasanha", description: "Serve 3 pessoas, com arroz, salada e batata palha", price: 70, category: "prato" },
  { id: "qt16", name: "Bife à Parmegiana", description: "Serve 2 pessoas", price: 56, category: "prato" },
  { id: "qt17", name: "Bife Acebolado", description: "Serve 2 pessoas", price: 52, category: "prato" },
  { id: "qt18", name: "Pastel Doce", description: "Pastel doce diversos sabores", price: 20, category: "sobremesa" },
];

const santanaBarMenu: MenuItem[] = [
  { id: "sn1", name: "Cabroni", description: "Tequila Don Julio Blanco, Vermute Rosso, Aperol e Café", price: 52, category: "drink" },
  { id: "sn2", name: "Limessy", description: "Milk Punch, Gin Tanqueray, Ameixa Fresca e Limão Tahiti", price: 49, category: "drink" },
  { id: "sn3", name: "Melhor da Noite", description: "Bulleit Bourbon, Beterraba, Framboesa, Limão Tahiti e Côco", price: 52, category: "drink" },
  { id: "sn4", name: "Moringa", description: "Vodka Ketel One, Licor de Goiaba e Cordial das Cascas", price: 45, category: "drink" },
  { id: "sn5", name: "Peperista", description: "Gin Tanqueray, Baunilha, Pêssego, Limão Siciliano e Pimentão", price: 49, category: "drink" },
  { id: "sn6", name: "Pistacchio", description: "Vodka Ketel One com Baunilha, Pistache, Limão e Clara de Ovo", price: 55, category: "drink" },
  { id: "sn7", name: "Executivo", description: "Whisky Black Label, Amaro, Vermute Seco, Frangelico e Azeite", price: 51, category: "drink" },
  { id: "sn8", name: "Ativista", description: "Tanqueray, Tônico de Laranja, Chá Verde, Capim Cidreira e Hortelã", price: 47, category: "drink" },
  { id: "sn9", name: "Biscoito de Parmesão e Kimchi", description: "Biscoito artesanal com parmesão e kimchi", price: 32, category: "entrada" },
  { id: "sn10", name: "Gildas", description: "Espetinhos de anchova, azeitona e pimenta", price: 25, category: "entrada" },
  { id: "sn11", name: "Chips de Nori Vegano", description: "Chips crocantes de nori", price: 31, category: "entrada" },
  { id: "sn12", name: "Tartare de Carne", description: "Carne crua temperada cortada na ponta da faca", price: 57, category: "prato" },
  { id: "sn13", name: "Polvo", description: "Consulte disponibilidade", price: 55, category: "prato" },
  { id: "sn14", name: "Torta de Tomate", description: "Torta artesanal de tomate", price: 51, category: "prato" },
];

const sylvesterBarMenu: MenuItem[] = [
  { id: "sy1", name: "Basil Smash", description: "Gin Larios Dry, suco cítrico, manjericão e xarope de açúcar", price: 30.9, category: "drink" },
  { id: "sy2", name: "Paper Plane", description: "Bourbon Jim Beam, Amaro Averna, Aperol e suco cítrico", price: 35.9, category: "drink" },
  { id: "sy3", name: "Fanciulli", description: "Bourbon Jim Beam, Carpano Classico, Fernet Branca e twist de laranja", price: 35.9, category: "drink" },
  { id: "sy4", name: "Vieux Carré", description: "Bourbon, Brandy, Carpano Classico, licor de ervas e bitters", price: 36.9, category: "drink" },
  { id: "sy5", name: "Cosmopolitan", description: "Vodka, cranberry, licor de laranja, limão e twist de laranja", price: 35.9, category: "drink" },
  { id: "sy6", name: "Penicillin", description: "Scotch whisky, gengibre, suco cítrico, mel e whisky defumado", price: 35.9, category: "drink" },
  { id: "sy7", name: "Stoli Mule", description: "Vodka Stoli, xarope, suco cítrico, gengibre e hortelã", price: 35.9, category: "drink" },
  { id: "sy8", name: "Hanky Panky", description: "Gin, Carpano Classico, Fernet Branca e twist de laranja", price: 35.9, category: "drink" },
  { id: "sy9", name: "Mojito", description: "Rum, hortelã, suco cítrico, xarope e água com gás", price: 30.9, category: "drink" },
  { id: "sy10", name: "Daiquiri", description: "Rum, suco de limão e xarope de açúcar", price: 30.9, category: "drink" },
  { id: "sy11", name: "Old Cuban", description: "Rum, suco cítrico, xarope de rapadura, hortelã e espumante", price: 35.9, category: "drink" },
  { id: "sy12", name: "El Presidente", description: "Rum, vermute dry, licor de laranja e grenadine", price: 35.9, category: "drink" },
  { id: "sy13", name: "Campari Tônica", description: "Campari, tônica e twist de laranja", price: 30.9, category: "drink" },
  { id: "sy14", name: "Bobby Burns", description: "Scotch whisky, Carpano Classico, licor de ervas e bitter", price: 35.9, category: "drink" },
];

const guilhotinaBarMenu: MenuItem[] = [
  { id: "gb1", name: "Gin Tonic", description: "Gin, água tônica e limão siciliano", price: 39, category: "drink" },
  { id: "gb2", name: "GT Sour", description: "Gin, limão, xarope de açúcar e clara de ovo", price: 39, category: "drink" },
  { id: "gb3", name: "Spanglish", description: "Gin, vermute seco, licor de sabugueiro e grapefruit", price: 39, category: "drink" },
  { id: "gb4", name: "Moscow Mule", description: "Vodka, ginger beer e limão", price: 39, category: "drink" },
  { id: "gb5", name: "Negroni", description: "Gin, campari e vermute tinto", price: 39, category: "drink" },
  { id: "gb6", name: "Coxinha de Frango", description: "Porção de coxinhas de frango", price: 32, category: "entrada" },
  { id: "gb7", name: "Pastel de Carne", description: "Porção de pastéis de carne", price: 32, category: "entrada" },
  { id: "gb8", name: "Dadinho de Tapioca", description: "Porção de dadinhos de tapioca com queijo coalho", price: 32, category: "entrada" },
];

const tanTanMenu: MenuItem[] = [
  { id: "tt1", name: "Pão, Peixe Curado e Ovas de Mujol", description: "Pão de leite, peixe curado no missô, sour cream e ovas de mujol (2un)", price: 48, category: "entrada" },
  { id: "tt2", name: "Gyoza de Porco", description: "Gyoza com nirá, frito e no vapor com molho de lichia (5un)", price: 42, category: "entrada" },
  { id: "tt3", name: "Sanduíche de Copa Lombo", description: "Pão de seda, copa lombo suíno, picles de nabo, maionese de karashi e coentro", price: 46, category: "prato" },
  { id: "tt4", name: "Berinjela Frita", description: "Berinjela frita com ponzu e katsuobushi", price: 39, category: "entrada" },
  { id: "tt5", name: "Frango Frito", description: "Sobrecoxa desossada e frita, marinada no shoyu e gengibre", price: 45, category: "entrada" },
  { id: "tt6", name: "Cogumelos na Brasa", description: "Mix de cogumelos com molho de ostra e shoyu, gema curada e pimenta", price: 52, category: "entrada" },
  { id: "tt7", name: "Couve Flor na Brasa", description: "Couve flor tostada com molho de amendoim, gergelim e óleo de pimenta", price: 42, category: "entrada" },
  { id: "tt8", name: "Tantanmen", description: "Caldo de galinha com gergelim e óleo de pimenta, carne de porco, bok choy e ovo", price: 62, category: "prato" },
  { id: "tt9", name: "Shio", description: "Caldo de galinha e dashi, chashu de porco, menma, cebolinha e ovo", price: 60, category: "prato" },
  { id: "tt10", name: "Shoyu", description: "Caldo de galinha e dashi com shoyu, chashu de porco, menma e ovo", price: 60, category: "prato" },
  { id: "tt11", name: "Veggie", description: "Caldo de legumes e cogumelos, cogumelos na brasa, menma e bok choy", price: 58, category: "prato" },
  { id: "tt12", name: "Torta de Chocolate", description: "Com caramelo de missô e praliné de amendoim", price: 36, category: "sobremesa" },
];

const martocaMenu: MenuItem[] = [
  { id: "mt1", name: "Baguette Rústica", description: "Pão de fermentação natural", price: 25, category: "prato" },
  { id: "mt2", name: "Baguette de Grãos", description: "Pão de fermentação natural com grãos", price: 28, category: "prato" },
  { id: "mt3", name: "Sourdough Basicão", description: "Pão de fermentação natural", price: 30, category: "prato" },
  { id: "mt4", name: "Pão de Queijo (un)", description: "Pão de queijo artesanal", price: 8, category: "entrada" },
  { id: "mt5", name: "Pão de Queijo (porção 3)", description: "Porção com 3 unidades", price: 22, category: "entrada" },
  { id: "mt6", name: "Pão de Queijo (porção 6)", description: "Porção com 6 unidades", price: 40, category: "entrada" },
  { id: "mt7", name: "Cesta de Pães da Casa", description: "Cesta com pães variados, manteiga e geleia", price: 35, category: "entrada" },
  { id: "mt8", name: "Queijo Quente", description: "Pão na chapa com queijo", price: 25, category: "prato" },
  { id: "mt9", name: "Misto Quente", description: "Pão na chapa com queijo e presunto", price: 28, category: "prato" },
  { id: "mt10", name: "Brownie de Castanha", description: "Bolo de chocolate com castanhas", price: 15, category: "sobremesa" },
  { id: "mt11", name: "Cookie", description: "Biscoito com gotas de chocolate", price: 12, category: "sobremesa" },
  { id: "mt12", name: "Espresso", description: "Café espresso", price: 8, category: "bebida" },
  { id: "mt13", name: "Cappuccino", description: "Café com leite e espuma de leite", price: 12, category: "bebida" },
  { id: "mt14", name: "Suco Natural", description: "Suco de frutas naturais", price: 15, category: "bebida" },
];

const ajPadariaMenu: MenuItem[] = [
  { id: "aj1", name: "Pão de Queijo", description: "Pão de queijo tradicional", price: 8.5, category: "entrada" },
  { id: "aj2", name: "Coxinha", description: "Coxinha de frango", price: 9, category: "entrada" },
  { id: "aj3", name: "Presunto Parma com Queijo Prato", description: "Sanduíche com alface, tomate e maionese", price: 35.9, category: "prato" },
  { id: "aj4", name: "Presunto Royalle com Provolone", description: "Sanduíche com provolone e tomate", price: 32.9, category: "prato" },
  { id: "aj5", name: "Picanha com Mozarela", description: "Sanduíche de picanha com molho tártaro", price: 42.9, category: "prato" },
  { id: "aj6", name: "Tapioca Mista", description: "Tapioca com presunto e queijo", price: 22.9, category: "prato" },
  { id: "aj7", name: "Tapioca Light", description: "Tapioca com peito de peru e queijo branco", price: 24.9, category: "prato" },
  { id: "aj8", name: "Cheese Salada", description: "Hambúrguer com queijo e salada", price: 28.9, category: "prato" },
  { id: "aj9", name: "Cheese Bacon", description: "Hambúrguer com queijo e bacon", price: 32.9, category: "prato" },
  { id: "aj10", name: "Beirute de Filé Mignon", description: "No pão sírio com queijo, ovo, bacon, alface, tomate e maionese", price: 45.9, category: "prato" },
  { id: "aj11", name: "Café Espresso", description: "Café espresso média", price: 6.5, category: "bebida" },
  { id: "aj12", name: "Cappuccino", description: "Cappuccino cremoso", price: 9.5, category: "bebida" },
  { id: "aj13", name: "Suco de Laranja", description: "Suco de laranja natural 300ml", price: 9, category: "bebida" },
  { id: "aj14", name: "Refrigerante em Lata", description: "Coca-Cola, Guaraná ou Soda", price: 7, category: "bebida" },
  { id: "aj15", name: "Fatia de Bolo", description: "Fatia de bolo do dia", price: 12, category: "sobremesa" },
];

const futuroRefeitorioMenu: MenuItem[] = [
  { id: "fr1", name: "Pão de Queijo", description: "Pão de queijo da casa", price: 12, category: "entrada" },
  { id: "fr2", name: "Hummus de Cenoura e Amêndoa", description: "Com pão de campo", price: 28, category: "entrada" },
  { id: "fr3", name: "Waffle de Fermentação Longa", description: "Com ricota caseira", price: 16, category: "prato" },
  { id: "fr4", name: "Tartine de Ricota", description: "Tomate cereja confit, gema curada, manjericão e parmesão", price: 32, category: "prato" },
  { id: "fr5", name: "Orecchiette com Tomate Confit", description: "Com limão siciliano, manjericão, amêndoas e ricota", price: 45, category: "prato" },
  { id: "fr6", name: "Salada de Arroz Preto", description: "Cogumelo, ervilha torta, avocado, furikake e molho de amendoim", price: 38, category: "prato" },
  { id: "fr7", name: "Sanduíche de Cenoura", description: "Com tempero fumado, avocado, maionese vegana e picles", price: 36, category: "prato" },
  { id: "fr8", name: "Bolo de Cenoura", description: "Cardamomo, cream cheese e limão", price: 18, category: "sobremesa" },
  { id: "fr9", name: "Infância Feliz", description: "Banana com doce de leite e queijo mascarpone (receita Paola Carosella)", price: 25, category: "sobremesa" },
  { id: "fr10", name: "Espresso", description: "Café espresso", price: 6.5, category: "bebida" },
  { id: "fr11", name: "Latte", description: "Espresso com leite vaporizado", price: 12, category: "bebida" },
  { id: "fr12", name: "Cappuccino", description: "Café com leite e espuma", price: 14, category: "bebida" },
  { id: "fr13", name: "Calmaria", description: "Com maracujá e gengibre", price: 15, category: "bebida" },
  { id: "fr14", name: "Um Bloody", description: "Suco de tomates assados com ervas, mostarda e tabasco", price: 33, category: "drink" },
];

const barDoBaixoMenu: MenuItem[] = [
  { id: "bb1", name: "Anéis de Cebola Crocante", description: "Com maionese verde", price: 40, category: "entrada" },
  { id: "bb2", name: "Batata Baixo Pinheiros", description: "Batata frita, farofa de bacon, calabresa e creme quatro queijos", price: 54, category: "entrada" },
  { id: "bb3", name: "Batata Frita Cheddar e Bacon", description: "Coberta com cheddar e bacon", price: 52, category: "entrada" },
  { id: "bb4", name: "Batata Frita Simples", description: "Com maionese", price: 42, category: "entrada" },
  { id: "bb5", name: "Dadinho de Tapioca", description: "Com geleia de pimenta", price: 42, category: "entrada" },
  { id: "bb6", name: "Bolinho de Abóbora com Camarão", description: "10 unidades", price: 49, category: "entrada" },
  { id: "bb7", name: "Bolinho de Mandioca com Costela", description: "10 unidades", price: 49, category: "entrada" },
  { id: "bb8", name: "Pastelzinho", description: "Carne, queijo, palmito ou mistos (10 un)", price: 48, category: "entrada" },
  { id: "bb9", name: "Burger Veg Salada", description: "Hambúrguer de lentilha, cebola caramelizada e maionese verde", price: 33, category: "prato" },
  { id: "bb10", name: "Costela Brie Salada", description: "Hambúrguer de costela, brie, geleia de pimenta e salada", price: 39, category: "prato" },
  { id: "bb11", name: "Costela X-Salada", description: "Hambúrguer de costela, cheddar e maionese verde", price: 36.5, category: "prato" },
  { id: "bb12", name: "Beck's Long Neck", description: "Cerveja Beck's", price: 16, category: "bebida" },
  { id: "bb13", name: "Budweiser Long Neck", description: "Cerveja Budweiser", price: 14, category: "bebida" },
  { id: "bb14", name: "Colorado Demoiselle", description: "Cerveja artesanal Colorado", price: 22, category: "bebida" },
  { id: "bb15", name: "Aperol Spritz", description: "Aperol, espumante, água com gás e laranja", price: 36, category: "drink" },
  { id: "bb16", name: "Bloody Mary", description: "Vodka, suco de tomate, limão, molho inglês e tabasco", price: 26, category: "drink" },
  { id: "bb17", name: "Boulevardier", description: "Whisky Bourbon, Campari e vermute rosso", price: 38, category: "drink" },
  { id: "bb18", name: "Caipirinha", description: "Cachaça com limão, abacaxi, maracujá ou morango", price: 32, category: "drink" },
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
    active: true,
    establishments: [
      {
        id: "guilhotina-bar",
        name: "Guilhotina Bar",
        address: "R. Costa Carvalho, 84 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.6,
        reviewCount: 3500,
        image: "/manus-storage/guilhotina-bar_cf0a50c4.jpg",
        hours: "Ter-Sáb 18h-01h | Dom-Seg Fechado",
        phone: "(11) 3031-5858",
        instagram: "@guilhotinabar",
        menu: guilhotinaBarMenu,
      },
      {
        id: "tan-tan",
        name: "Tan Tan",
        address: "R. dos Pinheiros, 352 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.5,
        reviewCount: 2200,
        image: "/manus-storage/tan-tan_8865b71b.jpg",
        hours: "Ter-Sáb 12h-15h e 18h-23h | Dom 12h-16h | Seg Fechado",
        phone: "(11) 3062-4567",
        instagram: "@tantan.noodle.bar",
        menu: tanTanMenu,
      },
      {
        id: "sylvester-bar-autoral",
        name: "Sylvester Bar",
        address: "R. Aspicuelta, 208 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.4,
        reviewCount: 1800,
        image: "/manus-storage/sylvester-bar_f9e1f0e2.jpg",
        hours: "Ter-Sáb 18h-02h | Dom-Seg Fechado",
        phone: "(11) 3032-0089",
        instagram: "@sylvesterbar",
        menu: sylvesterBarMenu,
      },
    ],
  },
  {
    id: "boteco-tradicional",
    name: "Boteco Tradicional",
    description: "Pé-sujo, cerveja gelada",
    icon: "Beer",
    active: true,
    establishments: [
      {
        id: "sao-conrado",
        name: "São Conrado",
        address: "R. Inácio Pereira da Rocha, 15 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.4,
        reviewCount: 2600,
        image: "/manus-storage/sao-conrado_f7ce2969.jpg",
        hours: "Seg-Sáb 17h-00h | Dom 12h-22h",
        phone: "(11) 3034-2007",
        instagram: "@saoconradobar",
        menu: saoConradoMenu,
      },
      {
        id: "quitandinha",
        name: "Quitandinha",
        address: "R. Mourato Coelho, 1447 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.3,
        reviewCount: 3100,
        image: "/manus-storage/quitandinha_219280e6.jpg",
        hours: "Seg-Sáb 11h-00h | Dom 11h-22h",
        phone: "(11) 3034-1456",
        instagram: "@quitandinha_bar",
        menu: quitandinhaMenu,
      },
    ],
  },
  {
    id: "boteco-moderno",
    name: "Boteco Moderno",
    description: "Gastrobar, petiscos autorais",
    icon: "Sparkles",
    active: true,
    establishments: [
      {
        id: "de-primeira",
        name: "De Primeira",
        address: "R. Aspicuelta, 515 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.5,
        reviewCount: 2400,
        image: "/manus-storage/de-primeira_f1246ce5.jpg",
        hours: "Ter-Sex 17h-00h | Sáb 12h-00h | Dom 12h-22h | Seg Fechado",
        phone: "(11) 3034-1556",
        instagram: "@deprimeira.bar",
        menu: dePrimeiraMenu,
      },
      {
        id: "bar-moela",
        name: "Bar Moela",
        address: "R. Aspicuelta, 307 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.6,
        reviewCount: 1900,
        image: "/manus-storage/bar-moela_b74cc7a7.jpg",
        hours: "Ter-Sex 17h-23h | Sáb 12h-23h | Dom 12h-20h | Seg Fechado",
        phone: "(11) 3032-2838",
        instagram: "@barmoela",
        menu: barMoelaMenu,
      },
    ],
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
    active: true,
    establishments: [
      {
        id: "santana-bar",
        name: "Santana Bar",
        address: "R. Santana, 108 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.5,
        reviewCount: 2100,
        image: "/manus-storage/santana-bar_d5c12f24.jpg",
        hours: "Ter-Sáb 18h-01h | Dom-Seg Fechado",
        phone: "(11) 3034-2345",
        instagram: "@santanabar",
        menu: santanaBarMenu,
      },
      {
        id: "sylvester-bar",
        name: "Sylvester Bar",
        address: "R. Aspicuelta, 208 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.4,
        reviewCount: 1800,
        image: "/manus-storage/sylvester-bar_f9e1f0e2.jpg",
        hours: "Ter-Sáb 18h-02h | Dom-Seg Fechado",
        phone: "(11) 3032-0089",
        instagram: "@sylvesterbar",
        menu: sylvesterBarMenu,
      },
    ],
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Café especial, brunch",
    icon: "CupSoda",
    active: true,
    establishments: [
      {
        id: "kof-king-of-the-fork",
        name: "KOF - King of The Fork",
        address: "R. Artur de Azevedo, 1317 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.3,
        reviewCount: 1800,
        image: "/manus-storage/kof-exterior_d9c04bf0.jpg",
        hours: "Seg-Sex 07h30-19h | Sáb 09h-18h | Dom Fechado",
        phone: "(11) 2533-9391",
        instagram: "@kingofthefork",
        menu: kofMenu,
      },
      {
        id: "fora-da-lei-cafe",
        name: "Fora da Lei Café",
        address: "R. Cubatão, 131 - Paraíso",
        neighborhood: "Paraíso",
        rating: 4.6,
        reviewCount: 1200,
        image: "/manus-storage/fora-da-lei_e7a3bc13.jpg",
        hours: "Seg 12h-18h | Ter-Sáb 09h-18h | Dom Fechado",
        phone: "(11) 97416-6766",
        instagram: "@foradalei_cafe",
        menu: foradaLeiMenu,
      },
      {
        id: "crio-cafe",
        name: "Crio Café",
        address: "R. Cubatão, 641 - Vila Mariana",
        neighborhood: "Vila Mariana",
        rating: 4.7,
        reviewCount: 950,
        image: "/manus-storage/crio-cafe_bfbc7063.jpg",
        hours: "Seg-Sáb 09h30-18h30 | Dom Fechado",
        phone: "",
        instagram: "@crio.cafe",
        menu: crioCafeMenu,
      },
    ],
  },
  {
    id: "padaria",
    name: "Padaria",
    description: "Pães, salgados e almoço",
    icon: "Croissant",
    active: true,
    establishments: [
      {
        id: "martoca-padaria",
        name: "Martoca - Padaria Artesanal",
        address: "R. Artur de Azevedo, 1523 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.7,
        reviewCount: 1500,
        image: "/manus-storage/martoca_be0fc2ae.jpg",
        hours: "Seg-Sáb 07h-19h | Dom 08h-14h",
        phone: "(11) 3062-3456",
        instagram: "@martocapadaria",
        menu: martocaMenu,
      },
      {
        id: "aj-padaria",
        name: "A J Padaria",
        address: "R. Cônego Eugênio Leite, 836 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.3,
        reviewCount: 2800,
        image: "/manus-storage/aj-padaria_ff684ac1.jpg",
        hours: "Seg-Sáb 06h-21h | Dom 06h-14h",
        phone: "(11) 3083-1346",
        instagram: "@ajpadaria",
        menu: ajPadariaMenu,
      },
      {
        id: "futuro-refeitorio",
        name: "O Futuro Refeitório",
        address: "R. dos Pinheiros, 514 - Pinheiros",
        neighborhood: "Pinheiros",
        rating: 4.6,
        reviewCount: 1200,
        image: "/manus-storage/futuro-refeitorio_657f2f97.jpg",
        hours: "Ter-Sex 09h-17h | Sáb-Dom 09h-16h | Seg Fechado",
        phone: "(11) 3064-0845",
        instagram: "@ofuturorefeitorio",
        menu: futuroRefeitorioMenu,
      },
    ],
  },
  {
    id: "bar-balada",
    name: "Bar Balada",
    description: "Música, drinks e pista",
    icon: "Music",
    active: true,
    establishments: [
      {
        id: "bar-do-baixo",
        name: "Bar do Baixo",
        address: "R. Girassol, 67 - Vila Madalena",
        neighborhood: "Vila Madalena",
        rating: 4.3,
        reviewCount: 3800,
        image: "/manus-storage/bar-do-baixo_f69e706b.jpg",
        hours: "Ter-Sáb 18h-03h | Dom-Seg Fechado",
        phone: "(11) 3034-6789",
        instagram: "@bardodobaixo",
        menu: barDoBaixoMenu,
      },
    ],
  },
  {
    id: "balada",
    name: "Balada",
    description: "Casas noturnas e festas",
    icon: "Music",
    active: false,
    establishments: [],
  },
  {
    id: "bar-musical",
    name: "Bar Musical",
    description: "Música ao vivo e shows",
    icon: "Music",
    active: false,
    establishments: [],
  },
];
