import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CENARIOS } from '../data'

export function Studio() {
  const [sel, setSel] = useState(CENARIOS[0].id)
  const cenario = CENARIOS.find((c) => c.id === sel)!

  return (
    <section id="studio">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">KRIÔ Studio</h2>
          <p className="mt-3 inline-flex rounded-full border border-kiwi/60 px-3 py-1 text-[13px] font-semibold text-kiwi semi">Próxima fase</p>
          <p className="mt-6 max-w-[30rem] text-[18px] leading-relaxed text-nevoa/90">Um espaço pensado para produzir volume sem parecer sempre o mesmo vídeo.</p>
          <dl className="mt-8 max-w-[30rem] text-[16px] leading-relaxed">
            <div className="border-t border-linha py-4">
              <dt className="font-bold">Eficiência</dt>
              <dd className="mt-1 text-salvia">Equipamento, luz e direção prontos reduzem o tempo de preparação e aumentam a consistência.</dd>
            </div>
            <div className="border-y border-linha py-4">
              <dt className="font-bold">Escala</dt>
              <dd className="mt-1 text-salvia">Um único dia gera várias peças, creators e variações de campanha para canais diferentes.</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="mb-3 text-[14px] text-salvia">Planta dos cenários modulares. Toque em um cenário.</p>
          <ul className="grid auto-rows-[104px] grid-cols-2 gap-2 sm:auto-rows-[130px] md:auto-rows-[150px] lg:grid-cols-4">
            {CENARIOS.map((c) => {
              const on = sel === c.id
              return (
                <li key={c.id} className={`min-w-0 ${c.area}`}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSel(c.id)}
                    className="relative flex h-full w-full items-end overflow-hidden rounded-[12px] p-4 text-left transition-[transform,filter] duration-300 ease-expo hover:brightness-110 active:scale-[0.98] md:p-5"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    {on && (
                      <motion.span
                        layoutId="cenario-sel"
                        className="pointer-events-none absolute inset-1.5 rounded-[8px] border-2 border-dashed"
                        style={{ borderColor: c.fg }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}
                    <span className={`relative cond font-black uppercase leading-[0.9] ${c.area.includes('row-span-2') || c.area.includes('col-span-4') ? 'text-[36px] md:text-[48px]' : 'text-[22px] md:text-[28px]'}`}>{c.nome}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 min-h-[88px] rounded-[12px] border border-linha bg-carvao px-5 py-4" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div key={cenario.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
                <p className="cond text-[24px] font-extrabold leading-none text-kiwi">{cenario.nome}</p>
                <p className="mt-2 text-[16px] text-nevoa/90">{cenario.uso}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
