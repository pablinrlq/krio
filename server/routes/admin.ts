import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, count, desc, eq, inArray, isNotNull, notInArray } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db'
import { exigir, usuarioDe, type Ambiente } from '../auth'
import { ficha, redesDe } from '../fichas'
import { avisar } from '../lib/avisos'
import { corpo, naoEncontrado } from '../lib/util'
import { conversaDoPedido, publicarMensagem } from './chat'
import { detalhePedido } from './pedidos'

export const rotasAdmin = new Hono<Ambiente>()
rotasAdmin.use('*', exigir('admin'))

rotasAdmin.get('/resumo', async (c) => {
  const porStatus = await db.select({ status: schema.pedidos.status, n: count() }).from(schema.pedidos).groupBy(schema.pedidos.status)
  const creatorsPorStatus = await db.select({ status: schema.creators.status, n: count() }).from(schema.creators).groupBy(schema.creators.status)
  const marcas = await db.$count(schema.marcas)
  const matches = await db.$count(schema.candidatos, isNotNull(schema.candidatos.matchEm))
  const recentes = await db
    .select({ p: schema.pedidos, empresa: schema.marcas.empresa })
    .from(schema.pedidos)
    .innerJoin(schema.marcas, eq(schema.marcas.usuarioId, schema.pedidos.marcaId))
    .orderBy(desc(schema.pedidos.criadoEm))
    .limit(6)
  const fila = await db
    .select()
    .from(schema.creators)
    .where(eq(schema.creators.status, 'em_analise'))
    .orderBy(desc(schema.creators.atualizadoEm))
    .limit(6)
  const redes = await redesDe(fila.map((f) => f.usuarioId))
  return c.json({
    pedidos: Object.fromEntries(porStatus.map((x) => [x.status, x.n])),
    creators: Object.fromEntries(creatorsPorStatus.map((x) => [x.status, x.n])),
    marcas,
    matches,
    recentes: recentes.map((r) => ({ id: r.p.id, titulo: r.p.titulo, status: r.p.status, empresa: r.empresa, criadoEm: r.p.criadoEm })),
    fila: fila.map((f) => ficha(f, redes.get(f.usuarioId) ?? [], true)),
  })
})

// ---------- Creators ----------

rotasAdmin.get('/creators', async (c) => {
  const status = c.req.query('status')
  const linhas = await db
    .select({ cr: schema.creators, email: schema.usuarios.email })
    .from(schema.creators)
    .innerJoin(schema.usuarios, eq(schema.usuarios.id, schema.creators.usuarioId))
    .where(status ? eq(schema.creators.status, status as 'em_analise') : undefined)
    .orderBy(desc(schema.creators.atualizadoEm))
  const redes = await redesDe(linhas.map((l) => l.cr.usuarioId))
  return c.json(
    linhas.map((l) => ({
      ...ficha(l.cr, redes.get(l.cr.usuarioId) ?? [], true),
      status: l.cr.status,
      notaInterna: l.cr.notaInterna,
      email: l.email,
      whatsapp: l.cr.whatsapp,
      academy: l.cr.academy,
    })),
  )
})

rotasAdmin.post('/creators/:id/status', async (c) => {
  const { status, nota, motivo } = await corpo(
    c,
    z.object({ status: z.enum(['aprovado', 'recusado', 'em_analise']), nota: z.string().trim().max(1000).optional(), motivo: z.string().trim().max(600).optional() }),
  )
  const id = c.req.param('id')
  const [cr] = await db.select().from(schema.creators).where(eq(schema.creators.usuarioId, id))
  if (!cr) throw naoEncontrado('Creator')
  await db
    .update(schema.creators)
    .set({ status, ...(nota !== undefined ? { notaInterna: nota } : {}), atualizadoEm: new Date() })
    .where(eq(schema.creators.usuarioId, id))
  if (status === 'aprovado') await avisar(id, 'Sua ficha foi aprovada! Você já está no casting da KRIÔ.', '/creator', true)
  if (status === 'recusado') await avisar(id, `Sua ficha ainda não entrou no casting.${motivo ? ` ${motivo}` : ''} Ajuste e envie de novo quando quiser.`, '/creator/perfil', true)
  return c.json({ ok: true })
})

// ---------- Pedidos ----------

rotasAdmin.get('/pedidos', async (c) => {
  const ps = await db
    .select({ p: schema.pedidos, empresa: schema.marcas.empresa })
    .from(schema.pedidos)
    .innerJoin(schema.marcas, eq(schema.marcas.usuarioId, schema.pedidos.marcaId))
    .orderBy(desc(schema.pedidos.atualizadoEm))
  const cands = ps.length ? await db.select().from(schema.candidatos).where(inArray(schema.candidatos.pedidoId, ps.map((x) => x.p.id))) : []
  return c.json(
    ps.map(({ p, empresa }) => {
      const cs = cands.filter((x) => x.pedidoId === p.id)
      return { ...p, empresa, lista: cs.length, matches: cs.filter((x) => x.matchEm).length, convites: cs.filter((x) => x.respostaCreator === 'pendente').length }
    }),
  )
})

rotasAdmin.get('/pedidos/:id', async (c) => c.json(await detalhePedido(c.req.param('id'), usuarioDe(c))))

rotasAdmin.patch('/pedidos/:id', async (c) => {
  const d = await corpo(
    c,
    z.object({
      status: z.enum(['briefing', 'match', 'producao', 'entrega', 'concluido', 'cancelado']).optional(),
      rodadasTotal: z.number().int().min(0).max(20).optional(),
    }),
  )
  const [p] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.id, c.req.param('id')))
  if (!p) throw naoEncontrado('Pedido')
  await db.update(schema.pedidos).set({ ...d, atualizadoEm: new Date() }).where(eq(schema.pedidos.id, p.id))
  if (d.status && d.status !== p.status) {
    const nomes = { briefing: 'Briefing', match: 'Match', producao: 'Produção', entrega: 'Entrega', concluido: 'Concluído', cancelado: 'Cancelado' }
    const conversa = await conversaDoPedido(p.id, null)
    await publicarMensagem({ conversaId: conversa.id, autorId: null, tipo: 'sistema', texto: `O pedido passou para a etapa: ${nomes[d.status]}.` })
    await avisar(p.marcaId, `"${p.titulo}" agora está em ${nomes[d.status]}`, `/marca/pedidos/${p.id}`, d.status === 'concluido')
  }
  return c.json({ ok: true })
})

// Sugestões automáticas para a lista curta: pontua cada creator aprovado pelo
// quanto combina com o briefing. A decisão final é da curadoria.
rotasAdmin.get('/pedidos/:id/sugestoes', async (c) => {
  const [p] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.id, c.req.param('id')))
  if (!p) throw naoEncontrado('Pedido')
  const ja = (await db.select({ id: schema.candidatos.creatorId }).from(schema.candidatos).where(eq(schema.candidatos.pedidoId, p.id))).map((x) => x.id)
  const crs = await db
    .select()
    .from(schema.creators)
    .where(and(eq(schema.creators.status, 'aprovado'), ja.length ? notInArray(schema.creators.usuarioId, ja) : undefined))
  const redes = await redesDe(crs.map((x) => x.usuarioId))
  const perfil = (p.perfilCreator ?? '').toLowerCase()
  const pontuados = crs.map((cr) => {
    const motivos: string[] = []
    let pontos = 0
    const nichos = cr.nichos.filter((n) => p.nichos.includes(n))
    if (nichos.length) {
      pontos += 30 * nichos.length
      motivos.push(`Nicho: ${nichos.join(', ')}`)
    }
    if (cr.formatos.includes(p.modalidade)) {
      pontos += 20
      motivos.push(`Faz ${p.modalidade}`)
    }
    const idiomas = cr.idiomas.filter((i) => p.idiomas.includes(i))
    if (idiomas.length) {
      pontos += 10 * idiomas.length
      motivos.push(`Idioma: ${idiomas.join(', ')}`)
    }
    if (cr.cidade && perfil.includes(cr.cidade.toLowerCase())) {
      pontos += 15
      motivos.push(`Cidade: ${cr.cidade}`)
    }
    if (cr.linguagem && perfil && cr.linguagem.toLowerCase().split(/\s+/).some((w) => w.length > 3 && perfil.includes(w))) {
      pontos += 10
      motivos.push(`Linguagem: ${cr.linguagem}`)
    }
    const rs = redes.get(cr.usuarioId) ?? []
    const alcance = rs.reduce((s, r) => s + (r.seguidores ?? 0), 0)
    if (alcance) pontos += Math.min(20, Math.round(Math.log10(alcance) * 3))
    const eng = Math.max(0, ...rs.map((r) => r.engajamento ?? 0))
    if (eng >= 300) {
      pontos += 10
      motivos.push(`Engajamento ${(eng / 100).toFixed(1).replace('.', ',')}%`)
    }
    return { pontos, motivos, creator: ficha(cr, rs, true) }
  })
  pontuados.sort((a, b) => b.pontos - a.pontos)
  return c.json(pontuados.slice(0, 24))
})

rotasAdmin.post('/pedidos/:id/candidatos', async (c) => {
  const { creatorId, nota } = await corpo(c, z.object({ creatorId: z.string().min(1), nota: z.string().trim().max(400).optional() }))
  const [p] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.id, c.req.param('id')))
  if (!p) throw naoEncontrado('Pedido')
  const [cr] = await db.select().from(schema.creators).where(eq(schema.creators.usuarioId, creatorId))
  if (!cr || cr.status !== 'aprovado') throw new HTTPException(400, { message: 'Só creators aprovados entram na lista curta.' })
  await db.insert(schema.candidatos).values({ pedidoId: p.id, creatorId, notaKrio: nota }).onConflictDoNothing()
  return c.json({ ok: true })
})

rotasAdmin.patch('/candidatos/:cid', async (c) => {
  const { nota } = await corpo(c, z.object({ nota: z.string().trim().max(400) }))
  await db.update(schema.candidatos).set({ notaKrio: nota }).where(eq(schema.candidatos.id, c.req.param('cid')))
  return c.json({ ok: true })
})

rotasAdmin.delete('/candidatos/:cid', async (c) => {
  const [cand] = await db.select().from(schema.candidatos).where(eq(schema.candidatos.id, c.req.param('cid')))
  if (!cand) throw naoEncontrado('Candidato')
  if (cand.matchEm) throw new HTTPException(409, { message: 'Este creator já deu match; não dá para tirar da lista.' })
  await db.delete(schema.candidatos).where(eq(schema.candidatos.id, cand.id))
  return c.json({ ok: true })
})

// Manda a lista curta para a marca começar a passar as fichas.
rotasAdmin.post('/pedidos/:id/enviar-lista', async (c) => {
  const [p] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.id, c.req.param('id')))
  if (!p) throw naoEncontrado('Pedido')
  const n = await db.$count(schema.candidatos, and(eq(schema.candidatos.pedidoId, p.id), eq(schema.candidatos.decisaoMarca, 'pendente')))
  if (!n) throw new HTTPException(400, { message: 'Adicione creators à lista antes de enviar.' })
  if (p.status === 'briefing') await db.update(schema.pedidos).set({ status: 'match', atualizadoEm: new Date() }).where(eq(schema.pedidos.id, p.id))
  const conversa = await conversaDoPedido(p.id, null)
  await publicarMensagem({
    conversaId: conversa.id,
    autorId: null,
    tipo: 'sistema',
    texto: `A lista curta está pronta: ${n} ${n === 1 ? 'creator selecionado' : 'creators selecionados'} para você. Passe as fichas e diga quem você quer.`,
  })
  await avisar(p.marcaId, `Sua lista curta para "${p.titulo}" está pronta`, `/marca/pedidos/${p.id}`, true)
  return c.json({ ok: true })
})

rotasAdmin.get('/marcas', async (c) => {
  const linhas = await db
    .select({ m: schema.marcas, u: schema.usuarios })
    .from(schema.marcas)
    .innerJoin(schema.usuarios, eq(schema.usuarios.id, schema.marcas.usuarioId))
    .orderBy(desc(schema.usuarios.criadoEm))
  const ps = await db.select({ marcaId: schema.pedidos.marcaId, n: count() }).from(schema.pedidos).groupBy(schema.pedidos.marcaId)
  return c.json(
    linhas.map(({ m, u }) => ({
      id: m.usuarioId,
      empresa: m.empresa,
      nome: u.nome,
      email: u.email,
      whatsapp: m.whatsapp,
      criadoEm: u.criadoEm,
      pedidos: ps.find((x) => x.marcaId === m.usuarioId)?.n ?? 0,
    })),
  )
})
