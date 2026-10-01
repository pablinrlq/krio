// Contatos da KRIÔ. Preencha quando o cliente enviar os dados:
// - whatsapp: só números, com DDI e DDD (ex.: "5531999999999").
//   Vazio, o WhatsApp abre e pede para escolher o contato.
// - instagram / email: vazios ficam escondidos no rodapé.
export const CONTATO = {
  whatsapp: '',
  instagram: '',
  email: '',
}

export function linkWhatsApp(mensagem: string) {
  const texto = encodeURIComponent(mensagem)
  return CONTATO.whatsapp
    ? `https://wa.me/${CONTATO.whatsapp}?text=${texto}`
    : `https://wa.me/?text=${texto}`
}
