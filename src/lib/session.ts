import { DEMO, SESSION_STORAGE_KEYS } from '#/config/site'
import type { ChatMessage } from '#/lib/types'

/**
 * Identidade e historico da demonstracao.
 *
 * A sessao existe apenas no navegador e apenas em `sessionStorage`:
 * - um refresh preserva a conversa;
 * - outra aba comeca uma sessao propria;
 * - fechar a aba descarta tudo.
 *
 * Nenhum dado pessoal (e-mail, telefone, IP) entra no identificador.
 */

/**
 * O TypeScript assume que `crypto` sempre existe. Na pratica, navegadores
 * antigos e contextos nao seguros podem nao expor a Web Crypto, entao o acesso
 * passa por aqui com o tipo correto.
 */
function getWebCrypto(): Crypto | undefined {
  const globals: Record<string, unknown> = globalThis
  const candidate = globals.crypto
  return typeof candidate === 'object' && candidate !== null
    ? (candidate as Crypto)
    : undefined
}

function randomId(): string {
  const webCrypto = getWebCrypto()

  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID()
  }

  if (typeof webCrypto?.getRandomValues === 'function') {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (byte: number) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Ultimo recurso: ambientes sem Web Crypto.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`
}

export function createSessionId(): string {
  return `demo_${randomId()}`
}

export function createMessageId(): string {
  return randomId()
}

function safeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    // Modo privado / storage bloqueado: a demonstracao segue sem persistencia.
    return null
  }
}

/** Recupera a sessao da aba atual ou cria uma nova. */
export function loadOrCreateSessionId(): string {
  const store = safeSessionStorage()
  const existing = store?.getItem(SESSION_STORAGE_KEYS.sessionId)
  if (existing) return existing

  const created = createSessionId()
  store?.setItem(SESSION_STORAGE_KEYS.sessionId, created)
  return created
}

export function persistSessionId(sessionId: string): void {
  safeSessionStorage()?.setItem(SESSION_STORAGE_KEYS.sessionId, sessionId)
}

function historyKey(sessionId: string): string {
  return `${SESSION_STORAGE_KEYS.history}:${sessionId}`
}

/** Valida um item vindo do storage antes de confiar nele. */
function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false

  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.content === 'string' &&
    typeof record.createdAt === 'number' &&
    (record.role === 'user' || record.role === 'assistant')
  )
}

interface StoredHistory {
  messages: Array<ChatMessage>
  userMessageCount: number
}

export function loadHistory(sessionId: string): StoredHistory {
  const empty: StoredHistory = { messages: [], userMessageCount: 0 }
  const store = safeSessionStorage()
  if (!store) return empty

  try {
    const raw = store.getItem(historyKey(sessionId))
    if (!raw) return empty

    const parsed: unknown = JSON.parse(raw)
    const candidates: unknown =
      typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>).messages
        : undefined

    if (!Array.isArray(candidates)) return empty

    const messages = candidates.filter(isChatMessage)

    const userMessageCount = messages.filter((m) => m.role === 'user').length

    return { messages, userMessageCount }
  } catch {
    return empty
  }
}

export function saveHistory(
  sessionId: string,
  messages: Array<ChatMessage>,
): void {
  const store = safeSessionStorage()
  if (!store) return

  try {
    const trimmed = messages.slice(-DEMO.maxStoredMessages)
    store.setItem(
      historyKey(sessionId),
      JSON.stringify({ messages: trimmed } satisfies Pick<
        StoredHistory,
        'messages'
      >),
    )
  } catch {
    // Cota estourada: o historico em memoria continua valido.
  }
}

export function clearHistory(sessionId: string): void {
  try {
    safeSessionStorage()?.removeItem(historyKey(sessionId))
  } catch {
    // Silencioso de proposito: limpar historico nunca deve quebrar a pagina.
  }
}
