import type { OperationSnapshot } from '#/lib/types'

/**
 * ALLOWLIST do snapshot operacional.
 *
 * Compartilhada entre servidor e navegador:
 * - o servidor aplica antes de responder `/api/chat`;
 * - o navegador reaplica ao receber a resposta e ao restaurar o historico do
 *   `sessionStorage` (defesa em profundidade: o storage pode ser editado).
 *
 * Regras:
 * - somente as chaves de `OperationSnapshot` sao lidas, e o objeto devolvido
 *   e sempre NOVO: nenhuma chave extra sobrevive;
 * - cada valor e validado por tipo, tamanho e quantidade;
 * - valores invalidos sao ignorados em silencio, nunca trocados por palpite.
 */

export const OPERATION_LIMITS = {
  /** Codigos como `DIAGNOSING` ou `TECHNICAL_SUPPORT`. */
  codeLength: 64,
  /** Textos curtos, como o setor de encaminhamento. */
  shortTextLength: 80,
  /** Motivo do encaminhamento e proxima acao. */
  textLength: 280,
  summaryLength: 600,
  listItems: 6,
  listItemLength: 160,
  /** Quantos itens de uma lista chegam a ser examinados. */
  listScan: 30,
} as const

/** Letras (inclusive acentuadas), numeros, espaco, `_`, `.` e `-`. */
const CODE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Texto de uma linha: sem caracteres de controle e com espacos colapsados. */
function cleanText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined

  const normalized = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (normalized === '') return undefined
  if (normalized.length <= maxLength) return normalized

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

/** Codigo curto e "limpo". Fora do formato, e descartado (nao corrigido). */
function cleanCode(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  if (trimmed.length > OPERATION_LIMITS.codeLength) return undefined

  return CODE_PATTERN.test(trimmed) ? trimmed : undefined
}

/** Lista de textos curtos, sem duplicatas e com quantidade limitada. */
function cleanList(value: unknown): Array<string> | undefined {
  if (!Array.isArray(value)) return undefined

  const candidates: Array<unknown> = value.slice(0, OPERATION_LIMITS.listScan)
  const items: Array<string> = []

  for (const candidate of candidates) {
    const text = cleanText(candidate, OPERATION_LIMITS.listItemLength)
    if (text !== undefined && !items.includes(text)) items.push(text)
    if (items.length >= OPERATION_LIMITS.listItems) break
  }

  return items.length > 0 ? items : undefined
}

/**
 * Monta um `OperationSnapshot` a partir de um objeto qualquer.
 *
 * Devolve `undefined` quando nada valido sobra, para que mensagens sem dados
 * operacionais continuem exatamente como eram.
 */
export function sanitizeOperation(
  input: unknown,
): OperationSnapshot | undefined {
  if (!isRecord(input)) return undefined

  const candidate: OperationSnapshot = {
    state: cleanCode(input.state),
    intent: cleanCode(input.intent),
    handoff: typeof input.handoff === 'boolean' ? input.handoff : undefined,
    summary: cleanText(input.summary, OPERATION_LIMITS.summaryLength),
    context: cleanList(input.context),
    actions: cleanList(input.actions),
    handoffReason: cleanText(input.handoffReason, OPERATION_LIMITS.textLength),
    department: cleanText(input.department, OPERATION_LIMITS.shortTextLength),
    nextAction: cleanText(input.nextAction, OPERATION_LIMITS.textLength),
  }

  // Descarta chaves vazias: nada de `undefined` trafegando ou persistido.
  const entries = Object.entries(candidate).filter(
    ([, value]) => value !== undefined,
  )

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}
