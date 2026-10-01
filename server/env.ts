import { randomBytes } from 'node:crypto'

const prod = process.env.NODE_ENV === 'production'

function obrigatorio(nome: string, padraoDev: string) {
  const v = process.env[nome]
  if (v) return v
  if (prod) throw new Error(`Variável de ambiente ${nome} é obrigatória em produção`)
  return padraoDev
}

export const env = {
  prod,
  porta: Number(process.env.PORT ?? 3000),
  // Endereço público do site, usado nos links de e-mail e no retorno do OAuth.
  urlBase: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  // Sem DATABASE_URL, o banco roda embutido (PGlite) na pasta data/.
  databaseUrl: process.env.DATABASE_URL ?? '',
  pastaDados: process.env.DATA_DIR ?? './data',
  // Chave de 32+ caracteres para cifrar tokens das redes sociais.
  segredo: obrigatorio('APP_SECRET', 'dev-' + randomBytes(16).toString('hex')),
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminSenha: process.env.ADMIN_PASSWORD ?? '',
  google: { id: process.env.GOOGLE_CLIENT_ID ?? '', segredo: process.env.GOOGLE_CLIENT_SECRET ?? '' },
  instagram: { id: process.env.INSTAGRAM_APP_ID ?? '', segredo: process.env.INSTAGRAM_APP_SECRET ?? '' },
  tiktok: { id: process.env.TIKTOK_CLIENT_KEY ?? '', segredo: process.env.TIKTOK_CLIENT_SECRET ?? '' },
  smtp: {
    url: process.env.SMTP_URL ?? '',
    remetente: process.env.MAIL_FROM ?? 'KRIÔ <nao-responda@krio.com.br>',
  },
  limiteUploadMb: Number(process.env.UPLOAD_LIMIT_MB ?? 200),
}
