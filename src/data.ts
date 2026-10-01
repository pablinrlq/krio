export const NICHOS = [
  'Lifestyle',
  'Beleza',
  'Corporativo',
  'Humor',
  'Gamer',
  'Fitness',
  'Alimentação',
  'Tecnologia',
] as const

export type Creator = {
  id: string
  nome: string
  ini: string
  nicho: string
  formato: string
  idiomas: string
  base: string
  linguagem: string
  ficha: string
  bg: string
  fg: string
  fotoBg: string
  fotoFg: string
  carimbo: string
}

// Perfis ilustrativos: a KRIÔ ainda está montando o casting real.
export const CREATORS: Creator[] = [
  { id: 'duda', nome: 'Duda Ramos', ini: 'DR', nicho: 'Beleza', formato: 'UGC', idiomas: 'PT · ES', base: 'Belo Horizonte, MG', linguagem: 'Tutorial próximo', ficha: '014', bg: '#A8E063', fg: '#0B0D09', fotoBg: '#1F3A12', fotoFg: '#A8E063', carimbo: '#1F3A12' },
  { id: 'caio', nome: 'Caio Nunes', ini: 'CN', nicho: 'Gamer', formato: 'Influencer', idiomas: 'PT · EN', base: 'São Paulo, SP', linguagem: 'Humor rápido', ficha: '027', bg: '#1F3A12', fg: '#F2F7EA', fotoBg: '#0B0D09', fotoFg: '#A8E063', carimbo: '#A8E063' },
  { id: 'bia', nome: 'Bia Torres', ini: 'BT', nicho: 'Fitness', formato: 'UGC + Influencer', idiomas: 'PT', base: 'Rio de Janeiro, RJ', linguagem: 'Energia alta', ficha: '031', bg: '#E6F5CC', fg: '#0B0D09', fotoBg: '#3D6B1F', fotoFg: '#E6F5CC', carimbo: '#3D6B1F' },
  { id: 'leo', nome: 'Léo Matos', ini: 'LM', nicho: 'Tecnologia', formato: 'UGC', idiomas: 'PT · EN', base: 'Curitiba, PR', linguagem: 'Review direto', ficha: '042', bg: '#1A1F16', fg: '#F2F7EA', fotoBg: '#A8E063', fotoFg: '#0B0D09', carimbo: '#A8E063' },
  { id: 'nina', nome: 'Nina Castro', ini: 'NC', nicho: 'Alimentação', formato: 'UGC', idiomas: 'PT', base: 'Salvador, BA', linguagem: 'Receita em 30 s', ficha: '055', bg: '#CBEE96', fg: '#0B0D09', fotoBg: '#0B0D09', fotoFg: '#CBEE96', carimbo: '#0B0D09' },
  { id: 'rafa', nome: 'Rafa Lima', ini: 'RL', nicho: 'Corporativo', formato: 'UGC', idiomas: 'PT · EN', base: 'Contagem, MG', linguagem: 'Claro e confiável', ficha: '063', bg: '#3D6B1F', fg: '#F2F7EA', fotoBg: '#E6F5CC', fotoFg: '#1F3A12', carimbo: '#E6F5CC' },
]

export const ETAPAS = [
  {
    titulo: 'Briefing',
    texto: 'Você conta o objetivo, o produto, o público, os canais, quantas peças precisa e o perfil de creator que imagina.',
    itens: ['Objetivo', 'Produto', 'Público', 'Canais', 'Nº de peças', 'Perfil de creator'],
  },
  {
    titulo: 'Match',
    texto: 'A KRIÔ apresenta creators compatíveis por estilo, nicho, linguagem, idade aparente e experiência.',
    itens: ['Estilo', 'Nicho', 'Linguagem', 'Idade aparente', 'Experiência'],
  },
  {
    titulo: 'Produção',
    texto: 'Roteiro, direção e gravação em estúdio ou remota, com a KRIÔ acompanhando o creator.',
    itens: ['Roteiro', 'Direção', 'Gravação em estúdio', 'Gravação remota'],
  },
  {
    titulo: 'Entrega',
    texto: 'Edição, ajustes, aprovação e os arquivos finais nos formatos contratados.',
    itens: ['Edição', 'Ajustes', 'Aprovação', 'Arquivos finais'],
  },
]

export const FRENTES = [
  {
    id: 'casting',
    titulo: 'Casting',
    texto: 'Catálogo organizado de creators e influenciadores. Cada perfil traz vídeo de apresentação, portfólio, nichos, estilo, idiomas, cidade e experiência.',
    tags: NICHOS.join(' · '),
    alvo: '#topo',
    acao: 'Testar o match',
    cor: '#A8E063',
  },
  {
    id: 'producao',
    titulo: 'Produção',
    texto: 'Briefing, roteiro, gravação, direção, edição, aprovação e entrega final em uma única operação.',
    tags: 'Anúncios · Social · Campanhas · Lançamentos',
    alvo: '#como',
    acao: 'Ver as etapas',
    cor: '#CBEE96',
  },
  {
    id: 'academy',
    titulo: 'Academy',
    texto: 'Formação de novos creators do zero, com avaliação antes de entrarem no casting comercial.',
    tags: 'Cursos · Workshops · Prática em estúdio',
    alvo: '#academy',
    acao: 'Conhecer a Academy',
    cor: '#E6F5CC',
  },
  {
    id: 'studio',
    titulo: 'Studio',
    texto: 'Cenários modulares para gravar volume sem parecer sempre o mesmo vídeo.',
    tags: 'Próxima fase',
    alvo: '#studio',
    acao: 'Ver os cenários',
    cor: '#A3B394',
  },
]

export const MODALIDADES = {
  UGC: 'O creator produz o conteúdo para a sua marca publicar e anunciar nos próprios canais.',
  Influencer: 'Produção mais publicação: o conteúdo também vai para a audiência do próprio creator.',
} as const

export type Modalidade = keyof typeof MODALIDADES

export const PACOTES = [
  { nome: 'Starter', itens: ['5 vídeos', '1 creator', 'Roteiro', 'Edição', 'Rodada de ajustes'], topo: '#1A1F16', texto: '#F2F7EA' },
  { nome: 'Growth', itens: ['10 vídeos', 'Até 3 creators', 'Variações criativas', 'Edição para redes e Ads'], topo: '#1F3A12', texto: '#F2F7EA' },
  { nome: 'Scale', itens: ['20+ vídeos', 'Múltiplos creators', 'Produção contínua', 'Biblioteca mensal de criativos'], topo: '#3D6B1F', texto: '#F2F7EA' },
  { nome: 'Custom', itens: ['Campanhas e lançamentos', 'Influenciadores', 'Captação externa', 'Necessidades específicas'], topo: '#A8E063', texto: '#0B0D09' },
]

export const ACADEMY = [
  { titulo: 'Formação', texto: 'Presença em câmera, roteiro, UGC, iluminação, áudio, interpretação, portfólio, negociação e direitos de imagem.' },
  { titulo: 'Prática', texto: 'Treino com estrutura real de gravação e peças para o seu portfólio.' },
  { titulo: 'Avaliação', texto: 'Concluir o curso não garante vaga: todo creator passa por avaliação de padrão e perfil comercial.' },
  { titulo: 'Casting', texto: 'Quem é aprovado entra no catálogo e disputa trabalhos reais.' },
]

export const CENARIOS = [
  { id: 'sala', nome: 'Sala / casa', uso: 'Rotina, review de produto em uso e conversa direta com a câmera.', area: 'col-span-2 row-span-2', bg: '#1F3A12', fg: '#F2F7EA' },
  { id: 'escritorio', nome: 'Escritório', uso: 'Conteúdo corporativo, depoimento e explicação de serviço.', area: 'col-span-1', bg: '#3D6B1F', fg: '#F2F7EA' },
  { id: 'produto', nome: 'Produto', uso: 'Mesa para detalhe, unboxing e demonstração em close.', area: 'col-span-1', bg: '#1A1F16', fg: '#F2F7EA' },
  { id: 'podcast', nome: 'Podcast', uso: 'Entrevista, bate-papo e cortes para redes.', area: 'col-span-1', bg: '#CBEE96', fg: '#0B0D09' },
  { id: 'gamer', nome: 'Setup gamer', uso: 'Gameplay, review de periférico e transmissão.', area: 'col-span-1', bg: '#A8E063', fg: '#0B0D09' },
  { id: 'infinito', nome: 'Fundo infinito', uso: 'Peças limpas para anúncio, moda e recortes.', area: 'col-span-2 lg:col-span-4', bg: '#E6F5CC', fg: '#1F3A12' },
]

export const DIFERENCIAIS = [
  { titulo: 'Curadoria', texto: 'Você não recebe uma lista aleatória: recebe talentos adequados ao seu briefing.' },
  { titulo: 'Ponta a ponta', texto: 'Um único parceiro coordena creator, roteiro, produção, edição, aprovação e entrega.' },
  { titulo: 'Formação própria', texto: 'A Academy alimenta o casting com novos talentos preparados no padrão KRIÔ.' },
  { titulo: 'Infraestrutura', texto: 'Studio, casting, produção e educação dentro do mesmo ecossistema.' },
]

export const FAQ = [
  { p: 'Qual a diferença entre UGC e Influencer?', r: 'No UGC, o creator produz o conteúdo e a sua marca publica e anuncia nos próprios canais. No Influencer, além de produzir, o creator também publica para a audiência dele.' },
  { p: 'Eu escolho o creator?', r: 'Sim. A KRIÔ apresenta creators compatíveis com o seu briefing e você aprova antes da produção começar.' },
  { p: 'A gravação é presencial?', r: 'Pode ser em estúdio ou remota. Nos dois casos a KRIÔ acompanha o creator, com roteiro e direção.' },
  { p: 'As quantidades dos pacotes são fixas?', r: 'Não. Os números de cada pacote são exemplos e se ajustam ao que a sua marca precisa.' },
  { p: 'O direito de uso de imagem está incluso?', r: 'Não. Ele é contratado à parte, por período, mídia paga, território e exclusividade.' },
  { p: 'Terminar a Academy garante vaga no casting?', r: 'Não. Todo creator passa por avaliação de padrão e perfil comercial antes de entrar no catálogo.' },
]
