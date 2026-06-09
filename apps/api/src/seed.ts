import { ensureApiEnvLoaded } from './config/load-env.js';

ensureApiEnvLoaded();

import { PropertyCategory, PropertyStatus, Role } from '@prisma/client';
import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/auth.js';
import { ensureThemeLayoutsSeeded } from './utils/theme-layouts.js';

const ADMIN_NAME = 'Ícarõ Munay';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'imob@munay.com.br').trim().toLowerCase();
const LEGACY_ADMIN_EMAIL = 'imub@munay.com.br';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Brend@12';

async function ensureMasterAdmin() {
  const existingMaster = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const legacyAdmin = existingMaster ? null : await prisma.user.findUnique({ where: { email: LEGACY_ADMIN_EMAIL } });
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  if (!existingMaster && legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: Role.ADMIN,
        emailVerified: legacyAdmin.emailVerified || new Date(),
        whatsapp: legacyAdmin.whatsapp || '(48) 99999-9999',
        cpf: legacyAdmin.cpf || null,
        address: legacyAdmin.address || 'Painel administrativo Munay'
      }
    });

    console.log(`Administrador já existe: ${ADMIN_EMAIL}`);
  } else if (!existingMaster) {
    await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        whatsapp: '(48) 99999-9999',
        cpf: null,
        address: 'Painel administrativo Munay',
        role: Role.ADMIN,
        emailVerified: new Date()
      }
    });

    console.log(`Administrador criado: ${ADMIN_EMAIL}`);
  } else {
    await prisma.user.update({
      where: { id: existingMaster.id },
      data: {
        name: ADMIN_NAME,
        passwordHash,
        role: Role.ADMIN,
        emailVerified: existingMaster.emailVerified || new Date(),
        whatsapp: existingMaster.whatsapp || '(48) 99999-9999',
        cpf: existingMaster.cpf || null,
        address: existingMaster.address || 'Painel administrativo Munay'
      }
    });

    console.log(`Administrador já existe: ${ADMIN_EMAIL}`);
  }

  await prisma.user.updateMany({
    where: {
      email: { notIn: [ADMIN_EMAIL, LEGACY_ADMIN_EMAIL] },
      role: Role.ADMIN
    },
    data: {
      role: Role.USER
    }
  });
}

async function ensureInitialSettings() {
  const settings = await prisma.siteSetting.findFirst({ select: { id: true } });
  if (!settings) {
    await prisma.siteSetting.create({
      data: {
        brandName: 'Munay Imóveis',
        heroTitle: 'Imóveis, terrenos e oportunidades exclusivas para morar, investir e valorizar patrimônio.',
        heroSubtitle:
          'Atendimento com foco em compra e venda de imóveis, oportunidades imobiliárias selecionadas e suporte consultivo para gerar segurança em cada negociação.',
        whatsappNumber: '5548991702077',
        creci: 'CRECI 33928-F',
        cnpj: '',
        address: 'Atendimento com hora marcada',
        phone: '(48) 99170-2077',
        instagram: 'https://instagram.com/corretor_icaro_munay',
        privacyUrl: '/politica-de-privacidade'
      },
      select: { id: true }
    });
  }
}

async function seedExamplePropertiesOnlyWhenDatabaseIsEmpty() {
  const countProperties = await prisma.property.count();

  if (countProperties > 0) {
    console.log('Imóveis existentes preservados');
    return;
  }

  await prisma.property.create({
    data: {
      title: 'Terreno Vista Serra',
      slug: 'terreno-vista-serra-te001',
      shortDescription: 'Terreno em localização estratégica com potencial de valorização e excelente liquidez.',
      fullDescription:
        'Oportunidade para investir ou construir com segurança, infraestrutura próxima e leitura comercial favorável para crescimento patrimonial.',
      price: 285000,
      promotionalPrice: 259000,
      status: PropertyStatus.LAUNCH,
      propertyCode: 'TE001',
      area: 420,
      city: 'Torres',
      district: 'Centro',
      state: 'RS',
      category: PropertyCategory.TERRENO,
      type: 'Terreno',
      featured: true,
      launch: true,
      coverImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&fm=webp&w=1200&q=75',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Vista do terreno', sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Região do terreno', sortOrder: 1 }
        ]
      }
    }
  });

  await prisma.property.create({
    data: {
      title: 'Casa Alto Padrão Frente Mar',
      slug: 'casa-alto-padrao-frente-mar-ca001',
      shortDescription: 'Casa sofisticada com acabamento premium e localização exclusiva próxima ao mar.',
      fullDescription:
        'Residência contemporânea com espaços amplos, suítes confortáveis e perfil ideal para morar com exclusividade ou investir em um ativo imobiliário diferenciado.',
      price: 2150000,
      status: PropertyStatus.AVAILABLE,
      propertyCode: 'CA001',
      area: 320,
      bedrooms: 4,
      bathrooms: 5,
      garage: 3,
      city: 'Torres',
      district: 'Praia Grande',
      state: 'RS',
      category: PropertyCategory.CASA,
      type: 'Casa',
      featured: true,
      launch: false,
      coverImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&fm=webp&w=1200&q=75',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Fachada premium', sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Interior sofisticado', sortOrder: 1 }
        ]
      }
    }
  });

  await prisma.property.create({
    data: {
      title: 'Apartamento Vista Atlântica',
      slug: 'apartamento-vista-atlantica-ap001',
      shortDescription: 'Apartamento moderno com localização nobre e excelente apelo para moradia ou renda.',
      fullDescription:
        'Imóvel pronto para quem busca conforto, valorização patrimonial e um produto imobiliário de alta procura na região sul.',
      price: 890000,
      status: PropertyStatus.AVAILABLE,
      propertyCode: 'AP001',
      area: 128,
      bedrooms: 3,
      bathrooms: 3,
      garage: 2,
      city: 'Capão da Canoa',
      district: 'Centro',
      state: 'RS',
      category: PropertyCategory.APARTAMENTO,
      type: 'Apartamento',
      featured: false,
      launch: false,
      coverImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&fm=webp&w=1200&q=75',
      images: {
        create: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&fm=webp&w=1200&q=75', alt: 'Sala do apartamento', sortOrder: 0 }]
      }
    }
  });
}

async function main() {
  await ensureMasterAdmin();
  await ensureInitialSettings();
  await ensureThemeLayoutsSeeded();
  await seedExamplePropertiesOnlyWhenDatabaseIsEmpty();

  const countPosts = await prisma.post.count();
  if (countPosts === 0) {
    await prisma.post.createMany({
      data: [
        {
          title: 'Como escolher imóveis com maior potencial de valorização',
          slug: 'como-escolher-imoveis-com-maior-potencial-de-valorizacao',
          excerpt: 'Entenda o que observar antes de comprar imóveis, terrenos e oportunidades para investir com mais segurança.',
          content:
            'Localização, liquidez, vocação da região, padrão construtivo e demanda são pilares para identificar imóveis com boa perspectiva de valorização patrimonial.',
          coverImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&fm=webp&w=1200&q=75',
          category: 'investimento',
          published: true
        },
        {
          title: 'Terrenos e loteamentos: quando vale a pena investir',
          slug: 'terrenos-e-loteamentos-quando-vale-a-pena-investir',
          excerpt: 'Veja como analisar loteamentos e terrenos em regiões com expansão urbana e valorização consistente.',
          content:
            'Investimentos em terrenos e loteamentos podem gerar ganho de capital relevante quando a compra é feita com leitura correta de localização, infraestrutura e demanda futura.',
          coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&fm=webp&w=1200&q=75',
          category: 'valorizacao',
          published: true
        }
      ]
    });
  }

  const countTestimonials = await prisma.testimonial.count();
  if (countTestimonials === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: 'Mariana Souza',
          photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
          text: 'Atendimento impecável, negociação segura e imóvel alinhado exatamente ao que procurávamos.',
          rating: 5
        },
        {
          name: 'Eduardo Lima',
          photoUrl: 'https://randomuser.me/api/portraits/men/46.jpg',
          text: 'Recebemos oportunidades muito mais assertivas e um acompanhamento comercial de verdade.',
          rating: 5
        }
      ]
    });
  }

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
