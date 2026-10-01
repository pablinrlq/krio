export type Papel = 'marca' | 'creator' | 'admin'
export type Usuario = { id: string; nome: string; email: string; papel: Papel }
export type Rede = 'instagram' | 'tiktok' | 'youtube'

export type Post = { id: string; url: string; thumb?: string; legenda?: string; curtidas?: number; comentarios?: number; views?: number }

export type FichaRede = {
  rede: Rede
  usuario: string | null
  seguidores: number | null
  nomeExibicao?: string | null
  avatarUrl?: string | null
  publicacoes?: number | null
  engajamento?: number | null
  posts?: Post[]
  sincronizadoEm?: string | null
  erro?: string | null
}

export type Ficha = {
  id: string
  slug: string
  nome: string
  cidade: string | null
  uf: string | null
  nichos: string[]
  formatos: string[]
  fotoUrl: string | null
  demo: boolean
  alcance: number
  redes: FichaRede[]
  idiomas?: string[]
  linguagem?: string | null
  bio?: string | null
  videoUrl?: string | null
  favorito?: boolean
}

export type StatusPedido = 'briefing' | 'match' | 'producao' | 'entrega' | 'concluido' | 'cancelado'

export type Pedido = {
  id: string
  titulo: string
  objetivo: string
  produto: string
  publico: string
  canais: string[]
  pecas: number
  creatorsDesejados: number
  perfilCreator: string | null
  nichos: string[]
  idiomas: string[]
  pacote: string | null
  modalidade: string
  prazo: string | null
  observacoes: string | null
  status: StatusPedido
  rodadasTotal: number
  rodadasUsadas: number
  criadoEm: string
  atualizadoEm: string
}

export type Candidato = {
  id: string
  decisaoMarca: 'pendente' | 'quero' | 'passo'
  respostaCreator: 'aguardando' | 'pendente' | 'aceito' | 'recusado'
  matchEm: string | null
  notaKrio: string | null
  conversaId: string | null
  creator: Ficha
}

export type PedidoDetalhe = Pedido & { marca: { id: string; empresa: string }; conversaGeralId: string; candidatos: Candidato[] }

export type Mensagem = {
  id: string
  conversaId: string
  tipo: 'texto' | 'arquivo' | 'entrega' | 'sistema'
  texto: string
  statusEntrega: 'aguardando' | 'aprovado' | 'ajuste' | null
  criadoEm: string
  autor: { id: string; nome: string; papel: Papel } | null
  arquivo: { id: string; nome: string; tipo: string; tamanho: number; url: string } | null
}

export type Evento =
  | { tipo: 'mensagem'; conversaId: string; mensagem: Mensagem }
  | { tipo: 'entrega'; conversaId: string; mensagemId: string; status: Mensagem['statusEntrega'] }
  | { tipo: 'aviso'; texto: string; link?: string | null }
  | { tipo: 'pedido'; pedidoId: string }

export const ETAPAS_PEDIDO: { id: StatusPedido; nome: string }[] = [
  { id: 'briefing', nome: 'Briefing' },
  { id: 'match', nome: 'Match' },
  { id: 'producao', nome: 'Produção' },
  { id: 'entrega', nome: 'Entrega' },
  { id: 'concluido', nome: 'Concluído' },
]
