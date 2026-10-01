import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, eq, isNull, lt } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db'
import { env } from '../env'
import { contarTentativa, criarSessao, encerrarSessao, exigir, limparTentativas, usuarioDe, type Ambiente } from '../auth'
import { conferirSenha, hashSenha, tokenAleatorio } from '../lib/cripto'
import { apagarArquivo } from '../lib/arquivos'
import { avisarAdmins } from '../lib/avisos'
import { corpo, slugify } from '../lib/util'

export const rotasAuth = new Hono<Ambiente>()

const email = z.string().trim().toLowerCase().email('Confira o e-mail.')

const cadastro = z.object({
  papel: z.enum(['marca', 'creator']),
  nome: z.string().trim().min(2, 'Escreva seu nome.').max(80),
  email,
  senha: z.string().min(8, 'A senha precisa de pelo menos 8 caracteres.').max(200),
  empresa: z.string().trim().max(120).optional(),
  aceitouTermos: z.literal(true, { error: 'Aceite os termos de uso e a política de privacidade.' }),
})

export async function slugLivre(base: string) {
  const raiz = slugify(base) || 'creator'
  for (let i = 0; i < 20; i++) {
    const s = i === 0 ? raiz : `${raiz}-${Math.random().toString(36).slice(2, 6)}`
    const [ja] = await db.select({ s: schema.creators.slug }).from(schema.creators).where(eq(schema.creators.slug, s))
    if (!ja) return s
  }
  return `${raiz}-${Date.now().toString(36)}`
}

async function criarConta(d: { papel: 'marca' | 'creator'; nome: string; email: string; senhaHash?: string; googleId?: string; empresa?: string }) {
  const [u] = await db
    .insert(schema.usuarios)
    .values({ email: d.email, nome: d.nome, senhaHash: d.senhaHash, googleId: d.googleId, papel: d.papel, aceitouTermosEm: new Date() })
    .returning()
  if (d.papel === 'marca') {
    await db.insert(schema.marcas).values({ usuarioId: u.id, empresa: d.empresa?.trim() || d.nome })
    await avisarAdmins(`Nova marca cadastrada: ${d.empresa?.trim() || d.nome}`, '/admin')
  } else {
    await db.insert(schema.creators).values({ usuarioId: u.id, nomeArtistico: d.nome, slug: await slugLivre(d.nome) })
  }
  return u
}

rotasAuth.post('/cadastro', async (c) => {
  const d = await corpo(c, cadastro)
  if (d.papel === 'marca' && !d.empresa?.trim()) throw new HTTPException(400, { message: 'Diga o nome da marca ou empresa.' })
  const [ja] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.email, d.email))
  if (ja) throw new HTTPException(409, { message: 'Já existe uma conta com este e-mail. Entre com ele.' })
  const u = await criarConta({ ...d, senhaHash: await hashSenha(d.senha) })
  await criarSessao(c, u.id)
  return c.json({ ok: true, papel: u.papel })
})

rotasAuth.post('/entrar', async (c) => {
  const d = await corpo(c, z.object({ email, senha: z.string().min(1, 'Digite a senha.') }))
  const chave = `${c.req.header('x-forwarded-for') ?? 'local'}:${d.email}`
  if (!contarTentativa(chave)) throw new HTTPException(429, { message: 'Muitas tentativas. Espere 15 minutos e tente de novo.' })
  const [u] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, d.email))
  if (!u || !u.senhaHash || !(await conferirSenha(d.senha, u.senhaHash))) {
    throw new HTTPException(401, { message: u && !u.senhaHash ? 'Esta conta entra com o Google.' : 'E-mail ou senha não conferem.' })
  }
  limparTentativas(chave)
  await criarSessao(c, u.id)
  return c.json({ ok: true, papel: u.papel })
})

rotasAuth.post('/sair', async (c) => {
  await encerrarSessao(c)
  return c.json({ ok: true })
})

rotasAuth.get('/eu', async (c) => {
  const u = c.get('usuario')
  if (!u) return c.json({ usuario: null })
  const naoLidos = await db.$count(schema.avisos, and(eq(schema.avisos.usuarioId, u.id), isNull(schema.avisos.lidoEm)))
  return c.json({ usuario: u, avisos: naoLidos, google: !!env.google.id })
})

rotasAuth.get('/config', (c) => c.json({ google: !!env.google.id }))

// Exclusão de conta (LGPD): apaga a pessoa e tudo que é dela.
rotasAuth.delete('/conta', exigir(), async (c) => {
  const u = usuarioDe(c)
  if (u.papel === 'admin') throw new HTTPException(400, { message: 'Contas de administrador são removidas por outro administrador.' })
  const meus = await db.select({ caminho: schema.arquivos.caminho }).from(schema.arquivos).where(eq(schema.arquivos.donoId, u.id))
  await db.delete(schema.usuarios).where(eq(schema.usuarios.id, u.id))
  await Promise.all(meus.map((a) => apagarArquivo(a.caminho)))
  await encerrarSessao(c)
  return c.json({ ok: true })
})

// ---------- Login com Google ----------

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token'
const GOOGLE_INFO = 'https://openidconnect.googleapis.com/v1/userinfo'

rotasAuth.get('/google', async (c) => {
  if (!env.google.id) throw new HTTPException(404, { message: 'Login com Google ainda não configurado.' })
  const papel = c.req.query('papel') === 'creator' ? 'creator' : c.req.query('papel') === 'marca' ? 'marca' : null
  const estado = tokenAleatorio(24)
  await db.delete(schema.estadosOauth).where(lt(schema.estadosOauth.expiraEm, new Date()))
  await db.insert(schema.estadosOauth).values({ id: estado, provedor: 'google', extra: { papel }, expiraEm: new Date(Date.now() + 10 * 60 * 1000) })
  const p = new URLSearchParams({
    client_id: env.google.id,
    redirect_uri: `${env.urlBase}/api/auth/google/retorno`,
    response_type: 'code',
    scope: 'openid email profile',
    state: estado,
    prompt: 'select_account',
  })
  return c.redirect(`${GOOGLE_AUTH}?${p}`)
})

rotasAuth.get('/google/retorno', async (c) => {
  const { code, state } = c.req.query()
  const [estado] = state ? await db.select().from(schema.estadosOauth).where(eq(schema.estadosOauth.id, state)) : []
  if (!code || !estado || estado.provedor !== 'google' || estado.expiraEm < new Date()) return c.redirect('/entrar?erro=google')
  await db.delete(schema.estadosOauth).where(eq(schema.estadosOauth.id, estado.id))

  const tok = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.google.id,
      client_secret: env.google.segredo,
      redirect_uri: `${env.urlBase}/api/auth/google/retorno`,
      grant_type: 'authorization_code',
    }),
  }).then((r) => r.json() as Promise<{ access_token?: string }>)
  if (!tok.access_token) return c.redirect('/entrar?erro=google')
  const info = await fetch(GOOGLE_INFO, { headers: { authorization: `Bearer ${tok.access_token}` } }).then(
    (r) => r.json() as Promise<{ sub: string; email?: string; email_verified?: boolean; name?: string }>,
  )
  if (!info.sub || !info.email || !info.email_verified) return c.redirect('/entrar?erro=google')

  const emailG = info.email.toLowerCase()
  let [u] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.googleId, info.sub))
  if (!u) {
    ;[u] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, emailG))
    if (u) await db.update(schema.usuarios).set({ googleId: info.sub }).where(eq(schema.usuarios.id, u.id))
  }
  if (!u) {
    const papel = (estado.extra as { papel?: 'marca' | 'creator' } | null)?.papel
    if (!papel) return c.redirect('/cadastro?erro=google-sem-conta')
    u = await criarConta({ papel, nome: info.name || emailG.split('@')[0], email: emailG, googleId: info.sub })
  }
  await criarSessao(c, u.id)
  return c.redirect('/painel')
})
