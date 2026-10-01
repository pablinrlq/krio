import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, type PanInfo } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import { CREATORS, type Creator } from '../data'
import { useBrief } from '../brief'
import { BotaoLink } from './ui'

// Posição das três fichas visíveis no baralho; o resto fica escondido atrás.
const SLOTS = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
  { x: -54, y: 22, rotate: -7, scale: 0.95, opacity: 1 },
  { x: 52, y: 36, rotate: 6, scale: 0.9, opacity: 1 },
]
const ESCONDIDA = { x: 0, y: 52, rotate: 0, scale: 0.86, opacity: 0 }

export function Hero() {
  const { preencher } = useBrief()
  const reduzir = useReducedMotion()
  const [ordem, setOrdem] = useState(CREATORS.map((c) => c.id))
  const [tocou, setTocou] = useState(false)
  const [pausado, setPausado] = useState(false)
  const palco = useRef<HTMLDivElement>(null)
  const naTela = useInView(palco, { amount: 0.4 })

  // No celular as fichas de trás abrem menos, para não sair da tela.
  const [estreito, setEstreito] = useState(() => window.matchMedia('(max-width: 480px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 480px)')
    const fn = () => setEstreito(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  const abertura = estreito ? 0.42 : 1

  const frente = CREATORS.find((c) => c.id === ordem[0])!

  const trazer = (id: string) => setOrdem((o) => [id, ...o.filter((x) => x !== id)])
  const proxima = () => setOrdem((o) => [...o.slice(1), o[0]])
  const anterior = () => setOrdem((o) => [o[o.length - 1], ...o.slice(0, -1)])
  const sortear = () => {
    const outros = ordem.slice(1)
    trazer(outros[Math.floor(Math.random() * outros.length)])
  }
  const interagir = (fn: () => void) => () => {
    setTocou(true)
    fn()
  }

  // O baralho gira sozinho até a pessoa mexer nele.
  useEffect(() => {
    if (tocou || pausado || reduzir || !naTela) return
    const t = setInterval(proxima, 3400)
    return () => clearInterval(t)
  }, [tocou, pausado, reduzir, naTela])

  const soltar = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500) {
      setTocou(true)
      info.offset.x < 0 ? proxima() : anterior()
    }
  }

  return (
    <section id="topo" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-4 pb-20 pt-12 md:px-8 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 lg:pb-28">
        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="cond text-[clamp(3.4rem,11vw,6rem)] font-black uppercase leading-[0.86] tracking-[-0.01em]">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              O rosto certo.
            </motion.span>
            <motion.span
              className="block text-kiwi"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              Com o vídeo pronto.
            </motion.span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-[18px] leading-relaxed text-nevoa/85 md:text-[19px]">
            A KRIÔ conecta sua marca a creators selecionados e cuida da produção inteira: briefing, roteiro, gravação, edição e entrega. Um parceiro só, do começo ao arquivo final.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BotaoLink href="#contato" icone={<ArrowRight className="size-[18px]" />} onClick={(e) => { e.preventDefault(); preencher({ perfil: 'marca' }) }}>
              Quero creators para a minha marca
            </BotaoLink>
            <BotaoLink href="#academy" variante="contorno" icone={<ArrowRight className="size-[18px]" />}>
              Sou creator
            </BotaoLink>
          </div>
          <p className="mt-10 text-[15px] font-semibold text-salvia semi">Casting · Produção · Studio · Academy</p>
        </div>

        <div className="relative min-w-0" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}>
          <fieldset className="min-w-0">
            <legend className="text-[15px] font-semibold text-salvia">Teste o match: escolha um nicho</legend>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {CREATORS.map((c) => {
                const on = c.id === frente.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={interagir(() => trazer(c.id))}
                    className={`relative inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-semibold semi transition-colors duration-200 ${
                      on ? 'border-kiwi text-breu' : 'border-linha text-nevoa hover:border-salvia'
                    }`}
                  >
                    {on && <motion.span layoutId="chip-nicho" className="absolute inset-0 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                    <span className="relative">{c.nicho}</span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div ref={palco} className="relative mt-6 h-[470px] sm:h-[500px]">
            {CREATORS.map((c) => {
              const i = ordem.indexOf(c.id)
              const base = SLOTS[i] ?? ESCONDIDA
              const slot = { ...base, x: base.x * abertura, rotate: base.rotate * (estreito ? 0.7 : 1) }
              return (
                <motion.article
                  key={c.id}
                  aria-hidden={i !== 0}
                  className="absolute left-1/2 top-2 -ml-[146px] w-[292px] origin-bottom touch-pan-y select-none rounded-[14px] p-4 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)]"
                  style={{ backgroundColor: c.bg, color: c.fg, zIndex: 10 - i, cursor: i === 0 ? 'grab' : 'default' }}
                  initial={false}
                  animate={slot}
                  transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                  drag={i === 0 ? 'x' : false}
                  dragSnapToOrigin
                  dragElastic={0.6}
                  whileDrag={{ cursor: 'grabbing', rotate: 0 }}
                  onDragEnd={soltar}
                >
                  <Ficha c={c} frente={i === 0} />
                </motion.article>
              )
            })}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <button type="button" onClick={interagir(anterior)} aria-label="Ficha anterior" className="inline-flex size-11 items-center justify-center rounded-full border border-linha text-nevoa transition-colors hover:border-kiwi hover:text-kiwi active:scale-95">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={interagir(sortear)} className="inline-flex h-11 items-center gap-2 rounded-full border border-linha px-4 text-[15px] font-semibold text-nevoa semi transition-colors hover:border-kiwi hover:text-kiwi active:scale-95">
              <Shuffle className="size-4" aria-hidden="true" />
              Sortear
            </button>
            <button type="button" onClick={interagir(proxima)} aria-label="Próxima ficha" className="inline-flex size-11 items-center justify-center rounded-full border border-linha text-nevoa transition-colors hover:border-kiwi hover:text-kiwi active:scale-95">
              <ChevronRight className="size-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => preencher({ perfil: 'marca', nicho: frente.nicho })}
            className="mx-auto mt-4 flex min-h-11 items-center gap-2 text-[16px] font-bold text-kiwi underline decoration-kiwi/40 underline-offset-4 semi transition-colors hover:decoration-kiwi"
          >
            Quero um creator de {frente.nicho}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="sr-only" aria-live="polite">
            Match: {frente.nome}, {frente.nicho}
          </p>
          <p className="mt-3 text-center text-[13px] text-salvia">Perfis ilustrativos. Arraste a ficha para o lado para ver a próxima.</p>
        </div>
      </div>
    </section>
  )
}

function Ficha({ c, frente }: { c: Creator; frente: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] semi">
        <span>KRIÔ</span>
        <span className="tabular-nums">Ficha {c.ficha}</span>
      </div>
      <div className="relative mt-3 flex h-[176px] items-end overflow-hidden rounded-[8px] p-3" style={{ backgroundColor: c.fotoBg, color: c.fotoFg }}>
        <span className="cond text-[118px] font-black leading-[0.78] tracking-[-0.02em]">{c.ini}</span>
        <span className="absolute right-2.5 top-2.5 rounded-full border border-current px-2 py-0.5 text-[11px] font-semibold uppercase semi">{c.formato}</span>
      </div>
      <p className="mt-3 cond text-[32px] font-extrabold leading-none">{c.nome}</p>
      <dl className="mt-2.5 text-[13px] leading-snug">
        {[
          ['Nicho', c.nicho],
          ['Idiomas', c.idiomas],
          ['Base', c.base],
          ['Linguagem', c.linguagem],
        ].map(([k, v], i, arr) => (
          <div key={k} className={`flex justify-between gap-3 border-t py-2 ${i === arr.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)' }}>
            <dt>{k}</dt>
            <dd className="text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <AnimatePresence>
        {frente && (
          <motion.span
            key={c.id}
            className="absolute right-3 top-[176px] grid size-[84px] place-items-center rounded-full border-2 border-current cond text-[19px] font-black uppercase leading-none tracking-[0.04em]"
            style={{ color: c.carimbo, backgroundColor: c.bg }}
            initial={{ scale: 2.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: -12, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 22, delay: 0.18 }}
            aria-hidden="true"
          >
            Match
          </motion.span>
        )}
      </AnimatePresence>
    </>
  )
}
