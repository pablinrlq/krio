# KRIÔ · site e plataforma

Site da KRIÔ, a creator company, e a plataforma onde o trabalho acontece: marcas mandam briefing, a KRIÔ monta a lista curta, a marca passa as fichas e, quando o creator aceita, dá **MATCH** e abre a conversa entre marca, creator e KRIÔ.

Feito com React, TypeScript, Vite, Tailwind CSS 4, Motion e Lucide no navegador, e Node (Hono) + PostgreSQL (Drizzle) no servidor. Roda num servidor próprio, sem serviços de terceiros obrigatórios.

## O que tem

| Quem | O que faz |
| --- | --- |
| **Marca** | Cria conta (e-mail ou Google), faz o briefing em 4 passos, passa as fichas da lista curta (arrastar ou botões), conversa, aprova entregas ou pede ajuste (conta as rodadas), favorita creators. |
| **Creator** | Cria conta, monta a ficha (foto, nichos, formatos, idiomas, apresentação, vídeo), conecta Instagram, TikTok e YouTube pelo login oficial, manda a ficha para a curadoria, aceita convites, conversa e envia entregas. |
| **Equipe KRIÔ** | Painel com números, fila de avaliação de creators (aprovar, recusar, nota interna), quadro de pedidos por etapa, lista curta com sugestões automáticas, envio da lista para a marca, todas as conversas e marcas. |
| **Visitante** | Site público, catálogo de creators com ficha resumida, termos e privacidade. |

Também: avisos em tempo real (sino + aviso na tela), e-mails de convite, match, lista pronta e aprovação, chat com arquivos (imagem, vídeo, áudio, PDF) em tempo real, exclusão de conta (LGPD), tokens das redes cifrados, sessões seguras, proteção contra CSRF e limite de tentativas de login.

## Rodar no computador

```bash
npm install
npm run seed   # cria contas de demonstração
npm run dev    # site em http://localhost:5173, API em :3000
```

Sem `DATABASE_URL`, o banco roda embutido (PGlite) na pasta `data/`, sem instalar nada.

Contas de demonstração (senha `krio2026`):

- `admin@krio.demo`: equipe KRIÔ
- `marca@krio.demo`: marca com um pedido e a lista curta pronta
- `duda@krio.demo`: creator no casting
- `joana@krio.demo`: creator esperando avaliação

## Publicar no servidor da KRIÔ (VPS)

Qualquer VPS com Docker serve (2 GB de RAM bastam no começo).

1. Aponte o domínio (registro A) para o IP do servidor.
2. No servidor:
   ```bash
   git clone https://github.com/pablinrlq/krio.git && cd krio
   cp .env.example .env   # preencha DOMAIN, POSTGRES_PASSWORD, APP_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
   docker compose up -d --build
   ```
3. Pronto: HTTPS automático, banco PostgreSQL, arquivos em volume próprio e backup diário em `./backups` (14 dias).

Para atualizar: `git pull && docker compose up -d --build`. As migrações do banco rodam sozinhas ao subir.

## Conectar Google, Instagram, TikTok e YouTube

Cada rede precisa de um app de desenvolvedor no nome da KRIÔ. Os endereços de retorno estão no `.env.example`.

- **Google (login + YouTube):** console.cloud.google.com → Credenciais → ID do cliente OAuth (aplicativo da Web). Ative a YouTube Data API v3.
- **Instagram:** developers.facebook.com → app do tipo Empresa → produto "Instagram" com login do Instagram, permissão `instagram_business_basic`. Exige conta Meta Business verificada e revisão do app. Só conecta contas profissionais (Criador ou Comercial).
- **TikTok:** developers.tiktok.com → app com Login Kit, escopos `user.info.basic`, `user.info.profile`, `user.info.stats` e `video.list`. Passa por revisão.

Enquanto uma rede não está configurada, o botão "Conectar" avisa que está em liberação. Os números das redes se atualizam sozinhos uma vez por dia.

## Dados de contato do site

O formulário "Prefere conversar antes?" monta a mensagem e abre o WhatsApp. Preencha `src/config.ts` com o número, o Instagram e o e-mail da KRIÔ. Campos vazios ficam escondidos no rodapé.

## Estrutura

- `src/components`: seções do site público
- `src/pages` e `src/app`: telas da plataforma (acesso, marca, creator, admin, chat, baralho)
- `server/routes`: API (contas, creators, redes, pedidos, chat, admin)
- `server/db/schema.ts`: tabelas; `npm run db:gerar` cria a migração depois de mudar o schema
- `server/social.ts`: integrações com Instagram, TikTok e YouTube

## Observações

- As fichas do hero do site e as contas `@krio.demo` são ilustrativas.
- Termos de uso e política de privacidade são uma versão inicial e precisam de revisão jurídica.
