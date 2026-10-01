import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, ExternalLink, Mail, Plus, Search, Send, Sparkles, Trash2, X } from 'lucide-react'
import { api, formatarNumero, quando, useDados } from '../lib/api'
import { useEventos, useSessao } from '../lib/sessao'
import { ETAPAS_PEDIDO, type Ficha, type Pedido, type PedidoDetalhe, type StatusPedido } from '../lib/tipos'
import { Avatar, Botao, Campo, Carregando, ErroCaixa, FichaCard, IconeRede, Selo, SeloStatus, Titulo, Vazio } from '../app/ui'
import { Chat } from '../app/Chat'
import { Etapas, ResumoBriefing } from './Marca'

type Resumo = {
  pedidos: Partial<Record<StatusPedido, number>>
  creators: Partial<Record<'rascunho' | 'em_analise' | 'aprovado' | 'recusado', number>>
  marcas: number
  matches: number
  recentes: { id: string; titulo: string; status: StatusPedido; empresa: string; criadoEm: string }[]
  fila: Ficha[]
}

export function AdminInicio() {
  const { dados, erro, carregando, recarregar } = useDados<Resumo>('/admin/resumo')
  useEventos((e) => e.tipo === 'aviso' && recarregar())
  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Erro ao carregar.'} tentar={recarregar} />
  const ativos = (dados.pedidos.briefing ?? 0) + (dados.pedidos.match ?? 0) + (dados.pedidos.producao ?? 0) + (dados.pedidos.entrega ?? 0)
  const linha = [
    { n: dados.pedidos.briefing ?? 0, t: 'briefings esperando lista', link: '/admin/pedidos' },
    { n: ativos, t: 'pedidos em andamento', link: '/admin/pedidos' },
    { n: dados.creators.em_analise ?? 0, t: 'creators para avaliar', link: '/admin/creators?status=em_analise' },
    { n: dados.creators.aprovado ?? 0, t: 'creators no casting', link: '/admin/creators?status=aprovado' },
    { n: dados.marcas, t: 'marcas', link: '/admin/marcas' },
    { n: dados.matches, t: 'matches', link: '/admin/pedidos' },
  ]
  return (
    <>
      <Titulo>Painel</Titulo>
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-linha bg-linha md:grid-cols-3 xl:grid-cols-6">
        {linha.map((l) => (
          <li key={l.t}>
            <Link to={l.link} className="block h-full bg-carvao px-4 py-4 no-underline transition-colors hover:bg-grafite">
              <span className="block cond text-[34px] font-black leading-none tabular-nums text-nevoa">{l.n}</span>
              <span className="mt-1 block text-[13px] text-salvia">{l.t}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-12 xl:grid-cols-2">
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="cond text-[30px] font-black leading-none">Fila de avaliação</h2>
            <Link to="/admin/creators?status=em_analise" className="text-[14px] font-semibold text-kiwi">
              Ver todos
            </Link>
          </div>
          {dados.fila.length === 0 ? (
            <p className="mt-4 text-[15px] text-salvia">Nenhum creator esperando avaliação.</p>
          ) : (
            <ul className="mt-4 divide-y divide-linha rounded-[16px] border border-linha bg-carvao">
              {dados.fila.map((f) => (
                <li key={f.id}>
                  <Link to={`/admin/creators?status=em_analise&id=${f.id}`} className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-nevoa/5">
                    <Avatar nome={f.nome} foto={f.fotoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-nevoa semi">{f.nome}</span>
                      <span className="block truncate text-[13px] text-salvia">
                        {[f.cidade, f.uf].filter(Boolean).join(', ')} · {f.nichos.join(', ')}
                      </span>
                    </span>
                    <ArrowRight className="size-4 text-salvia" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="cond text-[30px] font-black leading-none">Pedidos recentes</h2>
            <Link to="/admin/pedidos" className="text-[14px] font-semibold text-kiwi">
              Quadro
            </Link>
          </div>
          {dados.recentes.length === 0 ? (
            <p className="mt-4 text-[15px] text-salvia">Nenhum pedido ainda.</p>
          ) : (
            <ul className="mt-4 divide-y divide-linha rounded-[16px] border border-linha bg-carvao">
              {dados.recentes.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/pedidos/${p.id}`} className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-nevoa/5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-bold text-nevoa semi">{p.titulo}</span>
                      <span className="block truncate text-[13px] text-salvia">
                        {p.empresa} · {quando(p.criadoEm)}
                      </span>
                    </span>
                    <SeloStatus status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

// ---------- Creators ----------

type CreatorAdmin = Ficha & { status: 'rascunho' | 'em_analise' | 'aprovado' | 'recusado'; notaInterna: string | null; email: string; whatsapp: string | null; academy: boolean }

const FILTROS = [
  ['em_analise', 'Para avaliar'],
  ['aprovado', 'No casting'],
  ['recusado', 'Recusados'],
  ['rascunho', 'Rascunhos'],
  ['', 'Todos'],
] as const

const NOME_STATUS = { rascunho: 'Rascunho', em_analise: 'Em avaliação', aprovado: 'No casting', recusado: 'Recusado' }

export function AdminCreators() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'em_analise'
  const { dados, erro, carregando, recarregar } = useDados<CreatorAdmin[]>(`/admin/creators${status ? `?status=${status}` : ''}`)
  const aberto = dados?.find((c) => c.id === params.get('id'))

  return (
    <>
      <Titulo sub="Toda ficha passa pela curadoria antes de entrar no casting.">Creators</Titulo>
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {FILTROS.map(([v, nome]) => (
          <button key={v || 'todos'} type="button" aria-pressed={status === v} onClick={() => setParams({ status: v })} className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-semibold semi ${status === v ? 'border-kiwi bg-kiwi text-breu' : 'border-linha text-nevoa hover:border-salvia'}`}>
            {nome}
          </button>
        ))}
      </div>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <ErroCaixa texto={erro} tentar={recarregar} />
      ) : !dados?.length ? (
        <Vazio titulo="Nada por aqui" texto="Nenhum creator neste filtro." />
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-linha">
          <table className="w-full min-w-[720px] text-left text-[15px]">
            <thead className="bg-carvao text-[13px] text-salvia">
              <tr>
                <th className="px-4 py-3 font-semibold">Creator</th>
                <th className="px-4 py-3 font-semibold">Nichos</th>
                <th className="px-4 py-3 font-semibold">Redes</th>
                <th className="px-4 py-3 text-right font-semibold">Alcance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {dados.map((c) => (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-nevoa/5" onClick={() => setParams({ status, id: c.id })}>
                  <td className="px-4 py-3">
                    <button type="button" className="flex items-center gap-3 text-left" onClick={() => setParams({ status, id: c.id })}>
                      <Avatar nome={c.nome} foto={c.fotoUrl} tamanho={40} />
                      <span>
                        <span className="block font-bold semi">{c.nome}</span>
                        <span className="block text-[13px] text-salvia">{[c.cidade, c.uf].filter(Boolean).join(', ') || '—'}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[14px]">{c.nichos.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="flex gap-2 text-salvia">
                      {c.redes.map((r) => (
                        <IconeRede key={r.rede} rede={r.rede} className="size-5" />
                      ))}
                      {!c.redes.length && '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatarNumero(c.alcance)}</td>
                  <td className="px-4 py-3">
                    <Selo tom={c.status === 'aprovado' ? 'kiwi' : c.status === 'em_analise' ? 'claro' : c.status === 'recusado' ? 'alerta' : 'neutro'}>{NOME_STATUS[c.status]}</Selo>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AnimatePresence>{aberto && <PainelCreator key={aberto.id} c={aberto} fechar={() => setParams({ status })} aoMudar={recarregar} />}</AnimatePresence>
    </>
  )
}

function PainelCreator({ c, fechar, aoMudar }: { c: CreatorAdmin; fechar: () => void; aoMudar: () => void }) {
  const { toast } = useSessao()
  const [nota, setNota] = useState(c.notaInterna ?? '')
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState<string | null>(null)

  const mudar = async (status: 'aprovado' | 'recusado' | 'em_analise') => {
    setEnviando(status)
    try {
      await api(`/admin/creators/${c.id}/status`, { json: { status, nota, motivo: motivo || undefined } })
      toast(status === 'aprovado' ? `${c.nome} entrou no casting.` : status === 'recusado' ? `${c.nome} foi avisado.` : 'Nota salva.')
      aoMudar()
      if (status !== 'em_analise') fechar()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    } finally {
      setEnviando(null)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-breu/70" onClick={fechar} aria-hidden="true" />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${c.nome}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] overflow-y-auto border-l border-linha bg-breu p-5 md:p-7"
      >
        <div className="flex items-center justify-between">
          <Selo tom={c.status === 'aprovado' ? 'kiwi' : 'claro'}>{NOME_STATUS[c.status]}</Selo>
          <button type="button" onClick={fechar} aria-label="Fechar" className="inline-flex size-11 items-center justify-center rounded-full border border-linha hover:border-kiwi">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
          <FichaCard f={c} compacta />
          <div className="grid content-start gap-3 text-[15px]">
            <p>
              <span className="text-salvia">E-mail: </span>
              <a href={`mailto:${c.email}`} className="text-nevoa underline">
                {c.email}
              </a>
            </p>
            {c.whatsapp && (
              <p>
                <span className="text-salvia">WhatsApp: </span>
                {c.whatsapp}
              </p>
            )}
            <p>
              <span className="text-salvia">Idiomas: </span>
              {c.idiomas?.join(', ') || '—'}
            </p>
            {c.academy && <Selo tom="kiwi">Academy</Selo>}
            {c.videoUrl && (
              <a href={c.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-kiwi">
                Vídeo de apresentação
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        {c.bio && <p className="mt-6 text-[16px] leading-relaxed text-nevoa/90">{c.bio}</p>}
        <div className="mt-6 grid gap-5">
          <Campo label="Nota interna (só a equipe vê)">{(p) => <textarea {...p} rows={3} value={nota} onChange={(e) => setNota(e.target.value)} className={`${p.className} py-3`} />}</Campo>
          {c.status !== 'aprovado' && (
            <Campo label="Motivo, se recusar (vai para o creator)">{(p) => <input {...p} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: falta um vídeo de apresentação" />}</Campo>
          )}
          <div className="flex flex-wrap gap-2">
            {c.status !== 'aprovado' && (
              <Botao icone={<Check className="size-4" />} carregando={enviando === 'aprovado'} onClick={() => mudar('aprovado')}>
                Aprovar no casting
              </Botao>
            )}
            {c.status !== 'recusado' && (
              <Botao variante="perigo" icone={<X className="size-4" />} carregando={enviando === 'recusado'} onClick={() => mudar('recusado')}>
                {c.status === 'aprovado' ? 'Tirar do casting' : 'Recusar'}
              </Botao>
            )}
            <Botao variante="fantasma" carregando={enviando === 'em_analise'} onClick={() => mudar('em_analise')}>
              Salvar nota
            </Botao>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

// ---------- Pedidos (quadro) ----------

type PedidoAdmin = Pedido & { empresa: string; lista: number; matches: number; convites: number }

export function AdminPedidos() {
  const { toast } = useSessao()
  const { dados, erro, carregando, recarregar, setDados } = useDados<PedidoAdmin[]>('/admin/pedidos')
  useEventos((e) => e.tipo === 'aviso' && recarregar())

  const mover = async (p: PedidoAdmin, status: StatusPedido) => {
    setDados((d) => d?.map((x) => (x.id === p.id ? { ...x, status } : x)) ?? d)
    try {
      await api(`/admin/pedidos/${p.id}`, { method: 'PATCH', json: { status } })
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
      recarregar()
    }
  }

  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Erro.'} tentar={recarregar} />

  return (
    <>
      <Titulo sub="Arraste no celular para ver todas as colunas. Mude a etapa pelo menu de cada pedido.">Pedidos</Titulo>
      {dados.length === 0 ? (
        <Vazio titulo="Sem pedidos" texto="Os briefings das marcas aparecem aqui assim que forem enviados." />
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0 2xl:overflow-visible">
          {ETAPAS_PEDIDO.map((et) => {
            const cards = dados.filter((p) => p.status === et.id)
            return (
              <section key={et.id} className="w-[280px] shrink-0 snap-start rounded-[16px] bg-carvao p-3 2xl:w-auto 2xl:min-w-0 2xl:flex-1" aria-label={et.nome}>
                <h2 className="flex items-center justify-between px-2 pb-3 pt-1 text-[15px] font-bold semi">
                  {et.nome}
                  <span className="rounded-full bg-grafite px-2.5 py-0.5 text-[13px] tabular-nums text-salvia">{cards.length}</span>
                </h2>
                <ul className="grid gap-2">
                  <AnimatePresence initial={false}>
                    {cards.map((p) => (
                      <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="rounded-[12px] border border-linha bg-grafite p-3">
                        <Link to={`/admin/pedidos/${p.id}`} className="block no-underline">
                          <span className="block text-[15px] font-bold leading-snug text-nevoa semi">{p.titulo}</span>
                          <span className="mt-1 block text-[13px] text-salvia">
                            {p.empresa} · {p.pecas} vídeos · {p.modalidade}
                          </span>
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[12px] font-semibold semi">
                          {p.lista === 0 && <span className="rounded-full bg-[#ffcf9e] px-2 py-0.5 text-breu">Sem lista</span>}
                          {p.convites > 0 && <span className="rounded-full border border-linha px-2 py-0.5 text-salvia">{p.convites} convites</span>}
                          {p.matches > 0 && <span className="rounded-full bg-kiwi px-2 py-0.5 text-breu">{p.matches} match</span>}
                        </div>
                        <label className="sr-only" htmlFor={`etapa-${p.id}`}>
                          Mudar etapa de {p.titulo}
                        </label>
                        <select id={`etapa-${p.id}`} value={p.status} onChange={(e) => mover(p, e.target.value as StatusPedido)} className="mt-3 min-h-10 w-full cursor-pointer rounded-[8px] border border-linha bg-breu px-2 text-[13px] text-nevoa focus:border-kiwi focus:outline-none">
                          {[...ETAPAS_PEDIDO, { id: 'cancelado' as const, nome: 'Cancelado' }].map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nome}
                            </option>
                          ))}
                        </select>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}

// ---------- Pedido (admin) ----------

type Sugestao = { pontos: number; motivos: string[]; creator: Ficha }

export function AdminPedido() {
  const { id } = useParams()
  const { toast } = useSessao()
  const [params, setParams] = useSearchParams()
  const pedido = useDados<PedidoDetalhe>(`/admin/pedidos/${id}`)
  const sugestoes = useDados<Sugestao[]>(`/admin/pedidos/${id}/sugestoes`)
  const [filtro, setFiltro] = useState('')
  const [enviando, setEnviando] = useState(false)
  useEventos((e) => (e.tipo === 'aviso' || e.tipo === 'entrega') && pedido.recarregar())
  const aba = params.get('aba') ?? (params.get('conversa') ? 'conversas' : 'lista')

  const recarregarTudo = () => {
    pedido.recarregar()
    sugestoes.recarregar()
  }

  const adicionar = async (creatorId: string, nota?: string) => {
    try {
      await api(`/admin/pedidos/${id}/candidatos`, { json: { creatorId, nota } })
      recarregarTudo()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    }
  }
  const remover = async (cid: string) => {
    try {
      await api(`/admin/candidatos/${cid}`, { method: 'DELETE' })
      recarregarTudo()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    }
  }
  const salvarNota = async (cid: string, nota: string) => {
    await api(`/admin/candidatos/${cid}`, { method: 'PATCH', json: { nota } }).catch((e) => toast(e.message, { tom: 'erro' }))
  }
  const enviarLista = async () => {
    setEnviando(true)
    try {
      await api(`/admin/pedidos/${id}/enviar-lista`, { method: 'POST' })
      toast('Lista enviada. A marca foi avisada por e-mail.')
      pedido.recarregar()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    } finally {
      setEnviando(false)
    }
  }
  const mudar = async (json: { status?: StatusPedido; rodadasTotal?: number }) => {
    try {
      await api(`/admin/pedidos/${id}`, { method: 'PATCH', json })
      pedido.recarregar()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    }
  }

  const sugs = useMemo(() => (sugestoes.dados ?? []).filter((s) => !filtro || s.creator.nome.toLowerCase().includes(filtro.toLowerCase()) || s.creator.nichos.some((n) => n.toLowerCase().includes(filtro.toLowerCase()))), [sugestoes.dados, filtro])

  if (pedido.carregando) return <Carregando />
  if (pedido.erro || !pedido.dados) return <ErroCaixa texto={pedido.erro ?? 'Pedido não encontrado.'} tentar={pedido.recarregar} />
  const p = pedido.dados
  const conversas = [{ id: p.conversaGeralId, nome: p.marca.empresa, sub: 'Marca e KRIÔ' }, ...p.candidatos.filter((c) => c.conversaId).map((c) => ({ id: c.conversaId!, nome: c.creator.nome, sub: 'Match' }))]
  const conversaAberta = params.get('conversa') ?? conversas[0].id
  const naoEnviados = p.candidatos.filter((c) => c.decisaoMarca === 'pendente').length

  return (
    <>
      <Link to="/admin/pedidos" className="mb-4 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-salvia no-underline hover:text-nevoa">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Pedidos
      </Link>
      <Titulo sub={`${p.marca.empresa} · ${p.pecas} vídeos · ${p.modalidade}${p.pacote ? ` · ${p.pacote}` : ''} · ${p.creatorsDesejados} creator(s)`} acao={<SeloStatus status={p.status} />}>
        {p.titulo}
      </Titulo>
      <Etapas status={p.status} />
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="etapa" className="text-[13px] font-semibold text-salvia">
            Etapa
          </label>
          <select id="etapa" value={p.status} onChange={(e) => mudar({ status: e.target.value as StatusPedido })} className="mt-1 block min-h-11 rounded-[10px] border border-linha bg-grafite px-3 text-[15px] text-nevoa">
            {[...ETAPAS_PEDIDO, { id: 'cancelado' as const, nome: 'Cancelado' }].map((x) => (
              <option key={x.id} value={x.id}>
                {x.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rodadas" className="text-[13px] font-semibold text-salvia">
            Rodadas de ajuste ({p.rodadasUsadas} usadas)
          </label>
          <input id="rodadas" type="number" min={0} max={20} defaultValue={p.rodadasTotal} onBlur={(e) => Number(e.target.value) !== p.rodadasTotal && mudar({ rodadasTotal: Number(e.target.value) })} className="mt-1 block min-h-11 w-28 rounded-[10px] border border-linha bg-grafite px-3 text-[15px] text-nevoa" />
        </div>
      </div>

      <div role="tablist" aria-label="Seções" className="mt-8 flex gap-1 overflow-x-auto border-b border-linha">
        {[
          ['lista', `Lista curta (${p.candidatos.length})`],
          ['conversas', 'Conversas'],
          ['briefing', 'Briefing'],
        ].map(([k, nome]) => (
          <button key={k} role="tab" aria-selected={aba === k} onClick={() => setParams({ aba: k })} className={`relative min-h-12 shrink-0 px-4 text-[15px] font-bold semi ${aba === k ? 'text-nevoa' : 'text-salvia hover:text-nevoa'}`}>
            {nome}
            {aba === k && <motion.span layoutId="aba-admin" className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-kiwi" />}
          </button>
        ))}
      </div>

      <div className="pt-8">
        {aba === 'lista' && (
          <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <section>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="cond text-[30px] font-black leading-none">Lista curta</h2>
                <Botao tamanho="sm" icone={<Send className="size-4" />} carregando={enviando} disabled={!naoEnviados} onClick={enviarLista}>
                  Enviar para a marca
                </Botao>
              </div>
              {p.candidatos.length === 0 ? (
                <p className="mt-4 text-[15px] text-salvia">Adicione creators das sugestões ao lado.</p>
              ) : (
                <ul className="mt-4 grid gap-3">
                  {p.candidatos.map((c) => (
                    <li key={c.id} className="rounded-[14px] border border-linha bg-carvao p-4">
                      <div className="flex items-center gap-3">
                        <Avatar nome={c.creator.nome} foto={c.creator.fotoUrl} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] font-bold semi">{c.creator.nome}</p>
                          <p className="text-[13px] text-salvia">
                            Marca: {c.decisaoMarca === 'quero' ? 'quer' : c.decisaoMarca === 'passo' ? 'passou' : 'ainda não viu'}
                            {c.decisaoMarca === 'quero' && ` · Creator: ${c.matchEm ? 'MATCH' : c.respostaCreator === 'recusado' ? 'recusou' : 'pensando'}`}
                          </p>
                        </div>
                        {!c.matchEm && (
                          <button type="button" onClick={() => remover(c.id)} aria-label={`Tirar ${c.creator.nome} da lista`} className="inline-flex size-10 items-center justify-center rounded-full text-salvia hover:bg-[#ff9b85]/10 hover:text-[#ffb3a3]">
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      <label className="mt-3 block text-[13px] font-semibold text-salvia" htmlFor={`nota-${c.id}`}>
                        Por que a KRIÔ escolheu (a marca vê)
                      </label>
                      <input id={`nota-${c.id}`} defaultValue={c.notaKrio ?? ''} onBlur={(e) => e.target.value !== (c.notaKrio ?? '') && salvarNota(c.id, e.target.value)} className="mt-1 w-full min-h-10 rounded-[8px] border border-linha bg-grafite px-3 text-[14px] text-nevoa focus:border-kiwi focus:outline-none" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="flex items-center gap-2 cond text-[30px] font-black leading-none">
                <Sparkles className="size-6 text-kiwi" aria-hidden="true" />
                Sugestões
              </h2>
              <p className="mt-2 text-[14px] text-salvia">Creators aprovados ordenados por nicho, formato, idioma, cidade, linguagem, alcance e engajamento.</p>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-salvia" aria-hidden="true" />
                <label htmlFor="filtro-sug" className="sr-only">
                  Filtrar sugestões
                </label>
                <input id="filtro-sug" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Filtrar por nome ou nicho" className="w-full min-h-11 rounded-[10px] border border-linha bg-grafite pl-10 pr-4 text-[15px] text-nevoa focus:border-kiwi focus:outline-none" />
              </div>
              {sugestoes.carregando ? (
                <Carregando />
              ) : !sugs.length ? (
                <p className="mt-4 text-[15px] text-salvia">Nenhum creator aprovado fora da lista.</p>
              ) : (
                <ul className="mt-4 grid gap-2">
                  {sugs.map((s) => (
                    <li key={s.creator.id} className="flex items-center gap-3 rounded-[12px] border border-linha p-3">
                      <Avatar nome={s.creator.nome} foto={s.creator.fotoUrl} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[15px] font-bold semi">
                          {s.creator.nome}
                          <span className="rounded-full bg-grafite px-2 py-0.5 text-[12px] tabular-nums text-kiwi">{s.pontos} pts</span>
                        </p>
                        <p className="truncate text-[13px] text-salvia">{s.motivos.join(' · ') || s.creator.nichos.join(', ')}</p>
                      </div>
                      <button type="button" onClick={() => adicionar(s.creator.id, s.motivos.slice(0, 2).join('. '))} aria-label={`Adicionar ${s.creator.nome}`} className="inline-flex size-11 items-center justify-center rounded-full border border-kiwi/50 text-kiwi transition-colors hover:bg-kiwi hover:text-breu">
                        <Plus className="size-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
        {aba === 'conversas' && (
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <ul className="flex gap-2 overflow-x-auto lg:flex-col">
              {conversas.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button type="button" onClick={() => setParams({ aba: 'conversas', conversa: c.id })} className={`w-full rounded-[12px] border px-4 py-3 text-left ${conversaAberta === c.id ? 'border-kiwi bg-kiwi/10' : 'border-linha hover:border-salvia'}`}>
                    <span className="block text-[15px] font-bold semi">{c.nome}</span>
                    <span className="block text-[13px] text-salvia">{c.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Chat key={conversaAberta} conversaId={conversaAberta} />
          </div>
        )}
        {aba === 'briefing' && <ResumoBriefing p={p} />}
      </div>
    </>
  )
}

// ---------- Marcas ----------

type MarcaAdmin = { id: string; empresa: string; nome: string; email: string; whatsapp: string | null; criadoEm: string; pedidos: number }

export function AdminMarcas() {
  const { dados, erro, carregando, recarregar } = useDados<MarcaAdmin[]>('/admin/marcas')
  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Erro.'} tentar={recarregar} />
  return (
    <>
      <Titulo>Marcas</Titulo>
      {!dados.length ? (
        <Vazio titulo="Nenhuma marca" texto="As marcas aparecem aqui quando criam conta." />
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-linha">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="bg-carvao text-[13px] text-salvia">
              <tr>
                <th className="px-4 py-3 font-semibold">Marca</th>
                <th className="px-4 py-3 font-semibold">Contato</th>
                <th className="px-4 py-3 text-right font-semibold">Pedidos</th>
                <th className="px-4 py-3 font-semibold">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {dados.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-bold semi">{m.empresa}</td>
                  <td className="px-4 py-3">
                    <span className="block">{m.nome}</span>
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-[14px] text-kiwi">
                      <Mail className="size-3.5" aria-hidden="true" />
                      {m.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{m.pedidos}</td>
                  <td className="px-4 py-3 text-[14px] text-salvia">{new Date(m.criadoEm).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
