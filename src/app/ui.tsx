import { useId, type ComponentProps, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, Check, LoaderCircle } from 'lucide-react'
import { formatarEngajamento, formatarNumero } from '../lib/api'
import type { Ficha, FichaRede, Rede, StatusPedido } from '../lib/tipos'

export const CAMPO =
  'w-full min-h-12 rounded-[10px] border border-linha bg-grafite px-4 text-[16px] text-nevoa placeholder:text-salvia/70 transition-colors hover:border-salvia focus:border-kiwi focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kiwi aria-[invalid=true]:border-[#ff9b85] disabled:opacity-60'

export function Campo({
  label,
  erro,
  dica,
  children,
}: {
  label: string
  erro?: string | null
  dica?: string
  children: (p: { id: string; className: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}) {
  const id = useId()
  const ajuda = useId()
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-semibold text-salvia">
        {label}
      </label>
      <div className="mt-2">{children({ id, className: CAMPO, 'aria-invalid': erro ? true : undefined, 'aria-describedby': erro || dica ? ajuda : undefined })}</div>
      {(erro || dica) && (
        <p id={ajuda} className={`mt-2 text-[14px] ${erro ? 'font-medium text-[#ffb3a3]' : 'text-salvia'}`}>
          {erro || dica}
        </p>
      )}
    </div>
  )
}

type Variante = 'kiwi' | 'contorno' | 'fantasma' | 'perigo' | 'claro'
const VAR: Record<Variante, string> = {
  kiwi: 'bg-kiwi text-breu hover:bg-broto',
  contorno: 'border border-nevoa/25 text-nevoa hover:border-kiwi hover:text-kiwi',
  fantasma: 'text-salvia hover:bg-nevoa/5 hover:text-nevoa',
  perigo: 'border border-[#ff9b85]/40 text-[#ffb3a3] hover:bg-[#ff9b85]/10',
  claro: 'bg-nevoa text-breu hover:bg-broto',
}

export function Botao({
  variante = 'kiwi',
  carregando,
  icone,
  children,
  className = '',
  tamanho = 'md',
  ...p
}: ComponentProps<'button'> & { variante?: Variante; carregando?: boolean; icone?: ReactNode; tamanho?: 'sm' | 'md' | 'lg' }) {
  const t = tamanho === 'sm' ? 'min-h-10 px-4 text-[14px]' : tamanho === 'lg' ? 'min-h-14 px-7 text-[17px]' : 'min-h-12 px-5 text-[15px]'
  return (
    <button
      type="button"
      disabled={carregando || p.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold semi transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${t} ${VAR[variante]} ${className}`}
      {...p}
    >
      {carregando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : icone}
      {children}
    </button>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-salvia" role="status">
      <LoaderCircle className="size-5 animate-spin text-kiwi" aria-hidden="true" />
      <span className="text-[15px]">{texto}</span>
    </div>
  )
}

export function ErroCaixa({ texto, tentar }: { texto: string; tentar?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#ff9b85]/30 bg-[#ff9b85]/5 px-4 py-3 text-[15px] text-[#ffd0c4]" role="alert">
      <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">{texto}</span>
      {tentar && (
        <Botao variante="fantasma" tamanho="sm" onClick={tentar}>
          Tentar de novo
        </Botao>
      )}
    </div>
  )
}

export function Vazio({ titulo, texto, acao }: { titulo: string; texto: string; acao?: ReactNode }) {
  return (
    <div className="rounded-[16px] border border-dashed border-linha px-6 py-12 text-center">
      <p className="cond text-[30px] font-black leading-none">{titulo}</p>
      <p className="mx-auto mt-3 max-w-[30rem] text-[16px] text-salvia">{texto}</p>
      {acao && <div className="mt-6 flex justify-center">{acao}</div>}
    </div>
  )
}

export function Titulo({ children, acao, sub }: { children: ReactNode; acao?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="cond text-[clamp(2.4rem,6vw,3.75rem)] font-black leading-[0.9]">{children}</h1>
        {sub && <p className="mt-3 max-w-[40rem] text-[16px] text-salvia">{sub}</p>}
      </div>
      {acao}
    </div>
  )
}

const STATUS_PEDIDO: Record<StatusPedido, { nome: string; cor: string }> = {
  briefing: { nome: 'Briefing', cor: 'bg-grafite text-nevoa border-linha' },
  match: { nome: 'Match', cor: 'bg-kiwi/15 text-kiwi border-kiwi/40' },
  producao: { nome: 'Produção', cor: 'bg-broto/15 text-broto border-broto/40' },
  entrega: { nome: 'Entrega', cor: 'bg-polpa/15 text-polpa border-polpa/40' },
  concluido: { nome: 'Concluído', cor: 'bg-kiwi text-breu border-kiwi' },
  cancelado: { nome: 'Cancelado', cor: 'bg-transparent text-salvia border-linha' },
}

export function SeloStatus({ status }: { status: StatusPedido }) {
  const s = STATUS_PEDIDO[status]
  return <span className={`inline-flex h-7 items-center rounded-full border px-3 text-[13px] font-bold semi ${s.cor}`}>{s.nome}</span>
}

export function Selo({ children, tom = 'neutro' }: { children: ReactNode; tom?: 'neutro' | 'kiwi' | 'alerta' | 'claro' }) {
  const c = { neutro: 'border-linha text-salvia', kiwi: 'border-kiwi/50 text-kiwi', alerta: 'border-[#ffb36b]/50 text-[#ffcf9e]', claro: 'border-nevoa/30 text-nevoa' }[tom]
  return <span className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold semi ${c}`}>{children}</span>
}

const iniciais = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export function Avatar({ nome, foto, tamanho = 44, className = '' }: { nome: string; foto?: string | null; tamanho?: number; className?: string }) {
  return foto ? (
    <img src={foto} alt="" width={tamanho} height={tamanho} className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: tamanho, height: tamanho }} />
  ) : (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-musgo cond font-black text-kiwi ${className}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  )
}

export function IconeRede({ rede, className = 'size-4' }: { rede: Rede; className?: string }) {
  const p = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (rede === 'instagram')
    return (
      <svg {...p}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
    )
  if (rede === 'youtube')
    return (
      <svg {...p}>
        <rect x="2.5" y="5" width="19" height="14" rx="4" />
        <path d="m10 9 5 3-5 3z" fill="currentColor" />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.3 4.6 5 5" />
    </svg>
  )
}

export const NOME_REDE: Record<Rede, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' }

export function LinhaRede({ r, completa = true }: { r: FichaRede; completa?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-current/15 py-2 text-[14px]">
      <span className="flex min-w-0 items-center gap-2">
        <IconeRede rede={r.rede} />
        <span className="truncate">{r.usuario ? (r.usuario.startsWith('@') ? r.usuario : `@${r.usuario}`) : NOME_REDE[r.rede]}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3 font-semibold tabular-nums">
        <span>{formatarNumero(r.seguidores)}</span>
        {completa && r.engajamento !== undefined && <span className="opacity-70">{formatarEngajamento(r.engajamento)}</span>}
      </span>
    </div>
  )
}

// Ficha de casting: o mesmo objeto visual do site, agora com dados reais.
export function FichaCard({ f, rodape, compacta = false }: { f: Ficha; rodape?: ReactNode; compacta?: boolean }) {
  return (
    <article className="relative flex h-full flex-col rounded-[14px] bg-grafite p-4 text-nevoa">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-salvia semi">
        <span>KRIÔ</span>
        {f.demo && <span>Perfil ilustrativo</span>}
      </div>
      <div className={`relative mt-3 flex items-end overflow-hidden rounded-[10px] bg-musgo p-3 ${compacta ? 'h-[120px]' : 'h-[176px]'}`}>
        {f.fotoUrl ? (
          <img src={f.fotoUrl} alt={`Foto de ${f.nome}`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className={`cond font-black leading-[0.78] tracking-[-0.02em] text-kiwi ${compacta ? 'text-[80px]' : 'text-[118px]'}`} aria-hidden="true">
            {iniciais(f.nome)}
          </span>
        )}
        {f.formatos.length > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-kiwi bg-breu/60 px-2 py-0.5 text-[11px] font-semibold uppercase text-kiwi semi">{f.formatos.join(' + ')}</span>
        )}
      </div>
      <p className="mt-3 cond text-[30px] font-extrabold leading-none">{f.nome}</p>
      <p className="mt-1 text-[14px] text-salvia">{[f.cidade, f.uf].filter(Boolean).join(', ') || 'Cidade não informada'}</p>
      {f.nichos.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {f.nichos.map((n) => (
            <li key={n} className="rounded-full bg-breu/50 px-2.5 py-1 text-[12px] font-semibold text-broto semi">
              {n}
            </li>
          ))}
        </ul>
      )}
      {!compacta && f.linguagem && (
        <p className="mt-3 text-[14px]">
          <span className="text-salvia">Linguagem: </span>
          <span className="font-semibold">{f.linguagem}</span>
        </p>
      )}
      <div className="mt-3">
        {f.redes.length ? f.redes.map((r) => <LinhaRede key={r.rede} r={r} />) : <p className="border-t border-current/15 py-2 text-[14px] text-salvia">Sem redes conectadas</p>}
      </div>
      {rodape && <div className="mt-auto pt-4">{rodape}</div>}
    </article>
  )
}

export function Escolhas<T extends string>({
  opcoes,
  valor,
  aoMudar,
  rotulo,
  multipla = false,
}: {
  opcoes: readonly T[]
  valor: T[]
  aoMudar: (v: T[]) => void
  rotulo: string
  multipla?: boolean
}) {
  return (
    <fieldset>
      <legend className="text-[15px] font-semibold text-salvia">{rotulo}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const on = valor.includes(o)
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => aoMudar(multipla ? (on ? valor.filter((x) => x !== o) : [...valor, o]) : on ? [] : [o])}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold semi transition-colors ${
                on ? 'border-kiwi bg-kiwi text-breu' : 'border-linha text-nevoa hover:border-salvia'
              }`}
            >
              {on && <Check className="size-4" aria-hidden="true" />}
              {o}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Carimbo({ texto = 'Match', cor = '#A8E063', tamanho = 140 }: { texto?: string; cor?: string; tamanho?: number }) {
  return (
    <motion.span
      className="grid place-items-center rounded-full border-[3px] cond font-black uppercase leading-none tracking-[0.04em]"
      style={{ width: tamanho, height: tamanho, color: cor, borderColor: cor, fontSize: tamanho * 0.24 }}
      initial={{ scale: 2.6, rotate: -32, opacity: 0 }}
      animate={{ scale: 1, rotate: -12, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 20 }}
    >
      {texto}
    </motion.span>
  )
}
