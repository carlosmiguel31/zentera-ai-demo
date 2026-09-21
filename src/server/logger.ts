/**
 * Log tecnico do servidor.
 *
 * PRIVACIDADE: o conteudo das mensagens nunca e registrado. Apenas um prefixo
 * curto do sessionId, o codigo do evento e metricas agregadas. URLs internas e
 * segredos sao removidos antes de imprimir.
 */

type LogLevel = 'info' | 'warn' | 'error'

export interface LogFields {
  event: string
  sessionRef?: string
  messageRef?: string
  code?: string
  status?: number
  durationMs?: number
  length?: number
  reason?: string
}

/** Reduz o sessionId a um prefixo curto para correlacionar logs. */
export function sessionRef(sessionId: string): string {
  return sessionId.slice(0, 13)
}

/** Idem para o messageId, que vira `externalMessageId` na Zentera. */
export function messageRef(messageId: string): string {
  return messageId.slice(0, 8)
}

function redact(value: string): string {
  return value
    .replace(/https?:\/\/[^\s]+/gi, '[url]')
    .replace(/(bearer|token|secret|key)[=:\s"']+[^\s"']+/gi, '$1 [redacted]')
    .slice(0, 300)
}

export function log(level: LogLevel, fields: LogFields): void {
  const line = {
    at: new Date().toISOString(),
    scope: 'zentera-ai-demo',
    ...fields,
    reason: fields.reason ? redact(fields.reason) : undefined,
  }

  const serialized = JSON.stringify(line)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else console.log(serialized)
}

/** Extrai uma mensagem curta e segura de um erro desconhecido. */
export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  if (typeof error === 'string') return error
  return 'unknown_error'
}
