import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { secureHeaders } from 'hono/secure-headers'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { carregarUsuario, type Ambiente } from './auth'
import { rotasAuth } from './routes/auth'
import { rotasArquivos, rotasCreators } from './routes/creators'
import { rotasRedes } from './routes/redes'
import { rotasChat } from './routes/chat'
import { rotasPedidos, rotasTrabalhos } from './routes/pedidos'
import { rotasAdmin } from './routes/admin'
import { sincronizarPendentes } from './social'

export const app = new Hono<Ambiente>()

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
// Chamado uma vez por dia pelo agendador (Vercel Cron) ou pelo próprio servidor.
app.get('/api/cron/redes', async (c) => c.json({ atualizadas: await sincronizarPendentes() }))
app.all('/api/*', (c) => c.json({ erro: 'Rota não encontrada.' }, 404))

app.onError((e, c) => {
  if (e instanceof HTTPException) return c.json({ erro: e.message }, e.status)
  console.error(e)
  return c.json({ erro: 'Algo deu errado do nosso lado. Tente de novo em instantes.' }, 500)
})

