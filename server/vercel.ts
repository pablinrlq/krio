// Entrada da API na Vercel: uma função Node que atende todas as rotas /api/*.
// O build (scripts/vercel-build.mjs) empacota este arquivo num só.
import { getRequestListener } from '@hono/node-server'
import { app } from './app'
import { preparar } from './preparar'

// Na fase de teste, o banco vazio ganha as contas de demonstração.
await preparar({ demo: true })

export default getRequestListener(app.fetch)
