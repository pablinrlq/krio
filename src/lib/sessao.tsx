import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router'
import { api } from './api'
import type { Evento, Mensagem, Usuario } from './tipos'

type Toast = { id: number; texto: string; link?: string | null; tom?: 'ok' | 'erro' }
type Config = { google: boolean; limiteUploadMb: number; bancoTemporario: boolean; modoTeste: boolean }
type Novidades = { agora: string; mensagens: Mensagem[]; avisos: { id: string; texto: string; link: string | null }[] }

type Ctx = {
  usuario: Usuario | null | undefined
  avisos: number
  google: boolean
  config: Config
  recarregar: () => Promise<void>
  sair: () => Promise<void>
  zerarAvisos: () => void
  ouvir: (fn: (e: Evento) => void) => () => void
  toast: (texto: string, opcoes?: { link?: string | null; tom?: 'ok' | 'erro' }) => void
}

const SessaoContext = createContext<Ctx | null>(null)
const PADRAO: Config = { google: false, limiteUploadMb: 200, bancoTemporario: false, modoTeste: false }

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null | undefined>(undefined)
  const [avisos, setAvisos] = useState(0)
  const [config, setConfig] = useState<Config>(PADRAO)
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
      const r = await api<{ usuario: Usuario | null; avisos?: number } & Partial<Config>>('/auth/eu')
      setUsuario(r.usuario)
      setAvisos(r.avisos ?? 0)
      setConfig({ ...PADRAO, ...Object.fromEntries(Object.entries(r).filter(([k]) => k in PADRAO)) })
    } catch {
      setUsuario(null)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  // "Tempo real" por consulta curta: a cada 3 s com a aba aberta, a cada 20 s em
  // segundo plano. Funciona igual na Vercel, na VPS e no computador.
  useEffect(() => {
    if (!usuario) return
    let cursor: string | null = null
    let parado = false
    let rodando = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const vistos = new Set<string>()
    const emitir = (e: Evento) => ouvintes.current.forEach((fn) => fn(e))

    const rodar = async () => {
      if (parado || rodando) return
      rodando = true
      clearTimeout(timer)
      try {
        const r = await api<Novidades>(`/novidades${cursor ? `?desde=${encodeURIComponent(cursor)}` : ''}`)
        cursor = r.agora
        for (const m of r.mensagens) {
          const chave = `${m.id}:${m.statusEntrega ?? ''}`
          if (vistos.has(chave)) continue
          vistos.add(chave)
          emitir({ tipo: 'mensagem', conversaId: m.conversaId, mensagem: m })
        }
        for (const a of r.avisos) {
          if (vistos.has(a.id)) continue
          vistos.add(a.id)
          setAvisos((n) => n + 1)
          toast(a.texto, { link: a.link })
          emitir({ tipo: 'aviso', texto: a.texto, link: a.link })
        }
      } catch {
        // Sem conexão: tenta de novo no próximo ciclo.
      } finally {
        rodando = false
        if (!parado) timer = setTimeout(rodar, document.hidden ? 20_000 : 3_000)
      }
    }
    rodar()
    const aoVoltar = () => !document.hidden && rodar()
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      parado = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [usuario?.id, toast])

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
    <SessaoContext.Provider value={{ usuario, avisos, google: config.google, config, recarregar, sair, zerarAvisos: () => setAvisos(0), ouvir, toast }}>
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
