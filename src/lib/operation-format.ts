import type { ChatMessage, OperationSnapshot } from '#/lib/types'

/**
 * Apresentacao do snapshot operacional na Visao da empresa.
 *
 * Este modulo apenas TRADUZ o que a aplicacao Zentera devolveu; nunca cria
 * informacao. Um dicionario pequeno cobre os codigos conhecidos e qualquer
 * outro codigo vira texto legivel sem ganhar significado novo:
 * `WAITING_FOR_CUSTOMER` -> `Waiting for customer`.
 *
 * O codigo original continua guardado na mensagem; so a exibicao muda.
 */

type Labels = Readonly<Record<string, string | undefined>>

const INTENT_LABELS: Labels = {
  TECHNICAL_SUPPORT: 'Suporte técnico',
  SALES: 'Comercial',
  NEW_CONTRACT: 'Contratação',
  BILLING: 'Financeiro',
  CANCELLATION: 'Cancelamento',
  GENERAL_INQUIRY: 'Dúvida geral',
}

const STATE_LABELS: Labels = {
  GREETING: 'Saudação',
  DIAGNOSING: 'Diagnóstico',
  QUALIFYING: 'Qualificação',
  WAITING_CUSTOMER: 'Aguardando cliente',
  HANDOFF: 'Encaminhamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Encerrado',
}

/** Estados que, quando informados pela aplicacao, indicam fim do atendimento. */
const CLOSED_STATES = new Set(['RESOLVED', 'CLOSED'])

/** Parece um codigo (`SNAKE_CASE`, `kebab-case`, `dot.case`)? */
const CODE_LIKE = /^[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$/

function normalizeKey(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s.-]+/g, '_')
}

/** Fallback seguro: so torna o codigo legivel, sem traduzir significado. */
export function humanizeCode(code: string): string {
  if (!CODE_LIKE.test(code)) return code

  const words = code
    .split(/[_.-]+/)
    .join(' ')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function formatIntent(code: string): string {
  return INTENT_LABELS[normalizeKey(code)] ?? humanizeCode(code)
}

export function formatState(code: string): string {
  return STATE_LABELS[normalizeKey(code)] ?? humanizeCode(code)
}

export function formatHandoff(handoff: boolean): string {
  return handoff ? 'Recomendado' : 'Não necessário no momento'
}

export function isClosedState(state: string | undefined): boolean {
  return state !== undefined && CLOSED_STATES.has(normalizeKey(state))
}

/** Duracao aproximada entre a primeira e a ultima mensagem. */
export function formatDuration(ms: number): string {
  const minutes = Math.round(Math.max(0, ms) / 60_000)

  if (minutes < 1) return 'menos de 1 minuto'
  if (minutes === 1) return 'cerca de 1 minuto'
  if (minutes < 60) return `cerca de ${minutes} minutos`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `cerca de ${hours} h` : `cerca de ${hours} h ${rest} min`
}

/** O que um turno do assistente mudou na leitura operacional. */
export interface OperationChange {
  /** Presentes apenas quando mudaram neste turno. */
  intent?: string
  state?: string
  handoff?: boolean
  /** Itens de contexto que aparecem pela primeira vez neste turno. */
  newContext: Array<string>
  /** Acoes que aparecem pela primeira vez neste turno. */
  newActions: Array<string>
  /** `true` quando o handoff passou a ser recomendado neste turno. */
  handoffRaised: boolean
  /** Leitura acumulada logo apos este turno. */
  snapshot: OperationSnapshot
}

export interface TimelineEntry {
  message: ChatMessage
  /** `null` quando o turno nao trouxe nada novo (ou nao trouxe `operation`). */
  change: OperationChange | null
}

export interface OperationTimeline {
  entries: Array<TimelineEntry>
  /**
   * Ultimo valor INFORMADO de cada campo ao longo da conversa. Um campo que a
   * aplicacao nunca devolveu simplesmente nao existe aqui.
   */
  current: OperationSnapshot
}

/**
 * Deriva a leitura operacional das proprias mensagens.
 *
 * Funcao pura: nao busca nada, nao guarda nada. Por isso alternar entre as
 * visoes e instantaneo e nunca dispara requisicao.
 */
export function buildOperationTimeline(
  messages: Array<ChatMessage>,
): OperationTimeline {
  let current: OperationSnapshot = {}
  const seenContext = new Set<string>()
  const seenActions = new Set<string>()

  const entries = messages.map((message): TimelineEntry => {
    const operation =
      message.role === 'assistant' ? message.operation : undefined
    if (!operation) return { message, change: null }

    const previous = current

    const newContext = (operation.context ?? []).filter(
      (item) => !seenContext.has(item),
    )
    for (const item of newContext) seenContext.add(item)

    const newActions = (operation.actions ?? []).filter(
      (item) => !seenActions.has(item),
    )
    for (const item of newActions) seenActions.add(item)

    current = {
      ...previous,
      ...operation,
      context:
        seenContext.size > 0 ? Array.from(seenContext) : previous.context,
      actions:
        seenActions.size > 0 ? Array.from(seenActions) : previous.actions,
    }

    const change: OperationChange = {
      intent:
        operation.intent !== previous.intent ? operation.intent : undefined,
      state: operation.state !== previous.state ? operation.state : undefined,
      handoff:
        operation.handoff !== previous.handoff ? operation.handoff : undefined,
      newContext,
      newActions,
      handoffRaised: operation.handoff === true && previous.handoff !== true,
      snapshot: current,
    }

    const changed =
      change.intent !== undefined ||
      change.state !== undefined ||
      change.handoff !== undefined ||
      newContext.length > 0 ||
      newActions.length > 0

    return { message, change: changed ? change : null }
  })

  return { entries, current }
}
