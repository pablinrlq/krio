import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { env } from '../env'
import * as schema from './schema'

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>

const pastaMigracoes = fileURLToPath(new URL('./migrations', import.meta.url))

async function conectar(): Promise<DB> {
  if (env.databaseUrl) {
    const { default: postgres } = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    const db = drizzle(postgres(env.databaseUrl, { max: 10 }), { schema })
    await migrate(db, { migrationsFolder: pastaMigracoes })
    return db as unknown as DB
  }
  // Desenvolvimento: Postgres embutido, sem instalar nada.
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  mkdirSync(env.pastaDados, { recursive: true })
  const cliente = new PGlite(join(env.pastaDados, 'pglite'))
  const db = drizzle(cliente, { schema })
  await migrate(db, { migrationsFolder: pastaMigracoes })
  return db as unknown as DB
}

export const db = await conectar()
export { schema }
