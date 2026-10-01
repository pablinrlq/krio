import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Camera, Check, CircleAlert, Clock, MessagesSquare, RefreshCw, Send, Unplug, X } from 'lucide-react'
import { NICHOS } from '../data'
import { api, formatarEngajamento, formatarNumero, quando, useDados } from '../lib/api'
import { useEventos, useSessao } from '../lib/sessao'
import type { Ficha, Rede, StatusPedido } from '../lib/tipos'
import { Botao, Campo, Carimbo, Carregando, Escolhas, ErroCaixa, FichaCard, IconeRede, NOME_REDE, Selo, Titulo } from '../app/ui'
import { Chat } from '../app/Chat'

type MinhaFicha = Ficha & { status: 'rascunho' | 'em_analise' | 'aprovado' | 'recusado'; whatsapp: string | null; academy: boolean; nascimento?: string | null }

type Trabalho = {
  id: string
  resposta: 'pendente' | 'aceito' | 'recusado'
  matchEm: string | null
  conversaId: string | null
  pedido: { id: string; titulo: string; marca: string; objetivo: string; produto: string; publico: string; canais: string[]; pecas: number; modalidade: string; prazo: string | null; status: StatusPedido; perfilCreator: string | null }
}

const STATUS_FICHA = {
  rascunho: { titulo: 'Complete sua ficha', texto: 'Preencha foto, cidade, nichos, formato e apresentação, conecte suas redes e envie para a curadoria.', tom: 'alerta' as const },
  em_analise: { titulo: 'Ficha em avaliação', texto: 'A equipe da KRIÔ está olhando seu perfil. Você recebe um aviso assim que tiver resposta.', tom: 'claro' as const },
  aprovado: { titulo: 'Você está no casting', texto: 'Marcas já podem receber sua ficha. Os convites aparecem aqui.', tom: 'kiwi' as const },
  recusado: { titulo: 'Ainda não entrou no casting', texto: 'Ajuste a ficha com as dicas da KRIÔ e envie de novo quando quiser.', tom: 'alerta' as const },
}

export function CreatorInicio() {
  const ficha = useDados<MinhaFicha>('/creators/eu')
  const trabalhos = useDados<Trabalho[]>('/trabalhos')
  useEventos((e) => {
    if (e.tipo === 'aviso') {
      ficha.recarregar()
      trabalhos.recarregar()
    }
  })
  if (ficha.carregando || trabalhos.carregando) return <Carregando />
  if (ficha.erro || !ficha.dados) return <ErroCaixa texto={ficha.erro ?? 'Não deu para carregar sua ficha.'} tentar={ficha.recarregar} />

  const s = STATUS_FICHA[ficha.dados.status]
  const convites = trabalhos.dados?.filter((t) => t.resposta === 'pendente') ?? []
  const ativos = trabalhos.dados?.filter((t) => t.matchEm) ?? []

  return (
    <>
      <Titulo>Olá, {ficha.dados.nome.split(' ')[0]}</Titulo>
      <section className="grid gap-6 rounded-[20px] border border-linha bg-carvao p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-7">
        <div>
          <Selo tom={s.tom}>{s.titulo}</Selo>
          <p className="mt-3 max-w-[40rem] text-[16px] text-nevoa/90">{s.texto}</p>
        </div>
        <Link to="/creator/perfil" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi transition-colors hover:bg-broto">
          {ficha.dados.status === 'aprovado' ? 'Editar ficha' : 'Abrir minha ficha'}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="cond text-[32px] font-black leading-none">Convites</h2>
        {convites.length === 0 ? (
          <p className="mt-4 text-[16px] text-salvia">Nenhum convite agora. Quando uma marca escolher sua ficha, ele aparece aqui e no seu e-mail.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {convites.map((t) => (
              <li key={t.id}>
                <Link to={`/creator/trabalhos/${t.id}`} className="flex flex-wrap items-center gap-4 rounded-[16px] border border-kiwi/50 bg-kiwi/5 p-5 no-underline transition-colors hover:bg-kiwi/10">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-kiwi semi">{t.pedido.marca}</p>
                    <p className="cond text-[28px] font-extrabold leading-none text-nevoa">{t.pedido.titulo}</p>
                    <p className="mt-2 text-[14px] text-salvia">
                      {t.pedido.pecas} vídeos · {t.pedido.modalidade}
                      {t.pedido.prazo ? ` · ${t.pedido.prazo}` : ''}
                    </p>
                  </div>
                  <span className="inline-flex min-h-11 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu semi">
                    Ver convite
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="cond text-[32px] font-black leading-none">Trabalhos</h2>
        {ativos.length === 0 ? (
          <p className="mt-4 text-[16px] text-salvia">Seus matches aparecem aqui, com a conversa e as entregas de cada um.</p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {ativos.map((t) => (
              <li key={t.id}>
                <Link to={`/creator/trabalhos/${t.id}`} className="flex flex-wrap items-center gap-4 rounded-[16px] border border-linha bg-carvao p-5 no-underline transition-colors hover:border-kiwi/60">
                  <span className="rounded-full bg-kiwi px-3 py-1 cond text-[18px] font-black uppercase text-breu">Match</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-bold text-nevoa semi">{t.pedido.titulo}</p>
                    <p className="text-[14px] text-salvia">
                      {t.pedido.marca} · match {quando(t.matchEm!)}
                    </p>
                  </div>
                  <MessagesSquare className="size-5 text-kiwi" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

// ---------- Editor da ficha ----------

const IDIOMAS = ['Português', 'Inglês', 'Espanhol'] as const
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
const MSG_REDE: Record<string, string> = {
  indisponivel: 'A conexão com esta rede ainda está sendo liberada pela plataforma. Tente de novo em breve.',
  cancelado: 'Você cancelou a conexão. Quando quiser, é só tentar de novo.',
  expirado: 'A conexão demorou demais. Tente de novo.',
  falhou: 'Não conseguimos conectar. No Instagram, confira se a conta é profissional (Criador de conteúdo ou Comercial).',
}

export function PerfilCreator() {
  const { toast, config } = useSessao()
  const [params, setParams] = useSearchParams()
  const { dados, erro, carregando, recarregar } = useDados<MinhaFicha>('/creators/eu')
  const disponiveis = useDados<Record<Rede, boolean>>('/redes/disponiveis')
  const [f, setF] = useState<MinhaFicha | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroForm, setErroForm] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dados) setF(dados)
  }, [dados])

  useEffect(() => {
    const ok = params.get('conectado')
    const e = params.get('erro')
    if (ok) toast(`${NOME_REDE[ok as Rede] ?? 'Rede'} conectado! Seus números já aparecem na ficha.`)
    if (e) {
      const [rede, motivo] = e.split('-')
      toast(`${NOME_REDE[rede as Rede] ?? 'Rede'}: ${MSG_REDE[motivo] ?? 'algo deu errado.'}`, { tom: 'erro' })
    }
    if (ok || e) setParams({}, { replace: true })
  }, [])

  if (carregando || !f) return erro ? <ErroCaixa texto={erro} tentar={recarregar} /> : <Carregando />

  const set = <K extends keyof MinhaFicha>(k: K, v: MinhaFicha[K]) => {
    setF((x) => (x ? { ...x, [k]: v } : x))
    setErroForm(null)
  }

  const salvar = async (silencioso = false) => {
    setSalvando(true)
    try {
      await api('/creators/eu', {
        method: 'PUT',
        json: {
          nomeArtistico: f.nome,
          cidade: f.cidade || null,
          uf: f.uf || null,
          nascimento: f.nascimento || null,
          idiomas: f.idiomas ?? [],
          nichos: f.nichos,
          formatos: f.formatos,
          linguagem: f.linguagem || null,
          bio: f.bio || null,
          videoUrl: f.videoUrl || null,
          whatsapp: f.whatsapp || null,
          academy: f.academy,
        },
      })
      if (!silencioso) toast('Ficha salva.')
      return true
    } catch (e) {
      setErroForm((e as Error).message)
      return false
    } finally {
      setSalvando(false)
    }
  }

  const enviarParaAvaliacao = async () => {
    if (!(await salvar(true))) return
    setEnviando(true)
    try {
      await api('/creators/eu/enviar', { method: 'POST' })
      toast('Ficha enviada para a curadoria da KRIÔ.')
      recarregar()
    } catch (e) {
      setErroForm((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const trocarFoto = async (arq?: File) => {
    if (!arq) return
    if (arq.size > config.limiteUploadMb * 1024 * 1024) return toast(`A foto passa de ${config.limiteUploadMb} MB. Envie uma menor.`, { tom: 'erro' })
    const fd = new FormData()
    fd.set('foto', arq)
    try {
      const r = await api<{ fotoUrl: string }>('/creators/eu/foto', { form: fd })
      set('fotoUrl', r.fotoUrl)
      toast('Foto atualizada.')
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    }
  }

  const desconectar = async (rede: Rede) => {
    if (!confirm(`Desconectar ${NOME_REDE[rede]}? Os números somem da ficha.`)) return
    await api(`/redes/${rede}`, { method: 'DELETE' }).catch((e) => toast(e.message, { tom: 'erro' }))
    recarregar()
  }

  const atualizarRede = async (rede: Rede) => {
    await api(`/redes/${rede}/sincronizar`, { method: 'POST' }).catch((e) => toast(e.message, { tom: 'erro' }))
    toast(`${NOME_REDE[rede]} atualizado.`)
    recarregar()
  }

  const s = STATUS_FICHA[f.status]

  return (
    <>
      <Titulo sub={params.get('novo') ? 'Bem-vindo! Monte sua ficha de casting: é ela que as marcas veem.' : 'É isso que as marcas veem quando a KRIÔ indica você.'} acao={<Selo tom={s.tom}>{s.titulo}</Selo>}>
        Minha ficha
      </Titulo>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="grid gap-10">
          <section className="grid gap-6">
            <div className="flex items-center gap-5">
              <button type="button" onClick={() => inputFoto.current?.click()} className="group relative size-24 shrink-0 overflow-hidden rounded-full bg-musgo" aria-label="Trocar foto">
                {f.fotoUrl ? <img src={f.fotoUrl} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center cond text-[40px] font-black text-kiwi">{f.nome.slice(0, 1)}</span>}
                <span className="absolute inset-0 grid place-items-center bg-breu/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="size-6" aria-hidden="true" />
                </span>
              </button>
              <input ref={inputFoto} type="file" accept="image/*" className="sr-only" onChange={(e) => trocarFoto(e.target.files?.[0])} tabIndex={-1} />
              <div>
                <p className="text-[16px] font-bold semi">Foto da ficha</p>
                <p className="text-[14px] text-salvia">Rosto bem iluminado, sem filtro pesado.</p>
                <Botao tamanho="sm" variante="contorno" className="mt-2" icone={<Camera className="size-4" />} onClick={() => inputFoto.current?.click()}>
                  {f.fotoUrl ? 'Trocar foto' : 'Enviar foto'}
                </Botao>
              </div>
            </div>
            <Campo label="Nome artístico">{(p) => <input {...p} value={f.nome} onChange={(e) => set('nome', e.target.value)} />}</Campo>
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_120px_170px]">
              <Campo label="Cidade">{(p) => <input {...p} value={f.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} autoComplete="address-level2" />}</Campo>
              <Campo label="UF">
                {(p) => (
                  <select {...p} value={f.uf ?? ''} onChange={(e) => set('uf', e.target.value)} className={`${p.className} appearance-none`}>
                    <option value="">—</option>
                    {UFS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                )}
              </Campo>
              <Campo label="Nascimento">{(p) => <input {...p} type="date" value={f.nascimento ?? ''} onChange={(e) => set('nascimento', e.target.value)} />}</Campo>
            </div>
            <Escolhas rotulo="Nichos" opcoes={NICHOS} valor={f.nichos as (typeof NICHOS)[number][]} aoMudar={(v) => set('nichos', v)} multipla />
            <Escolhas rotulo="Formatos que você faz" opcoes={['UGC', 'Influencer'] as const} valor={f.formatos as ('UGC' | 'Influencer')[]} aoMudar={(v) => set('formatos', v)} multipla />
            <Escolhas rotulo="Idiomas" opcoes={IDIOMAS} valor={(f.idiomas ?? []) as (typeof IDIOMAS)[number][]} aoMudar={(v) => set('idiomas', v)} multipla />
            <Campo label="Sua linguagem em poucas palavras" dica="Ex.: tutorial próximo, humor rápido, review direto.">
              {(p) => <input {...p} value={f.linguagem ?? ''} onChange={(e) => set('linguagem', e.target.value)} maxLength={80} />}
            </Campo>
            <Campo label="Apresentação" dica="Conte o que você grava e para quem. Até 800 caracteres.">
              {(p) => <textarea {...p} rows={4} maxLength={800} value={f.bio ?? ''} onChange={(e) => set('bio', e.target.value)} className={`${p.className} py-3`} />}
            </Campo>
            <div className="grid gap-6 sm:grid-cols-2">
              <Campo label="Link do vídeo de apresentação" dica="YouTube, Drive ou Instagram, começando com https://">
                {(p) => <input {...p} type="url" value={f.videoUrl ?? ''} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://" />}
              </Campo>
              <Campo label="WhatsApp (só a KRIÔ vê)">{(p) => <input {...p} type="tel" value={f.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} autoComplete="tel" />}</Campo>
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[15px] text-nevoa">
              <input type="checkbox" checked={f.academy} onChange={(e) => set('academy', e.target.checked)} className="size-5 accent-[#a8e063]" />
              Quero fazer (ou já fiz) a KRIÔ Academy
            </label>
          </section>

          <section>
            <h2 className="cond text-[32px] font-black leading-none">Redes sociais</h2>
            <p className="mt-2 max-w-[40rem] text-[15px] text-salvia">Conecte com o login oficial de cada rede. A KRIÔ nunca vê sua senha, e os números se atualizam sozinhos todo dia.</p>
            <ul className="mt-5 grid gap-3">
              {(['instagram', 'tiktok', 'youtube'] as Rede[]).map((rede) => {
                const r = f.redes.find((x) => x.rede === rede)
                const liberada = disponiveis.dados?.[rede]
                return (
                  <li key={rede} className="flex flex-wrap items-center gap-4 rounded-[14px] border border-linha bg-carvao p-4">
                    <span className={`grid size-12 place-items-center rounded-full ${r ? 'bg-kiwi text-breu' : 'bg-grafite text-salvia'}`}>
                      <IconeRede rede={rede} className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-bold semi">{NOME_REDE[rede]}</p>
                      {r ? (
                        <p className="text-[14px] text-salvia">
                          {r.usuario && <span className="text-nevoa">{r.usuario.startsWith('@') ? r.usuario : `@${r.usuario}`} · </span>}
                          {formatarNumero(r.seguidores)} seguidores · engajamento {formatarEngajamento(r.engajamento)}
                          {r.sincronizadoEm && ` · atualizado ${quando(r.sincronizadoEm)}`}
                        </p>
                      ) : (
                        <p className="text-[14px] text-salvia">{rede === 'instagram' ? 'Precisa ser conta profissional (Criador ou Comercial).' : 'Não conectado.'}</p>
                      )}
                      {r?.erro && (
                        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#ffcf9e]">
                          <CircleAlert className="size-4" aria-hidden="true" />
                          {r.erro}
                        </p>
                      )}
                    </div>
                    {r ? (
                      <div className="flex gap-2">
                        {!f.demo && (
                          <Botao tamanho="sm" variante="fantasma" icone={<RefreshCw className="size-4" />} onClick={() => atualizarRede(rede)}>
                            Atualizar
                          </Botao>
                        )}
                        <Botao tamanho="sm" variante="perigo" icone={<Unplug className="size-4" />} onClick={() => desconectar(rede)}>
                          Desconectar
                        </Botao>
                      </div>
                    ) : (
                      <a
                        href={`/api/redes/${rede}/conectar`}
                        aria-disabled={liberada === false}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-nevoa/25 px-5 text-[14px] font-bold text-nevoa no-underline semi transition-colors hover:border-kiwi hover:text-kiwi"
                      >
                        Conectar
                        {liberada === false && <span className="text-[12px] font-semibold text-salvia">(em liberação)</span>}
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {erroForm && <ErroCaixa texto={erroForm} />}
          <div className="flex flex-wrap gap-3">
            <Botao tamanho="lg" variante="contorno" carregando={salvando && !enviando} onClick={() => salvar()}>
              Salvar
            </Botao>
            {(f.status === 'rascunho' || f.status === 'recusado') && (
              <Botao tamanho="lg" carregando={enviando} icone={<Send className="size-5" />} onClick={enviarParaAvaliacao}>
                Enviar para a curadoria
              </Botao>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[14px] font-semibold text-salvia">Prévia da ficha</p>
          <FichaCard f={f} />
        </aside>
      </div>
    </>
  )
}

// ---------- Convite / trabalho ----------

export function TrabalhoCreator() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { toast } = useSessao()
  const { dados, erro, carregando, recarregar } = useDados<Trabalho>(`/trabalhos/${id}`)
  const [respondendo, setRespondendo] = useState<'aceito' | 'recusado' | null>(null)
  const [festa, setFesta] = useState(false)

  const responder = async (resposta: 'aceito' | 'recusado') => {
    setRespondendo(resposta)
    try {
      const r = await api<{ match: boolean }>(`/trabalhos/${id}/resposta`, { json: { resposta } })
      if (r.match) setFesta(true)
      else toast('Convite recusado. A marca e a KRIÔ foram avisadas.')
      recarregar()
    } catch (e) {
      toast((e as Error).message, { tom: 'erro' })
    } finally {
      setRespondendo(null)
    }
  }

  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Convite não encontrado.'} tentar={recarregar} />
  const p = dados.pedido

  return (
    <>
      <Link to="/creator" className="mb-4 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-salvia no-underline hover:text-nevoa">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Início
      </Link>
      <Titulo sub={`${p.marca} · ${p.pecas} vídeos · ${p.modalidade}${p.prazo ? ` · ${p.prazo}` : ''}`}>{p.titulo}</Titulo>

      <div className={`grid gap-8 ${dados.conversaId ? 'lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : ''}`}>
        <div>
          <dl className="divide-y divide-linha rounded-[16px] border border-linha bg-carvao">
            {(
              [
                ['Objetivo', p.objetivo],
                ['Produto', p.produto],
                ['Público', p.publico],
                ['Canais', p.canais.join(', ')],
                ['Perfil que a marca imagina', p.perfilCreator],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="px-5 py-4">
                  <dt className="text-[14px] font-semibold text-salvia">{k}</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-[16px]">{v}</dd>
                </div>
              ))}
          </dl>

          {dados.resposta === 'pendente' && (
            <div className="mt-6 rounded-[16px] border border-kiwi/50 bg-kiwi/5 p-5">
              <p className="text-[16px] font-semibold">A {p.marca} escolheu sua ficha. Topa o trabalho?</p>
              <p className="mt-1 text-[14px] text-salvia">Se aceitar, dá match e abre a conversa com a marca e a KRIÔ.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Botao tamanho="lg" icone={<Check className="size-5" />} carregando={respondendo === 'aceito'} onClick={() => responder('aceito')}>
                  Aceitar
                </Botao>
                <Botao tamanho="lg" variante="contorno" icone={<X className="size-5" />} carregando={respondendo === 'recusado'} onClick={() => responder('recusado')}>
                  Agora não
                </Botao>
              </div>
            </div>
          )}
          {dados.resposta === 'recusado' && (
            <p className="mt-6 flex items-center gap-2 text-[15px] text-salvia">
              <Clock className="size-4" aria-hidden="true" />
              Você recusou este convite.
            </p>
          )}
        </div>
        {dados.conversaId && <Chat conversaId={dados.conversaId} />}
      </div>

      <AnimatePresence>
        {festa && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center bg-breu/90 p-6" role="dialog" aria-modal="true" aria-label="Match!">
            <div className="flex flex-col items-center text-center">
              <Carimbo tamanho={200} />
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-10 cond text-[44px] font-black leading-none">
                Você e a {p.marca}
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 max-w-[28rem] text-[16px] text-salvia">
                A conversa já está aberta. Roteiro, gravação e entregas acontecem lá.
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="mt-8">
                <Botao
                  tamanho="lg"
                  icone={<MessagesSquare className="size-5" />}
                  onClick={() => {
                    setFesta(false)
                    navegar(`/creator/trabalhos/${id}`)
                  }}
                >
                  Abrir a conversa
                </Botao>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ---------- Ficha pública / completa ----------

export function FichaPagina({ voltar }: { voltar: string }) {
  const { slug } = useParams()
  const { usuario } = useSessao()
  const { dados, erro, carregando, recarregar } = useDados<Ficha>(`/creators/catalogo/${slug}`)
  if (carregando) return <Carregando />
  if (erro || !dados) return <ErroCaixa texto={erro ?? 'Creator não encontrado.'} tentar={recarregar} />
  const completa = dados.bio !== undefined
  return (
    <>
      <Link to={voltar} className="mb-6 inline-flex min-h-10 items-center gap-2 text-[15px] font-semibold text-salvia no-underline hover:text-nevoa">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Creators
      </Link>
      <div className="grid gap-10 lg:grid-cols-[330px_minmax(0,1fr)]">
        <FichaCard f={dados} />
        <div>
          <h1 className="cond text-[clamp(2.6rem,6vw,4rem)] font-black leading-[0.9]">{dados.nome}</h1>
          {completa ? (
            <>
              {dados.bio && <p className="mt-4 max-w-[40rem] text-[17px] leading-relaxed text-nevoa/90">{dados.bio}</p>}
              <dl className="mt-6 grid max-w-[40rem] gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[14px] text-salvia">Idiomas</dt>
                  <dd className="font-semibold">{dados.idiomas?.join(', ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[14px] text-salvia">Linguagem</dt>
                  <dd className="font-semibold">{dados.linguagem || '—'}</dd>
                </div>
              </dl>
              {dados.redes.length > 0 && (
                <ul className="mt-8 grid max-w-[40rem] gap-3 sm:grid-cols-3">
                  {dados.redes.map((r) => (
                    <li key={r.rede} className="rounded-[14px] border border-linha bg-carvao p-4">
                      <p className="flex items-center gap-2 text-[14px] text-salvia">
                        <IconeRede rede={r.rede} />
                        {NOME_REDE[r.rede]}
                      </p>
                      <p className="mt-2 cond text-[36px] font-black leading-none tabular-nums">{formatarNumero(r.seguidores)}</p>
                      <p className="mt-1 text-[13px] text-salvia">engajamento {formatarEngajamento(r.engajamento)}</p>
                    </li>
                  ))}
                </ul>
              )}
              {usuario?.papel === 'marca' && (
                <Link to="/marca/novo" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-kiwi px-6 text-[16px] font-bold text-breu no-underline semi">
                  Fazer um briefing
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              )}
            </>
          ) : (
            <div className="mt-6 max-w-[34rem] rounded-[16px] border border-linha bg-carvao p-5">
              <p className="text-[16px]">Apresentação, engajamento e posts recentes ficam visíveis para marcas com conta na KRIÔ.</p>
              <Link to="/cadastro?papel=marca" className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi">
                Criar conta de marca
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const FichaMarca = () => <FichaPagina voltar="/marca/creators" />
