# Portal Imobiliário Premium

Base full-stack profissional para um portal imobiliário premium, independente de WordPress, com frontend em Next.js, backend em Express, autenticação JWT, PostgreSQL e Prisma ORM.

## Visão geral

Este projeto foi estruturado com foco em produção real:

- arquitetura monorepo organizada
- frontend e backend separados
- tipagem forte com TypeScript
- SSR no frontend com SEO técnico
- painel administrativo customizado
- Prisma com PostgreSQL
- autenticação JWT para administração
- CRUD de imóveis, blog, depoimentos e leads
- seed inicial com admin e conteúdo de demonstração
- base preparada para integrações futuras (Cloudinary, CRM, mapas, Ads, automações)

## Stack

### Frontend
- Next.js 15
- React 18
- TypeScript
- TailwindCSS
- Framer Motion (instalado para evolução de animações)

### Backend
- Node.js
- Express
- Prisma ORM
- Zod para validação
- Helmet, CORS e rate limit

### Banco de dados
- PostgreSQL 16

## Estrutura do monorepo

```txt
portal-imobiliario-premium/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── app.ts
│   │       ├── index.ts
│   │       ├── config/
│   │       ├── lib/
│   │       ├── middleware/
│   │       ├── routes/
│   │       └── utils/
│   └── web/
│       ├── app/
│       ├── components/
│       └── lib/
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

## Funcionalidades implementadas

### Site público
- home premium com hero em vídeo
- página de empreendimentos
- página de terrenos
- página geral de imóveis
- página individual do imóvel
- blog com listagem e detalhe
- página sobre
- página simulador
- página contato
- botão flutuante de WhatsApp
- sitemap e robots
- metadata dinâmica e JSON-LD

### Painel administrativo
- login administrativo
- dashboard com métricas
- CRUD de imóveis
- CRUD de posts
- CRUD de depoimentos
- gestão de leads
- edição das configurações visuais e homepage

### Backend / API
- autenticação JWT
- validação com Zod
- tratamento centralizado de erros
- rate limit global + rotas sensíveis
- middleware de autenticação
- Prisma ORM com índices para consultas mais frequentes

## Banco de dados PostgreSQL

Entidades principais no Prisma:

- `User`
- `Property`
- `PropertyImage`
- `Post`
- `Testimonial`
- `Lead`
- `SiteSetting`

Índices foram adicionados para cenários comuns de busca e crescimento:

- cidade / bairro
- categoria / status / destaque
- preço
- ordenação por criação
- status de leads
- ordenação de imagens por imóvel

## Variáveis de ambiente

Copie o arquivo `.env.example` para `.env` na raiz.

```bash
cp .env.example .env
```

## Instalação local

### 1. Subir PostgreSQL

```bash
docker compose up -d
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Gerar Prisma Client

```bash
npm run prisma:generate
```

### 4. Criar migration inicial

```bash
npm run prisma:migrate
```

### 5. Popular banco com seed inicial

```bash
npm run seed
```

### 6. Rodar backend

```bash
npm run dev:api
```

### 7. Rodar frontend

```bash
npm run dev:web
```

## Endereços locais

- Site público: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Admin: `http://localhost:3000/admin`

## Admin inicial

Definido pelas variáveis:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Padrão do seed:

- email: `admin@premiumimoveis.com`
- senha: `12345678`

## Scripts úteis

```bash
npm run dev:web
npm run dev:api
npm run build:web
npm run build:api
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Padrões arquiteturais aplicados

### Backend
- `config/` para configuração e validação de ambiente
- `middleware/` para auth, not-found e error handler
- `routes/` por domínio funcional
- `utils/` para helpers reutilizáveis
- handlers assíncronos padronizados
- tratamento consistente de erros e validações

### Frontend
- `app/` com App Router e SSR
- `components/` separados por domínio
- `lib/` para API client, SEO, formatos e tipos
- componentes reutilizáveis para cards, layout, formulário e skeleton loading

## Boas práticas já consideradas

- SSR no frontend
- timeout curto e fallback controlado em fetches server-side
- metadata dinâmica por página
- JSON-LD em páginas estratégicas
- acessibilidade básica com skip link, labels e aria-live
- lazy loading de iframes e imagens responsivas com `sizes`
- fallback visual com loading, error e not-found
- JWT com issuer e audience
- validação anti-spam com honeypot em formulários

## Gargalos futuros já previstos

O projeto já está preparado para evoluir com:

- paginação real com UI no frontend
- upload para Cloudinary ou S3
- busca full-text no PostgreSQL
- filtros avançados com facets
- CRM interno de leads
- dashboard analítico
- mapa de lotes interativo
- filas assíncronas para integrações
- cache HTTP e CDN no deploy

## Estratégia de deploy

### Frontend
Recomendado:
- Vercel
- VPS com Node.js
- Cloudflare Pages (com ajustes)

### Backend
Recomendado:
- VPS com PM2 + Nginx
- Railway / Render
- Google Cloud Run

### Banco
Recomendado:
- PostgreSQL gerenciado
- backups automáticos
- monitoramento de conexão

## Deploy sugerido em produção

### Frontend
Configurar:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_URL`

### Backend
Configurar:
- `PORT`
- `NODE_ENV=production`
- `JWT_SECRET`
- `DATABASE_URL`
- `CORS_ORIGIN`

### Observações importantes
- use HTTPS em produção
- coloque frontend atrás de CDN
- publique a API atrás de reverse proxy
- configure backups do PostgreSQL
- troque a senha padrão do admin imediatamente

## Seed inicial

O seed cria automaticamente:

- usuário administrador
- configurações iniciais do site
- imóveis de exemplo
- posts do blog de exemplo
- depoimentos de exemplo

Arquivo do seed:

```txt
apps/api/src/seed.ts
```

## Próximas evoluções recomendadas

- refresh token e rotação de sessão
- upload real de mídia
- gestão de corretores
- tags e taxonomias de blog
- analytics e eventos de conversão
- cache Redis para listagens mais acessadas
- observabilidade com logs centralizados
- testes automatizados (unitários e integração)

## Status da base

A base foi organizada para ser modular, legível, escalável e fácil de manter, servindo como fundação real para um portal imobiliário premium de produção.
