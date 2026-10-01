# KRIÔ · site

Site da KRIÔ, a creator company: casting, produção, studio e academy de creators.

Feito com React, TypeScript, Vite, Tailwind CSS 4, Motion e Lucide.

## Rodar no computador

```bash
npm install
npm run dev
```

## Publicar na Vercel

1. Abra <https://vercel.com/new> e importe o repositório `pablinrlq/krio`.
2. A Vercel reconhece o Vite sozinha (build `npm run build`, saída `dist`). É só clicar em **Deploy**.

Cada push gera uma nova versão do site automaticamente.

## Dados de contato

Os botões de WhatsApp montam a mensagem com o que a pessoa escolheu no site. Para mandar direto para o número da KRIÔ, preencha `src/config.ts`:

```ts
export const CONTATO = {
  whatsapp: '5531999999999', // DDI + DDD + número, só dígitos
  instagram: '@krio',
  email: 'contato@krio.com.br',
}
```

Campos vazios ficam escondidos no rodapé. Sem número, o WhatsApp abre e pede para escolher o contato.

## Observações

- As fichas de creators do hero são ilustrativas e estão marcadas assim no site.
- Paleta: pretos com fundo de oliva, verde kiwi (`#A8E063`) e tons pastel de kiwi (`#CBEE96`, `#E6F5CC`). Os tokens ficam em `src/index.css`.
