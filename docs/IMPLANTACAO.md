# Implantação

Como publicar a plataforma e ligar as integrações. Para rodar localmente, veja o [README](../README.md#rodando-localmente).

## Publicar na Vercel (fase de teste)

1. Abra <https://vercel.com/new>, importe o repositório `pablinrlq/krio` e clique em **Deploy** sem mudar nada. O site já sobe em modo de demonstração (os dados voltam ao exemplo quando a função esfria).
2. Para guardar os dados de verdade: no projeto da Vercel, **Storage › Create Database › Neon (Postgres) › Connect**. Depois, em **Deployments**, clique em **Redeploy**. No primeiro acesso o banco é criado sozinho e ganha as contas de demonstração.
3. A tela de entrar mostra as contas de teste (senha `krio2026`).

Na Vercel: arquivos do chat e fotos vão até 4 MB e ficam guardados no banco; mensagens e avisos chegam a cada 3 segundos; as redes sociais são atualizadas uma vez por dia pelo Vercel Cron.

**Chaves de teste no código:** `server/env.ts` (bloco `TESTE`) tem a chave de sessão e a senha do admin fixas. Antes de abrir para clientes reais, defina `APP_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` em **Settings › Environment Variables** na Vercel e apague esses valores do código.

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

