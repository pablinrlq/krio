import { and, eq, isNotNull, lt, or, isNull } from 'drizzle-orm'
import { db, schema } from './db'
import { env } from './env'
import { cifrar, decifrar } from './lib/cripto'
import type { Post, Rede } from './db/schema'

type Tokens = { acesso: string; renovacao?: string; expiraEm?: Date }
type Perfil = {
  idExterno: string
  usuario?: string
  nomeExibicao?: string
  avatarUrl?: string
  seguidores?: number
  publicacoes?: number
  posts: Post[]
}

export type Provedor = {
  configurado: () => boolean
  urlAutorizacao: (estado: string) => string
  trocarCodigo: (codigo: string) => Promise<Tokens>
  renovar?: (t: Tokens) => Promise<Tokens>
  perfil: (acesso: string) => Promise<Perfil>
}

const retorno = (rede: Rede) => `${env.urlBase}/api/redes/${rede}/retorno`

async function json<T>(r: Response): Promise<T> {
  const corpo = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${corpo.slice(0, 300)}`)
  return JSON.parse(corpo) as T
}

const form = (dados: Record<string, string>) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(dados),
})

// Instagram API com login do Instagram (contas profissionais).
const instagram: Provedor = {
  configurado: () => !!env.instagram.id,
  urlAutorizacao: (estado) =>
    `https://www.instagram.com/oauth/authorize?${new URLSearchParams({
      client_id: env.instagram.id,
      redirect_uri: retorno('instagram'),
      response_type: 'code',
      scope: 'instagram_business_basic',
      state: estado,
    })}`,
  async trocarCodigo(codigo) {
    const curto = await json<{ access_token: string }>(
      await fetch(
        'https://api.instagram.com/oauth/access_token',
        form({ client_id: env.instagram.id, client_secret: env.instagram.segredo, grant_type: 'authorization_code', redirect_uri: retorno('instagram'), code: codigo }),
      ),
    )
    const longo = await json<{ access_token: string; expires_in: number }>(
      await fetch(
        `https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: env.instagram.segredo, access_token: curto.access_token })}`,
      ),
    )
    return { acesso: longo.access_token, expiraEm: new Date(Date.now() + longo.expires_in * 1000) }
  },
  async renovar(t) {
    const r = await json<{ access_token: string; expires_in: number }>(
      await fetch(`https://graph.instagram.com/refresh_access_token?${new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: t.acesso })}`),
    )
    return { acesso: r.access_token, expiraEm: new Date(Date.now() + r.expires_in * 1000) }
  },
  async perfil(acesso) {
    const p = await json<{ user_id?: string; id: string; username: string; name?: string; profile_picture_url?: string; followers_count?: number; media_count?: number }>(
      await fetch(`https://graph.instagram.com/me?${new URLSearchParams({ fields: 'user_id,username,name,profile_picture_url,followers_count,media_count', access_token: acesso })}`),
    )
    const midia = await json<{ data: { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string; like_count?: number; comments_count?: number }[] }>(
      await fetch(
        `https://graph.instagram.com/me/media?${new URLSearchParams({ fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count', limit: '12', access_token: acesso })}`,
      ),
    ).catch(() => ({ data: [] }))
    return {
      idExterno: p.user_id ?? p.id,
      usuario: p.username,
      nomeExibicao: p.name,
      avatarUrl: p.profile_picture_url,
      seguidores: p.followers_count,
      publicacoes: p.media_count,
      posts: midia.data.map((m) => ({
        id: m.id,
        url: m.permalink,
        thumb: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        legenda: m.caption?.slice(0, 200),
        data: m.timestamp,
        curtidas: m.like_count,
        comentarios: m.comments_count,
      })),
    }
  },
}

// TikTok Login Kit + Display API.
const tiktok: Provedor = {
  configurado: () => !!env.tiktok.id,
  urlAutorizacao: (estado) =>
    `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: env.tiktok.id,
      scope: 'user.info.basic,user.info.profile,user.info.stats,video.list',
      response_type: 'code',
      redirect_uri: retorno('tiktok'),
      state: estado,
    })}`,
  async trocarCodigo(codigo) {
    const r = await json<{ access_token: string; refresh_token: string; expires_in: number }>(
      await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        form({ client_key: env.tiktok.id, client_secret: env.tiktok.segredo, code: codigo, grant_type: 'authorization_code', redirect_uri: retorno('tiktok') }),
      ),
    )
    return { acesso: r.access_token, renovacao: r.refresh_token, expiraEm: new Date(Date.now() + r.expires_in * 1000) }
  },
  async renovar(t) {
    const r = await json<{ access_token: string; refresh_token: string; expires_in: number }>(
      await fetch(
        'https://open.tiktokapis.com/v2/oauth/token/',
        form({ client_key: env.tiktok.id, client_secret: env.tiktok.segredo, grant_type: 'refresh_token', refresh_token: t.renovacao ?? '' }),
      ),
    )
    return { acesso: r.access_token, renovacao: r.refresh_token, expiraEm: new Date(Date.now() + r.expires_in * 1000) }
  },
  async perfil(acesso) {
    const h = { authorization: `Bearer ${acesso}` }
    const u = await json<{ data: { user: { open_id: string; username?: string; display_name?: string; avatar_url?: string; follower_count?: number; video_count?: number } } }>(
      await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name,username,follower_count,likes_count,video_count', { headers: h }),
    )
    const v = await json<{ data: { videos: { id: string; title?: string; cover_image_url?: string; share_url: string; create_time: number; like_count?: number; comment_count?: number; view_count?: number }[] } }>(
      await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,share_url,create_time,like_count,comment_count,view_count', {
        method: 'POST',
        headers: { ...h, 'content-type': 'application/json' },
        body: JSON.stringify({ max_count: 12 }),
      }),
    ).catch(() => ({ data: { videos: [] } }))
    const x = u.data.user
    return {
      idExterno: x.open_id,
      usuario: x.username,
      nomeExibicao: x.display_name,
      avatarUrl: x.avatar_url,
      seguidores: x.follower_count,
      publicacoes: x.video_count,
      posts: v.data.videos.map((m) => ({
        id: m.id,
        url: m.share_url,
        thumb: m.cover_image_url,
        legenda: m.title?.slice(0, 200),
        data: new Date(m.create_time * 1000).toISOString(),
        curtidas: m.like_count,
        comentarios: m.comment_count,
        views: m.view_count,
      })),
    }
  },
}

// YouTube Data API v3 com o mesmo app do Google.
const youtube: Provedor = {
  configurado: () => !!env.google.id,
  urlAutorizacao: (estado) =>
    `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: env.google.id,
      redirect_uri: retorno('youtube'),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      access_type: 'offline',
      prompt: 'consent',
      state: estado,
    })}`,
  async trocarCodigo(codigo) {
    const r = await json<{ access_token: string; refresh_token?: string; expires_in: number }>(
      await fetch(
        'https://oauth2.googleapis.com/token',
        form({ code: codigo, client_id: env.google.id, client_secret: env.google.segredo, redirect_uri: retorno('youtube'), grant_type: 'authorization_code' }),
      ),
    )
    return { acesso: r.access_token, renovacao: r.refresh_token, expiraEm: new Date(Date.now() + r.expires_in * 1000) }
  },
  async renovar(t) {
    const r = await json<{ access_token: string; expires_in: number }>(
      await fetch(
        'https://oauth2.googleapis.com/token',
        form({ client_id: env.google.id, client_secret: env.google.segredo, refresh_token: t.renovacao ?? '', grant_type: 'refresh_token' }),
      ),
    )
    return { acesso: r.access_token, renovacao: t.renovacao, expiraEm: new Date(Date.now() + r.expires_in * 1000) }
  },
  async perfil(acesso) {
    const h = { headers: { authorization: `Bearer ${acesso}` } }
    const api = 'https://www.googleapis.com/youtube/v3'
    const ch = await json<{
      items?: { id: string; snippet: { title: string; customUrl?: string; thumbnails?: { default?: { url: string } } }; statistics: { subscriberCount?: string; videoCount?: string }; contentDetails?: { relatedPlaylists?: { uploads?: string } } }[]
    }>(await fetch(`${api}/channels?part=snippet,statistics,contentDetails&mine=true`, h))
    const canal = ch.items?.[0]
    if (!canal) throw new Error('Esta conta Google não tem canal no YouTube.')
    let posts: Post[] = []
    const uploads = canal.contentDetails?.relatedPlaylists?.uploads
    if (uploads) {
      const lista = await json<{ items: { snippet: { title: string; publishedAt: string; resourceId: { videoId: string }; thumbnails?: { medium?: { url: string } } } }[] }>(
        await fetch(`${api}/playlistItems?part=snippet&maxResults=12&playlistId=${uploads}`, h),
      ).catch(() => ({ items: [] }))
      const ids = lista.items.map((i) => i.snippet.resourceId.videoId)
      const stats = ids.length
        ? await json<{ items: { id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }[] }>(await fetch(`${api}/videos?part=statistics&id=${ids.join(',')}`, h)).catch(() => ({ items: [] }))
        : { items: [] }
      posts = lista.items.map((i) => {
        const s = stats.items.find((x) => x.id === i.snippet.resourceId.videoId)?.statistics
        return {
          id: i.snippet.resourceId.videoId,
          url: `https://www.youtube.com/watch?v=${i.snippet.resourceId.videoId}`,
          thumb: i.snippet.thumbnails?.medium?.url,
          legenda: i.snippet.title,
          data: i.snippet.publishedAt,
          views: s?.viewCount ? Number(s.viewCount) : undefined,
          curtidas: s?.likeCount ? Number(s.likeCount) : undefined,
          comentarios: s?.commentCount ? Number(s.commentCount) : undefined,
        }
      })
    }
    return {
      idExterno: canal.id,
      usuario: canal.snippet.customUrl,
      nomeExibicao: canal.snippet.title,
      avatarUrl: canal.snippet.thumbnails?.default?.url,
      seguidores: canal.statistics.subscriberCount ? Number(canal.statistics.subscriberCount) : undefined,
      publicacoes: canal.statistics.videoCount ? Number(canal.statistics.videoCount) : undefined,
      posts,
    }
  },
}

export const provedores: Record<Rede, Provedor> = { instagram, tiktok, youtube }

// Engajamento médio dos últimos posts, em centésimos de % (345 = 3,45%).
export function calcularEngajamento(seguidores: number | undefined, posts: Post[]) {
  if (!seguidores || !posts.length) return null
  const comDados = posts.filter((p) => p.curtidas !== undefined || p.comentarios !== undefined)
  if (!comDados.length) return null
  const media = comDados.reduce((s, p) => s + (p.curtidas ?? 0) + (p.comentarios ?? 0), 0) / comDados.length
  return Math.round((media / seguidores) * 10000)
}

export async function salvarConexao(creatorId: string, rede: Rede, tokens: Tokens, perfil: Perfil) {
  const valores = {
    idExterno: perfil.idExterno,
    usuario: perfil.usuario ?? null,
    nomeExibicao: perfil.nomeExibicao ?? null,
    avatarUrl: perfil.avatarUrl ?? null,
    seguidores: perfil.seguidores ?? null,
    publicacoes: perfil.publicacoes ?? null,
    engajamento: calcularEngajamento(perfil.seguidores, perfil.posts),
    posts: perfil.posts,
    tokenAcesso: cifrar(tokens.acesso),
    tokenRenovacao: tokens.renovacao ? cifrar(tokens.renovacao) : null,
    tokenExpiraEm: tokens.expiraEm ?? null,
    sincronizadoEm: new Date(),
    erro: null,
  }
  await db
    .insert(schema.redes)
    .values({ creatorId, rede, ...valores })
    .onConflictDoUpdate({ target: [schema.redes.creatorId, schema.redes.rede], set: valores })
}

export async function sincronizar(linha: typeof schema.redes.$inferSelect) {
  const p = provedores[linha.rede]
  if (!linha.tokenAcesso || !p.configurado()) return
  try {
    let tokens: Tokens = {
      acesso: decifrar(linha.tokenAcesso),
      renovacao: linha.tokenRenovacao ? decifrar(linha.tokenRenovacao) : undefined,
      expiraEm: linha.tokenExpiraEm ?? undefined,
    }
    // Renova o token quando falta pouco para vencer (Instagram: 60 dias; TikTok: 24 h; YouTube: 1 h).
    const limite = linha.rede === 'instagram' ? 7 * 24 * 3600 * 1000 : 5 * 60 * 1000
    if (p.renovar && tokens.expiraEm && tokens.expiraEm.getTime() - Date.now() < limite) tokens = await p.renovar(tokens)
    await salvarConexao(linha.creatorId, linha.rede, tokens, await p.perfil(tokens.acesso))
  } catch (e) {
    await db
      .update(schema.redes)
      .set({ erro: 'Não conseguimos atualizar. Conecte a rede de novo.', sincronizadoEm: new Date() })
      .where(eq(schema.redes.id, linha.id))
    console.error(`[redes] falha ao sincronizar ${linha.rede} de ${linha.creatorId}:`, (e as Error).message)
  }
}

// Atualiza uma vez por dia cada rede conectada.
export function iniciarSincronizacao() {
  const rodar = async () => {
    const ontem = new Date(Date.now() - 24 * 3600 * 1000)
    const pendentes = await db
      .select()
      .from(schema.redes)
      .where(and(isNotNull(schema.redes.tokenAcesso), or(isNull(schema.redes.sincronizadoEm), lt(schema.redes.sincronizadoEm, ontem))))
      .limit(50)
    for (const r of pendentes) await sincronizar(r)
  }
  setTimeout(rodar, 30_000)
  setInterval(rodar, 60 * 60 * 1000)
}
