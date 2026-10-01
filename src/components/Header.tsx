import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Link } from 'react-router'
import { inicioDoPapel, useSessao } from '../lib/sessao'
import { Logo } from './ui'

const LINKS = [
  { href: '#como', label: 'Como funciona' },
  { href: '#pacotes', label: 'Pacotes' },
  { href: '#academy', label: 'Academy' },
  { href: '#studio', label: 'Studio' },
  { href: '#faq', label: 'Dúvidas' },
]

export function Header() {
  const { usuario } = useSessao()
  const [aberto, setAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  const [ativo, setAtivo] = useState('')
  const { scrollYProgress } = useScroll()
  const progresso = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Destaca no menu a seção que está na tela.
  useEffect(() => {
    const secoes = LINKS.map((l) => document.querySelector(l.href)).filter(Boolean) as Element[]
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setAtivo('#' + e.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    secoes.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color] duration-300 ${
        rolou || aberto ? 'border-b border-linha bg-breu/95' : 'border-b border-transparent bg-breu'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 md:px-8" aria-label="Principal">
        <a href="#topo" className="text-[30px] text-nevoa no-underline" onClick={() => setAberto(false)}>
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 text-[15px] font-medium lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                aria-current={ativo === l.href ? 'true' : undefined}
                className={`relative rounded-full px-3.5 py-2 no-underline transition-colors ${
                  ativo === l.href ? 'text-breu' : 'text-salvia hover:text-nevoa'
                }`}
              >
                {ativo === l.href && (
                  <motion.span layoutId="nav-ativo" className="absolute inset-0 -z-10 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                )}
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {usuario ? (
            <Link
              to={inicioDoPapel(usuario.papel)}
              className="hidden min-h-11 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi transition-colors hover:bg-broto sm:inline-flex"
            >
              Meu painel
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="hidden min-h-11 items-center rounded-full px-4 text-[15px] font-semibold text-nevoa no-underline transition-colors hover:text-kiwi sm:inline-flex">
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="hidden min-h-11 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi transition-colors hover:bg-broto sm:inline-flex"
              >
                Criar conta
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-linha text-nevoa transition-colors hover:border-kiwi hover:text-kiwi lg:hidden"
            aria-expanded={aberto}
            aria-controls="menu-celular"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setAberto((v) => !v)}
          >
            {aberto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <motion.div className="absolute inset-x-0 bottom-[-1px] h-[2px] origin-left bg-kiwi" style={{ scaleX: progresso }} aria-hidden="true" />

      <AnimatePresence>
        {aberto && (
          <motion.div
            id="menu-celular"
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-breu lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="flex flex-col px-4 pt-6">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-linha"
                >
                  <a
                    href={l.href}
                    onClick={() => setAberto(false)}
                    className="flex items-center justify-between py-5 cond text-[44px] font-black uppercase leading-none text-nevoa no-underline active:text-kiwi"
                  >
                    {l.label}
                    <ArrowRight className="size-7 text-kiwi" aria-hidden="true" />
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="px-4 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <Link
                to={usuario ? inicioDoPapel(usuario.papel) : '/cadastro'}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-kiwi text-[18px] font-bold text-breu no-underline semi"
              >
                {usuario ? 'Meu painel' : 'Criar conta'}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
              {!usuario && (
                <Link to="/entrar" className="mt-3 flex min-h-14 w-full items-center justify-center rounded-full border border-nevoa/30 text-[18px] font-bold text-nevoa no-underline semi">
                  Entrar
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
