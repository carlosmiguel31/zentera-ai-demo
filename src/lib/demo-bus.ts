/**
 * Ponte minima entre as secoes da pagina e o chat.
 *
 * Os cards de capacidades e o CTA final precisam falar com o chat, que e um
 * componente irmao. Em vez de subir todo o estado da conversa para a rota, um
 * emissor de eventos de 12 linhas resolve o caso sem dependencia externa.
 */

export type DemoCommand =
  { type: 'prefill'; text: string; category?: string } | { type: 'restart' }

type Listener = (command: DemoCommand) => void

const listeners = new Set<Listener>()

export function onDemoCommand(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function sendDemoCommand(command: DemoCommand): void {
  for (const listener of listeners) listener(command)
}
