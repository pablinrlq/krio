import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db'
import { exigir, usuarioDe, type Ambiente, type Usuario } from '../auth'
import { ficha, redesDe } from '../fichas'
import { avisar, avisarAdmins } from '../lib/avisos'
import { corpo, naoEncontrado, proibido } from '../lib/util'
import { conversaDoPedido, publicarMensagem } from './chat'

export const rotasPedidos = new Hono<Ambiente>()

const texto = (max: number, msg: string) => z.string().trim().min(2, msg).max(max)

export const briefing = z.object({
  titulo: texto(120, 'Dê um nome para o pedido.'),
  objetivo: texto(600, 'Conte o objetivo do conteúdo.'),
  produto: texto(600, 'Conte qual é o produto ou serviço.'),
  publico: texto(600, 'Conte quem é o público.'),
  canais: z.array(z.string().max(40)).min(1, 'Escolha pelo menos um canal.').max(10),
  pecas: z.number().int().min(1, 'Quantos vídeos você precisa?').max(500),
  creatorsDesejados: z.number().int().min(1).max(50),
  perfilCreator: z.string().trim().max(600).optional(),
  nichos: z.array(z.string().max(40)).max(10),
  idiomas: z.array(z.string().max(40)).max(6),
  pacote: z.string().trim().max(40).optional(),
  modalidade: z.enum(['UGC', 'Influencer']),
  prazo: z.string().trim().max(60).optional(),
  observacoes: z.string().trim().max(2000).optional(),
})

// Pedido completo com a lista curta, do jeito que cada papel pode ver.
export async function detalhePedido(pedidoId: string, u: Usuario) {
  const [p] = await db
    .select({ pedido: schema.pedidos, marca: schema.marcas })
    .from(schema.pedidos)
    .innerJoin(schema.marcas, eq(schema.marcas.usuarioId, schema.pedidos.marcaId))
    .where(eq(schema.pedidos.id, pedidoId))
  if (!p) throw naoEncontrado('Pedido')
  if (u.papel === 'marca' && p.pedido.marcaId !== u.id) throw proibido()
  if (u.papel === 'creator') throw proibido()

  const cands = await db
    .select({ c: schema.candidatos, cr: schema.creators })
    .from(schema.candidatos)
    .innerJoin(schema.creators, eq(schema.creators.usuarioId, schema.candidatos.creatorId))
    .where(eq(schema.candidatos.pedidoId, pedidoId))
    .orderBy(schema.candidatos.criadoEm)
  const redes = await redesDe(cands.map((x) => x.cr.usuarioId))
  const conversas = await db.select().from(schema.conversas).where(eq(schema.conversas.pedidoId, pedidoId))
  const geral = conversas.find((x) => !x.candidatoId) ?? (await conversaDoPedido(pedidoId, null))

  return {
    ...p.pedido,
    marca: { id: p.marca.usuarioId, empresa: p.marca.empresa },
    conversaGeralId: geral.id,
    candidatos: cands.map(({ c, cr }) => ({
      id: c.id,
      decisaoMarca: c.decisaoMarca,
      respostaCreator: c.respostaCreator,
      matchEm: c.matchEm,
      notaKrio: c.notaKrio,
      conversaId: conversas.find((x) => x.candidatoId === c.id)?.id ?? null,
      creator: ficha(cr, redes.get(cr.usuarioId) ?? [], true),
    })),
  }
}

rotasPedidos.post('/', exigir('marca'), async (c) => {
  const u = usuarioDe(c)
  const d = await corpo(c, briefing)
  const [p] = await db
    .insert(schema.pedidos)
    .values({ ...d, marcaId: u.id }) // rodadas: 1 por padrão; a KRIÔ ajusta no admin
    .returning()
  const conversa = await conversaDoPedido(p.id, null)
  await publicarMensagem({
    conversaId: conversa.id,
    autorId: null,
    tipo: 'sistema',
    texto: 'Briefing recebido. A KRIÔ vai montar a lista curta de creators e avisar você por aqui.',
  })
  const [m] = await db.select({ empresa: schema.marcas.empresa }).from(schema.marcas).where(eq(schema.marcas.usuarioId, u.id))
  await avisarAdmins(`Novo briefing de ${m?.empresa ?? u.nome}: ${p.titulo}`, `/admin/pedidos/${p.id}`, true)
  return c.json({ id: p.id })
})

rotasPedidos.get('/', exigir('marca'), async (c) => {
  const u = usuarioDe(c)
  const ps = await db.select().from(schema.pedidos).where(eq(schema.pedidos.marcaId, u.id)).orderBy(desc(schema.pedidos.criadoEm))
  const cands = ps.length ? await db.select().from(schema.candidatos).where(inArray(schema.candidatos.pedidoId, ps.map((p) => p.id))) : []
  return c.json(
    ps.map((p) => {
      const cs = cands.filter((x) => x.pedidoId === p.id)
      return {
        ...p,
        paraDecidir: cs.filter((x) => x.decisaoMarca === 'pendente').length,
        matches: cs.filter((x) => x.matchEm).length,
        lista: cs.length,
      }
    }),
  )
})

rotasPedidos.get('/:id', exigir('marca', 'admin'), async (c) => c.json(await detalhePedido(c.req.param('id'), usuarioDe(c))))

// Baralho: a marca diz "quero" ou "passo" para cada creator da lista curta.
rotasPedidos.post('/:id/candidatos/:cid/decisao', exigir('marca'), async (c) => {
  const u = usuarioDe(c)
  const { decisao } = await corpo(c, z.object({ decisao: z.enum(['quero', 'passo', 'pendente']) }))
  const [linha] = await db
    .select({ c: schema.candidatos, p: schema.pedidos, cr: schema.creators })
    .from(schema.candidatos)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.candidatos.pedidoId))
    .innerJoin(schema.creators, eq(schema.creators.usuarioId, schema.candidatos.creatorId))
    .where(and(eq(schema.candidatos.id, c.req.param('cid')), eq(schema.candidatos.pedidoId, c.req.param('id'))))
  if (!linha || linha.p.marcaId !== u.id) throw naoEncontrado('Creator da lista')
  if (linha.c.matchEm) throw new HTTPException(409, { message: 'Este creator já deu match com você.' })

  const convidar = decisao === 'quero' && linha.c.respostaCreator === 'aguardando'
  await db
    .update(schema.candidatos)
    .set({
      decisaoMarca: decisao,
      respostaCreator: decisao === 'quero' ? (linha.c.respostaCreator === 'aguardando' ? 'pendente' : linha.c.respostaCreator) : 'aguardando',
    })
    .where(eq(schema.candidatos.id, linha.c.id))
  if (convidar) {
    const [m] = await db.select({ empresa: schema.marcas.empresa }).from(schema.marcas).where(eq(schema.marcas.usuarioId, u.id))
    await avisar(linha.cr.usuarioId, `Convite da ${m?.empresa ?? 'uma marca'}: ${linha.p.titulo}`, `/creator/trabalhos/${linha.c.id}`, true)
  }
  return c.json({ ok: true, convidado: convidar })
})

// ---------- Lado do creator: convites e trabalhos ----------

export const rotasTrabalhos = new Hono<Ambiente>()

async function trabalhoDo(u: Usuario, candidatoId?: string) {
  const filtros = [eq(schema.candidatos.creatorId, u.id), inArray(schema.candidatos.respostaCreator, ['pendente', 'aceito', 'recusado'])]
  if (candidatoId) filtros.push(eq(schema.candidatos.id, candidatoId))
  const linhas = await db
    .select({ c: schema.candidatos, p: schema.pedidos, m: schema.marcas })
    .from(schema.candidatos)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.candidatos.pedidoId))
    .innerJoin(schema.marcas, eq(schema.marcas.usuarioId, schema.pedidos.marcaId))
    .where(and(...filtros))
    .orderBy(desc(schema.candidatos.criadoEm))
  const conversas = linhas.length
    ? await db.select().from(schema.conversas).where(inArray(schema.conversas.candidatoId, linhas.map((l) => l.c.id)))
    : []
  return linhas.map(({ c, p, m }) => ({
    id: c.id,
    resposta: c.respostaCreator,
    matchEm: c.matchEm,
    conversaId: c.matchEm ? (conversas.find((x) => x.candidatoId === c.id)?.id ?? null) : null,
    pedido: {
      id: p.id,
      titulo: p.titulo,
      marca: m.empresa,
      objetivo: p.objetivo,
      produto: p.produto,
      publico: p.publico,
      canais: p.canais,
      pecas: p.pecas,
      modalidade: p.modalidade,
      prazo: p.prazo,
      status: p.status,
      perfilCreator: p.perfilCreator,
    },
  }))
}

rotasTrabalhos.get('/', exigir('creator'), async (c) => c.json(await trabalhoDo(usuarioDe(c))))

rotasTrabalhos.get('/:id', exigir('creator'), async (c) => {
  const [t] = await trabalhoDo(usuarioDe(c), c.req.param('id'))
  if (!t) throw naoEncontrado('Convite')
  return c.json(t)
})

rotasTrabalhos.post('/:id/resposta', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const { resposta } = await corpo(c, z.object({ resposta: z.enum(['aceito', 'recusado']) }))
  const [linha] = await db
    .select({ c: schema.candidatos, p: schema.pedidos, cr: schema.creators })
    .from(schema.candidatos)
    .innerJoin(schema.pedidos, eq(schema.pedidos.id, schema.candidatos.pedidoId))
    .innerJoin(schema.creators, eq(schema.creators.usuarioId, schema.candidatos.creatorId))
    .where(and(eq(schema.candidatos.id, c.req.param('id')), eq(schema.candidatos.creatorId, u.id)))
  if (!linha || linha.c.respostaCreator === 'aguardando') throw naoEncontrado('Convite')
  if (linha.c.matchEm) return c.json({ ok: true, match: true })

  const match = resposta === 'aceito' && linha.c.decisaoMarca === 'quero'
  await db
    .update(schema.candidatos)
    .set({ respostaCreator: resposta, matchEm: match ? new Date() : null })
    .where(eq(schema.candidatos.id, linha.c.id))

  if (!match) {
    await avisar(linha.p.marcaId, `${linha.cr.nomeArtistico} não vai poder participar de "${linha.p.titulo}"`, `/marca/pedidos/${linha.p.id}`)
    await avisarAdmins(`${linha.cr.nomeArtistico} recusou o convite de "${linha.p.titulo}"`, `/admin/pedidos/${linha.p.id}`)
    return c.json({ ok: true, match: false })
  }

  const conversa = await conversaDoPedido(linha.p.id, linha.c.id)
  if (linha.p.status === 'briefing') await db.update(schema.pedidos).set({ status: 'match', atualizadoEm: new Date() }).where(eq(schema.pedidos.id, linha.p.id))
  await publicarMensagem({
    conversaId: conversa.id,
    autorId: null,
    tipo: 'sistema',
    texto: `MATCH! ${linha.cr.nomeArtistico} topou "${linha.p.titulo}". Esta conversa junta marca, creator e KRIÔ: roteiro, gravação e entregas acontecem aqui.`,
  })
  await avisar(linha.p.marcaId, `MATCH com ${linha.cr.nomeArtistico} em "${linha.p.titulo}"`, `/marca/pedidos/${linha.p.id}?conversa=${conversa.id}`, true)
  await avisarAdmins(`MATCH: ${linha.cr.nomeArtistico} em "${linha.p.titulo}"`, `/admin/pedidos/${linha.p.id}`)
  return c.json({ ok: true, match: true, conversaId: conversa.id })
})
