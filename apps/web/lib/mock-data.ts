import { Post, Property, SiteSettings, Testimonial } from './types';

const now = new Date().toISOString();

export const mockSettings: SiteSettings = {
  brandName: 'Munay Imóveis',
  primaryColor: '#102a1f',
  secondaryColor: '#d4af72',
  accentColor: '#f6f2e8',
  heroTitle: 'Invista em terrenos com alto potencial de valorização',
  heroSubtitle: 'Empreendimentos premium, imóveis selecionados e atendimento consultivo para quem busca patrimônio com inteligência.',
  heroVideoUrl: 'https://www.youtube.com/embed/mfNsrZJiQkg?autoplay=1&mute=1&controls=0&loop=1&playlist=mfNsrZJiQkg',
  homeVideoStatus: 'INACTIVE',
  homeVideoUrl: '',
  homeVideoTitle: '',
  homeVideoDescription: '',
  homeVideoThumbnailUrl: '',
  homeVideoOrder: 1,
  whatsappNumber: '5548991702077',
  creci: 'CRECI 33928-F',
  cnpj: '',
  address: 'Atendimento com hora marcada',
  phone: '(48) 99170-2077',
  instagram: 'https://instagram.com/corretor_icaro_munay',
  privacyUrl: '/politica-de-privacidade',
  googleTagManagerId: '',
  ga4MeasurementId: '',
  googleSiteVerification: '',
  metaPixelId: '',
  metaDomainVerification: '',
  microsoftClarityId: '',
  bingSiteVerification: '',
  tiktokPixelId: '',
  linkedInPartnerId: '',
  pinterestTagId: '',
  customHeadCode: '',
  customBodyCode: '',
  customFooterCode: '',
  indexNowKey: 'munay-indexnow-key'
};

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Reserva Imperial Jardins',
    slug: 'reserva-imperial-jardins',
    shortDescription: 'Loteamento premium com infraestrutura completa, entrada facilitada e alto potencial de valorização.',
    fullDescription:
      '<p>Empreendimento planejado para quem busca segurança patrimonial, localização estratégica e padrão elevado de urbanismo. Ideal para morar ou investir com visão de longo prazo.</p><p>Conta com infraestrutura completa, urbanismo qualificado, acesso facilitado e condições comerciais competitivas para acelerar sua decisão de compra.</p>',
    price: 185000,
    promotionalPrice: 169900,
    status: 'LAUNCH',
    propertyCode: 'RIJ-001',
    area: 360,
    lotsMinArea: 360,
    lotsMaxArea: 540,
    lotsQuantity: 182,
    developmentInfrastructure: 'Portaria, boulevard central, áreas verdes, drenagem e iluminação planejada.',
    developmentHasPaving: true,
    developmentHasElectricity: true,
    developmentHasWaterNetwork: true,
    readyToBuild: true,
    hasDevelopmentInstallments: true,
    developmentMaxInstallments: 120,
    acceptsBankFinancing: true,
    city: 'Goiânia',
    district: 'Jardins Verona',
    state: 'GO',
    category: 'LOTEAMENTO',
    type: 'Loteamento',
    featured: true,
    launch: true,
    approved: true,
    reviewStatus: 'APPROVED',
    viewCount: 248,
    googleMapsLink: 'https://maps.google.com',
    youtubeLink: 'https://www.youtube.com/watch?v=Scxs7L0vhZ4',
    coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&fm=webp&w=1200&q=75',
    images: [
      { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Vista aérea do loteamento' },
      { url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Área nobre do empreendimento' }
    ]
  },
  {
    id: '2',
    title: 'Casa Horizon Residence',
    slug: 'casa-horizon-residence',
    shortDescription: 'Casa sofisticada com acabamento premium, edícula completa e localização nobre.',
    fullDescription:
      '<p>Residência contemporânea com integração total dos ambientes, suítes amplas, iluminação natural e espaço gourmet com edícula para um público exigente.</p><p>Acabamentos selecionados, posição solar valorizada e condições comerciais flexíveis tornam esta opção ideal para famílias que buscam conforto e patrimônio.</p>',
    price: 1250000,
    promotionalPrice: 1190000,
    status: 'AVAILABLE',
    propertyCode: 'CHR-101',
    area: 240,
    landArea: 420,
    builtArea: 240,
    bedrooms: 4,
    bathrooms: 5,
    suites: 3,
    garage: 3,
    solarPosition: 'Norte/Leste',
    hasEdicule: true,
    ediculeArea: 40,
    ediculeBedrooms: 1,
    ediculeBathrooms: 1,
    ediculeHasLivingRoom: true,
    ediculeHasKitchen: true,
    acceptsBankFinancing: true,
    acceptsFgts: true,
    acceptsExchange: true,
    acceptsProposal: true,
    constructionYear: 2021,
    city: 'Goiânia',
    district: 'Aldeia do Vale',
    state: 'GO',
    category: 'CASA',
    type: 'Alto padrão',
    featured: true,
    approved: true,
    reviewStatus: 'APPROVED',
    viewCount: 612,
    coverImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&fm=webp&w=1200&q=75',
    images: [
      { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Fachada premium' },
      { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Interior sofisticado' }
    ]
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Como avaliar o potencial de valorização de um terreno',
    slug: 'como-avaliar-o-potencial-de-valorizacao-de-um-terreno',
    excerpt: 'Entenda os fatores que impactam diretamente o crescimento patrimonial em loteamentos e áreas urbanas.',
    content:
      '<p>Localização, infraestrutura, crescimento urbano, documentação e liquidez são pilares para análise. Este artigo mostra como comparar oportunidades com visão de longo prazo.</p><h2>1. Entenda o vetor de crescimento</h2><p>Observe obras públicas, expansão comercial, acessos viários e demanda habitacional na região.</p><h2>2. Compare metragem e liquidez</h2><p>Terrenos bem posicionados, com frente adequada e potencial construtivo claro, tendem a ter melhor saída e valorização consistente.</p>',
    coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&fm=webp&w=1200&q=75',
    category: 'Valorização',
    author: 'Equipe Munay Imóveis',
    published: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: '2',
    title: 'Financiamento de lote: o que analisar antes de fechar negócio',
    slug: 'financiamento-de-lote-o-que-analisar-antes-de-fechar-negocio',
    excerpt: 'Veja taxas, prazos, documentação e riscos para comprar com segurança.',
    content:
      '<p>Antes de fechar negócio, compare CET, prazo total, flexibilidade contratual e reputação do empreendimento. Uma compra bem planejada reduz risco e preserva caixa.</p><h2>1. Analise o custo efetivo total</h2><p>Mais importante que a parcela é entender o custo final do contrato, seguros e taxas embutidas.</p><h2>2. Valide a documentação</h2><p>Verifique matrícula, licenças, cronograma de infraestrutura e cláusulas de reajuste antes de assinar.</p>',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&fm=webp&w=1200&q=75',
    category: 'Financiamento',
    author: 'Equipe Munay Imóveis',
    published: true,
    createdAt: now,
    updatedAt: now
  }
];

export const mockTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Mariana Souza',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&fm=webp&w=300&q=70',
    text: 'Atendimento impecável, apresentação clara e excelente oportunidade de investimento.',
    rating: 5
  },
  {
    id: '2',
    name: 'Eduardo Lima',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&fm=webp&w=300&q=70',
    text: 'Experiência premium de verdade, com orientação estratégica para compra.',
    rating: 5
  }
];
