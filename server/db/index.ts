import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { env } from '../env'
import * as schema from './schema'

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>

// No código-fonte as migrações ficam ao lado deste arquivo; no pacote da Vercel,
// ao lado do arquivo único gerado no build (o caminho relativo é o mesmo).
const pastaMigracoes = fileURLToPath(new URL('./migrations', import.meta.url))

// Duas funções da Vercel podem acordar juntas e migrar ao mesmo tempo:
// a que perder tenta de novo depois que a outra terminar.
async function comNovaTentativa(fn: () => Promise<unknown>) {
  for (let i = 0; ; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i >= 3) throw e
      await new Promise((r) => setTimeout(r, 500 * (i + 1)))
    }
  }
}

async function conectar(): Promise<{ db: DB; embutido: boolean }> {
  if (env.databaseUrl) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    // Na Vercel: uma conexão por função e sem prepared statements (pooler).
    const cliente = postgres(env.databaseUrl, { ...(env.vercel ? { max: 1, prepare: false } : { max: 10 }), onnotice: () => {} })
    const db = drizzle(cliente, { schema })
    await comNovaTentativa(() => migrate(db, { migrationsFolder: pastaMigracoes }))
    return { db: db as unknown as DB, embutido: false }
  }
  // Sem banco configurado: Postgres embutido, sem instalar nada.
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  mkdirSync(env.pastaDados, { recursive: true })
  const cliente = new PGlite(join(env.pastaDados, 'pglite'))
  const db = drizzle(cliente, { schema })
  await migrate(db, { migrationsFolder: pastaMigracoes })
  return { db: db as unknown as DB, embutido: true }
}

const conexao = await conectar()
export const db = conexao.db
// Na Vercel sem Postgres os dados somem quando a função esfria.
export const bancoTemporario = env.vercel && conexao.embutido
export { schema }
