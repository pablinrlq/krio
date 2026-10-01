import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { and, arrayOverlaps, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '../db'
import { exigir, usuarioDe, type Ambiente } from '../auth'
import { ficha, redesDe } from '../fichas'
import { ErroArquivo, abrirArquivo, lerFaixa, salvarArquivo } from '../lib/arquivos'
import { avisarAdmins } from '../lib/avisos'
import { corpo, naoEncontrado, proibido } from '../lib/util'
import { podeVerConversa } from './chat'

export const rotasCreators = new Hono<Ambiente>()

const lista = z.array(z.string().trim().min(1).max(40)).max(12)

const perfil = z.object({
  nomeArtistico: z.string().trim().min(2, 'Escreva o nome artístico.').max(80),
  cidade: z.string().trim().max(80).nullable(),
  uf: z.string().trim().toUpperCase().max(2).nullable(),
  nascimento: z.string().trim().max(10).nullable(),
  idiomas: lista,
  nichos: lista,
  formatos: z.array(z.enum(['UGC', 'Influencer'])).max(2),
  linguagem: z.string().trim().max(80).nullable(),
  bio: z.string().trim().max(800).nullable(),
  videoUrl: z.union([z.literal(''), z.url('O link do vídeo precisa começar com https://').max(300)]).nullable(),
  whatsapp: z.string().trim().max(20).nullable(),
  academy: z.boolean(),
})

async function meuCreator(id: string) {
  const [c] = await db.select().from(schema.creators).where(eq(schema.creators.usuarioId, id))
  if (!c) throw naoEncontrado('Perfil de creator')
  return c
}

rotasCreators.get('/eu', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const cr = await meuCreator(u.id)
  const redes = (await redesDe([u.id])).get(u.id) ?? []
  return c.json({ ...ficha(cr, redes, true), status: cr.status, whatsapp: cr.whatsapp, academy: cr.academy })
})

rotasCreators.put('/eu', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const d = await corpo(c, perfil)
  await db
    .update(schema.creators)
    .set({ ...d, videoUrl: d.videoUrl || null, atualizadoEm: new Date() })
    .where(eq(schema.creators.usuarioId, u.id))
  return c.json({ ok: true })
})

rotasCreators.post('/eu/foto', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const f = (await c.req.parseBody())['foto']
  if (!(f instanceof File) || !f.type.startsWith('image/')) throw new HTTPException(400, { message: 'Envie uma imagem.' })
  try {
    const a = await salvarArquivo(f, u.id, true)
    await db.update(schema.creators).set({ fotoId: a.id }).where(eq(schema.creators.usuarioId, u.id))
    return c.json({ fotoUrl: `/api/arquivos/${a.id}` })
  } catch (e) {
    if (e instanceof ErroArquivo) throw new HTTPException(400, { message: e.message })
    throw e
  }
})

// O creator manda a ficha para a curadoria da KRIÔ.
rotasCreators.post('/eu/enviar', exigir('creator'), async (c) => {
  const u = usuarioDe(c)
  const cr = await meuCreator(u.id)
  const falta = [
    !cr.fotoId && 'foto',
    !cr.cidade && 'cidade',
    !cr.nichos.length && 'pelo menos um nicho',
    !cr.formatos.length && 'formato (UGC ou Influencer)',
    !cr.bio && 'apresentação',
  ].filter(Boolean)
  if (falta.length) throw new HTTPException(400, { message: `Antes de enviar, preencha: ${falta.join(', ')}.` })
  if (cr.status === 'aprovado') return c.json({ ok: true, status: cr.status })
  await db.update(schema.creators).set({ status: 'em_analise' }).where(eq(schema.creators.usuarioId, u.id))
  await avisarAdmins(`${cr.nomeArtistico} enviou a ficha para avaliação`, `/admin/creators?id=${u.id}`, true)
  return c.json({ ok: true, status: 'em_analise' })
})

// ---------- Catálogo ----------

rotasCreators.get('/catalogo', async (c) => {
  const u = c.get('usuario')
  const completa = !!u && (u.papel === 'marca' || u.papel === 'admin')
  const { nicho, q, formato } = c.req.query()
  const filtros = [eq(schema.creators.status, 'aprovado')]
  if (nicho) filtros.push(arrayOverlaps(schema.creators.nichos, [nicho]))
  if (formato) filtros.push(arrayOverlaps(schema.creators.formatos, [formato]))
  if (q) filtros.push(or(ilike(schema.creators.nomeArtistico, `%${q}%`), ilike(schema.creators.cidade, `%${q}%`))!)
  const linhas = await db
    .select()
    .from(schema.creators)
    .where(and(...filtros))
    .orderBy(desc(schema.creators.atualizadoEm))
    .limit(60)
  const redes = await redesDe(linhas.map((l) => l.usuarioId))
  let favs = new Set<string>()
  if (u?.papel === 'marca') {
    const f = await db.select({ id: schema.favoritos.creatorId }).from(schema.favoritos).where(eq(schema.favoritos.marcaId, u.id))
    favs = new Set(f.map((x) => x.id))
  }
  return c.json(linhas.map((l) => ({ ...ficha(l, redes.get(l.usuarioId) ?? [], completa), favorito: favs.has(l.usuarioId) })))
})

rotasCreators.get('/catalogo/:slug', async (c) => {
  const u = c.get('usuario')
  const [cr] = await db.select().from(schema.creators).where(eq(schema.creators.slug, c.req.param('slug')))
  const dono = u?.id === cr?.usuarioId
  if (!cr || (cr.status !== 'aprovado' && !dono && u?.papel !== 'admin')) throw naoEncontrado('Creator')
  const completa = !!u && (u.papel !== 'creator' || dono)
  const redes = (await redesDe([cr.usuarioId])).get(cr.usuarioId) ?? []
  let favorito = false
  if (u?.papel === 'marca') {
    const [f] = await db
      .select()
      .from(schema.favoritos)
      .where(and(eq(schema.favoritos.marcaId, u.id), eq(schema.favoritos.creatorId, cr.usuarioId)))
    favorito = !!f
  }
  return c.json({ ...ficha(cr, redes, completa), favorito })
})

rotasCreators.post('/favoritos/:id', exigir('marca'), async (c) => {
  const u = usuarioDe(c)
  const creatorId = c.req.param('id')
  const [ja] = await db
    .select()
    .from(schema.favoritos)
    .where(and(eq(schema.favoritos.marcaId, u.id), eq(schema.favoritos.creatorId, creatorId)))
  if (ja) await db.delete(schema.favoritos).where(and(eq(schema.favoritos.marcaId, u.id), eq(schema.favoritos.creatorId, creatorId)))
  else await db.insert(schema.favoritos).values({ marcaId: u.id, creatorId })
  return c.json({ favorito: !ja })
})

// ---------- Arquivos ----------

export const rotasArquivos = new Hono<Ambiente>()

rotasArquivos.get('/:id', async (c) => {
  const [a] = await db
    .select({ id: schema.arquivos.id, caminho: schema.arquivos.caminho, nome: schema.arquivos.nome, tipo: schema.arquivos.tipo, tamanho: schema.arquivos.tamanho, publico: schema.arquivos.publico, donoId: schema.arquivos.donoId })
    .from(schema.arquivos)
    .where(eq(schema.arquivos.id, c.req.param('id')))
  if (!a) throw naoEncontrado('Arquivo')
  if (!a.publico) {
    const u = c.get('usuario')
    if (!u) throw new HTTPException(401, { message: 'Entre na sua conta para ver este arquivo.' })
    let ok = u.papel === 'admin' || a.donoId === u.id
    if (!ok) {
      const msgs = await db.select({ conversaId: schema.mensagens.conversaId }).from(schema.mensagens).where(eq(schema.mensagens.arquivoId, a.id))
      for (const m of msgs) if (await podeVerConversa(u, m.conversaId)) ok = true
    }
    if (!ok) throw proibido()
  }
  const faixa = lerFaixa(c.req.header('range'), a.tamanho)
  const { tamanho, corpo: stream } = await abrirArquivo(a, faixa ?? undefined)
  const baixar = c.req.query('baixar') !== undefined
  return new Response(stream, {
    status: faixa ? 206 : 200,
    headers: {
      'content-type': a.tipo,
      'content-length': String(faixa ? faixa.fim - faixa.inicio + 1 : tamanho),
      'accept-ranges': 'bytes',
      ...(faixa ? { 'content-range': `bytes ${faixa.inicio}-${faixa.fim}/${tamanho}` } : {}),
      'cache-control': a.publico ? 'public, max-age=31536000, immutable' : 'private, max-age=3600',
      'x-content-type-options': 'nosniff',
      'content-disposition': `${baixar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
    },
  })
})
