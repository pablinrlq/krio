import { useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { NICHOS } from '../data'

export function Faixa() {
  const itens = [...NICHOS, 'UGC', 'Influencer', 'Anúncios', 'Lançamentos']
  return (
    <div className="marquee on-light overflow-hidden border-y border-breu/10 bg-kiwi py-4 text-breu" aria-hidden="true">
      <div className="marquee-track flex w-max">
        {[0, 1].map((k) => (
          <ul key={k} className="flex shrink-0 items-center">
            {itens.map((n) => (
              <li key={n + k} className="flex items-center cond text-[clamp(1.75rem,4vw,2.75rem)] font-black uppercase leading-none">
                <span className="px-6">{n}</span>
                <svg className="size-4 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
                  <ellipse cx="8" cy="8" rx="3" ry="6" fill="currentColor" transform="rotate(35 8 8)" />
                </svg>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

const ETAPAS = [
  { etapa: 'Achar o creator', quem: 'Agência de casting', r: -4, x: -6 },
  { etapa: 'Alinhar o briefing', quem: 'E-mail com a marca', r: 3, x: 10 },
  { etapa: 'Negociar', quem: 'Assessoria do creator', r: -2, x: -14 },
  { etapa: 'Gravar', quem: 'Produtora', r: 5, x: 6 },
  { etapa: 'Revisar', quem: 'Editor freelancer', r: -5, x: 14 },
  { etapa: 'Entregar', quem: 'Mais uma planilha', r: 2, x: -8 },
]

export function Problema() {
  const [comKrio, setComKrio] = useState(false)

  return (
    <section className="on-light bg-polpa text-breu">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="max-w-[18ch] cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">
              Cada etapa com um fornecedor diferente. Ou uma operação só.
            </h2>
            <p className="mt-6 max-w-[34rem] text-[19px] leading-relaxed text-oliva">
              Achar o creator, alinhar o briefing, negociar, gravar, revisar, entregar. <strong className="font-bold text-breu">Na KRIÔ é uma operação só</strong>, com padrão de qualidade e previsibilidade. Você aprova; a gente coordena o resto.
            </p>
            <p className="mt-4 max-w-[34rem] text-[19px] leading-relaxed text-oliva">
              O creator deixa de ser só mídia: vira talento de produção para anúncio, rede social e campanha, com a linguagem nativa de quem cria todo dia.
            </p>
          </div>

          <div>
            <div role="radiogroup" aria-label="Comparar" className="inline-flex rounded-full bg-breu/8 p-1">
              {[
                { v: false, label: 'Sem a KRIÔ' },
                { v: true, label: 'Com a KRIÔ' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={comKrio === o.v}
                  onClick={() => setComKrio(o.v)}
                  className={`relative min-h-11 rounded-full px-5 text-[15px] font-bold semi transition-colors ${comKrio === o.v ? 'text-kiwi' : 'text-oliva hover:text-breu'}`}
                >
                  {comKrio === o.v && <motion.span layoutId="toggle-krio" className="absolute inset-0 rounded-full bg-breu" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <span className="relative">{o.label}</span>
                </button>
              ))}
            </div>

            <LayoutGroup>
              <motion.div
                layout
                className={`mt-6 rounded-[16px] p-4 sm:p-5 ${comKrio ? 'bg-breu text-nevoa' : 'bg-transparent'}`}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              >
                {comKrio && (
                  <motion.div layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 flex items-center justify-between text-[12px] font-semibold uppercase tracking-[0.06em] text-kiwi semi">
                    <span>KRIÔ · Ordem de produção</span>
                    <span>1 parceiro</span>
                  </motion.div>
                )}
                <ul className={comKrio ? 'grid gap-2' : 'grid gap-3 sm:grid-cols-2'}>
                  {ETAPAS.map((e, i) => (
                    <motion.li
                      layout
                      key={e.etapa}
                      animate={{ rotate: comKrio ? 0 : e.r, x: comKrio ? 0 : e.x }}
                      transition={{ type: 'spring', stiffness: 260, damping: 26, delay: i * 0.03 }}
                      className={`flex items-center justify-between gap-3 rounded-[10px] px-4 ${
                        comKrio ? 'bg-grafite py-3' : 'border border-breu/15 bg-creme py-4 shadow-[0_10px_20px_-14px_rgba(11,13,9,0.5)]'
                      }`}
                    >
                      <motion.span layout="position" className="flex items-center gap-3">
                        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-bold tabular-nums ${comKrio ? 'bg-kiwi text-breu' : 'bg-breu text-polpa'}`}>{i + 1}</span>
                        <span className="text-[16px] font-bold semi">{e.etapa}</span>
                      </motion.span>
                      <motion.span layout="position" className={`text-right text-[13px] ${comKrio ? 'text-kiwi' : 'text-oliva'}`}>
                        {comKrio ? 'KRIÔ' : e.quem}
                      </motion.span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </LayoutGroup>
            <p className="mt-4 text-[15px] font-semibold text-oliva semi" aria-live="polite">
              {comKrio ? 'Um contato, um prazo, um padrão de qualidade.' : 'Seis etapas, seis conversas paralelas para coordenar.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
