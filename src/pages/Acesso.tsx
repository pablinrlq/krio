import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { motion } from 'motion/react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Logo } from '../components/ui'
import { api } from '../lib/api'
import { inicioDoPapel, useSessao } from '../lib/sessao'
import { Botao, Campo, ErroCaixa } from '../app/ui'

function Moldura({ children, lado }: { children: ReactNode; lado: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-breu lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="on-light relative hidden flex-col justify-between overflow-hidden bg-kiwi p-12 text-breu lg:flex">
        <Link to="/" className="text-[40px] text-breu no-underline" aria-label="Voltar ao site">
          <Logo />
        </Link>
        {lado}
        <p className="text-[14px] font-semibold semi">Casting · Produção · Studio · Academy</p>
      </div>
      <div className="flex min-h-dvh flex-col px-4 py-8 md:px-10">
        <Link to="/" className="text-[32px] text-nevoa no-underline lg:hidden" aria-label="Voltar ao site">
          <Logo />
        </Link>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mx-auto my-auto w-full max-w-[440px] py-10">
          {children}
        </motion.div>
      </div>
    </div>
  )
}

function Senha({ valor, aoMudar, erro, nova }: { valor: string; aoMudar: (v: string) => void; erro?: string | null; nova?: boolean }) {
  const [ver, setVer] = useState(false)
  return (
    <Campo label="Senha" erro={erro} dica={nova ? 'Pelo menos 8 caracteres.' : undefined}>
      {(p) => (
        <div className="relative">
          <input {...p} type={ver ? 'text' : 'password'} autoComplete={nova ? 'new-password' : 'current-password'} value={valor} onChange={(e) => aoMudar(e.target.value)} className={`${p.className} pr-12`} />
          <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Esconder senha' : 'Mostrar senha'} className="absolute right-1.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-salvia hover:text-nevoa">
            {ver ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      )}
    </Campo>
  )
}

function BotaoGoogle({ papel }: { papel?: string }) {
  return (
    <a
      href={`/api/auth/google${papel ? `?papel=${papel}` : ''}`}
      className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-nevoa/25 text-[15px] font-bold text-nevoa no-underline semi transition-colors hover:border-nevoa hover:bg-nevoa/5"
    >
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
        <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.1-4.5H2.2v2.8A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.9 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8z" />
        <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5.4 12 5.4z" />
      </svg>
      Continuar com o Google
    </a>
  )
}

const Divisor = () => (
  <div className="my-6 flex items-center gap-3 text-[13px] text-salvia">
    <span className="h-px flex-1 bg-linha" />
    ou com e-mail
    <span className="h-px flex-1 bg-linha" />
  </div>
)

export function Entrar() {
  const { usuario, recarregar, google, config } = useSessao()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(params.get('erro') ? 'Não deu para entrar com o Google. Tente de novo.' : null)
  const [enviando, setEnviando] = useState(false)
  const enviou = useRef(false)

  if (usuario && !enviou.current) return <Navigate to={params.get('volta') ?? inicioDoPapel(usuario.papel)} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      const r = await api<{ papel: string }>('/auth/entrar', { json: { email, senha } })
      enviou.current = true
      await recarregar()
      navegar(params.get('volta') ?? inicioDoPapel(r.papel), { replace: true })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Moldura lado={<p className="cond text-[clamp(4rem,7vw,6rem)] font-black uppercase leading-[0.84]">Bom te ver de novo.</p>}>
      <h1 className="cond text-[52px] font-black leading-[0.9]">Entrar</h1>
      <p className="mt-3 text-[16px] text-salvia">Acompanhe pedidos, fichas e conversas.</p>
      <div className="mt-8">{google && <BotaoGoogle />}</div>
      {google && <Divisor />}
      <form onSubmit={enviar} noValidate className={`grid gap-5 ${google ? '' : 'mt-8'}`}>
        {erro && <ErroCaixa texto={erro} />}
        <Campo label="E-mail">{(p) => <input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />}</Campo>
        <Senha valor={senha} aoMudar={setSenha} />
        <Botao type="submit" tamanho="lg" carregando={enviando} className="mt-2 w-full">
          Entrar
          <ArrowRight className="size-5" aria-hidden="true" />
        </Botao>
      </form>
      {config.modoTeste && (
        <div className="mt-8 rounded-[14px] border border-kiwi/40 bg-kiwi/5 p-4 text-[14px]">
          <p className="font-bold text-kiwi semi">Contas de teste (senha krio2026)</p>
          <ul className="mt-2 grid gap-1">
            {[
              ['marca@krio.demo', 'Marca'],
              ['duda@krio.demo', 'Creator'],
              ['admin@krio.demo', 'Equipe KRIÔ'],
            ].map(([e, p]) => (
              <li key={e}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(e)
                    setSenha('krio2026')
                  }}
                  className="flex w-full min-h-10 items-center justify-between rounded-[8px] px-2 text-left hover:bg-nevoa/5"
                >
                  <span className="text-nevoa">{e}</span>
                  <span className="text-salvia">{p}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-8 text-center text-[15px] text-salvia">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-kiwi underline decoration-kiwi/40 hover:decoration-kiwi">
          Criar conta
        </Link>
      </p>
    </Moldura>
  )
}

export function Cadastro() {
  const { usuario, recarregar, google } = useSessao()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const [papel, setPapel] = useState<'marca' | 'creator'>(params.get('papel') === 'creator' ? 'creator' : 'marca')
  const [f, setF] = useState({ nome: '', empresa: '', email: '', senha: '', termos: false })
  const [erro, setErro] = useState<string | null>(params.get('erro') ? 'Esta conta Google ainda não tem cadastro. Escolha se você é marca ou creator e continue.' : null)
  const [enviando, setEnviando] = useState(false)
  const enviou = useRef(false)

  if (usuario && !enviou.current) return <Navigate to={inicioDoPapel(usuario.papel)} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!f.termos) return setErro('Aceite os termos de uso e a política de privacidade para continuar.')
    setEnviando(true)
    try {
      await api('/auth/cadastro', { json: { papel, nome: f.nome, empresa: papel === 'marca' ? f.empresa : undefined, email: f.email, senha: f.senha, aceitouTermos: true } })
      enviou.current = true
      await recarregar()
      const repassar = new URLSearchParams([...params].filter(([k]) => ['pacote', 'nicho', 'modalidade'].includes(k))).toString()
      navegar(papel === 'creator' ? '/creator/perfil?novo=1' : `/marca/novo${repassar ? `?${repassar}` : ''}`, { replace: true })
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }))

  return (
    <Moldura
      lado={
        <p className="cond text-[clamp(4rem,7vw,6rem)] font-black uppercase leading-[0.84]">
          {papel === 'marca' ? (
            <>
              O rosto certo.
              <br />
              Com o vídeo pronto.
            </>
          ) : (
            <>
              Ideias
              <br />
              ganham rosto.
            </>
          )}
        </p>
      }
    >
      <h1 className="cond text-[52px] font-black leading-[0.9]">Criar conta</h1>
      <div role="radiogroup" aria-label="Você é" className="mt-6 grid grid-cols-2 rounded-full bg-grafite p-1">
        {(
          [
            ['marca', 'Sou marca'],
            ['creator', 'Sou creator'],
          ] as const
        ).map(([v, label]) => (
          <button key={v} type="button" role="radio" aria-checked={papel === v} onClick={() => setPapel(v)} className={`relative min-h-12 rounded-full text-[16px] font-bold semi transition-colors ${papel === v ? 'text-breu' : 'text-salvia hover:text-nevoa'}`}>
            {papel === v && <motion.span layoutId="papel-cadastro" className="absolute inset-0 rounded-full bg-kiwi" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />}
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-salvia">
        {papel === 'marca' ? 'Mande briefings, escolha creators e aprove os vídeos num lugar só.' : 'Monte sua ficha, conecte suas redes e receba convites de marcas.'}
      </p>

      {google && (
        <div className="mt-6">
          <BotaoGoogle papel={papel} />
          <p className="mt-2 text-center text-[13px] text-salvia">Ao continuar com o Google, você aceita os termos e a política de privacidade.</p>
        </div>
      )}
      {google ? <Divisor /> : <div className="h-6" />}

      <form onSubmit={enviar} noValidate className="grid gap-5">
        {erro && <ErroCaixa texto={erro} />}
        <Campo label={papel === 'marca' ? 'Seu nome' : 'Seu nome artístico'}>{(p) => <input {...p} autoComplete="name" value={f.nome} onChange={(e) => set('nome')(e.target.value)} />}</Campo>
        {papel === 'marca' && <Campo label="Marca ou empresa">{(p) => <input {...p} autoComplete="organization" value={f.empresa} onChange={(e) => set('empresa')(e.target.value)} />}</Campo>}
        <Campo label="E-mail">{(p) => <input {...p} type="email" autoComplete="email" value={f.email} onChange={(e) => set('email')(e.target.value)} />}</Campo>
        <Senha valor={f.senha} aoMudar={set('senha')} nova />
        <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-salvia">
          <input type="checkbox" checked={f.termos} onChange={(e) => set('termos')(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[#a8e063]" />
          <span>
            Li e aceito os{' '}
            <Link to="/termos" target="_blank" className="font-semibold text-nevoa underline">
              termos de uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacidade" target="_blank" className="font-semibold text-nevoa underline">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        <Botao type="submit" tamanho="lg" carregando={enviando} className="mt-2 w-full">
          Criar conta de {papel === 'marca' ? 'marca' : 'creator'}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Botao>
      </form>
      <p className="mt-8 text-center text-[15px] text-salvia">
        Já tem conta?{' '}
        <Link to="/entrar" className="font-semibold text-kiwi underline decoration-kiwi/40 hover:decoration-kiwi">
          Entrar
        </Link>
      </p>
    </Moldura>
  )
}
