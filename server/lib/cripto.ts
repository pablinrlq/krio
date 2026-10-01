import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { env } from '../env'

const scryptAsync = promisify(scrypt) as (senha: string, sal: Buffer, tam: number, opts: object) => Promise<Buffer>
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

export async function hashSenha(senha: string) {
  const sal = randomBytes(16)
  const hash = await scryptAsync(senha, sal, 64, SCRYPT)
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`
}

export async function conferirSenha(senha: string, guardado: string) {
  const [alg, sal64, hash64] = guardado.split('$')
  if (alg !== 'scrypt' || !sal64 || !hash64) return false
  const esperado = Buffer.from(hash64, 'base64')
  const hash = await scryptAsync(senha, Buffer.from(sal64, 'base64'), esperado.length, SCRYPT)
  return timingSafeEqual(hash, esperado)
}

export const tokenAleatorio = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

// Tokens das redes sociais ficam cifrados no banco (AES-256-GCM).
const chave = createHash('sha256').update(env.segredo).digest()

export function cifrar(texto: string) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', chave, iv)
  const dados = Buffer.concat([c.update(texto, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), dados].map((b) => b.toString('base64url')).join('.')
}

export function decifrar(guardado: string) {
  const [iv, tag, dados] = guardado.split('.').map((p) => Buffer.from(p, 'base64url'))
  const d = createDecipheriv('aes-256-gcm', chave, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(dados), d.final()]).toString('utf8')
}
