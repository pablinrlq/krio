import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { Modalidade } from './data'

export type Perfil = 'marca' | 'creator'
export type Interesse = 'Academy' | 'Casting'

export type Pedido = {
  perfil?: Perfil
  nicho?: string
  pacote?: string
  modalidade?: Modalidade
  interesse?: Interesse
}

type Ctx = {
  pedido: Pedido
  versao: number
  preencher: (p: Pedido) => void
}

const BriefContext = createContext<Ctx | null>(null)

export function BriefProvider({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido>({})
  const [versao, setVersao] = useState(0)

  // Leva o que a pessoa escolheu em qualquer seção para o formulário de contato.
  const preencher = useCallback((p: Pedido) => {
    setPedido(p)
    setVersao((v) => v + 1)
    requestAnimationFrame(() => {
      document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  return <BriefContext.Provider value={{ pedido, versao, preencher }}>{children}</BriefContext.Provider>
}

export function useBrief() {
  const ctx = useContext(BriefContext)
  if (!ctx) throw new Error('useBrief fora do BriefProvider')
  return ctx
}
