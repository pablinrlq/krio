// Sobe a KRIÔ inteira no seu computador ou servidor local, sem configurar nada:
// site + plataforma + banco embutido + contas de demonstração.
// Uso: npm run local  →  http://localhost:3000
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'

const pasta = process.env.DATA_DIR ?? './data'
mkdirSync(pasta, { recursive: true })

// Chave guardada em data/segredo para as sessões sobreviverem a reinícios.
const arquivoSegredo = join(pasta, 'segredo')
if (!existsSync(arquivoSegredo)) writeFileSync(arquivoSegredo, randomBytes(32).toString('hex'))

process.env.NODE_ENV = 'production'
process.env.APP_SECRET ??= readFileSync(arquivoSegredo, 'utf8').trim()
process.env.PORT ??= '3000'
process.env.APP_URL ??= `http://localhost:${process.env.PORT}`

if (!existsSync('./dist/index.html')) {
  console.error('Rode "npm run build" antes (o "npm run local" já faz isso).')
  process.exit(1)
}

const { semear } = await import('./seed')
await semear()
await import('./index')
