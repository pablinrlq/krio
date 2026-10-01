import { eq } from 'drizzle-orm'
import { db, schema } from '../db'
import { emitirParaUsuario } from './eventos'
import { enviarEmail } from './email'

// Aviso dentro da plataforma + tempo real + e-mail (quando pedido).
export async function avisar(usuarioId: string, texto: string, link: string | null, porEmail = false) {
  await db.insert(schema.avisos).values({ usuarioId, texto, link })
  emitirParaUsuario(usuarioId, { tipo: 'aviso', texto, link })
  if (porEmail) {
    const [u] = await db.select({ email: schema.usuarios.email }).from(schema.usuarios).where(eq(schema.usuarios.id, usuarioId))
    if (u) await enviarEmail(u.email, `KRIÔ · ${texto}`, texto, link ?? undefined)
  }
}

export async function avisarAdmins(texto: string, link: string | null, porEmail = false) {
  const admins = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.papel, 'admin'))
  await Promise.all(admins.map((a) => avisar(a.id, texto, link, porEmail)))
}
