import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Clock, FilePlus2, MessagesSquare, RotateCcw, X } from 'lucide-react'
import { NICHOS, PACOTES } from '../data'
import { api, quando, useDados } from '../lib/api'
import { useEventos, useSessao } from '../lib/sessao'
import { ETAPAS_PEDIDO, type Pedido, type PedidoDetalhe } from '../lib/tipos'
import { Botao, Campo, Carregando, Escolhas, ErroCaixa, FichaCard, SeloStatus, Titulo, Vazio, Avatar } from '../app/ui'
import { Deck } from '../app/Deck'
import { Chat } from '../app/Chat'

type PedidoLista = Pedido & { paraDecidir: number; matches: number; lista: number }

export function MarcaInicio() {
  const { dados, erro, carregando, recarregar } = useDados<PedidoLista[]>('/pedidos')
  useEventos((e) => (e.tipo === 'aviso' || e.tipo === 'mensagem') && recarregar())
  if (carregando) return <Carregando />
  if (erro) return <ErroCaixa texto={erro} tentar={recarregar} />
  return (
    <>
      <Titulo
        sub="Cada pedido começa num briefing e termina com os vídeos aprovados."
        acao={
          <Link to="/marca/novo" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi transition-colors hover:bg-broto">
            <FilePlus2 className="size-5" aria-hidden="true" />
            Novo briefing
          </Link>
        }
      >
        Seus pedidos
      </Titulo>
      {!dados?.length ? (
        <Vazio
          titulo="Nenhum pedido ainda"
          texto="Conte o que você precisa num briefing curto. A KRIÔ monta a lista de creators e você escolhe passando as fichas."
          acao={
            <Link to="/marca/novo" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-kiwi px-6 text-[16px] font-bold text-breu no-underline semi">
              Fazer o primeiro briefing
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {dados.map((p) => (
            <li key={p.id}>
              <Link to={`/marca/pedidos/${p.id}`} className="group block rounded-[16px] border border-linha bg-carvao p-5 no-underline transition-colors hover:border-kiwi/60 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="cond text-[30px] font-extrabold leading-none text-nevoa">{p.titulo}</p>
                    <p className="mt-2 text-[14px] text-salvia">
                      {p.pecas} {p.pecas === 1 ? 'vídeo' : 'vídeos'} · {p.modalidade}
                      {p.pacote ? ` · ${p.pacote}` : ''} · criado {quando(p.criadoEm)}
                    </p>
                  </div>
                  <SeloStatus status={p.status} />
                </div>
                <Etapas status={p.status} />
                <div className="mt-4 flex flex-wrap gap-2 text-[14px] font-semibold semi">
                  {p.paraDecidir > 0 && <span className="rounded-full bg-kiwi px-3 py-1 text-breu">{p.paraDecidir} {p.paraDecidir === 1 ? 'ficha para passar' : 'fichas para passar'}</span>}
                  {p.matches > 0 && <span className="rounded-full border border-kiwi/50 px-3 py-1 text-kiwi">{p.matches} {p.matches === 1 ? 'match' : 'matches'}</span>}
                  {p.lista === 0 && <span className="rounded-full border border-linha px-3 py-1 text-salvia">A KRIÔ está montando a lista</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function Etapas({ status }: { status: Pedido['status'] }) {
  const atual = ETAPAS_PEDIDO.findIndex((e) => e.id === status)
  return (
    <ol className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Etapas do pedido">
      {ETAPAS_PEDIDO.map((e, i) => (
        <li key={e.id} className="min-w-0">
          <span className={`block h-1.5 rounded-full ${i <= atual ? 'bg-kiwi' : 'bg-linha'}`} />
          <span className={`mt-1.5 block truncate text-[12px] font-semibold semi ${i === atual ? 'text-kiwi' : 'text-salvia'}`} aria-current={i === atual ? 'step' : undefined}>
            {e.nome}
          </span>
        </li>
      ))}
    </ol>
  )
}

// ---------- Novo briefing ----------

const CANAIS = ['Instagram', 'TikTok', 'YouTube', 'Anúncios', 'Site', 'Outro'] as const
const IDIOMAS = ['Português', 'Inglês', 'Espanhol'] as const
const PASSOS = ['Objetivo', 'Público', 'Creator', 'Pacote'] as const

export function NovoBriefing() {
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const { toast } = useSessao()
  const [passo, setPasso] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [f, setF] = useState({
    titulo: '',
    objetivo: '',
    produto: '',
    publico: '',
    canais: [] as string[],
    pecas: 5,
    prazo: '',
    nichos: params.get('nicho') ? [params.get('nicho')!] : ([] as string[]),
    idiomas: ['Português'] as string[],
    perfilCreator: '',
    creatorsDesejados: 1,
    pacote: params.get('pacote') ?? '',
    modalidade: (params.get('modalidade') === 'Influencer' ? 'Influencer' : 'UGC') as 'UGC' | 'Influencer',
    observacoes: '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((x) => ({ ...x, [k]: v }))
    setErro(null)
  }

  const validar = () => {
    if (passo === 0 && (f.titulo.trim().length < 2 || f.objetivo.trim().length < 2 || f.produto.trim().length < 2)) return 'Preencha o nome do pedido, o objetivo e o produto.'
    if (passo === 1 && f.publico.trim().length < 2) return 'Conte quem é o público.'
    if (passo === 1 && !f.canais.length) return 'Escolha pelo menos um canal.'
    if (passo === 1 && (!f.pecas || f.pecas < 1)) return 'Diga quantos vídeos você precisa.'
    return null
  }

  const avancar = async () => {
    const e = validar()
    if (e) return setErro(e)
    if (passo < PASSOS.length - 1) return setPasso(passo + 1)
    setEnviando(true)
    try {
      const r = await api<{ id: string }>('/pedidos', {
        json: { ...f, pacote: f.pacote || undefined, prazo: f.prazo || undefined, observacoes: f.observacoes || undefined, perfilCreator: f.perfilCreator || undefined },
      })
      toast('Briefing enviado! A KRIÔ já foi avisada.')
      navegar(`/marca/pedidos/${r.id}`)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <Titulo sub="Quatro passos rápidos. Dá para voltar e mudar a qualquer momento.">Novo briefing</Titulo>
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Passos do briefing">
        {PASSOS.map((p, i) => (
          <li key={p}>
            <button type="button" onClick={() => i < passo && setPasso(i)} disabled={i > passo} className="w-full text-left disabled:cursor-default" aria-current={i === passo ? 'step' : undefined}>
              <span className="block h-1.5 overflow-hidden rounded-full bg-linha">
                <motion.span className="block h-full bg-kiwi" initial={false} animate={{ width: i <= passo ? '100%' : '0%' }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} />
              </span>
              <span className={`mt-2 block text-[13px] font-semibold semi ${i === passo ? 'text-kiwi' : 'text-salvia'}`}>
                {i + 1}. {p}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-[20px] border border-linha bg-carvao p-5 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={passo} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="grid gap-6">
            {passo === 0 && (
              <>
                <Campo label="Nome do pedido" dica="Para você achar fácil depois. Ex.: Lançamento do sérum.">
                  {(p) => <input {...p} value={f.titulo} onChange={(e) => set('titulo', e.target.value)} />}
                </Campo>
                <Campo label="Qual o objetivo do conteúdo?">{(p) => <textarea {...p} rows={3} value={f.objetivo} onChange={(e) => set('objetivo', e.target.value)} className={`${p.className} py-3`} placeholder="Ex.: apresentar o produto novo e vender no site." />}</Campo>
                <Campo label="Qual produto ou serviço?">{(p) => <textarea {...p} rows={3} value={f.produto} onChange={(e) => set('produto', e.target.value)} className={`${p.className} py-3`} />}</Campo>
              </>
            )}
            {passo === 1 && (
              <>
                <Campo label="Quem é o público?">{(p) => <textarea {...p} rows={3} value={f.publico} onChange={(e) => set('publico', e.target.value)} className={`${p.className} py-3`} placeholder="Ex.: mulheres de 25 a 40 anos que cuidam da pele." />}</Campo>
                <Escolhas rotulo="Onde os vídeos vão rodar?" opcoes={CANAIS} valor={f.canais as (typeof CANAIS)[number][]} aoMudar={(v) => set('canais', v)} multipla />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Campo label="Quantos vídeos?">{(p) => <input {...p} type="number" min={1} max={500} inputMode="numeric" value={f.pecas} onChange={(e) => set('pecas', Number(e.target.value))} />}</Campo>
                  <Campo label="Prazo (opcional)">{(p) => <input {...p} value={f.prazo} onChange={(e) => set('prazo', e.target.value)} placeholder="Ex.: até 30 de novembro" />}</Campo>
                </div>
              </>
            )}
            {passo === 2 && (
              <>
                <Escolhas rotulo="Nichos que combinam" opcoes={NICHOS} valor={f.nichos as (typeof NICHOS)[number][]} aoMudar={(v) => set('nichos', v)} multipla />
                <Escolhas rotulo="Idiomas" opcoes={IDIOMAS} valor={f.idiomas as (typeof IDIOMAS)[number][]} aoMudar={(v) => set('idiomas', v)} multipla />
                <Campo label="Como você imagina o creator?" dica="Estilo, jeito de falar, idade aparente, cidade. Quanto mais claro, melhor o match.">
                  {(p) => <textarea {...p} rows={3} value={f.perfilCreator} onChange={(e) => set('perfilCreator', e.target.value)} className={`${p.className} py-3`} />}
                </Campo>
                <Campo label="Quantos creators?">{(p) => <input {...p} type="number" min={1} max={50} inputMode="numeric" value={f.creatorsDesejados} onChange={(e) => set('creatorsDesejados', Number(e.target.value))} />}</Campo>
              </>
            )}
            {passo === 3 && (
              <>
                <fieldset>
                  <legend className="text-[15px] font-semibold text-salvia">Pacote</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {[...PACOTES.map((p) => ({ nome: p.nome, desc: p.itens.slice(0, 2).join(' · ') })), { nome: '', desc: 'A KRIÔ sugere depois de ler o briefing' }].map((p) => {
                      const on = f.pacote === p.nome
                      return (
                        <button key={p.nome || 'sem'} type="button" aria-pressed={on} onClick={() => set('pacote', p.nome)} className={`rounded-[12px] border px-4 py-3 text-left transition-colors ${on ? 'border-kiwi bg-kiwi/10' : 'border-linha hover:border-salvia'}`}>
                          <span className="flex items-center justify-between">
                            <span className="cond text-[24px] font-black uppercase leading-none">{p.nome || 'Ainda não sei'}</span>
                            {on && <Check className="size-5 text-kiwi" aria-hidden="true" />}
                          </span>
                          <span className="mt-1 block text-[14px] text-salvia">{p.desc}</span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
                <Escolhas rotulo="Modalidade" opcoes={['UGC', 'Influencer'] as const} valor={[f.modalidade]} aoMudar={(v) => v[0] && set('modalidade', v[0])} />
                <Campo label="Algo mais? (opcional)">{(p) => <textarea {...p} rows={3} value={f.observacoes} onChange={(e) => set('observacoes', e.target.value)} className={`${p.className} py-3`} />}</Campo>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {erro && (
          <div className="mt-6">
            <ErroCaixa texto={erro} />
          </div>
        )}
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Botao variante="fantasma" onClick={() => setPasso(Math.max(0, passo - 1))} disabled={passo === 0} icone={<ArrowLeft className="size-4" />}>
            Voltar
          </Botao>
          <Botao onClick={avancar} carregando={enviando} tamanho="lg">
            {passo === PASSOS.length - 1 ? 'Enviar briefing' : `Próximo: ${PASSOS[passo + 1]}`}
            <ArrowRight className="size-5" aria-hidden="true" />
          </Botao>
        </div>
      </div>
    </div>
  )
}

// ---------- Pedido da marca ----------

export function PedidoMarca() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const { toast } = useSessao()
  const { dados, erro, carregando, recarregar, setDados } = useDados<PedidoDetalhe>(`/pedidos/${id}`)
  const aba = params.get('aba') ?? (params.get('conversa') ? 'conversas' : 'fichas')
  useEventos((e) => (e.tipo === 'aviso' || e.tipo === 'entrega') && recarregar())

  const pendentes = useMemo(() => dados?.candidatos.filter((c) => c.decisaoMarca === 'pendente') ?? [], [dados])
  const escolhidos = dados?.candidatos.filter((c) => c.decisaoMarca === 'quero') ?? []
  const descartados = dados?.candidatos.filter((c) => c.decisaoMarca === 'passo') ?? []

  const decidir = async (cid: string, decisao: 'quero' | 'passo' | 'pendente') => {
    try {
      await api(`/pedidos/${id}/candidatos/${cid}/decisao`, { json: { decisao } })
      setDados((d) =>
        d
          ? {
              ...d,
              candidatos: d.candidatos.map((c) =>
                c.id === cid ? { ...c, decisaoMarca: decisao, respostaCreator: decisao === 'quero' ? (c.respostaCreator === 'aguardando' ? 'pendente' : c.respostaCreator) : 'aguardando' } : c,
              ),
            }
          : d,
      )
      const nome = dados?.candidatos.find((c) => c.id === cid)?.creator.nome
      if (decisao === 'quero') toast(`Convite enviado para ${nome}. O match acontece quando aceitar.`)
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
      recarregar()
    }
  }

  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Pedido não encontrado.'} tentar={recarregar} />

  const conversas = [{ id: dados.conversaGeralId, nome: 'KRIÔ', sub: 'Conversa geral do pedido' }, ...escolhidos.filter((c) => c.conversaId).map((c) => ({ id: c.conversaId!, nome: c.creator.nome, sub: 'Match' }))]
  const conversaAberta = params.get('conversa') ?? conversas[conversas.length - 1].id

  return (
    <>
      <Link to="/marca" className="mb-4 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-salvia no-underline hover:text-nevoa">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Pedidos
      </Link>
      <Titulo acao={<SeloStatus status={dados.status} />} sub={`${dados.pecas} vídeos · ${dados.modalidade}${dados.pacote ? ` · ${dados.pacote}` : ''}`}>
        {dados.titulo}
      </Titulo>
      <Etapas status={dados.status} />

      <div role="tablist" aria-label="Seções do pedido" className="mt-8 flex gap-1 overflow-x-auto border-b border-linha">
        {[
          ['fichas', `Fichas${pendentes.length ? ` (${pendentes.length})` : ''}`],
          ['conversas', 'Conversas'],
          ['briefing', 'Briefing'],
        ].map(([k, nome]) => (
          <button
            key={k}
            role="tab"
            aria-selected={aba === k}
            onClick={() => setParams({ aba: k })}
            className={`relative min-h-12 shrink-0 px-4 text-[15px] font-bold semi transition-colors ${aba === k ? 'text-nevoa' : 'text-salvia hover:text-nevoa'}`}
          >
            {nome}
            {aba === k && <motion.span layoutId="aba-pedido" className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-kiwi" />}
          </button>
        ))}
      </div>

      <div className="pt-8" role="tabpanel">
        {aba === 'fichas' && (
          <div className="grid gap-12">
            {dados.candidatos.length === 0 ? (
              <Vazio titulo="Lista em montagem" texto="A KRIÔ está escolhendo creators para o seu briefing. Você recebe um aviso assim que a lista curta ficar pronta." />
            ) : pendentes.length > 0 ? (
              <Deck candidatos={pendentes} aoDecidir={decidir} />
            ) : null}

            {escolhidos.length > 0 && (
              <section>
                <h2 className="cond text-[32px] font-black leading-none">Seus escolhidos</h2>
                <ul className="mt-5 grid gap-3">
                  {escolhidos.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center gap-4 rounded-[14px] border border-linha bg-carvao p-4">
                      <Avatar nome={c.creator.nome} foto={c.creator.fotoUrl} tamanho={52} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-bold semi">{c.creator.nome}</p>
                        <p className="text-[14px] text-salvia">{c.creator.nichos.join(' · ')}</p>
                      </div>
                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                      {c.matchEm ? (
                        <>
                          <span className="rounded-full bg-kiwi px-3 py-1 cond text-[18px] font-black uppercase text-breu">Match</span>
                          <Botao tamanho="sm" variante="contorno" icone={<MessagesSquare className="size-4" />} onClick={() => setParams({ aba: 'conversas', conversa: c.conversaId! })}>
                            Conversar
                          </Botao>
                        </>
                      ) : c.respostaCreator === 'recusado' ? (
                        <span className="inline-flex items-center gap-1.5 text-[14px] text-salvia">
                          <X className="size-4" aria-hidden="true" />
                          Não pode participar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[14px] text-broto">
                          <Clock className="size-4" aria-hidden="true" />
                          Convite enviado
                        </span>
                      )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {descartados.length > 0 && (
              <section>
                <h2 className="cond text-[26px] font-black leading-none text-salvia">Passou</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {descartados.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => decidir(c.id, 'pendente')} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-linha px-4 text-[14px] font-semibold text-salvia transition-colors hover:border-kiwi hover:text-kiwi">
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Rever {c.creator.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {aba === 'conversas' && (
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <ul className="flex gap-2 overflow-x-auto lg:flex-col">
              {conversas.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setParams({ aba: 'conversas', conversa: c.id })}
                    className={`w-full rounded-[12px] border px-4 py-3 text-left transition-colors ${conversaAberta === c.id ? 'border-kiwi bg-kiwi/10' : 'border-linha hover:border-salvia'}`}
                  >
                    <span className="block text-[15px] font-bold semi">{c.nome}</span>
                    <span className="block text-[13px] text-salvia">{c.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Chat key={conversaAberta} conversaId={conversaAberta} />
          </div>
        )}

        {aba === 'briefing' && <ResumoBriefing p={dados} />}
      </div>
    </>
  )
}

export function ResumoBriefing({ p }: { p: Pedido }) {
  const linhas: [string, string | null | undefined][] = [
    ['Objetivo', p.objetivo],
    ['Produto', p.produto],
    ['Público', p.publico],
    ['Canais', p.canais.join(', ')],
    ['Vídeos', String(p.pecas)],
    ['Creators', String(p.creatorsDesejados)],
    ['Perfil de creator', p.perfilCreator],
    ['Nichos', p.nichos.join(', ')],
    ['Idiomas', p.idiomas.join(', ')],
    ['Pacote', p.pacote],
    ['Modalidade', p.modalidade],
    ['Prazo', p.prazo],
    ['Observações', p.observacoes],
  ]
  return (
    <dl className="max-w-[48rem] divide-y divide-linha rounded-[16px] border border-linha bg-carvao">
      {linhas
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
            <dt className="text-[14px] font-semibold text-salvia">{k}</dt>
            <dd className="whitespace-pre-wrap text-[16px]">{v}</dd>
          </div>
        ))}
    </dl>
  )
}

// ---------- Catálogo (marca e público) ----------

type FichaCatalogo = Parameters<typeof FichaCard>[0]['f'] & { favorito?: boolean }

export function Catalogo({ publico = false }: { publico?: boolean }) {
  const [nicho, setNicho] = useState('')
  const [busca, setBusca] = useState('')
  const [q, setQ] = useState('')
  const [soFav, setSoFav] = useState(false)
  const { usuario, toast } = useSessao()
  useEffect(() => {
    const t = setTimeout(() => setQ(busca), 300)
    return () => clearTimeout(t)
  }, [busca])
  const url = `/creators/catalogo?${new URLSearchParams({ ...(nicho ? { nicho } : {}), ...(q ? { q } : {}) })}`
  const { dados, erro, carregando, recarregar, setDados } = useDados<FichaCatalogo[]>(url)
  const marca = usuario?.papel === 'marca'
  const base = publico ? '/creators' : '/marca/creators'

  const favoritar = async (id: string) => {
    try {
      const r = await api<{ favorito: boolean }>(`/creators/favoritos/${id}`, { method: 'POST' })
      setDados((d) => d?.map((f) => (f.id === id ? { ...f, favorito: r.favorito } : f)) ?? d)
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    }
  }

  const lista = (dados ?? []).filter((f) => !soFav || f.favorito)

  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <label htmlFor="busca-creators" className="text-[15px] font-semibold text-salvia">
            Buscar por nome ou cidade
          </label>
          <input id="busca-creators" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-2 w-full min-h-12 rounded-[10px] border border-linha bg-grafite px-4 text-[16px] text-nevoa focus:border-kiwi focus:outline-none" />
        </div>
        {marca && (
          <label className="flex min-h-12 cursor-pointer items-center gap-2 text-[15px] font-semibold text-salvia">
            <input type="checkbox" checked={soFav} onChange={(e) => setSoFav(e.target.checked)} className="size-5 accent-[#a8e063]" />
            Só favoritos
          </label>
        )}
      </div>
      <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {['', ...NICHOS].map((n) => (
          <button key={n || 'todos'} type="button" aria-pressed={nicho === n} onClick={() => setNicho(n)} className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-semibold semi transition-colors ${nicho === n ? 'border-kiwi bg-kiwi text-breu' : 'border-linha text-nevoa hover:border-salvia'}`}>
            {n || 'Todos'}
          </button>
        ))}
      </div>
      {carregando ? (
        <Carregando />
      ) : erro ? (
        <ErroCaixa texto={erro} tentar={recarregar} />
      ) : !lista.length ? (
        <Vazio titulo="Ninguém por aqui" texto={soFav ? 'Você ainda não favoritou nenhum creator.' : 'Nenhum creator com esse filtro. Tente outro nicho.'} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((f) => (
            <li key={f.id}>
              <FichaCard
                f={f}
                rodape={
                  <div className="flex gap-2">
                    <Link to={`${base}/${f.slug}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-nevoa/25 text-[14px] font-bold text-nevoa no-underline semi transition-colors hover:border-kiwi hover:text-kiwi">
                      Ver ficha
                    </Link>
                    {marca && (
                      <button type="button" onClick={() => favoritar(f.id)} aria-pressed={!!f.favorito} aria-label={f.favorito ? `Tirar ${f.nome} dos favoritos` : `Favoritar ${f.nome}`} className={`inline-flex size-11 items-center justify-center rounded-full border transition-colors ${f.favorito ? 'border-kiwi bg-kiwi text-breu' : 'border-nevoa/25 text-nevoa hover:border-kiwi'}`}>
                        <svg className="size-5" viewBox="0 0 24 24" fill={f.favorito ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                        </svg>
                      </button>
                    )}
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function CatalogoMarca() {
  return (
    <>
      <Titulo sub="Creators aprovados pela curadoria. Favorite os que você gostar para lembrar no próximo briefing.">Creators</Titulo>
      <Catalogo />
    </>
  )
}
