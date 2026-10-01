import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import { ArrowUpRight, GraduationCap } from 'lucide-react'
import { ACADEMY } from '../data'
import { useNavigate } from 'react-router'
import { useDestinos } from '../lib/destinos'
import { Botao } from './ui'

export function Academy() {
  const destinos = useDestinos()
  const navegar = useNavigate()
  const trilha = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: trilha, offset: ['start 85%', 'end 55%'] })
  const avanco = useSpring(scrollYProgress, { stiffness: 120, damping: 28 })

  return (
    <section id="academy" className="on-light bg-broto text-breu">
      <div className="mx-auto max-w-[1240px] px-4 py-24 md:px-8 md:py-32">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-10">
          <h2 className="cond text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.92]">Quer criar conteúdo de forma profissional? Comece pela KRIÔ Academy.</h2>
          <p className="max-w-[30rem] text-[18px] leading-relaxed text-oliva">Formação do zero com estrutura real de gravação. A agência não só encontra talentos: ajuda a formar os próximos.</p>
        </div>

        <ol ref={trilha} className="relative mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Trilho que enche conforme a rolagem: no celular é vertical, no computador horizontal. */}
          <span className="absolute bottom-0 left-[5px] top-0 w-[2px] bg-breu/15 lg:hidden" aria-hidden="true">
            <motion.span className="block h-full w-full origin-top bg-breu" style={{ scaleY: avanco }} />
          </span>
          <span className="absolute left-0 right-0 top-[5px] hidden h-[2px] bg-breu/15 lg:block" aria-hidden="true">
            <motion.span className="block h-full w-full origin-left bg-breu" style={{ scaleX: avanco }} />
          </span>
          {ACADEMY.map((a, i) => (
            <li key={a.titulo} className="relative pl-8 lg:pl-0 lg:pt-10">
              <span
                className={`absolute left-0 top-1 size-3 rounded-full lg:top-0 ${i === ACADEMY.length - 1 ? 'bg-folha ring-4 ring-folha/25' : 'bg-breu'}`}
                aria-hidden="true"
              />
              <h3 className="cond text-[30px] font-extrabold leading-none">{a.titulo}</h3>
              <p className="mt-3 max-w-[22rem] text-[16px] leading-relaxed text-oliva">{a.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Botao variante="escuro" icone={<GraduationCap className="size-[18px]" />} onClick={() => navegar(destinos.creator())}>
            Quero entrar na Academy
          </Botao>
          <Botao variante="contorno-escuro" icone={<ArrowUpRight className="size-[18px]" />} onClick={() => navegar(destinos.creator())}>
            Já sou creator: enviar portfólio
          </Botao>
        </div>
      </div>
    </section>
  )
}
