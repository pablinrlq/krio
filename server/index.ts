import { readFile } from 'node:fs/promises'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { app } from './app'
import { env } from './env'
import { preparar } from './preparar'
import { iniciarSincronizacao } from './social'

// Em produção o mesmo servidor entrega o site (pasta dist) e a API.
if (env.prod) {
  const indexHtml = await readFile('./dist/index.html', 'utf8')
  app.use('/assets/*', serveStatic({ root: './dist', onFound: (_p, c) => c.header('cache-control', 'public, max-age=31536000, immutable') }))
  app.use('*', serveStatic({ root: './dist' }))
  app.get('*', (c) => c.html(indexHtml))
}

await preparar()
iniciarSincronizacao()

serve({ fetch: app.fetch, port: env.porta }, (info) => {
  console.log(`KRIÔ rodando em http://localhost:${info.port}`)
})
