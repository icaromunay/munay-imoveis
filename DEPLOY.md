# Deploy do Portal Munay

Este projeto possui **duas aplicações HTTP distintas** rodando na mesma VPS:

- **Next.js / Web** em `127.0.0.1:3000`
- **API Express** em `127.0.0.1:4000`

O deploy precisa respeitar essa separação no Nginx. Se o Nginx encaminhar `location /api/` inteiro para a API Express com **barra final** no `proxy_pass`, o prefixo `/api` será removido e várias rotas quebrarão.

## Erro clássico de proxy

### Configuração incorreta

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000/;
}
```

A barra final faz o Nginx transformar:

- `/api/admin-token` em `/admin-token`
- `/api/admin/email/smtp` em `/admin/email/smtp`
- `/api/properties/admin/all` em `/properties/admin/all`

Isso gera respostas como:

```json
{"message":"Rota não encontrada: GET /admin-token"}
```

### Configuração correta

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:4000;
}
```

## Mapa completo das rotas Next internas

Essas rotas existem em `apps/web/app/api/**` e **devem chegar no Next.js (porta 3000)**.

| Arquivo | Método(s) | Rota pública | Upstream |
|---|---|---|---|
| `apps/web/app/api/admin-token/route.ts` | `GET` | `/api/admin-token` | `127.0.0.1:3000` |
| `apps/web/app/api/owner-token/route.ts` | `GET` | `/api/owner-token` | `127.0.0.1:3000` |
| `apps/web/app/api/revalidate/route.ts` | `POST` | `/api/revalidate` | `127.0.0.1:3000` |
| `apps/web/app/api/indexnow-key/route.ts` | `GET` | `/api/indexnow-key` | `127.0.0.1:3000` |
| `apps/web/app/api/admin/email/smtp/route.ts` | `GET`, `PUT` | `/api/admin/email/smtp` | `127.0.0.1:3000` |
| `apps/web/app/api/admin/email/smtp/test/route.ts` | `POST` | `/api/admin/email/smtp/test` | `127.0.0.1:3000` |
| `apps/web/app/api/admin/email-templates/password-reset/route.ts` | `GET`, `PUT` | `/api/admin/email-templates/password-reset` | `127.0.0.1:3000` |
| `apps/web/app/api/admin/uploads/route.ts` | `POST` | `/api/admin/uploads` | `127.0.0.1:3000` |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | `GET`, `POST` | `/api/auth/*` do NextAuth, como `/api/auth/session`, `/api/auth/signin`, `/api/auth/signout`, `/api/auth/callback/*`, `/api/auth/providers`, `/api/auth/csrf` | `127.0.0.1:3000` |
| `apps/web/app/api/auth/register/route.ts` | `POST` | `/api/auth/register` | `127.0.0.1:3000` |
| `apps/web/app/api/auth/reset-password/route.ts` | `POST` | `/api/auth/reset-password` | `127.0.0.1:3000` |
| `apps/web/app/api/auth/reset-password/confirm/route.ts` | `POST` | `/api/auth/reset-password/confirm` | `127.0.0.1:3000` |

## Mapa completo das rotas Express

Essas rotas existem em `apps/api/src/routes/**` e **devem chegar na API Express (porta 4000)**, exceto as exceções de autenticação listadas abaixo.

### Montagem principal da API

Em `apps/api/src/app.ts`, a API é montada assim:

- `/api/analytics`
- `/api/auth`
- `/api/blog-automation`
- `/api/dashboard`
- `/api/leads`
- `/api/posts`
- `/api/properties`
- `/api/redirects`
- `/api/settings`
- `/api/testimonials`
- `/api/themes`
- `/api/theme-layouts`
- `/uploads`

### Endpoints Express por arquivo

| Arquivo | Método(s) | Rota final |
|---|---|---|
| `apps/api/src/routes/analytics.ts` | `POST` | `/api/analytics/home/visit` |
|  | `POST` | `/api/analytics/home-video` |
|  | `POST` | `/api/analytics/properties/:slug/contact-click` |
|  | `GET` | `/api/analytics/views` |
| `apps/api/src/routes/auth.ts` | `POST` | `/api/auth/login` |
|  | `POST` | `/api/auth/google-owner` |
| `apps/api/src/routes/blog-automation.ts` | `GET`, `PUT` | `/api/blog-automation/settings` |
|  | `GET`, `POST` | `/api/blog-automation/queue` |
|  | `PUT`, `DELETE` | `/api/blog-automation/queue/:id` |
| `apps/api/src/routes/dashboard.ts` | `GET` | `/api/dashboard` |
| `apps/api/src/routes/leads.ts` | `POST`, `GET` | `/api/leads` |
|  | `PUT`, `DELETE` | `/api/leads/:id` |
| `apps/api/src/routes/posts.ts` | `GET`, `POST` | `/api/posts` |
|  | `GET` | `/api/posts/admin/all` |
|  | `POST` | `/api/posts/:id/duplicate` |
|  | `GET` | `/api/posts/:slug` |
|  | `PUT`, `DELETE` | `/api/posts/:id` |
| `apps/api/src/routes/properties.ts` | `GET`, `POST` | `/api/properties` |
|  | `GET` | `/api/properties/location-options` |
|  | `GET` | `/api/properties/admin/all` |
|  | `GET` | `/api/properties/owner/my` |
|  | `POST` | `/api/properties/submit` |
|  | `PUT` | `/api/properties/owner/:id` |
|  | `POST` | `/api/properties/:id/duplicate` |
|  | `PATCH` | `/api/properties/:id/approve` |
|  | `POST` | `/api/properties/:slug/view` |
|  | `GET` | `/api/properties/:slug` |
|  | `PUT`, `DELETE` | `/api/properties/:id` |
| `apps/api/src/routes/redirects.ts` | `GET`, `POST` | `/api/redirects` |
|  | `GET` | `/api/redirects/resolve` |
|  | `PUT`, `DELETE` | `/api/redirects/:id` |
| `apps/api/src/routes/settings.ts` | `GET`, `PUT` | `/api/settings` |
|  | `GET`, `PUT` | `/api/settings/home-video` |
|  | `GET`, `PUT` | `/api/settings/traffic` |
| `apps/api/src/routes/testimonials.ts` | `GET`, `POST` | `/api/testimonials` |
|  | `PUT`, `DELETE` | `/api/testimonials/:id` |
| `apps/api/src/routes/themes.ts` | `GET` | `/api/themes/active` |
|  | `GET`, `POST` | `/api/themes` |
|  | `GET` | `/api/themes/catalog` |
|  | `GET` | `/api/themes/history` |
|  | `POST` | `/api/themes/restore-previous` |
|  | `POST` | `/api/themes/history/:id/restore` |
|  | `POST` | `/api/themes/:id/duplicate` |
|  | `POST` | `/api/themes/:id/activate` |
|  | `PUT`, `DELETE` | `/api/themes/:id` |
| `apps/api/src/routes/themes.ts` | mesmos métodos | `/api/theme-layouts/*` aponta para o mesmo router |

## Regra de roteamento recomendada no Nginx

### Regra pronta

Use também o arquivo de exemplo em `deploy/nginx/imoveis.munay.com.br.conf.example`.

```nginx
upstream munay_web {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream munay_api {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name imoveis.munay.com.br;

    client_max_body_size 50M;

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    location = /api/admin-token {
        proxy_pass http://munay_web;
    }

    location = /api/owner-token {
        proxy_pass http://munay_web;
    }

    location = /api/revalidate {
        proxy_pass http://munay_web;
    }

    location = /api/indexnow-key {
        proxy_pass http://munay_web;
    }

    location ^~ /api/admin/ {
        proxy_pass http://munay_web;
    }

    location = /api/auth/login {
        proxy_pass http://munay_api;
    }

    location = /api/auth/google-owner {
        proxy_pass http://munay_api;
    }

    location ^~ /api/auth/ {
        proxy_pass http://munay_web;
    }

    location ^~ /api/ {
        proxy_pass http://munay_api;
    }

    location ^~ /uploads/ {
        proxy_pass http://munay_api;
    }

    location ^~ /_next/ {
        proxy_pass http://munay_web;
    }

    location / {
        proxy_pass http://munay_web;
    }
}
```

## Verificação automática pós-deploy

Foi criado o script:

```bash
scripts/verify-routing.sh
```

Ele valida três grupos:

1. **Next local** em `127.0.0.1:3000`
2. **API local** em `127.0.0.1:4000`
3. **Domínio público**

### Rotas conferidas automaticamente

#### Next
- `/api/admin-token`
- `/api/admin/email/smtp`
- `/api/auth/session`

#### API
- `/api/properties?limit=1`
- `/api/posts?limit=1`
- `/api/dashboard`

### Como executar

```bash
bash scripts/verify-routing.sh
```

Ou com domínio customizado:

```bash
PUBLIC_BASE_URL=https://imoveis.munay.com.br bash scripts/verify-routing.sh
```

### Interpretação

- `401` ou `403` em rotas protegidas é aceitável
- `404` ou mensagem `Rota não encontrada` indica encaminhamento incorreto
- Se a rota funciona localmente e falha no domínio, o problema está no **Nginx**

## Arquitetura: revisão e decisão

### Situação atual

Hoje existem dois backends HTTP diferentes atrás do mesmo domínio. Por isso o Nginx precisa separar corretamente:

- rotas internas do Next
- rotas da API Express

### É possível eliminar regras específicas do Nginx?

**Sim, mas exigiria refatoração estrutural maior.** As opções seriam:

1. **Unificar todas as APIs no Next.js**, usando Route Handlers como camada única e fazendo proxy interno ou movendo a lógica Express para o próprio app web.
2. **Mover a API Express para subdomínio dedicado**, por exemplo `api.imoveis.munay.com.br`, eliminando colisão de `/api/*` no domínio principal.
3. **Renomear o namespace da API Express**, por exemplo `/backend/*`, deixando `/api/*` exclusivamente para o Next.

### Recomendação para este projeto

Para evitar regressão sem quebrar login, SMTP, blog, uploads e painel administrativo, a decisão mais segura é:

- **manter a arquitetura atual**
- **versionar o contrato de Nginx no repositório**
- **versionar a validação automática pós-deploy**
- **manter o mapa de rotas documentado**

Ou seja: o problema deixa de depender de conhecimento manual e passa a fazer parte do código-fonte e do checklist de deploy.

## Uploads e `.gitignore`

O `.gitignore` foi ajustado para **não ignorar qualquer pasta chamada `uploads` de forma genérica**. Isso era arriscado porque podia esconder arquivos de rota como:

- `apps/web/app/api/admin/uploads/route.ts`

Agora o ignore foi restringido ao diretório real de mídia pública em runtime:

- `apps/web/public/uploads/`

## Scripts úteis adicionados

### Gerar inventário de rotas

```bash
bash scripts/list-route-map.sh
```

### Validar roteamento do deploy

```bash
bash scripts/verify-routing.sh
```

## Checklist obrigatório antes de liberar uma versão

```bash
npm install
npm run prisma:generate
npm run build
npm run routes:map
npm run verify:routing
```

## Checklist obrigatório depois do deploy

```bash
pm2 restart portal-api
pm2 restart portal-web
pm2 save
bash scripts/verify-routing.sh
```
