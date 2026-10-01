import { useSessao } from './sessao'

// Para onde os botões do site levam: quem já tem conta vai direto ao painel;
// quem não tem passa pelo cadastro, que repassa as escolhas para o briefing.
export function useDestinos() {
  const { usuario } = useSessao()
  const qs = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString()
    return p ? `?${p}` : ''
  }
  return {
    marca: (q: { pacote?: string; nicho?: string; modalidade?: string } = {}) =>
      usuario?.papel === 'marca' ? `/marca/novo${qs(q)}` : usuario ? '/painel' : `/cadastro${qs({ papel: 'marca', ...q })}`,
    creator: () => (usuario?.papel === 'creator' ? '/creator/perfil' : usuario ? '/painel' : '/cadastro?papel=creator'),
  }
}
