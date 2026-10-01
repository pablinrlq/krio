import { useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { ArrowRight, LogOut, Trash2 } from 'lucide-react'
import { Logo } from '../components/ui'
import { CONTATO } from '../config'
import { api } from '../lib/api'
import { inicioDoPapel, useSessao } from '../lib/sessao'
import { Botao, Campo, Carregando, ErroCaixa, Titulo } from '../app/ui'
import { Catalogo } from './Marca'
import { FichaPagina } from './Creator'

export function Painel() {
  const { usuario } = useSessao()
  if (usuario === undefined) return <Carregando />
  return <Navigate to={usuario ? inicioDoPapel(usuario.papel) : '/entrar'} replace />
}

export function Conta() {
  const { usuario, sair } = useSessao()
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [apagando, setApagando] = useState(false)

  const excluir = async () => {
    setApagando(true)
    try {
      await api('/auth/conta', { method: 'DELETE' })
      window.location.href = '/'
    } catch (e) {
      setErro((e as Error).message)
      setApagando(false)
    }
  }

  return (
    <div className="max-w-[640px]">
      <Titulo>Conta</Titulo>
      <dl className="divide-y divide-linha rounded-[16px] border border-linha bg-carvao">
        <div className="px-5 py-4">
          <dt className="text-[14px] text-salvia">Nome</dt>
          <dd className="text-[16px] font-semibold">{usuario?.nome}</dd>
        </div>
        <div className="px-5 py-4">
          <dt className="text-[14px] text-salvia">E-mail</dt>
          <dd className="text-[16px] font-semibold">{usuario?.email}</dd>
        </div>
      </dl>
      <Botao variante="contorno" className="mt-6" icone={<LogOut className="size-4" />} onClick={sair}>
        Sair da conta
      </Botao>

      {usuario?.papel !== 'admin' && (
        <section className="mt-14 rounded-[16px] border border-[#ff9b85]/30 p-5">
          <h2 className="cond text-[28px] font-black leading-none">Excluir conta</h2>
          <p className="mt-3 text-[15px] text-salvia">Apaga sua conta, sua ficha ou seus pedidos, as conversas e os arquivos que você enviou. Não dá para desfazer.</p>
          <div className="mt-5 grid gap-4">
            <Campo label='Digite EXCLUIR para confirmar'>{(p) => <input {...p} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} autoComplete="off" />}</Campo>
            {erro && <ErroCaixa texto={erro} />}
            <Botao variante="perigo" icone={<Trash2 className="size-4" />} disabled={confirmar !== 'EXCLUIR'} carregando={apagando} onClick={excluir} className="justify-self-start">
              Excluir minha conta
            </Botao>
          </div>
        </section>
      )}
    </div>
  )
}

function PaginaPublica({ children }: { children: ReactNode }) {
  const { usuario } = useSessao()
  return (
    <div className="min-h-dvh bg-breu">
      <header className="sticky top-0 z-40 border-b border-linha bg-breu/95">
        <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 md:px-8" aria-label="Principal">
          <Link to="/" className="text-[30px] text-nevoa no-underline" aria-label="KRIÔ, início">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {usuario ? (
              <Link to={inicioDoPapel(usuario.papel)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi">
                Meu painel
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/entrar" className="inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold text-nevoa no-underline hover:text-kiwi">
                  Entrar
                </Link>
                <Link to="/cadastro" className="inline-flex min-h-11 items-center rounded-full bg-kiwi px-5 text-[15px] font-bold text-breu no-underline semi">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="conteudo" className="mx-auto max-w-[1240px] px-4 pb-24 pt-10 md:px-8">
        {children}
      </main>
    </div>
  )
}

export function CatalogoPublico() {
  return (
    <PaginaPublica>
      <Titulo sub="Creators avaliados e aprovados pela curadoria da KRIÔ. Crie uma conta de marca para ver números completos e fazer um briefing.">Casting KRIÔ</Titulo>
      <Catalogo publico />
    </PaginaPublica>
  )
}

export function FichaPublica() {
  return (
    <PaginaPublica>
      <FichaPagina voltar="/creators" />
    </PaginaPublica>
  )
}

export function NaoEncontrada() {
  return (
    <PaginaPublica>
      <div className="py-20 text-center">
        <p className="cond text-[clamp(4rem,14vw,8rem)] font-black leading-none text-kiwi">404</p>
        <p className="mt-4 text-[18px] text-salvia">Esta página não existe.</p>
        <Link to="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-kiwi px-6 text-[16px] font-bold text-breu no-underline semi">
          Voltar ao início
        </Link>
      </div>
    </PaginaPublica>
  )
}

const contato = CONTATO.email || 'o e-mail de contato da KRIÔ'

function Texto({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <PaginaPublica>
      <article className="mx-auto max-w-[44rem] text-[17px] leading-relaxed text-nevoa/90 [&_h2]:mt-10 [&_h2]:cond [&_h2]:text-[30px] [&_h2]:font-black [&_h2]:leading-none [&_h2]:text-nevoa [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="cond text-[clamp(2.6rem,6vw,4rem)] font-black leading-[0.9] text-nevoa">{titulo}</h1>
        <p className="text-[14px] text-salvia">Versão inicial, em revisão jurídica. Última atualização: outubro de 2026.</p>
        {children}
      </article>
    </PaginaPublica>
  )
}

export function Termos() {
  return (
    <Texto titulo="Termos de uso">
      <h2>O que é a plataforma</h2>
      <p>A KRIÔ conecta marcas a creators e coordena a produção de conteúdo: briefing, escolha do creator, conversa, entregas e aprovação.</p>
      <h2>Contas</h2>
      <ul>
        <li>Cada pessoa é responsável pelos dados que informa e pela segurança da própria senha.</li>
        <li>Creators passam por avaliação antes de entrar no casting. A KRIÔ pode aprovar, recusar ou retirar fichas do casting.</li>
        <li>Concluir a KRIÔ Academy não garante vaga no casting.</li>
      </ul>
      <h2>Conteúdo e direitos</h2>
      <ul>
        <li>Arquivos enviados nas conversas ficam visíveis só para quem participa delas e para a equipe da KRIÔ.</li>
        <li>O direito de uso de imagem é contratado à parte, por período, mídia paga, território e exclusividade.</li>
        <li>As quantidades e rodadas de ajuste seguem o pacote combinado para cada pedido.</li>
      </ul>
      <h2>Conduta</h2>
      <p>Não é permitido enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros. Contas que fizerem isso podem ser suspensas.</p>
      <h2>Contato</h2>
      <p>Dúvidas sobre estes termos: {contato}.</p>
    </Texto>
  )
}

export function Privacidade() {
  return (
    <Texto titulo="Política de privacidade">
      <p>Esta política explica quais dados a KRIÔ guarda, por que e quais são os seus direitos pela Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
      <h2>Dados que guardamos</h2>
      <ul>
        <li>Cadastro: nome, e-mail, senha (cifrada) e, se você entrar com o Google, o identificador da sua conta Google.</li>
        <li>Marcas: nome da empresa e os briefings enviados.</li>
        <li>Creators: dados da ficha (foto, cidade, nichos, idiomas, apresentação, link de vídeo, WhatsApp) e, se você conectar redes sociais, nome de usuário, seguidores, publicações e posts recentes obtidos pelas APIs oficiais.</li>
        <li>Conversas, arquivos e avisos trocados na plataforma.</li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Apresentar creators às marcas, fazer o match e coordenar a produção.</li>
        <li>Enviar avisos de convite, match, mensagens e entregas.</li>
        <li>Manter a plataforma segura.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <p>A ficha do creator aprovado aparece para marcas com conta; um resumo dela aparece no catálogo público. Não vendemos dados. Usamos fornecedores de infraestrutura (servidor, e-mail) só para operar a plataforma.</p>
      <h2>Redes sociais</h2>
      <p>A conexão usa o login oficial de cada rede. A KRIÔ nunca recebe sua senha. Os tokens de acesso ficam cifrados e você pode desconectar a rede a qualquer momento na sua ficha.</p>
      <h2>Seus direitos</h2>
      <p>Você pode acessar, corrigir e apagar seus dados. A exclusão da conta fica em Conta, dentro do painel, e apaga a conta, a ficha ou os pedidos, as conversas e os arquivos enviados por você. Para outros pedidos: {contato}.</p>
    </Texto>
  )
}
