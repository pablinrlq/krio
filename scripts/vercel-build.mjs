// Monta a saída no formato da Vercel (Build Output API v3):
//   .vercel/output/static           → site (dist do Vite)
//   .vercel/output/functions/api.func → toda a API numa função Node
//   .vercel/output/config.json      → rotas e agendamento diário
// Rode depois do `vite build` (o `npm run build:vercel` já faz os dois).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

const saida = '.vercel/output'
const funcao = `${saida}/functions/api.func`

if (!existsSync('dist/index.html')) throw new Error('Rode o vite build antes.')
rmSync(saida, { recursive: true, force: true })
mkdirSync(funcao, { recursive: true })

cpSync('dist', `${saida}/static`, { recursive: true })

await build({
  entryPoints: ['server/vercel.ts'],
  outfile: `${funcao}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // O banco embutido carrega arquivos .wasm pelo caminho: vai inteiro, sem empacotar.
  external: ['@electric-sql/pglite'],
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  logLevel: 'warning',
})

cpSync('server/db/migrations', `${funcao}/migrations`, { recursive: true })
cpSync('node_modules/@electric-sql/pglite', `${funcao}/node_modules/@electric-sql/pglite`, { recursive: true })

writeFileSync(
  `${funcao}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', shouldAddHelpers: false, maxDuration: 60 }, null, 2),
)

writeFileSync(
  `${saida}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '^/assets/(.*)$', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
        { src: '^/api(/.*)?$', dest: '/api' },
        { handle: 'filesystem' },
        { src: '^/(.*)$', dest: '/index.html' },
      ],
      crons: [{ path: '/api/cron/redes', schedule: '0 9 * * *' }],
    },
    null,
    2,
  ),
)

console.log('Saída da Vercel pronta em .vercel/output')
