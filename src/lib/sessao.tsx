import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { api } from './api'
import type { Evento, Usuario } from './tipos'

type Toast = { id: number; texto: string; link?: string | null; tom?: 'ok' | 'erro' }

type Ctx = {
  usuario: Usuario | null | undefined
  avisos: number
  google: boolean
  recarregar: () => Promise<void>
  sair: () => Promise<void>
  zerarAvisos: () => void
  ouvir: (fn: (e: Evento) => void) => () => void
  toast: (texto: string, opcoes?: { link?: string | null; tom?: 'ok' | 'erro' }) => void
}

const SessaoContext = createContext<Ctx | null>(null)

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null | undefined>(undefined)
  const [avisos, setAvisos] = useState(0)
  const [google, setGoogle] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const ouvintes = useRef(new Set<(e: Evento) => void>())
  const navegar = useNavigate()

  const toast = useCallback((texto: string, opcoes: { link?: string | null; tom?: 'ok' | 'erro' } = {}) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, texto, ...opcoes }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const recarregar = useCallback(async () => {
    try {
      const r = await api<{ usuario: Usuario | null; avisos?: number; google?: boolean }>('/auth/eu')
      setUsuario(r.usuario)
      setAvisos(r.avisos ?? 0)
      setGoogle(!!r.google)
    } catch {
      setUsuario(null)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // Tempo real: uma conexão SSE por pessoa logada.
  useEffect(() => {
    if (!usuario) return
    const es = new EventSource('/api/eventos')
    es.addEventListener('evento', (m) => {
      const e = JSON.parse((m as MessageEvent).data) as Evento
      if (e.tipo === 'aviso') {
        setAvisos((n) => n + 1)
        toast(e.texto, { link: e.link })
      }
      ouvintes.current.forEach((fn) => fn(e))
    })
    return () => es.close()
  }, [usuario, toast])

  const sair = useCallback(async () => {
    await api('/auth/sair', { method: 'POST' }).catch(() => {})
    setUsuario(null)
    navegar('/')
  }, [navegar])

  const ouvir = useCallback((fn: (e: Evento) => void) => {
    ouvintes.current.add(fn)
    return () => {
      ouvintes.current.delete(fn)
    }
  }, [])

  return (
    <SessaoContext.Provider value={{ usuario, avisos, google, recarregar, sair, zerarAvisos: () => setAvisos(0), ouvir, toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[14px] px-4 py-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.7)] ${
                t.tom === 'erro' ? 'bg-[#3a1712] text-[#ffd9d0]' : 'bg-nevoa text-breu'
              }`}
            >
              <Bell className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <button
                type="button"
                className="flex-1 text-left text-[15px] font-semibold leading-snug"
                onClick={() => {
                  if (t.link) navegar(t.link)
                  setToasts((x) => x.filter((y) => y.id !== t.id))
                }}
              >
                {t.texto}
              </button>
              <button type="button" aria-label="Fechar aviso" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="-mr-1 rounded-full p-1 opacity-60 hover:opacity-100">
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SessaoContext.Provider>
  )
}

export function useSessao() {
  const c = useContext(SessaoContext)
  if (!c) throw new Error('useSessao fora do SessaoProvider')
  return c
}

export function useEventos(fn: (e: Evento) => void) {
  const { ouvir } = useSessao()
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => ouvir((e) => ref.current(e)), [ouvir])
}

export const inicioDoPapel = (p?: string) => (p === 'admin' ? '/admin' : p === 'creator' ? '/creator' : '/marca')
