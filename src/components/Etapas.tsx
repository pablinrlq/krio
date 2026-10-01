import { useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { ETAPAS } from '../data'

export function Etapas() {
  const [ativa, setAtiva] = useState(0)
  const abas = useRef<(HTMLButtonElement | null)[]>([])
  const etapa = ETAPAS[ativa]

  const teclado = (e: KeyboardEvent) => {
    const mov = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!mov) return
    e.preventDefault()
    const n = (ativa + mov + ETAPAS.length) % ETAPAS.length
    setAtiva(n)
    abas.current[n]?.focus()
  }

  return (
    <section id="como">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">
            Do briefing ao
            <br />
            arquivo final
          </h2>
          <p className="max-w-[24rem] text-[18px] leading-relaxed text-salvia">Sem precisar coordenar vários fornecedores. Quatro etapas, um responsável.</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[16px] bg-musgo shadow-[0_24px_48px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between border-b border-nevoa/15 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-broto semi md:px-7">
            <span>KRIÔ · Ordem de produção</span>
            <span className="tabular-nums">Etapa {ativa + 1} de {ETAPAS.length}</span>
          </div>

          <div role="tablist" aria-label="Etapas" className="grid grid-cols-4" onKeyDown={teclado}>
            {ETAPAS.map((e, i) => (
              <button
                key={e.titulo}
                ref={(el) => {
                  abas.current[i] = el
                }}
                role="tab"
                id={`aba-${i}`}
                aria-selected={ativa === i}
                aria-controls="painel-etapa"
                tabIndex={ativa === i ? 0 : -1}
                onClick={() => setAtiva(i)}
                className={`group relative flex flex-col items-start gap-2 border-l border-nevoa/15 px-3 pb-5 pt-5 text-left transition-colors first:border-l-0 md:px-7 md:pt-7 ${
                  ativa === i ? 'bg-breu/25' : 'hover:bg-breu/15'
                }`}
              >
                <span className={`cond text-[44px] font-black leading-[0.8] tabular-nums transition-colors md:text-[72px] ${ativa === i ? 'text-kiwi' : 'text-nevoa/35 group-hover:text-nevoa/60'}`}>{i + 1}</span>
                <span className={`cond text-[19px] font-extrabold leading-none sm:text-[24px] md:text-[30px] ${ativa === i ? 'text-nevoa' : 'text-nevoa/70'}`}>{e.titulo}</span>
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-nevoa/10">
                  <motion.span className="block h-full bg-kiwi" initial={false} animate={{ scaleX: ativa >= i ? 1 : 0 }} style={{ originX: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                </span>
              </button>
            ))}
          </div>

          <div id="painel-etapa" role="tabpanel" aria-labelledby={`aba-${ativa}`} className="border-t border-nevoa/15 px-5 py-8 md:px-7 md:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={ativa}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-12"
              >
                <p className="max-w-[34rem] text-[20px] leading-relaxed text-nevoa md:text-[22px]">{etapa.texto}</p>
                <ul className="flex flex-wrap gap-2">
                  {etapa.itens.map((it, k) => (
                    <motion.li
                      key={it}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.08 + k * 0.04, type: 'spring', stiffness: 420, damping: 28 }}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-breu/35 px-4 text-[15px] font-semibold text-broto semi"
                    >
                      <Check className="size-4 text-kiwi" aria-hidden="true" />
                      {it}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setAtiva((a) => (a + 1) % ETAPAS.length)}
                className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-nevoa/30 px-5 text-[15px] font-bold text-nevoa semi transition-colors hover:border-kiwi hover:text-kiwi"
              >
                {ativa === ETAPAS.length - 1 ? 'Voltar ao briefing' : `Próxima: ${ETAPAS[ativa + 1].titulo}`}
                <ArrowRight className="size-4 transition-transform duration-300 ease-expo group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
