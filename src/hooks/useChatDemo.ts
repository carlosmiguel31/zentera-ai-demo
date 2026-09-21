import { useCallback, useEffect, useRef, useState } from 'react'

import { DEMO } from '#/config/site'
import { track } from '#/lib/analytics'
import {
  clearHistory,
  createMessageId,
  createSessionId,
  loadHistory,
  loadOrCreateSessionId,
  persistSessionId,
  saveHistory,
} from '#/lib/session'
import { validateMessage } from '#/lib/validation'
import { DEMO_MODE_HEADER, isChatError } from '#/lib/types'
import type { ChatErrorCode, ChatMessage, ChatResponse } from '#/lib/types'

export interface ChatError {
  code: ChatErrorCode | 'network'
  message: string
  /** `true` quando faz sentido oferecer "Tentar novamente". */
  retryable: boolean
}

const NETWORK_ERROR: ChatError = {
  code: 'network',
  message: 'Não conseguimos falar com a IA agora. Tente novamente.',
  retryable: true,
}

const TIMEOUT_ERROR: ChatError = {
  code: 'upstream_timeout',
  message:
    'A resposta está demorando mais que o esperado. Tente novamente em alguns instantes.',
  retryable: true,
}

/**
 * A mensagem que aguarda confirmacao do servidor.
 *
 * O `id` e o mesmo da bolha ja desenhada na tela e viaja como `messageId`. O
 * retry reenvia exatamente este par, entao o servidor reconhece a repeticao e
 * nao debita a cota comercial outra vez.
 */
interface PendingMessage {
  id: string
  content: string
}

const RETRYABLE_CODES: Array<ChatErrorCode> = [
  'upstream_error',
  'upstream_timeout',
  'rate_limited',
  'demo_unavailable',
]

export interface ChatDemoController {
  sessionId: string
  messages: Array<ChatMessage>
  draft: string
  isSending: boolean
  error: ChatError | null
  /** Mensagens que o visitante ainda pode enviar nesta sessao. */
  remaining: number
  limitReached: boolean
  /** `mock` indica que nenhuma IA real respondeu (apenas desenvolvimento). */
  mode: 'live' | 'mock' | null
  hasConversation: boolean
  setDraft: (value: string) => void
  send: (text: string, origin?: 'composer' | 'suggestion') => void
  retryLast: () => void
  startNewConversation: () => void
  dismissError: () => void
}

/**
 * Toda a maquina de estado do chat de demonstracao.
 *
 * Mantem sessao, historico local, envio, erros, timeout e o limite comercial
 * de mensagens. O componente `ChatDemo` cuida apenas da apresentacao.
 */
export function useChatDemo(): ChatDemoController {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Array<ChatMessage>>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [mode, setMode] = useState<'live' | 'mock' | null>(null)

  const sessionRef = useRef('')
  const pendingRef = useRef<PendingMessage | null>(null)
  const inFlightRef = useRef(false)
  const startedRef = useRef(false)

  // Sessao e historico existem somente no navegador.
  useEffect(() => {
    const id = loadOrCreateSessionId()
    const stored = loadHistory(id)

    sessionRef.current = id
    setSessionId(id)
    setMessages(stored.messages)
    setUserMessageCount(stored.userMessageCount)
  }, [])

  useEffect(() => {
    if (sessionId !== '' && messages.length > 0) {
      saveHistory(sessionId, messages)
    }
  }, [sessionId, messages])

  /** Faz a chamada a `/api/chat` e traduz a resposta em estado da interface. */
  const deliver = useCallback(async (pending: PendingMessage) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DEMO.clientTimeoutMs)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId: sessionRef.current,
          messageId: pending.id,
          message: pending.content,
          metadata: { source: 'zentera-ai-demo' },
        }),
      })

      let payload: ChatResponse | null = null
      try {
        payload = (await response.json()) as ChatResponse
      } catch {
        payload = null
      }

      if (payload === null) {
        setError(NETWORK_ERROR)
        return
      }

      if (isChatError(payload)) {
        const { code, message: text } = payload.error
        setError({
          code,
          message: text,
          retryable: RETRYABLE_CODES.includes(code),
        })
        if (code === 'demo_limit_reached') {
          setUserMessageCount(DEMO.maxUserMessages)
        }
        return
      }

      // O corpo agora traz apenas `reply`. O selo de simulacao vem no header,
      // presente somente em desenvolvimento.
      setMode(
        response.headers.get(DEMO_MODE_HEADER) === 'mock' ? 'mock' : 'live',
      )
      pendingRef.current = null

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: payload.reply,
          createdAt: Date.now(),
        },
      ])
    } catch (cause) {
      const aborted = cause instanceof Error && cause.name === 'AbortError'
      setError(aborted ? TIMEOUT_ERROR : NETWORK_ERROR)
    } finally {
      clearTimeout(timer)
      inFlightRef.current = false
      setIsSending(false)
    }
  }, [])

  const send = useCallback(
    (text: string, origin: 'composer' | 'suggestion' = 'composer') => {
      // Guarda contra clique duplo / Enter repetido.
      if (inFlightRef.current || sessionRef.current === '') return
      if (userMessageCount >= DEMO.maxUserMessages) return

      const validated = validateMessage(text, DEMO.maxMessageLength)
      if (!validated.ok) {
        if (validated.reason === 'message_too_long') {
          setError({
            code: 'message_too_long',
            message: `Sua mensagem passou de ${DEMO.maxMessageLength} caracteres. Reduza um pouco e envie novamente.`,
            retryable: false,
          })
        }
        return
      }

      if (!startedRef.current) {
        startedRef.current = true
        track('demo_started')
      }
      track('message_sent', { source: origin, index: userMessageCount + 1 })

      const pending: PendingMessage = {
        id: createMessageId(),
        content: validated.message,
      }

      pendingRef.current = pending
      inFlightRef.current = true

      setMessages((current) => [
        ...current,
        {
          id: pending.id,
          role: 'user',
          content: pending.content,
          createdAt: Date.now(),
        },
      ])
      setUserMessageCount((count) => count + 1)
      setDraft('')
      setError(null)
      setIsSending(true)

      void deliver(pending)
    },
    [deliver, userMessageCount],
  )

  const retryLast = useCallback(() => {
    const pending = pendingRef.current
    if (pending === null || inFlightRef.current) return

    setError(null)
    setIsSending(true)
    inFlightRef.current = true
    void deliver(pending)
  }, [deliver])

  const startNewConversation = useCallback(() => {
    if (inFlightRef.current) return

    if (sessionRef.current !== '') clearHistory(sessionRef.current)

    const nextId = createSessionId()
    persistSessionId(nextId)
    sessionRef.current = nextId

    setSessionId(nextId)
    setMessages([])
    setUserMessageCount(0)
    setDraft('')
    setError(null)
    setMode(null)
    pendingRef.current = null
    startedRef.current = false

    track('new_conversation')
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  const remaining = Math.max(0, DEMO.maxUserMessages - userMessageCount)
  const limitReached = userMessageCount >= DEMO.maxUserMessages

  useEffect(() => {
    if (limitReached) track('demo_limit_reached')
  }, [limitReached])

  return {
    sessionId,
    messages,
    draft,
    isSending,
    error,
    remaining,
    limitReached,
    mode,
    hasConversation: messages.length > 0,
    setDraft,
    send,
    retryLast,
    startNewConversation,
    dismissError,
  }
}
