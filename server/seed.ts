// Dados de demonstração: um admin, uma marca, os creators ilustrativos do site
// e um pedido com lista curta pronta. Rode com `npm run seed`.
import { eq } from 'drizzle-orm'
import { db, schema } from './db'
import { hashSenha } from './lib/cripto'
import { conversaDoPedido, publicarMensagem } from './routes/chat'
import type { Post, Rede } from './db/schema'

const SENHA = process.env.SEED_PASSWORD ?? 'krio2026'

async function usuario(email: string, nome: string, papel: 'admin' | 'marca' | 'creator') {
  const [ja] = await db.select().from(schema.usuarios).where(eq(schema.usuarios.email, email))
  if (ja) return ja
  const [u] = await db.insert(schema.usuarios).values({ email, nome, papel, senhaHash: await hashSenha(SENHA), aceitouTermosEm: new Date() }).returning()
  return u
}

const posts = (n: number, base: number): Post[] =>
  Array.from({ length: n }, (_, i) => ({ id: `demo-${base}-${i}`, url: '#', legenda: 'Post de exemplo', curtidas: Math.round(base * (0.02 + i * 0.004)), comentarios: Math.round(base * 0.002) }))

const CREATORS: {
  nome: string
  email: string
  cidade: string
  uf: string
  nichos: string[]
  formatos: string[]
  idiomas: string[]
  linguagem: string
  bio: string
  redes: [Rede, string, number][]
}[] = [
  { nome: 'Duda Ramos', email: 'duda@krio.demo', cidade: 'Belo Horizonte', uf: 'MG', nichos: ['Beleza', 'Lifestyle'], formatos: ['UGC'], idiomas: ['Português', 'Espanhol'], linguagem: 'Tutorial próximo', bio: 'Maquiagem do dia a dia, sem filtro e com passo a passo.', redes: [['instagram', 'duda.ramos', 48200], ['tiktok', 'dudaramos', 91500]] },
  { nome: 'Caio Nunes', email: 'caio@krio.demo', cidade: 'São Paulo', uf: 'SP', nichos: ['Gamer', 'Humor'], formatos: ['Influencer'], idiomas: ['Português', 'Inglês'], linguagem: 'Humor rápido', bio: 'Gameplay, setup e muita zoeira. Ao vivo três vezes por semana.', redes: [['youtube', '@caionunes', 132000], ['tiktok', 'caionunes', 210000]] },
  { nome: 'Bia Torres', email: 'bia@krio.demo', cidade: 'Rio de Janeiro', uf: 'RJ', nichos: ['Fitness', 'Lifestyle'], formatos: ['UGC', 'Influencer'], idiomas: ['Português'], linguagem: 'Energia alta', bio: 'Treino curto, rotina real e alimentação sem neura.', redes: [['instagram', 'bia.torres.fit', 76400]] },
  { nome: 'Léo Matos', email: 'leo@krio.demo', cidade: 'Curitiba', uf: 'PR', nichos: ['Tecnologia'], formatos: ['UGC'], idiomas: ['Português', 'Inglês'], linguagem: 'Review direto', bio: 'Testo gadget por uma semana antes de falar dele.', redes: [['youtube', '@leomatos', 58900], ['instagram', 'leo.matos.tech', 22100]] },
  { nome: 'Nina Castro', email: 'nina@krio.demo', cidade: 'Salvador', uf: 'BA', nichos: ['Alimentação'], formatos: ['UGC'], idiomas: ['Português'], linguagem: 'Receita em 30 s', bio: 'Receitas rápidas com ingrediente de feira.', redes: [['tiktok', 'ninacastro', 143000], ['instagram', 'nina.cozinha', 39800]] },
  { nome: 'Rafa Lima', email: 'rafa@krio.demo', cidade: 'Contagem', uf: 'MG', nichos: ['Corporativo'], formatos: ['UGC'], idiomas: ['Português', 'Inglês'], linguagem: 'Claro e confiável', bio: 'Explico produto e serviço sem jargão.', redes: [['instagram', 'rafalima', 12600]] },
]

export async function semear() {
  await usuario(process.env.ADMIN_EMAIL ?? 'admin@krio.demo', 'Equipe KRIÔ', 'admin')
  const marca = await usuario('marca@krio.demo', 'Ana Souza', 'marca')
  await db.insert(schema.marcas).values({ usuarioId: marca.id, empresa: 'Verde Cosméticos', segmento: 'Beleza' }).onConflictDoNothing()

  const ids: string[] = []
  for (const [i, c] of CREATORS.entries()) {
    const u = await usuario(c.email, c.nome, 'creator')
    ids.push(u.id)
    await db
      .insert(schema.creators)
      .values({
        usuarioId: u.id,
        slug: c.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
        nomeArtistico: c.nome,
        cidade: c.cidade,
        uf: c.uf,
        nichos: c.nichos,
        formatos: c.formatos,
        idiomas: c.idiomas,
        linguagem: c.linguagem,
        bio: c.bio,
        status: 'aprovado',
        demo: true,
      })
      .onConflictDoNothing()
    for (const [rede, usuarioRede, seguidores] of c.redes) {
      const ps = posts(6, seguidores)
      await db
        .insert(schema.redes)
        .values({
          creatorId: u.id,
          rede,
          idExterno: `demo-${i}-${rede}`,
          usuario: usuarioRede,
          nomeExibicao: c.nome,
          seguidores,
          publicacoes: 120 + i * 37,
          engajamento: Math.round((ps.reduce((s, p) => s + (p.curtidas ?? 0) + (p.comentarios ?? 0), 0) / ps.length / seguidores) * 10000),
          posts: ps,
          sincronizadoEm: new Date(),
        })
        .onConflictDoNothing()
    }
  }

  // Um creator novo esperando avaliação no admin.
  const novo = await usuario('joana@krio.demo', 'Joana Prado', 'creator')
  await db
    .insert(schema.creators)
    .values({ usuarioId: novo.id, slug: 'joana-prado', nomeArtistico: 'Joana Prado', cidade: 'Recife', uf: 'PE', nichos: ['Lifestyle', 'Humor'], formatos: ['UGC'], idiomas: ['Português'], linguagem: 'Conversa de amiga', bio: 'Saí da Academy em setembro. Gravo em casa e na rua.', status: 'em_analise', academy: true, demo: true })
    .onConflictDoNothing()

  const [ja] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.marcaId, marca.id))
  if (!ja) {
    const [p] = await db
      .insert(schema.pedidos)
      .values({
        marcaId: marca.id,
        titulo: 'Lançamento do sérum Verde',
        objetivo: 'Apresentar o sérum novo e gerar vendas no e-commerce.',
        produto: 'Sérum facial vegano de vitamina C.',
        publico: 'Mulheres de 22 a 40 anos que cuidam da pele.',
        canais: ['Instagram', 'TikTok', 'Anúncios'],
        pecas: 10,
        creatorsDesejados: 3,
        perfilCreator: 'Linguagem de tutorial, próxima e sem exagero.',
        nichos: ['Beleza', 'Lifestyle'],
        idiomas: ['Português'],
        pacote: 'Growth',
        modalidade: 'UGC',
        prazo: 'Até o fim de novembro',
        status: 'match',
      })
      .returning()
    for (const [i, id] of [ids[0], ids[2], ids[4], ids[5]].entries()) {
      await db.insert(schema.candidatos).values({ pedidoId: p.id, creatorId: id, notaKrio: ['Tutorial é a cara do sérum.', 'Rotina de autocuidado combina.', 'Público feminino forte no TikTok.', 'Opção mais institucional.'][i] })
    }
    const conversa = await conversaDoPedido(p.id, null)
    await publicarMensagem({ conversaId: conversa.id, autorId: null, tipo: 'sistema', texto: 'Briefing recebido. A KRIÔ vai montar a lista curta de creators e avisar você por aqui.' })
    await publicarMensagem({ conversaId: conversa.id, autorId: null, tipo: 'sistema', texto: 'A lista curta está pronta: 4 creators selecionados para você. Passe as fichas e diga quem você quer.' })
  }

  console.log(`Pronto. Senha de todas as contas de demonstração: ${SENHA}`)
  console.log('admin@krio.demo · marca@krio.demo · duda@krio.demo (creator) · joana@krio.demo (em análise)')
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('server/seed.ts')) semear().then(() => process.exit(0))
