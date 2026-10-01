import { EventEmitter } from 'node:events'

// Canal interno para empurrar novidades em tempo real (SSE). Um servidor só,
// então a memória do processo basta.
const bus = new EventEmitter()
bus.setMaxListeners(0)

export type Evento =
  | { tipo: 'mensagem'; conversaId: string; mensagem: unknown }
  | { tipo: 'entrega'; conversaId: string; mensagemId: string; status: string }
  | { tipo: 'aviso'; texto: string; link?: string | null }
  | { tipo: 'pedido'; pedidoId: string }

export function emitirParaUsuario(usuarioId: string, evento: Evento) {
  bus.emit(`u:${usuarioId}`, evento)
}

export function ouvirUsuario(usuarioId: string, fn: (e: Evento) => void) {
  bus.on(`u:${usuarioId}`, fn)
  return () => {
    bus.off(`u:${usuarioId}`, fn)
  }
}
