import { sql } from 'drizzle-orm'
import { boolean, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'

const id = () =>
  text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`)
const criadoEm = () => timestamp('criado_em', { withTimezone: true }).notNull().defaultNow()

export type Papel = 'marca' | 'creator' | 'admin'

export const usuarios = pgTable('usuarios', {
  id: id(),
  email: text('email').notNull().unique(),
  nome: text('nome').notNull(),
  senhaHash: text('senha_hash'),
  googleId: text('google_id').unique(),
  papel: text('papel').$type<Papel>().notNull(),
  aceitouTermosEm: timestamp('aceitou_termos_em', { withTimezone: true }),
  criadoEm: criadoEm(),
})

export const sessoes = pgTable(
  'sessoes',
  {
    id: text('id').primaryKey(), // hash SHA-256 do token do cookie
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index('sessoes_usuario_idx').on(t.usuarioId)],
)

export const marcas = pgTable('marcas', {
  usuarioId: text('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  empresa: text('empresa').notNull(),
  segmento: text('segmento'),
  site: text('site'),
  whatsapp: text('whatsapp'),
})

export type StatusCreator = 'rascunho' | 'em_analise' | 'aprovado' | 'recusado'

export const creators = pgTable('creators', {
  usuarioId: text('usuario_id')
    .primaryKey()
    .references(() => usuarios.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  nomeArtistico: text('nome_artistico').notNull(),
  cidade: text('cidade'),
  uf: text('uf'),
  nascimento: text('nascimento'),
  idiomas: text('idiomas').array().notNull().default(sql`'{}'::text[]`),
  nichos: text('nichos').array().notNull().default(sql`'{}'::text[]`),
  formatos: text('formatos').array().notNull().default(sql`'{}'::text[]`),
  linguagem: text('linguagem'),
  bio: text('bio'),
  fotoId: text('foto_id'),
  videoUrl: text('video_url'),
  whatsapp: text('whatsapp'),
  status: text('status').$type<StatusCreator>().notNull().default('rascunho'),
  notaInterna: text('nota_interna'),
  academy: boolean('academy').notNull().default(false),
  demo: boolean('demo').notNull().default(false),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  criadoEm: criadoEm(),
})

export type Rede = 'instagram' | 'tiktok' | 'youtube'

export type Post = { id: string; url: string; thumb?: string; legenda?: string; data?: string; curtidas?: number; comentarios?: number; views?: number }

export const redes = pgTable(
  'redes',
  {
    id: id(),
    creatorId: text('creator_id')
      .notNull()
      .references(() => creators.usuarioId, { onDelete: 'cascade' }),
    rede: text('rede').$type<Rede>().notNull(),
    idExterno: text('id_externo').notNull(),
    usuario: text('usuario'),
    nomeExibicao: text('nome_exibicao'),
    avatarUrl: text('avatar_url'),
    seguidores: integer('seguidores'),
    publicacoes: integer('publicacoes'),
    engajamento: integer('engajamento'), // em centésimos de %, ex.: 345 = 3,45%
    posts: jsonb('posts').$type<Post[]>().notNull().default(sql`'[]'::jsonb`),
    tokenAcesso: text('token_acesso'), // cifrado
    tokenRenovacao: text('token_renovacao'), // cifrado
    tokenExpiraEm: timestamp('token_expira_em', { withTimezone: true }),
    sincronizadoEm: timestamp('sincronizado_em', { withTimezone: true }),
    erro: text('erro'),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('redes_creator_rede_idx').on(t.creatorId, t.rede)],
)

export type StatusPedido = 'briefing' | 'match' | 'producao' | 'entrega' | 'concluido' | 'cancelado'

export const pedidos = pgTable(
  'pedidos',
  {
    id: id(),
    marcaId: text('marca_id')
      .notNull()
      .references(() => marcas.usuarioId, { onDelete: 'cascade' }),
    titulo: text('titulo').notNull(),
    objetivo: text('objetivo').notNull(),
    produto: text('produto').notNull(),
    publico: text('publico').notNull(),
    canais: text('canais').array().notNull().default(sql`'{}'::text[]`),
    pecas: integer('pecas').notNull(),
    creatorsDesejados: integer('creators_desejados').notNull().default(1),
    perfilCreator: text('perfil_creator'),
    nichos: text('nichos').array().notNull().default(sql`'{}'::text[]`),
    idiomas: text('idiomas').array().notNull().default(sql`'{}'::text[]`),
    pacote: text('pacote'),
    modalidade: text('modalidade').notNull().default('UGC'),
    prazo: text('prazo'),
    observacoes: text('observacoes'),
    status: text('status').$type<StatusPedido>().notNull().default('briefing'),
    rodadasTotal: integer('rodadas_total').notNull().default(1),
    rodadasUsadas: integer('rodadas_usadas').notNull().default(0),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
    criadoEm: criadoEm(),
  },
  (t) => [index('pedidos_marca_idx').on(t.marcaId)],
)

export type Decisao = 'pendente' | 'quero' | 'passo'
export type Resposta = 'aguardando' | 'pendente' | 'aceito' | 'recusado'

// Um creator dentro da lista curta de um pedido. Vira "match" quando a marca
// diz "quero" e o creator aceita o convite.
export const candidatos = pgTable(
  'candidatos',
  {
    id: id(),
    pedidoId: text('pedido_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => creators.usuarioId, { onDelete: 'cascade' }),
    notaKrio: text('nota_krio'),
    decisaoMarca: text('decisao_marca').$type<Decisao>().notNull().default('pendente'),
    respostaCreator: text('resposta_creator').$type<Resposta>().notNull().default('aguardando'),
    matchEm: timestamp('match_em', { withTimezone: true }),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('candidatos_pedido_creator_idx').on(t.pedidoId, t.creatorId)],
)

// Conversa de um pedido: a geral (marca + KRIÔ) não tem candidato; a de cada
// match junta marca, creator e KRIÔ.
export const conversas = pgTable(
  'conversas',
  {
    id: id(),
    pedidoId: text('pedido_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),
    candidatoId: text('candidato_id').references(() => candidatos.id, { onDelete: 'cascade' }),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex('conversas_pedido_candidato_idx').on(t.pedidoId, t.candidatoId)],
)

export type TipoMensagem = 'texto' | 'arquivo' | 'entrega' | 'sistema'
export type StatusEntrega = 'aguardando' | 'aprovado' | 'ajuste'

export const mensagens = pgTable(
  'mensagens',
  {
    id: id(),
    conversaId: text('conversa_id')
      .notNull()
      .references(() => conversas.id, { onDelete: 'cascade' }),
    autorId: text('autor_id').references(() => usuarios.id, { onDelete: 'set null' }),
    tipo: text('tipo').$type<TipoMensagem>().notNull().default('texto'),
    texto: text('texto').notNull().default(''),
    arquivoId: text('arquivo_id'),
    statusEntrega: text('status_entrega').$type<StatusEntrega>(),
    criadoEm: criadoEm(),
  },
  (t) => [index('mensagens_conversa_idx').on(t.conversaId, t.criadoEm)],
)

export const leituras = pgTable(
  'leituras',
  {
    conversaId: text('conversa_id')
      .notNull()
      .references(() => conversas.id, { onDelete: 'cascade' }),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    lidoEm: timestamp('lido_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.conversaId, t.usuarioId] })],
)

export const arquivos = pgTable('arquivos', {
  id: id(),
  donoId: text('dono_id').references(() => usuarios.id, { onDelete: 'set null' }),
  caminho: text('caminho').notNull(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(),
  tamanho: integer('tamanho').notNull(),
  publico: boolean('publico').notNull().default(false),
  criadoEm: criadoEm(),
})

export const favoritos = pgTable(
  'favoritos',
  {
    marcaId: text('marca_id')
      .notNull()
      .references(() => marcas.usuarioId, { onDelete: 'cascade' }),
    creatorId: text('creator_id')
      .notNull()
      .references(() => creators.usuarioId, { onDelete: 'cascade' }),
    criadoEm: criadoEm(),
  },
  (t) => [primaryKey({ columns: [t.marcaId, t.creatorId] })],
)

export const avisos = pgTable(
  'avisos',
  {
    id: id(),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => usuarios.id, { onDelete: 'cascade' }),
    texto: text('texto').notNull(),
    link: text('link'),
    lidoEm: timestamp('lido_em', { withTimezone: true }),
    criadoEm: criadoEm(),
  },
  (t) => [index('avisos_usuario_idx').on(t.usuarioId, t.criadoEm)],
)

// Estados de OAuth em andamento (Google e redes sociais).
export const estadosOauth = pgTable('estados_oauth', {
  id: text('id').primaryKey(),
  usuarioId: text('usuario_id'),
  provedor: text('provedor').notNull(),
  verificador: text('verificador'),
  extra: jsonb('extra').$type<Record<string, unknown>>(),
  expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
})
