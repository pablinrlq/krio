import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { DIFERENCIAIS, FAQ } from '../data'

export function Diferenciais() {
  return (
    <section className="bg-carvao">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <h2 className="max-w-[16ch] cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">
          Não é só intermediar <span className="text-kiwi">influenciador.</span>
        </h2>
        <dl className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {DIFERENCIAIS.map((d) => (
            <div key={d.titulo} className="group border-t border-linha pt-6 transition-colors hover:border-kiwi">
              <dt className="cond text-[32px] font-extrabold leading-none transition-colors group-hover:text-kiwi">{d.titulo}</dt>
              <dd className="mt-3 max-w-[30rem] text-[17px] leading-relaxed text-salvia">{d.texto}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function Duvidas() {
  const [aberta, setAberta] = useState<number | null>(0)

  return (
    <section id="faq">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <div>
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">Dúvidas</h2>
          <p className="mt-5 max-w-[24rem] text-[18px] leading-relaxed text-salvia">
            Não achou a sua?{' '}
            <a href="#contato" className="font-semibold text-kiwi underline decoration-kiwi/40 hover:decoration-kiwi">
              Pergunte direto para a KRIÔ.
            </a>
          </p>
        </div>
        <ul className="border-b border-linha">
          {FAQ.map((f, i) => {
            const on = aberta === i
            return (
              <li key={f.p} className="border-t border-linha">
                <h3>
                  <button
                    type="button"
                    aria-expanded={on}
                    aria-controls={`faq-${i}`}
                    onClick={() => setAberta(on ? null : i)}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className={`text-[19px] font-bold leading-snug semi transition-colors md:text-[21px] ${on ? 'text-kiwi' : 'text-nevoa group-hover:text-kiwi'}`}>{f.p}</span>
                    <motion.span animate={{ rotate: on ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-linha text-nevoa" aria-hidden="true">
                      <Plus className="size-4" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[44rem] pb-6 text-[17px] leading-relaxed text-salvia">{f.r}</p>
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
