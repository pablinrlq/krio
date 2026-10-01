import { useState, type KeyboardEvent } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { Check, ExternalLink, Info, X } from 'lucide-react'
import { formatarEngajamento, formatarNumero } from '../lib/api'
import type { Candidato } from '../lib/tipos'
import { FichaCard, IconeRede, NOME_REDE } from './ui'

const LIMITE = 110

// Baralho da lista curta: arrastar para a direita = quero, para a esquerda = passo.
export function Deck({ candidatos, aoDecidir }: { candidatos: Candidato[]; aoDecidir: (id: string, d: 'quero' | 'passo') => Promise<void> }) {
  const [saindo, setSaindo] = useState<{ id: string; dir: 1 | -1 } | null>(null)
  const [detalhe, setDetalhe] = useState(false)
  const visiveis = candidatos.filter((c) => c.id !== saindo?.id).slice(0, 3)
  const topo = visiveis[0]

  const decidir = async (dir: 1 | -1) => {
    if (!topo || saindo) return
    setDetalhe(false)
    setSaindo({ id: topo.id, dir })
    await aoDecidir(topo.id, dir === 1 ? 'quero' : 'passo')
    setSaindo(null)
  }

  const teclas = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') decidir(1)
    if (e.key === 'ArrowLeft') decidir(-1)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
      <div tabIndex={0} onKeyDown={teclas} aria-label="Fichas para decidir. Use as setas: direita para quero, esquerda para passo." className="rounded-[20px] outline-offset-8">
        <div className="relative mx-auto h-[560px] w-full max-w-[330px]">
          <AnimatePresence custom={saindo?.dir ?? 1}>
            {visiveis
              .map((c, i) => <Carta key={c.id} c={c} indice={i} ativa={i === 0} aoSoltar={decidir} />)
              .reverse()}
          </AnimatePresence>
          {!topo && (
            <div className="absolute inset-0 grid place-items-center rounded-[16px] border border-dashed border-linha p-6 text-center">
              <p className="text-[16px] text-salvia">Você passou por todas as fichas desta lista.</p>
            </div>
          )}
        </div>
        {topo && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => decidir(-1)} aria-label={`Passo: ${topo.creator.nome}`} className="inline-flex size-16 items-center justify-center rounded-full border-2 border-linha text-nevoa transition-[border-color,transform] hover:border-[#ffb3a3] hover:text-[#ffb3a3] active:scale-90">
              <X className="size-7" />
            </button>
            <button type="button" onClick={() => setDetalhe((v) => !v)} aria-expanded={detalhe} aria-label="Ver ficha completa" className="inline-flex size-12 items-center justify-center rounded-full border border-linha text-salvia transition-colors hover:border-nevoa hover:text-nevoa">
              <Info className="size-5" />
            </button>
            <button type="button" onClick={() => decidir(1)} aria-label={`Quero: ${topo.creator.nome}`} className="inline-flex size-16 items-center justify-center rounded-full bg-kiwi text-breu transition-[background-color,transform] hover:bg-broto active:scale-90">
              <Check className="size-8" />
            </button>
          </div>
        )}
        <p className="mt-4 text-center text-[13px] text-salvia">Arraste a ficha ou use as setas do teclado.</p>
      </div>

      <AnimatePresence mode="wait">
        {topo && (
          <motion.div key={topo.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className={`${detalhe ? '' : 'hidden lg:block'}`}>
            <Detalhe c={topo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Carta({ c, indice, ativa, aoSoltar }: { c: Candidato; indice: number; ativa: boolean; aoSoltar: (dir: 1 | -1) => void }) {
  const x = useMotionValue(0)
  const rot = useTransform(x, [-240, 240], [-16, 16])
  const quero = useTransform(x, [20, LIMITE], [0, 1])
  const passo = useTransform(x, [-LIMITE, -20], [1, 0])

  const soltar = (_: unknown, info: PanInfo) => {
    const dir = info.offset.x > LIMITE || info.velocity.x > 600 ? 1 : info.offset.x < -LIMITE || info.velocity.x < -600 ? -1 : 0
    if (dir) aoSoltar(dir as 1 | -1)
    else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
  }

  return (
    <motion.div
      className="absolute inset-x-0 top-0 touch-pan-y select-none"
      style={{ x: ativa ? x : 0, rotate: ativa ? rot : 0, zIndex: 10 - indice, cursor: ativa ? 'grab' : 'default' }}
      initial={{ scale: 0.9, y: 40, opacity: 0 }}
      animate={{ scale: 1 - indice * 0.05, y: indice * 18, opacity: 1 }}
      variants={{ sair: (dir: number) => ({ x: dir * 520, rotate: dir * 22, opacity: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }) }}
      exit="sair"
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      drag={ativa ? 'x' : false}
      dragElastic={0.9}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={soltar}
      whileDrag={{ cursor: 'grabbing' }}
      aria-hidden={!ativa}
    >
      <div className="shadow-[0_28px_56px_-20px_rgba(0,0,0,0.85)] rounded-[14px]">
        <FichaCard f={c.creator} />
      </div>
      {ativa && (
        <>
          <motion.span style={{ opacity: quero }} className="pointer-events-none absolute left-5 top-20 -rotate-12 rounded-[10px] border-[3px] border-kiwi px-3 py-1 cond text-[40px] font-black uppercase leading-none text-kiwi">
            Quero
          </motion.span>
          <motion.span style={{ opacity: passo }} className="pointer-events-none absolute right-5 top-20 rotate-12 rounded-[10px] border-[3px] border-[#ffb3a3] px-3 py-1 cond text-[40px] font-black uppercase leading-none text-[#ffb3a3]">
            Passo
          </motion.span>
        </>
      )}
    </motion.div>
  )
}

function Detalhe({ c }: { c: Candidato }) {
  const f = c.creator
  return (
    <div className="rounded-[16px] border border-linha bg-carvao p-5 md:p-6">
      {c.notaKrio && (
        <p className="mb-5 rounded-[12px] bg-musgo px-4 py-3 text-[15px] text-broto">
          <span className="font-bold text-kiwi">Por que a KRIÔ escolheu: </span>
          {c.notaKrio}
        </p>
      )}
      <h3 className="cond text-[36px] font-black leading-none">{f.nome}</h3>
      {f.bio && <p className="mt-3 max-w-[40rem] text-[16px] leading-relaxed text-nevoa/90">{f.bio}</p>}
      <dl className="mt-5 grid gap-x-8 gap-y-3 text-[15px] sm:grid-cols-2">
        <div>
          <dt className="text-salvia">Idiomas</dt>
          <dd className="font-semibold">{f.idiomas?.join(', ') || '—'}</dd>
        </div>
        <div>
          <dt className="text-salvia">Linguagem</dt>
          <dd className="font-semibold">{f.linguagem || '—'}</dd>
        </div>
      </dl>
      {f.videoUrl && (
        <a href={f.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 text-[15px] font-bold text-kiwi underline decoration-kiwi/40 hover:decoration-kiwi">
          Ver vídeo de apresentação
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
      {f.redes.length > 0 && (
        <div className="mt-6">
          <p className="text-[14px] font-semibold text-salvia">Redes conectadas</p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[15px]">
              <thead>
                <tr className="text-[13px] text-salvia">
                  <th className="py-2 font-semibold">Rede</th>
                  <th className="py-2 text-right font-semibold">Seguidores</th>
                  <th className="py-2 text-right font-semibold">Engajamento</th>
                  <th className="py-2 text-right font-semibold">Publicações</th>
                </tr>
              </thead>
              <tbody>
                {f.redes.map((r) => (
                  <tr key={r.rede} className="border-t border-linha">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <IconeRede rede={r.rede} />
                        {NOME_REDE[r.rede]}
                        {r.usuario && <span className="text-salvia">{r.usuario.startsWith('@') ? r.usuario : `@${r.usuario}`}</span>}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{formatarNumero(r.seguidores)}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatarEngajamento(r.engajamento)}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatarNumero(r.publicacoes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PostsRecentes f={f} />
        </div>
      )}
    </div>
  )
}

export function PostsRecentes({ f }: { f: Candidato['creator'] }) {
  const posts = f.redes.flatMap((r) => (r.posts ?? []).filter((p) => p.thumb).map((p) => ({ ...p, rede: r.rede })))
  if (!posts.length) return null
  return (
    <div className="mt-5">
      <p className="text-[14px] font-semibold text-salvia">Últimos posts</p>
      <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {posts.slice(0, 8).map((p) => (
          <li key={p.id}>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden rounded-[8px] bg-grafite">
              <img src={p.thumb} alt={p.legenda ?? 'Post'} loading="lazy" className="size-full object-cover" />
              <span className="absolute bottom-1 left-1 rounded-full bg-breu/70 px-1.5 py-0.5 text-[11px] text-nevoa">
                <IconeRede rede={p.rede} className="inline size-3" /> {formatarNumero(p.views ?? p.curtidas)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
