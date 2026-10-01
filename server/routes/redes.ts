import { Hono } from 'hono'
import { and, eq, lt } from 'drizzle-orm'
import { db, schema } from '../db'
import { exigir, usuarioDe, type Ambiente } from '../auth'
import { tokenAleatorio } from '../lib/cripto'
import { naoEncontrado } from '../lib/util'
import { provedores, salvarConexao, sincronizar } from '../social'
import type { Rede } from '../db/schema'

export const rotasRedes = new Hono<Ambiente>()

const REDES: Rede[] = ['instagram', 'tiktok', 'youtube']
const rede = (v: string) => (REDES.includes(v as Rede) ? (v as Rede) : null)

rotasRedes.get('/disponiveis', (c) => c.json(Object.fromEntries(REDES.map((r) => [r, provedores[r].configurado()]))))

rotasRedes.get('/:rede/conectar', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const r = rede(c.req.param('rede'))
  if (!r) throw naoEncontrado('Rede')
  if (!provedores[r].configurado()) return c.redirect(`/creator/perfil?erro=${r}-indisponivel`)
  const estado = tokenAleatorio(24)
  await db.delete(schema.estadosOauth).where(lt(schema.estadosOauth.expiraEm, new Date()))
  await db.insert(schema.estadosOauth).values({ id: estado, usuarioId: u.id, provedor: r, expiraEm: new Date(Date.now() + 10 * 60 * 1000) })
  return c.redirect(provedores[r].urlAutorizacao(estado))
})

rotasRedes.get('/:rede/retorno', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const r = rede(c.req.param('rede'))
  const { code, state, error } = c.req.query()
  if (!r) throw naoEncontrado('Rede')
  const [estado] = state ? await db.select().from(schema.estadosOauth).where(eq(schema.estadosOauth.id, state)) : []
  if (estado) await db.delete(schema.estadosOauth).where(eq(schema.estadosOauth.id, estado.id))
  if (error) return c.redirect(`/creator/perfil?erro=${r}-cancelado`)
  if (!code || !estado || estado.provedor !== r || estado.usuarioId !== u.id || estado.expiraEm < new Date()) {
    return c.redirect(`/creator/perfil?erro=${r}-expirado`)
  }
  try {
    const p = provedores[r]
    const tokens = await p.trocarCodigo(code)
    await salvarConexao(u.id, r, tokens, await p.perfil(tokens.acesso))
    return c.redirect(`/creator/perfil?conectado=${r}`)
  } catch (e) {
    console.error(`[redes] falha ao conectar ${r}:`, (e as Error).message)
    return c.redirect(`/creator/perfil?erro=${r}-falhou`)
  }
})

rotasRedes.post('/:rede/sincronizar', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const r = rede(c.req.param('rede'))
  if (!r) throw naoEncontrado('Rede')
  const [linha] = await db
    .select()
    .from(schema.redes)
    .where(and(eq(schema.redes.creatorId, u.id), eq(schema.redes.rede, r)))
  if (!linha) throw naoEncontrado('Conexão')
  await sincronizar(linha)
  return c.json({ ok: true })
})

rotasRedes.delete('/:rede', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const r = rede(c.req.param('rede'))
  if (!r) throw naoEncontrado('Rede')
  await db.delete(schema.redes).where(and(eq(schema.redes.creatorId, u.id), eq(schema.redes.rede, r)))
  return c.json({ ok: true })
})
