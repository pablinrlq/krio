import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'

export function slugify(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function corpo<T extends z.ZodType>(c: { req: { json: () => Promise<unknown> } }, esquema: T): Promise<z.infer<T>> {
  let dados: unknown
  try {
    dados = await c.req.json()
  } catch {
    throw new HTTPException(400, { message: 'Corpo da requisição inválido.' })
  }
  const r = esquema.safeParse(dados)
  if (!r.success) {
    const primeiro = r.error.issues[0]
    throw new HTTPException(400, { message: primeiro?.message ?? 'Dados inválidos.' })
  }
  return r.data
}

export const naoEncontrado = (o = 'Item') => new HTTPException(404, { message: `${o} não encontrado.` })
export const proibido = (m = 'Você não tem acesso a isso.') => new HTTPException(403, { message: m })
