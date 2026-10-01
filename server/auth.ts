import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { and, eq, gt } from 'drizzle-orm'
import { db, schema } from './db'
import { env } from './env'
import { sha256, tokenAleatorio } from './lib/cripto'
import type { Papel } from './db/schema'

export type Usuario = { id: string; nome: string; email: string; papel: Papel }
export type Ambiente = { Variables: { usuario: Usuario | null } }

const COOKIE = 'krio_sessao'
const DIA = 24 * 60 * 60 * 1000
const DURACAO = 30 * DIA

export async function criarSessao(c: Context, usuarioId: string) {
  const token = tokenAleatorio()
  const expiraEm = new Date(Date.now() + DURACAO)
  await db.insert(schema.sessoes).values({ id: sha256(token), usuarioId, expiraEm })
  setCookie(c, COOKIE, token, { httpOnly: true, secure: env.urlBase.startsWith('https://'), sameSite: 'Lax', path: '/', expires: expiraEm })
}

export async function encerrarSessao(c: Context) {
  const token = getCookie(c, COOKIE)
  if (token) await db.delete(schema.sessoes).where(eq(schema.sessoes.id, sha256(token)))
  deleteCookie(c, COOKIE, { path: '/' })
}

export const carregarUsuario = createMiddleware<Ambiente>(async (c, next) => {
  c.set('usuario', null)
  const token = getCookie(c, COOKIE)
  if (token) {
    const id = sha256(token)
    const [linha] = await db
      .select({ u: schema.usuarios, expiraEm: schema.sessoes.expiraEm })
      .from(schema.sessoes)
      .innerJoin(schema.usuarios, eq(schema.usuarios.id, schema.sessoes.usuarioId))
      .where(and(eq(schema.sessoes.id, id), gt(schema.sessoes.expiraEm, new Date())))
    if (linha) {
      c.set('usuario', { id: linha.u.id, nome: linha.u.nome, email: linha.u.email, papel: linha.u.papel })
      // Sessão deslizante: renova quando passa da metade.
      if (linha.expiraEm.getTime() - Date.now() < DURACAO / 2) {
        const expiraEm = new Date(Date.now() + DURACAO)
        await db.update(schema.sessoes).set({ expiraEm }).where(eq(schema.sessoes.id, id))
        setCookie(c, COOKIE, token, { httpOnly: true, secure: env.urlBase.startsWith('https://'), sameSite: 'Lax', path: '/', expires: expiraEm })
      }
    }
  }
  await next()
})

export function exigir(...papeis: Papel[]): MiddlewareHandler<Ambiente> {
  return async (c, next) => {
    const u = c.get('usuario')
    if (!u) throw new HTTPException(401, { message: 'Entre na sua conta para continuar.' })
    if (papeis.length && !papeis.includes(u.papel)) throw new HTTPException(403, { message: 'Sua conta não tem acesso a esta área.' })
    await next()
  }
}

export function usuarioDe(c: Context<Ambiente>) {
  const u = c.get('usuario')
  if (!u) throw new HTTPException(401, { message: 'Entre na sua conta para continuar.' })
  return u
}

// Limite simples de tentativas de login por IP + e-mail.
const tentativas = new Map<string, { n: number; ate: number }>()
export function contarTentativa(chave: string) {
  const agora = Date.now()
  const t = tentativas.get(chave)
  if (!t || t.ate < agora) {
    tentativas.set(chave, { n: 1, ate: agora + 15 * 60 * 1000 })
    return true
  }
  t.n++
  return t.n <= 10
}
export const limparTentativas = (chave: string) => tentativas.delete(chave)
