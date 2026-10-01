import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App'
import { SessaoProvider } from './lib/sessao'
import { Protegido } from './app/Shell'
import { Carregando } from './app/ui'

// As telas do painel carregam sob demanda: o site público fica leve.
function sob<M extends Record<string, unknown>>(carregar: () => Promise<M>, nome: keyof M) {
  return lazy(() => carregar().then((m) => ({ default: m[nome] as ComponentType })))
}
const acesso = () => import('./pages/Acesso')
const marca = () => import('./pages/Marca')
const creator = () => import('./pages/Creator')
const admin = () => import('./pages/Admin')
const geral = () => import('./pages/Geral')
const chat = () => import('./app/Chat')

const Entrar = sob(acesso, 'Entrar')
const Cadastro = sob(acesso, 'Cadastro')
const MarcaInicio = sob(marca, 'MarcaInicio')
const NovoBriefing = sob(marca, 'NovoBriefing')
const PedidoMarca = sob(marca, 'PedidoMarca')
const CatalogoMarca = sob(marca, 'CatalogoMarca')
const CreatorInicio = sob(creator, 'CreatorInicio')
const PerfilCreator = sob(creator, 'PerfilCreator')
const TrabalhoCreator = sob(creator, 'TrabalhoCreator')
const FichaMarca = sob(creator, 'FichaMarca')
const AdminInicio = sob(admin, 'AdminInicio')
const AdminCreators = sob(admin, 'AdminCreators')
const AdminPedidos = sob(admin, 'AdminPedidos')
const AdminPedido = sob(admin, 'AdminPedido')
const AdminMarcas = sob(admin, 'AdminMarcas')
const CatalogoPublico = sob(geral, 'CatalogoPublico')
const FichaPublica = sob(geral, 'FichaPublica')
const Conta = sob(geral, 'Conta')
const Painel = sob(geral, 'Painel')
const Termos = sob(geral, 'Termos')
const Privacidade = sob(geral, 'Privacidade')
const NaoEncontrada = sob(geral, 'NaoEncontrada')
const Mensagens = sob(chat, 'Mensagens')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <SessaoProvider>
          <Suspense fallback={<div className="min-h-dvh bg-breu"><Carregando /></div>}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/entrar" element={<Entrar />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/creators" element={<CatalogoPublico />} />
              <Route path="/creators/:slug" element={<FichaPublica />} />
              <Route path="/painel" element={<Painel />} />

              <Route element={<Protegido papeis={['marca']} />}>
                <Route path="/marca" element={<MarcaInicio />} />
                <Route path="/marca/novo" element={<NovoBriefing />} />
                <Route path="/marca/pedidos/:id" element={<PedidoMarca />} />
                <Route path="/marca/creators" element={<CatalogoMarca />} />
                <Route path="/marca/creators/:slug" element={<FichaMarca />} />
              </Route>

              <Route element={<Protegido papeis={['creator']} />}>
                <Route path="/creator" element={<CreatorInicio />} />
                <Route path="/creator/perfil" element={<PerfilCreator />} />
                <Route path="/creator/trabalhos/:id" element={<TrabalhoCreator />} />
              </Route>

              <Route element={<Protegido papeis={['admin']} />}>
                <Route path="/admin" element={<AdminInicio />} />
                <Route path="/admin/creators" element={<AdminCreators />} />
                <Route path="/admin/pedidos" element={<AdminPedidos />} />
                <Route path="/admin/pedidos/:id" element={<AdminPedido />} />
                <Route path="/admin/marcas" element={<AdminMarcas />} />
              </Route>

              <Route element={<Protegido />}>
                <Route path="/mensagens" element={<Mensagens />} />
                <Route path="/conta" element={<Conta />} />
              </Route>

              <Route path="*" element={<NaoEncontrada />} />
            </Routes>
          </Suspense>
        </SessaoProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
