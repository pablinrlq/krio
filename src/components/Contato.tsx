import { useEffect, useId, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Copy, Send } from 'lucide-react'
import { NICHOS, PACOTES, type Modalidade } from '../data'
import { useBrief, type Interesse, type Perfil } from '../brief'
import { linkWhatsApp } from '../config'
import { WhatsIcon } from './ui'

type Form = {
  perfil: Perfil
  nome: string
  empresa: string
  instagram: string
  nicho: string
  pacote: string
  modalidade: Modalidade
  interesse: Interesse
  mensagem: string
}

const INICIAL: Form = {
  perfil: 'marca',
  nome: '',
  empresa: '',
  instagram: '',
  nicho: '',
  pacote: 'Ainda não sei',
  modalidade: 'UGC',
  interesse: 'Academy',
  mensagem: '',
}

function montarMensagem(f: Form) {
  const nome = f.nome.trim() || '[seu nome]'
  const linhas: string[] = []
  if (f.perfil === 'marca') {
    linhas.push(`Olá, KRIÔ! Sou ${nome}${f.empresa.trim() ? `, da ${f.empresa.trim()}` : ''}.`)
    linhas.push('Quero conteúdo com creators para a minha marca.')
    if (f.pacote !== 'Ainda não sei') linhas.push(`Pacote: ${f.pacote} (${f.modalidade})`)
    else linhas.push(`Modalidade: ${f.modalidade}`)
  } else {
    linhas.push(`Olá, KRIÔ! Sou ${nome}${f.instagram.trim() ? ` (${f.instagram.trim()})` : ''}.`)
    linhas.push(f.interesse === 'Academy' ? 'Quero saber como entrar na KRIÔ Academy.' : 'Sou creator e quero enviar meu portfólio para o casting.')
  }
  if (f.nicho) linhas.push(`Nicho: ${f.nicho}`)
  if (f.mensagem.trim()) linhas.push('', f.mensagem.trim())
  return linhas.join('\n')
}

export function Contato() {
  const { pedido, versao } = useBrief()
  const [form, setForm] = useState<Form>(INICIAL)
  const [erros, setErros] = useState<Partial<Record<keyof Form, string>>>({})
  const [aviso, setAviso] = useState('')
  const [destaque, setDestaque] = useState(false)

  // Recebe o que a pessoa escolheu no hero, nos pacotes ou na Academy.
  useEffect(() => {
    if (!versao) return
    setForm((f) => ({ ...f, ...Object.fromEntries(Object.entries(pedido).filter(([, v]) => v !== undefined)) }))
    setErros({})
    setDestaque(true)
    const t = setTimeout(() => setDestaque(false), 1400)
    return () => clearTimeout(t)
  }, [versao, pedido])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2600)
    return () => clearTimeout(t)
  }, [aviso])

  const mensagem = useMemo(() => montarMensagem(form), [form])
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    if (erros[k]) setErros((e) => ({ ...e, [k]: undefined }))
  }

  const validar = () => {
    const e: typeof erros = {}
    if (form.nome.trim().length < 2) e.nome = 'Escreva seu nome para a KRIÔ saber com quem está falando.'
    if (form.perfil === 'marca' && !form.empresa.trim()) e.empresa = 'Diga o nome da marca ou empresa.'
    setErros(e)
    if (Object.keys(e).length) {
      document.getElementById(`campo-${Object.keys(e)[0]}`)?.focus()
      return false
    }
    return true
  }

  const enviar = (ev: FormEvent) => {
    ev.preventDefault()
    if (!validar()) return
    window.open(linkWhatsApp(mensagem), '_blank', 'noopener')
    setAviso('Abrimos o WhatsApp com a sua mensagem pronta.')
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem)
      setAviso('Mensagem copiada.')
    } catch {
      setAviso('Não deu para copiar. Selecione o texto da prévia e copie.')
    }
  }

  return (
    <section id="contato" className="on-light bg-kiwi text-breu">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="flex flex-col">
          <h2 className="cond text-[clamp(3.4rem,10vw,6rem)] font-black uppercase leading-[0.84] tracking-[-0.02em]">
            KRIÔ.
            <br />
            Feito por
            <br />
            quem cria.
          </h2>
          <p className="mt-8 max-w-[30rem] text-[19px] leading-relaxed">Conte o que você precisa. A KRIÔ responde com creators compatíveis e uma proposta.</p>

          <div className="mt-10 hidden lg:block">
            <p className="text-[14px] font-semibold semi">Prévia da mensagem</p>
            <Previa texto={mensagem} />
          </div>
        </div>

        <motion.form
          noValidate
          onSubmit={enviar}
          animate={destaque ? { scale: [1, 1.015, 1] } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-[20px] bg-breu p-5 text-nevoa shadow-[0_30px_60px_-28px_rgba(11,13,9,0.8)] transition-[box-shadow] sm:p-8 ${destaque ? 'ring-4 ring-breu/25' : ''}`}
          style={{ caretColor: '#A8E063' }}
        >
          <fieldset>
            <legend className="text-[15px] font-semibold text-salvia">Você é</legend>
            <div role="radiogroup" aria-label="Você é" className="mt-2 grid grid-cols-2 rounded-full bg-grafite p-1">
              {(
                [
                  ['marca', 'Marca'],
                  ['creator', 'Creator'],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={form.perfil === v}
                  onClick={() => set('perfil', v)}
                  className={`relative min-h-11 rounded-full text-[16px] font-bold semi transition-colors ${form.perfil === v ? 'text-breu' : 'text-salvia hover:text-nevoa'}`}
                >
                  {form.perfil === v && <motion.span layoutId="perfil" className="absolute inset-0 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
                  <span className="relative">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Campo id="campo-nome" label="Seu nome" erro={erros.nome}>
              {(p) => <input {...p} autoComplete="name" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Como você se chama" />}
            </Campo>
            {form.perfil === 'marca' ? (
              <Campo id="campo-empresa" label="Marca ou empresa" erro={erros.empresa}>
                {(p) => <input {...p} autoComplete="organization" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Nome da marca" />}
              </Campo>
            ) : (
              <Campo id="campo-instagram" label="Seu @ (opcional)">
                {(p) => <input {...p} value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@seuperfil" />}
              </Campo>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {form.perfil === 'marca' ? (
              <motion.div key="marca" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Campo id="campo-pacote" label="Pacote">
                    {(p) => (
                      <Seletor>
                        <select {...p} className={`${p.className} ${SELECT}`} value={form.pacote} onChange={(e) => set('pacote', e.target.value)}>
                          <option>Ainda não sei</option>
                          {PACOTES.map((x) => (
                            <option key={x.nome}>{x.nome}</option>
                          ))}
                        </select>
                      </Seletor>
                    )}
                  </Campo>
                  <Campo id="campo-modalidade" label="Modalidade">
                    {(p) => (
                      <Seletor>
                        <select {...p} className={`${p.className} ${SELECT}`} value={form.modalidade} onChange={(e) => set('modalidade', e.target.value as Modalidade)}>
                          <option value="UGC">UGC</option>
                          <option value="Influencer">Influencer</option>
                        </select>
                      </Seletor>
                    )}
                  </Campo>
                </div>
              </motion.div>
            ) : (
              <motion.div key="creator" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <fieldset className="mt-5">
                  <legend className="text-[15px] font-semibold text-salvia">Quero</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['Academy', 'Entrar na Academy'],
                        ['Casting', 'Enviar portfólio'],
                      ] as const
                    ).map(([v, label]) => (
                      <Chip key={v} on={form.interesse === v} onClick={() => set('interesse', v)}>
                        {label}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              </motion.div>
            )}
          </AnimatePresence>

          <fieldset className="mt-5">
            <legend className="text-[15px] font-semibold text-salvia">Nicho</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {NICHOS.map((n) => (
                <Chip key={n} on={form.nicho === n} onClick={() => set('nicho', form.nicho === n ? '' : n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="mt-5">
            <Campo id="campo-mensagem" label="Conte um pouco mais (opcional)">
              {(p) => <textarea {...p} rows={3} value={form.mensagem} onChange={(e) => set('mensagem', e.target.value)} placeholder="Produto, prazo, canais, quantas peças..." className={`${p.className} min-h-[96px] resize-y py-3`} />}
            </Campo>
          </div>

          <div className="mt-6 lg:hidden">
            <p className="text-[14px] font-semibold text-salvia semi">Prévia da mensagem</p>
            <Previa texto={mensagem} escuro />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              className="group inline-flex min-h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-kiwi px-6 text-[17px] font-bold text-breu semi transition-[background-color,transform] hover:bg-broto active:scale-[0.98]"
            >
              <WhatsIcon className="size-5" />
              Enviar pelo WhatsApp
              <Send className="size-4 transition-transform duration-300 ease-expo group-hover:translate-x-0.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={copiar}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-nevoa/30 px-6 text-[16px] font-bold text-nevoa semi transition-colors hover:border-kiwi hover:text-kiwi"
            >
              <Copy className="size-4" aria-hidden="true" />
              Copiar mensagem
            </button>
          </div>
        </motion.form>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {aviso && (
            <motion.p
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-nevoa px-5 py-3 text-[15px] font-semibold text-breu shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)] semi"
            >
              <Check className="size-4 text-folha" aria-hidden="true" />
              {aviso}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

const CAMPO =
  'w-full min-h-12 rounded-[10px] border border-linha bg-grafite px-4 text-[16px] text-nevoa placeholder:text-salvia/80 transition-colors hover:border-salvia focus:border-kiwi focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kiwi aria-[invalid=true]:border-[#ff9b85]'

const SELECT = 'cursor-pointer appearance-none pr-11 [&>option]:bg-grafite [&>option]:text-nevoa'

function Seletor({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-kiwi" aria-hidden="true" />
    </div>
  )
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string
  label: string
  erro?: string
  children: (p: { id: string; className: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => ReactNode
}) {
  const erroId = useId()
  return (
    <div>
      <label htmlFor={id} className="text-[15px] font-semibold text-salvia">
        {label}
      </label>
      <div className="mt-2">{children({ id, className: CAMPO, 'aria-invalid': erro ? true : undefined, 'aria-describedby': erro ? erroId : undefined })}</div>
      <AnimatePresence>
        {erro && (
          <motion.p id={erroId} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-[14px] font-medium text-[#ffb3a3]">
            {erro}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-[15px] font-semibold semi transition-colors ${
        on ? 'border-kiwi bg-kiwi text-breu' : 'border-linha text-nevoa hover:border-salvia'
      }`}
    >
      {on && <Check className="size-4" aria-hidden="true" />}
      {children}
    </button>
  )
}

function Previa({ texto, escuro = false }: { texto: string; escuro?: boolean }) {
  return (
    <div className={`mt-3 max-w-[30rem] rounded-[16px] rounded-tl-[4px] px-5 py-4 text-[15px] leading-relaxed whitespace-pre-line ${escuro ? 'bg-grafite text-nevoa' : 'bg-breu text-nevoa'}`}>
      {texto}
    </div>
  )
}
