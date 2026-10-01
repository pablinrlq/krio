import { randomBytes } from 'node:crypto'

const prod = process.env.NODE_ENV === 'production'
// A Vercel define VERCEL=1 nas funções e no build.
const vercel = !!process.env.VERCEL

// FASE DE TESTE: chaves fixas no código para subir na Vercel sem configurar nada.
// Antes de abrir para clientes reais, troque por variáveis de ambiente na Vercel
// (APP_SECRET, ADMIN_PASSWORD etc.) e apague estes valores.
const TESTE = {
  segredo: 'krio-teste-2026-9f4c1a7e3b8d2c6f0a5e9d1b7c3f8a2e',
  adminEmail: 'admin@krio.demo',
  adminSenha: 'krio2026',
}

function obrigatorio(nome: string, padraoDev: string) {
  const v = process.env[nome]
  if (v) return v
  if (vercel) return TESTE.segredo
  if (prod) throw new Error(`Variável de ambiente ${nome} é obrigatória em produção`)
  return padraoDev
}

function enderecoPublico() {
  if (process.env.APP_URL) return process.env.APP_URL
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (host) return `https://${host}`
  return 'http://localhost:5173'
}

export const env = {
  prod,
  vercel,
  porta: Number(process.env.PORT ?? 3000),
  // Endereço público do site, usado nos links de e-mail e no retorno do OAuth.
  urlBase: enderecoPublico().replace(/\/$/, ''),
  // Sem banco configurado, roda o Postgres embutido (PGlite). Na Vercel ele vive
  // só enquanto a função está quente: serve para demonstração, não para guardar dados.
  databaseUrl: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? '',
  pastaDados: process.env.DATA_DIR ?? (vercel ? '/tmp/krio' : './data'),
  // Onde ficam os arquivos enviados: no disco (VPS/local) ou no banco (Vercel).
  armazenamento: (process.env.ARMAZENAMENTO ?? (vercel ? 'banco' : 'disco')) as 'disco' | 'banco',
  segredo: obrigatorio('APP_SECRET', 'dev-' + randomBytes(16).toString('hex')),
  adminEmail: process.env.ADMIN_EMAIL ?? (vercel ? TESTE.adminEmail : ''),
  adminSenha: process.env.ADMIN_PASSWORD ?? (vercel ? TESTE.adminSenha : ''),
  google: { id: process.env.GOOGLE_CLIENT_ID ?? '', segredo: process.env.GOOGLE_CLIENT_SECRET ?? '' },
  instagram: { id: process.env.INSTAGRAM_APP_ID ?? '', segredo: process.env.INSTAGRAM_APP_SECRET ?? '' },
  tiktok: { id: process.env.TIKTOK_CLIENT_KEY ?? '', segredo: process.env.TIKTOK_CLIENT_SECRET ?? '' },
  smtp: {
    url: process.env.SMTP_URL ?? '',
    remetente: process.env.MAIL_FROM ?? 'KRIÔ <nao-responda@krio.com.br>',
  },
  // A Vercel aceita no máximo ~4,5 MB por requisição.
  limiteUploadMb: Number(process.env.UPLOAD_LIMIT_MB ?? (vercel ? 4 : 200)),
  // Na Vercel usando as chaves fixas de teste: a tela de entrar mostra as contas de demonstração.
  modoTeste: vercel && !process.env.APP_SECRET,
}
