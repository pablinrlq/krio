import { useCallback, useEffect, useRef, useState } from 'react'

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    public status: number,
  ) {
    super(mensagem)
  }
}

type Opcoes = { method?: string; json?: unknown; form?: FormData }

export async function api<T = unknown>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  let r: Response
  try {
    r = await fetch(`/api${caminho}`, {
      method: opcoes.method ?? (opcoes.json || opcoes.form ? 'POST' : 'GET'),
      headers: opcoes.json !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: opcoes.form ?? (opcoes.json !== undefined ? JSON.stringify(opcoes.json) : undefined),
      credentials: 'same-origin',
    })
  } catch {
    throw new ErroApi('Sem conexão. Confira a internet e tente de novo.', 0)
  }
  const dados = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErroApi((dados as { erro?: string }).erro ?? 'Algo deu errado. Tente de novo.', r.status)
  return dados as T
}

// Busca dados de uma rota e mantém o estado de carregamento e erro.
export function useDados<T>(caminho: string | null) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(!!caminho)
  const atual = useRef(caminho)
  atual.current = caminho

  const recarregar = useCallback(async () => {
    if (!atual.current) return
    const pedido = atual.current
    try {
      const d = await api<T>(pedido)
      if (atual.current === pedido) {
        setDados(d)
        setErro(null)
      }
    } catch (e) {
      if (atual.current === pedido) setErro((e as Error).message)
    } finally {
      if (atual.current === pedido) setCarregando(false)
    }
  }, [])

  useEffect(() => {
    setCarregando(!!caminho)
    setDados(null)
    setErro(null)
    recarregar()
  }, [caminho, recarregar])

  return { dados, erro, carregando, recarregar, setDados }
}

export const formatarNumero = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} mi`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.', ',').replace(',0', '')} mil`
  return String(n)
}

export const formatarEngajamento = (e: number | null | undefined) => (e === null || e === undefined ? '—' : `${(e / 100).toFixed(1).replace('.', ',')}%`)

export function quando(iso: string | Date) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400 && new Date().getDate() === d.getDate()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86400) return d.toLocaleDateString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
