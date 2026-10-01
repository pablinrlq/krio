import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, desc, eq, gt, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db'
import { exigir, usuarioDe, type Ambiente, type Usuario } from '../auth'
import { ErroArquivo, salvarArquivo } from '../lib/arquivos'
import { avisar } from '../lib/avisos'
import { corpo, naoEncontrado, proibido } from '../lib/util'

export const rotasChat = new Hono<Ambiente>()

async function dadosConversa(conversaId: string) {
  const [linha] = await db
    .select({ conversa: schema.conversas, pedido: schema.pedidos, candidato: schema.candidatos })
    .from(schema.conversas)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.conversas.pedidoId))
    .leftJoin(schema.candidatos, eq(schema.candidatos.id, schema.conversas.candidatoId))
    .where(eq(schema.conversas.id, conversaId))
  return linha ?? null
}

export async function podeVerConversa(u: Usuario, conversaId: string) {
  const d = await dadosConversa(conversaId)
  if (!d) return false
  if (u.papel === 'admin') return true
  if (u.papel === 'marca') return d.pedido.marcaId === u.id
  return !!d.candidato && d.candidato.creatorId === u.id && !!d.candidato.matchEm
}

export async function participantes(conversaId: string) {
  const d = await dadosConversa(conversaId)
  if (!d) return []
  const admins = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.papel, 'admin'))
  const ids = new Set([d.pedido.marcaId, ...admins.map((a) => a.id)])
  if (d.candidato?.matchEm) ids.add(d.candidato.creatorId)
  return [...ids]
}

export async function conversaDoPedido(pedidoId: string, candidatoId: string | null) {
  const filtro = and(
    eq(schema.conversas.pedidoId, pedidoId),
    candidatoId ? eq(schema.conversas.candidatoId, candidatoId) : isNull(schema.conversas.candidatoId),
  )
  const [ja] = await db.select().from(schema.conversas).where(filtro)
  if (ja) return ja
  const [nova] = await db.insert(schema.conversas).values({ pedidoId, candidatoId }).onConflictDoNothing().returning()
  return nova ?? (await db.select().from(schema.conversas).where(filtro))[0]
}

type MensagemRow = typeof schema.mensagens.$inferSelect

async function serializar(ms: MensagemRow[]) {
  const autores = [...new Set(ms.map((m) => m.autorId).filter(Boolean))] as string[]
  const arqs = [...new Set(ms.map((m) => m.arquivoId).filter(Boolean))] as string[]
  const us = autores.length
    ? await db.select({ id: schema.usuarios.id, nome: schema.usuarios.nome, papel: schema.usuarios.papel }).from(schema.usuarios).where(inArray(schema.usuarios.id, autores))
    : []
  const as = arqs.length
    ? await db.select({ id: schema.arquivos.id, nome: schema.arquivos.nome, tipo: schema.arquivos.tipo, tamanho: schema.arquivos.tamanho }).from(schema.arquivos).where(inArray(schema.arquivos.id, arqs))
    : []
  return ms.map((m) => {
    const a = as.find((x) => x.id === m.arquivoId)
    return {
      id: m.id,
      conversaId: m.conversaId,
      tipo: m.tipo,
      texto: m.texto,
      statusEntrega: m.statusEntrega,
      criadoEm: m.criadoEm,
      autor: us.find((x) => x.id === m.autorId) ?? null,
      arquivo: a ? { id: a.id, nome: a.nome, tipo: a.tipo, tamanho: a.tamanho, url: `/api/arquivos/${a.id}` } : null,
    }
  })
}

export async function publicarMensagem(valores: typeof schema.mensagens.$inferInsert, avisoTexto?: string) {
  const [m] = await db.insert(schema.mensagens).values(valores).returning()
  const [s] = await serializar([m])
  if (avisoTexto) {
    const ids = await participantes(m.conversaId)
    const d = await dadosConversa(m.conversaId)
    for (const id of ids) {
      if (id === valores.autorId) continue
      const [u] = await db.select({ papel: schema.usuarios.papel }).from(schema.usuarios).where(eq(schema.usuarios.id, id))
      const link =
        u?.papel === 'creator'
          ? `/creator/trabalhos/${d?.candidato?.id}`
          : `${u?.papel === 'admin' ? '/admin/pedidos' : '/marca/pedidos'}/${d?.pedido.id}?conversa=${m.conversaId}`
      await avisar(id, avisoTexto, link)
    }
  }
  return s
}

async function exigirConversa(u: Usuario, id: string) {
  if (!(await podeVerConversa(u, id))) throw proibido('Você não participa desta conversa.')
  return (await dadosConversa(id))!
}

// Lista de conversas que a pessoa pode ver, com a última mensagem.
rotasChat.get('/conversas', exigir(), async (c) => {
  const u = usuarioDe(c)
  const base = db
    .select({ conversa: schema.conversas, pedido: schema.pedidos, candidato: schema.candidatos, creatorNome: schema.creators.nomeArtistico, marcaNome: schema.marcas.empresa })
    .from(schema.conversas)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.conversas.pedidoId))
    .innerJoin(schema.marcas, eq(schema.marcas.usuarioId, schema.pedidos.marcaId))
    .leftJoin(schema.candidatos, eq(schema.candidatos.id, schema.conversas.candidatoId))
    .leftJoin(schema.creators, eq(schema.creators.usuarioId, schema.candidatos.creatorId))
  const linhas =
    u.papel === 'admin'
      ? await base
      : u.papel === 'marca'
        ? await base.where(eq(schema.pedidos.marcaId, u.id))
        : await base.where(and(eq(schema.candidatos.creatorId, u.id), isNotNull(schema.candidatos.matchEm)))
  const ids = linhas.map((l) => l.conversa.id)
  if (!ids.length) return c.json([])
  const ultimas = await db
    .selectDistinctOn([schema.mensagens.conversaId])
    .from(schema.mensagens)
    .where(inArray(schema.mensagens.conversaId, ids))
    .orderBy(schema.mensagens.conversaId, desc(schema.mensagens.criadoEm))
  const lidas = await db.select().from(schema.leituras).where(and(eq(schema.leituras.usuarioId, u.id), inArray(schema.leituras.conversaId, ids)))
  const naoLidas = await Promise.all(
    ids.map(async (id) => {
      const l = lidas.find((x) => x.conversaId === id)
      return db.$count(
        schema.mensagens,
        and(eq(schema.mensagens.conversaId, id), l ? gt(schema.mensagens.criadoEm, l.lidoEm) : undefined, ne(sql`coalesce(${schema.mensagens.autorId}, '')`, u.id)),
      )
    }),
  )
  const res = linhas.map((l, i) => {
    const ult = ultimas.find((m) => m.conversaId === l.conversa.id)
    return {
      id: l.conversa.id,
      pedidoId: l.pedido.id,
      pedidoTitulo: l.pedido.titulo,
      marca: l.marcaNome,
      creator: l.creatorNome,
      geral: !l.candidato,
      ultima: ult ? { texto: ult.tipo === 'texto' || ult.tipo === 'sistema' ? ult.texto : 'Arquivo enviado', criadoEm: ult.criadoEm } : null,
      naoLidas: naoLidas[i],
    }
  })
  res.sort((a, b) => +new Date(b.ultima?.criadoEm ?? 0) - +new Date(a.ultima?.criadoEm ?? 0))
  return c.json(res)
})

rotasChat.get('/conversas/:id', exigir(), async (c) => {
  const u = usuarioDe(c)
  const d = await exigirConversa(u, c.req.param('id'))
  const ms = await db
    .select()
    .from(schema.mensagens)
    .where(eq(schema.mensagens.conversaId, d.conversa.id))
    .orderBy(desc(schema.mensagens.criadoEm))
    .limit(300)
  let creatorNome: string | null = null
  if (d.candidato) {
    const [cr] = await db.select({ n: schema.creators.nomeArtistico }).from(schema.creators).where(eq(schema.creators.usuarioId, d.candidato.creatorId))
    creatorNome = cr?.n ?? null
  }
  return c.json({
    id: d.conversa.id,
    pedido: { id: d.pedido.id, titulo: d.pedido.titulo, rodadasTotal: d.pedido.rodadasTotal, rodadasUsadas: d.pedido.rodadasUsadas, status: d.pedido.status },
    creator: creatorNome,
    geral: !d.candidato,
    mensagens: await serializar(ms.reverse()),
  })
})

rotasChat.post('/conversas/:id/mensagens', exigir(), async (c) => {
  const u = usuarioDe(c)
  const d = await exigirConversa(u, c.req.param('id'))
  const { texto } = await corpo(c, z.object({ texto: z.string().trim().min(1, 'Escreva uma mensagem.').max(4000) }))
  const m = await publicarMensagem({ conversaId: d.conversa.id, autorId: u.id, tipo: 'texto', texto }, `Nova mensagem de ${u.nome} em "${d.pedido.titulo}"`)
  await marcarLida(d.conversa.id, u.id)
  return c.json(m)
})

rotasChat.post('/conversas/:id/arquivos', exigir(), async (c) => {
  const u = usuarioDe(c)
  const d = await exigirConversa(u, c.req.param('id'))
  const corpoForm = await c.req.parseBody()
  const f = corpoForm['arquivo']
  if (!(f instanceof File)) throw new HTTPException(400, { message: 'Escolha um arquivo.' })
  const entrega = corpoForm['entrega'] === 'true' && (u.papel === 'creator' || u.papel === 'admin') && !!d.candidato
  try {
    const a = await salvarArquivo(f, u.id)
    const texto = String(corpoForm['texto'] ?? '').slice(0, 1000)
    const m = await publicarMensagem(
      { conversaId: d.conversa.id, autorId: u.id, tipo: entrega ? 'entrega' : 'arquivo', texto, arquivoId: a.id, statusEntrega: entrega ? 'aguardando' : null },
      entrega ? `Nova entrega para aprovar em "${d.pedido.titulo}"` : `${u.nome} enviou um arquivo em "${d.pedido.titulo}"`,
    )
    if (entrega && d.pedido.status === 'match') {
      await db.update(schema.pedidos).set({ status: 'producao', atualizadoEm: new Date() }).where(eq(schema.pedidos.id, d.pedido.id))
    }
    return c.json(m)
  } catch (e) {
    if (e instanceof ErroArquivo) throw new HTTPException(400, { message: e.message })
    throw e
  }
})

// A marca aprova uma entrega ou pede ajuste (conta uma rodada do pacote).
rotasChat.post('/mensagens/:id/entrega', exigir('marca', 'admin'), async (c) => {
  const u = usuarioDe(c)
  const { acao, comentario } = await corpo(c, z.object({ acao: z.enum(['aprovar', 'ajuste']), comentario: z.string().trim().max(2000).optional() }))
  const [m] = await db.select().from(schema.mensagens).where(eq(schema.mensagens.id, c.req.param('id')))
  if (!m || m.tipo !== 'entrega') throw naoEncontrado('Entrega')
  const d = await exigirConversa(u, m.conversaId)
  if (m.statusEntrega !== 'aguardando') throw new HTTPException(409, { message: 'Esta entrega já foi respondida.' })
  if (acao === 'ajuste' && !comentario) throw new HTTPException(400, { message: 'Conte o que precisa ajustar.' })

  const status = acao === 'aprovar' ? 'aprovado' : 'ajuste'
  await db.update(schema.mensagens).set({ statusEntrega: status, atualizadoEm: new Date() }).where(eq(schema.mensagens.id, m.id))
  let texto: string
  if (acao === 'aprovar') {
    texto = `${u.nome} aprovou a entrega.${comentario ? ` "${comentario}"` : ''}`
    await db.update(schema.pedidos).set({ status: 'entrega', atualizadoEm: new Date() }).where(and(eq(schema.pedidos.id, d.pedido.id), inArray(schema.pedidos.status, ['match', 'producao'])))
  } else {
    const usadas = d.pedido.rodadasUsadas + 1
    await db.update(schema.pedidos).set({ rodadasUsadas: usadas, atualizadoEm: new Date() }).where(eq(schema.pedidos.id, d.pedido.id))
    const extra = usadas > d.pedido.rodadasTotal ? ' Esta rodada passa do que o pacote inclui; a KRIÔ vai combinar com a marca.' : ''
    texto = `${u.nome} pediu ajuste (rodada ${usadas} de ${d.pedido.rodadasTotal}): "${comentario}".${extra}`
  }
  await publicarMensagem({ conversaId: m.conversaId, autorId: null, tipo: 'sistema', texto }, acao === 'aprovar' ? `Entrega aprovada em "${d.pedido.titulo}"` : `Ajuste pedido em "${d.pedido.titulo}"`)
  return c.json({ ok: true, status })
})

async function marcarLida(conversaId: string, usuarioId: string) {
  await db
    .insert(schema.leituras)
    .values({ conversaId, usuarioId, lidoEm: new Date() })
    .onConflictDoUpdate({ target: [schema.leituras.conversaId, schema.leituras.usuarioId], set: { lidoEm: new Date() } })
}

rotasChat.post('/conversas/:id/lida', exigir(), async (c) => {
  const u = usuarioDe(c)
  await exigirConversa(u, c.req.param('id'))
  await marcarLida(c.req.param('id'), u.id)
  return c.json({ ok: true })
})

// ---------- Avisos ----------

rotasChat.get('/avisos', exigir(), async (c) => {
  const u = usuarioDe(c)
  const lista = await db.select().from(schema.avisos).where(eq(schema.avisos.usuarioId, u.id)).orderBy(desc(schema.avisos.criadoEm)).limit(30)
  return c.json(lista)
})

rotasChat.post('/avisos/lidos', exigir(), async (c) => {
  const u = usuarioDe(c)
  await db.update(schema.avisos).set({ lidoEm: new Date() }).where(and(eq(schema.avisos.usuarioId, u.id), isNull(schema.avisos.lidoEm)))
  return c.json({ ok: true })
})

// ---------- Novidades (tempo real por consulta curta) ----------
// O navegador pergunta a cada poucos segundos o que mudou desde a última vez.
// Funciona igual na Vercel (funções sem conexão aberta), na VPS e no computador.

rotasChat.get('/novidades', exigir(), async (c) => {
  const u = usuarioDe(c)
  const [{ agora }] = await db.select({ agora: sql<string>`now()` }).from(sql`(select 1) as x`)
  const pedido = c.req.query('desde')
  // Sem cursor (primeira consulta), só devolve o relógio do servidor.
  if (!pedido || Number.isNaN(Date.parse(pedido))) return c.json({ agora, mensagens: [], avisos: [] })
  // Margem de 5 s para não perder nada gravado no limite; o navegador ignora repetidos.
  const desde = new Date(Date.parse(pedido) - 5000)

  const base = db
    .select({ id: schema.conversas.id })
    .from(schema.conversas)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.conversas.pedidoId))
    .leftJoin(schema.candidatos, eq(schema.candidatos.id, schema.conversas.candidatoId))
  const visiveis =
    u.papel === 'admin'
      ? undefined
      : u.papel === 'marca'
        ? await base.where(eq(schema.pedidos.marcaId, u.id))
        : await base.where(and(eq(schema.candidatos.creatorId, u.id), isNotNull(schema.candidatos.matchEm)))
  const ids = visiveis?.map((v) => v.id)

  const ms =
    ids && !ids.length
      ? []
      : await db
          .select()
          .from(schema.mensagens)
          .where(and(gt(schema.mensagens.atualizadoEm, desde), ids ? inArray(schema.mensagens.conversaId, ids) : undefined))
          .orderBy(schema.mensagens.criadoEm)
          .limit(200)
  const avisos = await db
    .select({ id: schema.avisos.id, texto: schema.avisos.texto, link: schema.avisos.link })
    .from(schema.avisos)
    .where(and(eq(schema.avisos.usuarioId, u.id), gt(schema.avisos.criadoEm, desde)))
    .orderBy(schema.avisos.criadoEm)
    .limit(20)
  return c.json({ agora, mensagens: await serializar(ms), avisos })
})
