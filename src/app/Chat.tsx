import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Download, FileText, Paperclip, PackageCheck, RotateCcw, Send, X } from 'lucide-react'
import { api, quando, useDados } from '../lib/api'
import { useEventos, useSessao } from '../lib/sessao'
import type { Mensagem } from '../lib/tipos'
import { Botao, Carregando, ErroCaixa } from './ui'

type Conversa = {
  id: string
  pedido: { id: string; titulo: string; rodadasTotal: number; rodadasUsadas: number; status: string }
  creator: string | null
  geral: boolean
  mensagens: Mensagem[]
}

export function Chat({ conversaId, altura = 'h-[min(72dvh,720px)]' }: { conversaId: string; altura?: string }) {
  const { usuario, toast, config } = useSessao()
  const { dados, erro, carregando, recarregar, setDados } = useDados<Conversa>(`/conversas/${conversaId}`)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [comoEntrega, setComoEntrega] = useState(false)
  const lista = useRef<HTMLDivElement>(null)
  const inputArquivo = useRef<HTMLInputElement>(null)

  const rolarAoFim = (suave = true) => lista.current?.scrollTo({ top: lista.current.scrollHeight, behavior: suave ? 'smooth' : 'auto' })

  useLayoutEffect(() => {
    if (dados) rolarAoFim(false)
  }, [dados?.id])

  useEffect(() => {
    if (dados) api(`/conversas/${conversaId}/lida`, { method: 'POST' }).catch(() => {})
  }, [dados?.mensagens.length, conversaId])

  useEventos((e) => {
    if (e.tipo !== 'mensagem' || e.conversaId !== conversaId) return
    const nova = !dados?.mensagens.some((m) => m.id === e.mensagem.id)
    // Mensagem nova entra no fim; uma já existente (entrega aprovada ou com ajuste) é atualizada.
    setDados((d) =>
      d ? { ...d, mensagens: d.mensagens.some((m) => m.id === e.mensagem.id) ? d.mensagens.map((m) => (m.id === e.mensagem.id ? e.mensagem : m)) : [...d.mensagens, e.mensagem] } : d,
    )
    if (nova) requestAnimationFrame(() => rolarAoFim())
    if (e.mensagem.tipo === 'sistema') recarregar()
  })

  const enviar = async (ev?: FormEvent) => {
    ev?.preventDefault()
    if (enviando || (!texto.trim() && !arquivo)) return
    setEnviando(true)
    try {
      let m: Mensagem
      if (arquivo) {
        const fd = new FormData()
        fd.set('arquivo', arquivo)
        fd.set('texto', texto.trim())
        fd.set('entrega', String(comoEntrega))
        m = await api<Mensagem>(`/conversas/${conversaId}/arquivos`, { form: fd })
      } else {
        m = await api<Mensagem>(`/conversas/${conversaId}/mensagens`, { json: { texto } })
      }
      setDados((d) => (d && !d.mensagens.some((x) => x.id === m.id) ? { ...d, mensagens: [...d.mensagens, m] } : d))
      setTexto('')
      setArquivo(null)
      setComoEntrega(false)
      requestAnimationFrame(() => rolarAoFim())
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    } finally {
      setEnviando(false)
    }
  }

  const teclas = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  if (carregando) return <Carregando texto="Abrindo conversa…" />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Conversa não encontrada.'} tentar={recarregar} />

  const podeEntregar = !dados.geral && (usuario?.papel === 'creator' || usuario?.papel === 'admin')
  const podeAprovar = usuario?.papel === 'marca' || usuario?.papel === 'admin'

  return (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-linha bg-carvao ${altura}`} aria-label="Conversa">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-linha px-4 py-3 md:px-5">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-bold semi">{dados.geral ? 'Marca e KRIÔ' : `Match com ${dados.creator}`}</p>
          <p className="truncate text-[13px] text-salvia">{dados.pedido.titulo}</p>
        </div>
        {!dados.geral && (
          <span className="rounded-full border border-linha px-3 py-1 text-[12px] font-semibold text-salvia tabular-nums semi">
            Ajustes {dados.pedido.rodadasUsadas} de {dados.pedido.rodadasTotal}
          </span>
        )}
      </header>

      <div ref={lista} className="flex-1 space-y-3 overflow-y-auto px-3 py-4 md:px-5" aria-live="polite">
        {dados.mensagens.length === 0 && <p className="py-10 text-center text-[15px] text-salvia">Nenhuma mensagem ainda. Comece a conversa.</p>}
        {dados.mensagens.map((m) => (
          <Bolha key={m.id} m={m} minha={m.autor?.id === usuario?.id} podeAprovar={podeAprovar} />
        ))}
      </div>

      <form onSubmit={enviar} className="border-t border-linha p-3 md:p-4">
        <AnimatePresence>
          {arquivo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-[10px] bg-grafite px-3 py-2">
                <FileText className="size-4 text-kiwi" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[14px]">{arquivo.name}</span>
                {podeEntregar && (
                  <label className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-broto">
                    <input type="checkbox" checked={comoEntrega} onChange={(e) => setComoEntrega(e.target.checked)} className="size-4 accent-[#a8e063]" />
                    Enviar como entrega para aprovação
                  </label>
                )}
                <button type="button" aria-label="Tirar anexo" onClick={() => setArquivo(null)} className="rounded-full p-1 text-salvia hover:text-nevoa">
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-2">
          <input
            ref={inputArquivo}
            type="file"
            className="sr-only"
            accept="image/*,video/*,audio/*,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              e.target.value = ''
              if (f && f.size > config.limiteUploadMb * 1024 * 1024) return toast(`O arquivo passa de ${config.limiteUploadMb} MB. Envie um menor ou mande o link.`, { tom: 'erro' })
              setArquivo(f)
            }}
            tabIndex={-1}
          />
          <button type="button" aria-label="Anexar arquivo" onClick={() => inputArquivo.current?.click()} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-linha text-salvia transition-colors hover:border-kiwi hover:text-kiwi">
            <Paperclip className="size-5" />
          </button>
          <label className="sr-only" htmlFor={`msg-${conversaId}`}>
            Mensagem
          </label>
          <textarea
            id={`msg-${conversaId}`}
            rows={1}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={teclas}
            placeholder={arquivo ? 'Comentário (opcional)' : 'Escreva uma mensagem'}
            className="max-h-40 min-h-12 flex-1 resize-none rounded-[24px] border border-linha bg-grafite px-4 py-3 text-[16px] leading-snug text-nevoa placeholder:text-salvia/70 focus:border-kiwi focus:outline-none [field-sizing:content]"
          />
          <button type="submit" aria-label="Enviar" disabled={enviando || (!texto.trim() && !arquivo)} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-kiwi text-breu transition-[background-color,transform] hover:bg-broto active:scale-95 disabled:opacity-40">
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </section>
  )
}

function Bolha({ m, minha, podeAprovar }: { m: Mensagem; minha: boolean; podeAprovar: boolean }) {
  if (m.tipo === 'sistema') {
    const match = m.texto.startsWith('MATCH!')
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center py-1">
        <p className={`max-w-[34rem] rounded-[12px] px-4 py-2.5 text-center text-[14px] leading-snug ${match ? 'bg-kiwi font-semibold text-breu' : 'bg-grafite text-salvia'}`}>{m.texto}</p>
      </motion.div>
    )
  }
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={`flex flex-col ${minha ? 'items-end' : 'items-start'}`}>
      {!minha && (
        <span className="mb-1 px-2 text-[12px] font-semibold text-salvia">
          {m.autor?.nome ?? 'KRIÔ'}
          {m.autor?.papel === 'admin' && <span className="ml-1.5 text-kiwi">· KRIÔ</span>}
        </span>
      )}
      <div className={`max-w-[min(85%,34rem)] rounded-[18px] px-4 py-2.5 ${minha ? 'rounded-br-[6px] bg-kiwi text-breu' : 'rounded-bl-[6px] bg-grafite text-nevoa'} ${m.tipo === 'entrega' ? 'w-full max-w-[26rem]' : ''}`}>
        {m.arquivo && <Anexo m={m} minha={minha} />}
        {m.texto && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.texto}</p>}
        {m.tipo === 'entrega' && <Entrega m={m} podeAprovar={podeAprovar && !minha} />}
      </div>
      <span className="mt-1 px-2 text-[11px] text-salvia">{quando(m.criadoEm)}</span>
    </motion.div>
  )
}

function Anexo({ m, minha }: { m: Mensagem; minha: boolean }) {
  const a = m.arquivo!
  if (a.tipo.startsWith('image/')) return <img src={a.url} alt={a.nome} className="mb-2 max-h-72 w-full rounded-[10px] object-cover" loading="lazy" />
  if (a.tipo.startsWith('video/')) return <video src={a.url} controls preload="metadata" className="mb-2 max-h-80 w-full rounded-[10px] bg-breu" />
  if (a.tipo.startsWith('audio/')) return <audio src={a.url} controls className="mb-2 w-full" />
  return (
    <a href={`${a.url}?baixar`} className={`mb-2 flex items-center gap-3 rounded-[10px] px-3 py-2.5 no-underline ${minha ? 'bg-breu/10 text-breu' : 'bg-breu/40 text-nevoa'}`}>
      <FileText className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{a.nome}</span>
      <Download className="size-4 shrink-0" aria-hidden="true" />
    </a>
  )
}

function Entrega({ m, podeAprovar }: { m: Mensagem; podeAprovar: boolean }) {
  const { toast } = useSessao()
  const [ajuste, setAjuste] = useState(false)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState<'aprovar' | 'ajuste' | null>(null)

  const responder = async (acao: 'aprovar' | 'ajuste') => {
    setEnviando(acao)
    try {
      await api(`/mensagens/${m.id}/entrega`, { json: { acao, comentario: comentario || undefined } })
      setAjuste(false)
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    } finally {
      setEnviando(null)
    }
  }

  const selo = {
    aguardando: { t: 'Aguardando aprovação', c: 'bg-breu/30', i: <PackageCheck className="size-4" /> },
    aprovado: { t: 'Aprovado', c: 'bg-kiwi text-breu', i: <Check className="size-4" /> },
    ajuste: { t: 'Ajuste pedido', c: 'bg-[#ffcf9e] text-breu', i: <RotateCcw className="size-4" /> },
  }[m.statusEntrega ?? 'aguardando']

  return (
    <div className="mt-2 border-t border-current/15 pt-3">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold semi ${selo.c}`}>
        {selo.i}
        {selo.t}
      </span>
      {podeAprovar && m.statusEntrega === 'aguardando' && (
        <div className="mt-3">
          {ajuste ? (
            <div className="grid gap-2">
              <label htmlFor={`aj-${m.id}`} className="text-[13px] font-semibold">
                O que precisa ajustar?
              </label>
              <textarea id={`aj-${m.id}`} rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} className="rounded-[10px] border border-linha bg-breu px-3 py-2 text-[15px] text-nevoa focus:border-kiwi focus:outline-none" />
              <div className="flex gap-2">
                <Botao tamanho="sm" carregando={enviando === 'ajuste'} disabled={!comentario.trim()} onClick={() => responder('ajuste')}>
                  Pedir ajuste
                </Botao>
                <Botao tamanho="sm" variante="fantasma" onClick={() => setAjuste(false)}>
                  Cancelar
                </Botao>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Botao tamanho="sm" icone={<Check className="size-4" />} carregando={enviando === 'aprovar'} onClick={() => responder('aprovar')}>
                Aprovar
              </Botao>
              <Botao tamanho="sm" variante="contorno" icone={<RotateCcw className="size-4" />} onClick={() => setAjuste(true)}>
                Pedir ajuste
              </Botao>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Página de mensagens: lista de conversas + conversa aberta.
type ItemConversa = { id: string; pedidoId: string; pedidoTitulo: string; marca: string; creator: string | null; geral: boolean; ultima: { texto: string; criadoEm: string } | null; naoLidas: number }

export function Mensagens() {
  const { usuario } = useSessao()
  const { dados, erro, carregando, recarregar } = useDados<ItemConversa[]>('/conversas')
  const [aberta, setAberta] = useState<string | null>(() => new URLSearchParams(location.search).get('c'))
  useEventos((e) => e.tipo === 'mensagem' && recarregar())

  useEffect(() => {
    if (!aberta && dados?.length && window.matchMedia('(min-width: 1024px)').matches) setAberta(dados[0].id)
  }, [dados, aberta])

  if (carregando) return <Carregando />
  if (erro) return <ErroCaixa texto={erro} tentar={recarregar} />

  const titulo = (c: ItemConversa) => (c.geral ? (usuario?.papel === 'marca' ? 'KRIÔ' : c.marca) : usuario?.papel === 'creator' ? c.marca : `${c.creator}${usuario?.papel === 'admin' ? ` · ${c.marca}` : ''}`)

  return (
    <div>
      <h1 className="mb-6 cond text-[clamp(2.4rem,6vw,3.75rem)] font-black leading-[0.9]">Mensagens</h1>
      {!dados?.length ? (
        <p className="rounded-[16px] border border-dashed border-linha px-6 py-12 text-center text-[16px] text-salvia">As conversas aparecem aqui quando um pedido começa ou um match acontece.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ul className={`overflow-hidden rounded-[16px] border border-linha ${aberta ? 'hidden lg:block' : ''}`}>
            {dados.map((c) => (
              <li key={c.id} className="border-b border-linha last:border-0">
                <button type="button" onClick={() => setAberta(c.id)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${aberta === c.id ? 'bg-grafite' : 'hover:bg-nevoa/5'}`}>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] font-bold semi">{titulo(c)}</span>
                      {c.ultima && <span className="shrink-0 text-[12px] text-salvia">{quando(c.ultima.criadoEm)}</span>}
                    </span>
                    <span className="block truncate text-[13px] text-kiwi">{c.pedidoTitulo}</span>
                    <span className="mt-0.5 block truncate text-[14px] text-salvia">{c.ultima?.texto ?? 'Sem mensagens'}</span>
                  </span>
                  {c.naoLidas > 0 && aberta !== c.id && <span className="mt-1 grid min-w-6 place-items-center rounded-full bg-kiwi px-1.5 text-[12px] font-bold text-breu tabular-nums">{c.naoLidas}</span>}
                </button>
              </li>
            ))}
          </ul>
          {aberta && (
            <div className="min-w-0">
              <button type="button" onClick={() => setAberta(null)} className="mb-3 inline-flex min-h-10 items-center text-[15px] font-semibold text-kiwi lg:hidden">
                ← Todas as conversas
              </button>
              <Chat key={aberta} conversaId={aberta} altura="h-[calc(100dvh-15rem)] lg:h-[calc(100dvh-12rem)]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
