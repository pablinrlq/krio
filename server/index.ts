import { readFile } from 'node:fs/promises'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import { db, schema } from './db'
import { env } from './env'
import { carregarUsuario, type Ambiente } from './auth'
import { hashSenha } from './lib/cripto'
import { rotasAuth } from './routes/auth'
import { rotasArquivos, rotasCreators } from './routes/creators'
import { rotasRedes } from './routes/redes'
import { rotasChat } from './routes/chat'
import { rotasPedidos, rotasTrabalhos } from './routes/pedidos'
import { rotasAdmin } from './routes/admin'
import { iniciarSincronizacao } from './social'

const app = new Hono<Ambiente>()

app.use(
  '*',
  secureHeaders({
    crossOriginResourcePolicy: 'same-origin',
    referrerPolicy: 'strict-origin-when-cross-origin',
    // Só vale em HTTPS; em http://IP-da-rede o navegador ignora e reclama.
    crossOriginOpenerPolicy: env.urlBase.startsWith('https://') ? 'same-origin' : false,
  }),
)
app.use(
  '/api/*',
  csrf({
    origin: (origem, c) => {
      if (origem === env.urlBase || (!env.prod && origem.startsWith('http://localhost'))) return true
      // Mesma origem: a página foi servida por este mesmo servidor (localhost, rede local ou domínio).
      try {
        return new URL(origem).host === c.req.header('host')
      } catch {
        return false
      }
    },
  }),
)
app.use('/api/*', bodyLimit({ maxSize: (env.limiteUploadMb + 5) * 1024 * 1024, onError: (c) => c.json({ erro: 'Arquivo grande demais.' }, 413) }))
app.use('/api/*', carregarUsuario)

app.route('/api/auth', rotasAuth)
app.route('/api/creators', rotasCreators)
app.route('/api/arquivos', rotasArquivos)
app.route('/api/redes', rotasRedes)
app.route('/api/pedidos', rotasPedidos)
app.route('/api/trabalhos', rotasTrabalhos)
app.route('/api/admin', rotasAdmin)
app.route('/api', rotasChat)
app.get('/api/saude', (c) => c.json({ ok: true }))
app.all('/api/*', (c) => c.json({ erro: 'Rota não encontrada.' }, 404))

app.onError((e, c) => {
  if (e instanceof HTTPException) return c.json({ erro: e.message }, e.status)
  console.error(e)
  return c.json({ erro: 'Algo deu errado do nosso lado. Tente de novo em instantes.' }, 500)
})

// Em produção o mesmo servidor entrega o site (pasta dist) e a API.
if (env.prod) {
  const indexHtml = await readFile('./dist/index.html', 'utf8')
  app.use('/assets/*', serveStatic({ root: './dist', onFound: (_p, c) => c.header('cache-control', 'public, max-age=31536000, immutable') }))
  app.use('*', serveStatic({ root: './dist' }))
  app.get('*', (c) => c.html(indexHtml))
}

// Cria o primeiro administrador a partir das variáveis de ambiente.
if (env.adminEmail && env.adminSenha) {
  const email = env.adminEmail.toLowerCase()
  const [ja] = await db.select({ id: schema.usuarios.id }).from(schema.usuarios).where(eq(schema.usuarios.email, email))
  if (!ja) {
    await db.insert(schema.usuarios).values({ email, nome: 'Equipe KRIÔ', senhaHash: await hashSenha(env.adminSenha), papel: 'admin', aceitouTermosEm: new Date() })
    console.log(`Administrador criado: ${email}`)
  }
}

iniciarSincronizacao()

serve({ fetch: app.fetch, port: env.porta }, (info) => {
  console.log(`KRIÔ rodando em http://localhost:${info.port}`)
})
