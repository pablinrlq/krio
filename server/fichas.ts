import { inArray } from 'drizzle-orm'
import { db, schema } from './db'

type CreatorRow = typeof schema.creators.$inferSelect
type RedeRow = typeof schema.redes.$inferSelect

export const urlArquivo = (id: string | null) => (id ? `/api/arquivos/${id}` : null)

export async function redesDe(ids: string[]) {
  if (!ids.length) return new Map<string, RedeRow[]>()
  const linhas = await db.select().from(schema.redes).where(inArray(schema.redes.creatorId, ids))
  const mapa = new Map<string, RedeRow[]>()
  for (const r of linhas) mapa.set(r.creatorId, [...(mapa.get(r.creatorId) ?? []), r])
  return mapa
}

// Ficha do creator para a interface. "completa" só para quem tem conta
// (marca, admin ou o próprio creator); visitantes veem o resumo.
export function ficha(c: CreatorRow, redes: RedeRow[], completa: boolean) {
  const ordem = { instagram: 0, tiktok: 1, youtube: 2 }
  const rs = [...redes].sort((a, b) => ordem[a.rede] - ordem[b.rede])
  return {
    id: c.usuarioId,
    slug: c.slug,
    nome: c.nomeArtistico,
    cidade: c.cidade,
    uf: c.uf,
    nichos: c.nichos,
    formatos: c.formatos,
    fotoUrl: urlArquivo(c.fotoId),
    demo: c.demo,
    alcance: rs.reduce((s, r) => s + (r.seguidores ?? 0), 0),
    redes: rs.map((r) => ({
      rede: r.rede,
      usuario: r.usuario,
      seguidores: r.seguidores,
      ...(completa
        ? {
            nomeExibicao: r.nomeExibicao,
            avatarUrl: r.avatarUrl,
            publicacoes: r.publicacoes,
            engajamento: r.engajamento,
            posts: r.posts.slice(0, 6),
            sincronizadoEm: r.sincronizadoEm,
            erro: r.erro,
          }
        : {}),
    })),
    ...(completa
      ? {
          idiomas: c.idiomas,
          linguagem: c.linguagem,
          bio: c.bio,
          videoUrl: c.videoUrl,
          nascimento: c.nascimento,
        }
      : {}),
  }
}

export type Ficha = ReturnType<typeof ficha>
