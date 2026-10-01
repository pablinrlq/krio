import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, Briefcase, FilePlus2, Home, LayoutGrid, LogOut, MessagesSquare, Settings, UserRound, Users, Store } from 'lucide-react'
import { Logo } from '../components/ui'
import { api, quando } from '../lib/api'
import { inicioDoPapel, useSessao } from '../lib/sessao'
import type { Papel } from '../lib/tipos'
import { Carregando } from './ui'

type Item = { para: string; nome: string; icone: ReactNode; fim?: boolean }

const MENUS: Record<Papel, Item[]> = {
  marca: [
    { para: '/marca', nome: 'Pedidos', icone: <Home className="size-5" />, fim: true },
    { para: '/marca/novo', nome: 'Novo briefing', icone: <FilePlus2 className="size-5" /> },
    { para: '/marca/creators', nome: 'Creators', icone: <LayoutGrid className="size-5" /> },
    { para: '/mensagens', nome: 'Mensagens', icone: <MessagesSquare className="size-5" /> },
    { para: '/conta', nome: 'Conta', icone: <Settings className="size-5" /> },
  ],
  creator: [
    { para: '/creator', nome: 'Início', icone: <Home className="size-5" />, fim: true },
    { para: '/creator/perfil', nome: 'Minha ficha', icone: <UserRound className="size-5" /> },
    { para: '/mensagens', nome: 'Mensagens', icone: <MessagesSquare className="size-5" /> },
    { para: '/conta', nome: 'Conta', icone: <Settings className="size-5" /> },
  ],
  admin: [
    { para: '/admin', nome: 'Painel', icone: <Home className="size-5" />, fim: true },
    { para: '/admin/pedidos', nome: 'Pedidos', icone: <Briefcase className="size-5" /> },
    { para: '/admin/creators', nome: 'Creators', icone: <Users className="size-5" /> },
    { para: '/admin/marcas', nome: 'Marcas', icone: <Store className="size-5" /> },
    { para: '/mensagens', nome: 'Mensagens', icone: <MessagesSquare className="size-5" /> },
  ],
}

export function Protegido({ papeis }: { papeis?: Papel[] }) {
  const { usuario } = useSessao()
  const local = useLocation()
  if (usuario === undefined) return <Carregando />
  if (!usuario) return <Navigate to={`/entrar?volta=${encodeURIComponent(local.pathname + local.search)}`} replace />
  if (papeis && !papeis.includes(usuario.papel)) return <Navigate to={inicioDoPapel(usuario.papel)} replace />
  return <Shell />
}

function Shell() {
  const { usuario, sair } = useSessao()
  const menu = MENUS[usuario!.papel]
  const local = useLocation()

  return (
    <div className="min-h-dvh bg-breu lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-linha px-4 py-6 lg:flex">
        <Link to="/" className="px-3 text-[34px] text-nevoa no-underline" aria-label="KRIÔ, ir para o site">
          <Logo />
        </Link>
        <p className="mt-1 px-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-salvia semi">
          {usuario!.papel === 'admin' ? 'Equipe KRIÔ' : usuario!.papel === 'creator' ? 'Creator' : 'Marca'}
        </p>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Painel">
          {menu.map((m) => (
            <NavLink
              key={m.para}
              to={m.para}
              end={m.fim}
              className={({ isActive }) =>
                `relative flex min-h-11 items-center gap-3 rounded-full px-4 text-[15px] font-semibold no-underline transition-colors ${isActive ? 'text-breu' : 'text-salvia hover:bg-nevoa/5 hover:text-nevoa'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="menu-ativo" className="absolute inset-0 -z-10 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  {m.icone}
                  {m.nome}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-linha pt-4">
          <p className="truncate px-3 text-[15px] font-semibold">{usuario!.nome}</p>
          <p className="truncate px-3 text-[13px] text-salvia">{usuario!.email}</p>
          <button type="button" onClick={sair} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-full px-4 text-[15px] font-semibold text-salvia transition-colors hover:bg-nevoa/5 hover:text-nevoa">
            <LogOut className="size-5" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-linha bg-breu/95 px-4 md:px-8">
          <Link to="/" className="text-[28px] text-nevoa no-underline lg:hidden" aria-label="KRIÔ, ir para o site">
            <Logo />
          </Link>
          <p className="hidden text-[15px] text-salvia lg:block">
            Olá, <span className="font-semibold text-nevoa">{usuario!.nome.split(' ')[0]}</span>
          </p>
          <Avisos />
        </header>
        <motion.main
          key={local.pathname}
          id="conteudo"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[1180px] px-4 pb-28 pt-8 md:px-8 lg:pb-16"
        >
          <Suspense fallback={<Carregando />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-linha bg-breu/95 pb-[env(safe-area-inset-bottom)] lg:hidden" style={{ gridTemplateColumns: `repeat(${menu.length}, minmax(0, 1fr))` }} aria-label="Painel">
        {menu.map((m) => (
          <NavLink
            key={m.para}
            to={m.para}
            end={m.fim}
            className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold no-underline semi ${isActive ? 'text-kiwi' : 'text-salvia'}`}
          >
            {m.icone}
            <span className="max-w-full truncate px-1">{m.nome}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

type Aviso = { id: string; texto: string; link: string | null; lidoEm: string | null; criadoEm: string }

function Avisos() {
  const { avisos, zerarAvisos } = useSessao()
  const [aberto, setAberto] = useState(false)
  const [lista, setLista] = useState<Aviso[] | null>(null)
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    api<Aviso[]>('/avisos').then(setLista).catch(() => setLista([]))
    if (avisos) api('/avisos/lidos', { method: 'POST' }).then(zerarAvisos).catch(() => {})
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-label={avisos ? `Avisos, ${avisos} novos` : 'Avisos'}
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="relative inline-flex size-11 items-center justify-center rounded-full border border-linha text-nevoa transition-colors hover:border-kiwi hover:text-kiwi"
      >
        <Bell className="size-5" />
        {avisos > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-kiwi px-1 text-[11px] font-bold text-breu tabular-nums">
            {avisos > 9 ? '9+' : avisos}
          </motion.span>
        )}
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-14 z-50 w-[min(92vw,380px)] overflow-hidden rounded-[16px] border border-linha bg-carvao shadow-[0_24px_48px_-16px_rgba(0,0,0,0.8)]"
          >
            <p className="border-b border-linha px-4 py-3 text-[14px] font-bold semi">Avisos</p>
            <ul className="max-h-[60vh] overflow-y-auto">
              {lista === null && <li className="px-4 py-6 text-[14px] text-salvia">Carregando…</li>}
              {lista?.length === 0 && <li className="px-4 py-6 text-[14px] text-salvia">Nenhum aviso por enquanto.</li>}
              {lista?.map((a) => (
                <li key={a.id} className="border-b border-linha/60 last:border-0">
                  <Link to={a.link ?? '#'} onClick={() => setAberto(false)} className="flex gap-3 px-4 py-3 no-underline transition-colors hover:bg-nevoa/5">
                    <span className={`mt-2 size-2 shrink-0 rounded-full ${a.lidoEm ? 'bg-transparent' : 'bg-kiwi'}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-[14px] leading-snug text-nevoa">{a.texto}</span>
                      <span className="mt-1 block text-[12px] text-salvia">{quando(a.criadoEm)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
