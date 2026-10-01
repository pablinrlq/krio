import { MotionConfig } from 'motion/react'
import { BriefProvider } from './brief'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Faixa, Problema } from './components/Problema'
import { Etapas } from './components/Etapas'
import { Frentes } from './components/Frentes'
import { Pacotes } from './components/Pacotes'
import { Academy } from './components/Academy'
import { Studio } from './components/Studio'
import { Diferenciais, Duvidas } from './components/Diferenciais'
import { Contato } from './components/Contato'
import { Rodape, VoltarAoTopo } from './components/Rodape'

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BriefProvider>
        <a
          href="#conteudo"
          className="sr-only z-[70] rounded-full bg-kiwi px-4 py-2 font-bold text-breu focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">
          <Hero />
          <Faixa />
          <Problema />
          <Etapas />
          <Frentes />
          <Pacotes />
          <Academy />
          <Studio />
          <Diferenciais />
          <Duvidas />
          <Contato />
        </main>
        <Rodape />
        <VoltarAoTopo />
      </BriefProvider>
    </MotionConfig>
  )
}
