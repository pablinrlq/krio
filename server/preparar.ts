import { eq } from 'drizzle-orm'
import { db, schema } from './db'
import { env } from './env'
import { hashSenha } from './lib/cripto'

// Roda uma vez quando o servidor (ou a função da Vercel) acorda.
export async function preparar({ demo = false } = {}) {
  // Banco vazio + modo demonstração: cria as contas e o pedido de exemplo.
  if (demo && (await db.$count(schema.usuarios)) === 0) {
    const { semear } = await import('./seed')
    await semear()
  }
  // Primeiro administrador a partir da configuração.
  if (env.adminEmail && env.adminSenha) {
    const email = env.adminEmail.toLowerCase()
    const [ja] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.email, email))
    if (!ja) {
      await db.insert(schema.usuarios).values({ email, nome: 'Equipe KRIÔ', senhaHash: await hashSenha(env.adminSenha), papel: 'admin', aceitouTermosEm: new Date() })
      console.log(`Administrador criado: ${email}`)
    }
  }
}
