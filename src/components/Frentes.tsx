import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Plus } from 'lucide-react'
import { FRENTES } from '../data'

export function Frentes() {
  const [aberta, setAberta] = useState<string | null>(FRENTES[0].id)

  return (
    <section className="bg-musgo">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">
            Quatro frentes,
            <br />
            uma operação
          </h2>
          <p className="max-w-[24rem] text-[18px] leading-relaxed text-broto">Toque em cada frente para ver o que ela faz pela sua marca.</p>
        </div>

        <ul className="mt-12 border-b border-nevoa/20">
          {FRENTES.map((f) => {
            const on = aberta === f.id
            return (
              <li key={f.id} className="border-t border-nevoa/20">
                <h3>
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`frente-${f.id}`}
                    onClick={() => setAberta(on ? null : f.id)}
                    className="group flex w-full items-center gap-5 py-6 text-left md:py-8"
                  >
                    <motion.span
                      className="w-3 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: f.cor }}
                      animate={{ height: on ? 56 : 28 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                    <span className={`flex-1 cond text-[clamp(2.4rem,7vw,4.25rem)] font-black uppercase leading-[0.85] transition-colors ${on ? 'text-nevoa' : 'text-nevoa/60 group-hover:text-nevoa'}`}>
                      {f.titulo}
                    </span>
                    <motion.span
                      className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full border transition-colors ${on ? 'border-kiwi bg-kiwi text-breu' : 'border-nevoa/30 text-nevoa group-hover:border-kiwi'}`}
                      animate={{ rotate: on ? 45 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                      aria-hidden="true"
                    >
                      <Plus className="size-5" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`frente-${f.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-6 pb-8 pl-8 md:grid-cols-[minmax(0,1.3fr)_auto] md:items-end md:gap-12 md:pb-10">
                        <div>
                          <p className="max-w-[40rem] text-[18px] leading-relaxed text-nevoa/90">{f.texto}</p>
                          <p className="mt-3 text-[14px] font-semibold text-broto semi">{f.tags}</p>
                        </div>
                        <a
                          href={f.alvo}
                          className="group/l inline-flex min-h-11 items-center gap-2 self-start text-[16px] font-bold text-kiwi underline decoration-kiwi/40 underline-offset-4 semi hover:decoration-kiwi md:self-end"
                        >
                          {f.acao}
                          <ArrowUpRight className="size-4 transition-transform duration-300 ease-expo group-hover/l:-translate-y-0.5 group-hover/l:translate-x-0.5" aria-hidden="true" />
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
