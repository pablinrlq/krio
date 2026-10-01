import type { ComponentProps, ReactNode } from 'react'

type Variante = 'kiwi' | 'contorno' | 'escuro' | 'contorno-escuro' | 'claro'

const VARIANTES: Record<Variante, string> = {
  kiwi: 'bg-kiwi text-breu hover:bg-broto',
  contorno: 'border border-nevoa/35 text-nevoa hover:border-nevoa hover:bg-nevoa/5',
  escuro: 'bg-breu text-nevoa hover:bg-musgo',
  'contorno-escuro': 'border border-breu/45 text-breu hover:border-breu hover:bg-breu/5',
  claro: 'bg-nevoa text-musgo hover:bg-broto',
}

const BASE =
  'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-6 py-3 text-[16px] font-bold semi transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50'

export function Botao({
  variante = 'kiwi',
  icone,
  children,
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: Variante; icone?: ReactNode }) {
  return (
    <button type="button" className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      <span>{children}</span>
      {icone && <span className="shrink-0 transition-transform duration-300 ease-expo group-hover:translate-x-0.5">{icone}</span>}
    </button>
  )
}

export function BotaoLink({
  variante = 'kiwi',
  icone,
  children,
  className = '',
  ...props
}: ComponentProps<'a'> & { variante?: Variante; icone?: ReactNode }) {
  return (
    <a className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      <span>{children}</span>
      {icone && <span className="shrink-0 transition-transform duration-300 ease-expo group-hover:translate-x-0.5">{icone}</span>}
    </a>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`cond font-black leading-none tracking-[-0.01em] ${className}`} aria-label="KRIÔ">
      <span aria-hidden="true">
        KRI<span className="relative inline-block">
          O
          <svg
            className="absolute left-1/2 top-[-0.2em] h-[0.26em] w-[0.62em] -translate-x-1/2 text-kiwi"
            viewBox="0 0 20 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="square"
          >
            <path d="M2 8 10 1.6 18 8" />
          </svg>
        </span>
      </span>
    </span>
  )
}

export function WhatsIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </svg>
  )
}
