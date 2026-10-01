import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, AtSign, Mail } from 'lucide-react'
import { CONTATO, linkWhatsApp } from '../config'
import { Logo, WhatsIcon } from './ui'

const LINKS = [
  { href: '#como', label: 'Como funciona' },
  { href: '#pacotes', label: 'Pacotes' },
  { href: '#academy', label: 'Academy' },
  { href: '#studio', label: 'Studio' },
  { href: '#faq', label: 'Dúvidas' },
  { href: '#contato', label: 'Contato' },
]

export function Rodape() {
  const contatos = [
    { href: linkWhatsApp('Olá, KRIÔ!'), label: 'WhatsApp', icone: <WhatsIcon className="size-4" />, externo: true },
    CONTATO.instagram && { href: `https://instagram.com/${CONTATO.instagram.replace('@', '')}`, label: CONTATO.instagram, icone: <AtSign className="size-4" />, externo: true },
    CONTATO.email && { href: `mailto:${CONTATO.email}`, label: CONTATO.email, icone: <Mail className="size-4" />, externo: false },
  ].filter(Boolean) as { href: string; label: string; icone: React.ReactNode; externo: boolean }[]

  return (
    <footer className="border-t border-linha">
      <div className="mx-auto max-w-[1240px] px-4 pb-10 pt-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <a href="#topo" className="text-[56px] text-nevoa no-underline">
              <Logo />
            </a>
            <p className="mt-3 text-[16px] text-salvia">Creator Company · Ideias ganham rosto.</p>
          </div>
          <nav aria-label="Rodapé">
            <ul className="grid gap-1 text-[16px]">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="inline-flex min-h-10 items-center text-salvia no-underline transition-colors hover:text-kiwi">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="grid content-start gap-1 text-[16px]">
            {contatos.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex min-h-10 items-center gap-2 text-nevoa no-underline transition-colors hover:text-kiwi"
                >
                  {c.icone}
                  {c.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 flex flex-col gap-2 border-t border-linha pt-6 text-[14px] text-salvia md:flex-row md:justify-between">
          <p>© 2026 KRIÔ. Todos os direitos reservados.</p>
          <p>As fichas de creators do site são ilustrativas.</p>
        </div>
      </div>
    </footer>
  )
}

export function VoltarAoTopo() {
  const [ver, setVer] = useState(false)
  useEffect(() => {
    const onScroll = () => setVer(window.scrollY > 900)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {ver && (
        <motion.a
          href="#topo"
          aria-label="Voltar ao topo"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="fixed bottom-5 right-4 z-50 inline-flex size-12 items-center justify-center rounded-full border border-linha bg-breu text-kiwi shadow-[0_12px_28px_-10px_rgba(0,0,0,0.7)] transition-colors hover:bg-kiwi hover:text-breu md:right-6"
        >
          <ArrowUp className="size-5" />
        </motion.a>
      )}
    </AnimatePresence>
  )
}
