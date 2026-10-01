import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check } from 'lucide-react'
import { MODALIDADES, PACOTES, type Modalidade } from '../data'
import { useBrief } from '../brief'

export function Pacotes() {
  const { preencher } = useBrief()
  const [modalidade, setModalidade] = useState<Modalidade>('UGC')
  const [foco, setFoco] = useState('Growth')

  return (
    <section id="pacotes">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">Pacotes para marcas</h2>
          <p className="max-w-[28rem] text-[18px] leading-relaxed text-salvia">Projeto avulso ou, melhor, recorrência. As quantidades são exemplos e se ajustam ao que a sua marca precisa.</p>
        </div>

        <div className="mt-12 grid gap-6 rounded-[16px] border border-linha bg-carvao p-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10 md:p-6">
          <div role="radiogroup" aria-label="Modalidade" className="inline-flex self-start rounded-full bg-breu p-1">
            {(Object.keys(MODALIDADES) as Modalidade[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={modalidade === m}
                onClick={() => setModalidade(m)}
                className={`relative min-h-11 rounded-full px-6 text-[16px] font-bold semi transition-colors ${modalidade === m ? 'text-breu' : 'text-salvia hover:text-nevoa'}`}
              >
                {modalidade === m && <motion.span layoutId="modalidade" className="absolute inset-0 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                <span className="relative">{m}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={modalidade}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-[18px] leading-relaxed text-nevoa/90"
            >
              <strong className="font-bold text-kiwi">{modalidade}:</strong> {MODALIDADES[modalidade]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-[16px] border border-linha bg-linha md:grid-cols-2 lg:grid-cols-4">
          {PACOTES.map((p) => {
            const on = foco === p.nome
            return (
              <div
                key={p.nome}
                onMouseEnter={() => setFoco(p.nome)}
                onFocusCapture={() => setFoco(p.nome)}
                className={`relative flex flex-col transition-colors duration-300 ${on ? 'bg-grafite' : 'bg-carvao'}`}
              >
                <div className="relative overflow-hidden px-6 py-5" style={{ backgroundColor: p.topo, color: p.texto }}>
                  <h3 className="cond text-[40px] font-black uppercase leading-none">{p.nome}</h3>
                  <p className="mt-1 text-[14px] font-semibold opacity-80 semi">{modalidade}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-3 px-6 py-6 text-[16px]">
                  {p.itens.map((it) => (
                    <li key={it} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-[18px] shrink-0 text-kiwi" aria-hidden="true" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <div className="px-6 pb-6">
                  <button
                    type="button"
                    onClick={() => preencher({ perfil: 'marca', pacote: p.nome, modalidade })}
                    className={`group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-[16px] font-bold semi transition-colors ${
                      on ? 'bg-kiwi text-breu hover:bg-broto' : 'border border-nevoa/25 text-nevoa hover:border-kiwi hover:text-kiwi'
                    }`}
                  >
                    Pedir o {p.nome}
                    <ArrowRight className="size-4 transition-transform duration-300 ease-expo group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-5 max-w-[48rem] text-[14px] leading-relaxed text-salvia">Direito de uso de imagem é contratado à parte, por período, mídia paga, território e exclusividade.</p>
      </div>
    </section>
  )
}
