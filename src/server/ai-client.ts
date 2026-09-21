import { getServerConfig, isProduction } from '#/server/config'
import { describeError, log, messageRef, sessionRef } from '#/server/logger'

/**
 * ADAPTER DA APLICACAO ZENTERA — unico ponto de contato com o backend de IA.
 *
 * Toda a integracao vive aqui. A rota `/api/chat` e o frontend nao conhecem o
 * contrato da Zentera: eles falam apenas em `{ sessionId, messageId, message }`
 * e recebem `{ reply }`.
 *
 * ENDPOINT (produção, mesma VPS, apenas loopback):
 *   POST http://127.0.0.1:3001/api/integrations/generic-webhook/incoming
 *
 * Configurado em `AI_WEBHOOK_URL`. O IP publico nunca aparece no codigo.
 *
 * ---------------------------------------------------------------------------
 * REQUISICAO — o que enviamos
 * ---------------------------------------------------------------------------
 * ```json
 * {
 *   "tenantId": "empresa_demo",
 *   "platform": "generic",
 *   "channel": "web",
 *   "externalConversationId": "demo_550e8400-...",
 *   "externalMessageId": "b6f0c2a1-...",
 *   "messageText": "Quero contratar internet"
 * }
 * ```
 *
 * MAPEAMENTO
 *   sessionId  -> externalConversationId   (memoria da conversa)
 *   messageId  -> externalMessageId        (idempotencia)
 *   message    -> messageText
 *
 * A landing nao tem nome, telefone, CPF nem e-mail do visitante, entao os
 * campos opcionais de identificacao simplesmente NAO sao enviados. Nada e
 * inventado para preencher o payload.
 *
 * ---------------------------------------------------------------------------
 * RESPOSTA — o que aceitamos
 * ---------------------------------------------------------------------------
 * ```json
 * {
 *   "ok": true,
 *   "data": {
 *     "replyText": "Resposta da IA",
 *     "conversationState": "DIAGNOSING",
 *     "detectedIntent": "TECHNICAL_SUPPORT",
 *     "shouldHandoffToHuman": false,
 *     "metadata": {}
 *   }
 * }
 * ```
 *
 * So ha sucesso quando HTTP 2xx **e** `ok === true` **e** `data.replyText` e
 * uma string nao vazia. Qualquer outra coisa vira erro controlado.
 *
 * Do corpo acima, unicamente `data.replyText` atravessa para o navegador.
 * `conversationState`, `detectedIntent`, `shouldHandoffToHuman`, `provider`,
 * `fallbackUsed`, `toolCalls`, `policies`, `memory`, `observability` e o
 * restante da metadata interna ficam no servidor.
 */

export const AI_PLATFORM = 'generic'
export const AI_CHANNEL = 'web'

export type AiFailureReason =
  | 'not_configured'
  | 'timeout'
  | 'upstream_error'
  /** HTTP 2xx, mas o corpo nao segue o contrato (ok: false, sem replyText...). */
  | 'invalid_response'

export type AiResult =
  | { ok: true; reply: string; mode: 'live' | 'mock' }
  | { ok: false; reason: AiFailureReason }

const MAX_REPLY_LENGTH = 8000

/** Descreve por que um corpo 2xx foi recusado, para o log tecnico. */
type RejectReason =
  | 'not_object'
  | 'ok_false'
  | 'missing_data'
  | 'missing_reply_text'
  | 'empty_reply_text'

type Extraction =
  { ok: true; replyText: string } | { ok: false; why: RejectReason }

/**
 * Extrai `data.replyText` validando cada degrau do contrato.
 *
 * Nada aqui usa acesso otimista: um corpo fora do formato nunca vira uma bolha
 * vazia no chat.
 */
export function extractReplyText(payload: unknown): Extraction {
  if (typeof payload !== 'object' || payload === null) {
    return { ok: false, why: 'not_object' }
  }

  const envelope = payload as Record<string, unknown>

  if (envelope.ok !== true) {
    return { ok: false, why: 'ok_false' }
  }

  const data = envelope.data
  if (typeof data !== 'object' || data === null) {
    return { ok: false, why: 'missing_data' }
  }

  const replyText = (data as Record<string, unknown>).replyText
  if (typeof replyText !== 'string') {
    return { ok: false, why: 'missing_reply_text' }
  }

  const trimmed = replyText.trim()
  if (trimmed === '') {
    return { ok: false, why: 'empty_reply_text' }
  }

  return { ok: true, replyText: trimmed.slice(0, MAX_REPLY_LENGTH) }
}

/**
 * Resposta simulada, usada SOMENTE fora de producao e SOMENTE quando
 * `AI_WEBHOOK_URL` nao esta configurado. O texto se identifica como simulacao
 * para que ninguem confunda com a IA real.
 */
function mockReply(message: string): string {
  const preview = message.length > 60 ? `${message.slice(0, 60)}…` : message

  return [
    '**Modo simulado (desenvolvimento).** Nenhuma IA real respondeu a esta mensagem.',
    '',
    `Recebi: "${preview}"`,
    '',
    'Configure `AI_WEBHOOK_URL` no arquivo `.env` para conversar com a aplicação Zentera.',
  ].join('\n')
}

export interface AiRequest {
  /** Vira `externalConversationId`. Estavel durante toda a conversa. */
  sessionId: string
  /** Vira `externalMessageId`. Reutilizado nos retries — nunca gerado aqui. */
  messageId: string
  message: string
}

export async function sendToAi({
  sessionId,
  messageId,
  message,
}: AiRequest): Promise<AiResult> {
  const config = getServerConfig()
  const refs = {
    sessionRef: sessionRef(sessionId),
    messageRef: messageRef(messageId),
  }

  if (!config.aiWebhookUrl) {
    if (isProduction()) {
      log('error', { event: 'ai_not_configured', ...refs })
      return { ok: false, reason: 'not_configured' }
    }

    log('warn', { event: 'ai_mock_reply', ...refs })
    return { ok: true, reply: mockReply(message), mode: 'mock' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.aiRequestTimeoutMs)
  const startedAt = Date.now()

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    // A autenticacao da Zentera esta desativada por ora. O header so existe
    // quando `AI_WEBHOOK_SECRET` esta preenchido, entao ativar depois e so
    // preencher a variavel e reiniciar o processo.
    if (config.aiWebhookSecret) {
      headers.Authorization = `Bearer ${config.aiWebhookSecret}`
    }

    const response = await fetch(config.aiWebhookUrl, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        tenantId: config.tenantId,
        platform: AI_PLATFORM,
        channel: AI_CHANNEL,
        externalConversationId: sessionId,
        externalMessageId: messageId,
        messageText: message,
      }),
    })

    const durationMs = Date.now() - startedAt

    if (!response.ok) {
      log('error', {
        event: 'ai_upstream_status',
        ...refs,
        status: response.status,
        durationMs,
      })
      return { ok: false, reason: 'upstream_error' }
    }

    const raw = await response.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      log('error', {
        event: 'ai_invalid_json',
        ...refs,
        status: response.status,
        durationMs,
        length: raw.length,
      })
      return { ok: false, reason: 'invalid_response' }
    }

    const extracted = extractReplyText(parsed)

    if (!extracted.ok) {
      log('error', {
        event: 'ai_invalid_payload',
        ...refs,
        status: response.status,
        durationMs,
        // Apenas o degrau do contrato que falhou. O corpo nao e logado.
        code: extracted.why,
      })
      return { ok: false, reason: 'invalid_response' }
    }

    log('info', {
      event: 'ai_reply',
      ...refs,
      status: response.status,
      durationMs,
      length: extracted.replyText.length,
    })

    return { ok: true, reply: extracted.replyText, mode: 'live' }
  } catch (error) {
    const durationMs = Date.now() - startedAt
    const aborted = error instanceof Error && error.name === 'AbortError'

    log('error', {
      event: aborted ? 'ai_timeout' : 'ai_request_failed',
      ...refs,
      durationMs,
      // `describeError` mascara URLs e tokens antes de imprimir.
      reason: describeError(error),
    })

    return { ok: false, reason: aborted ? 'timeout' : 'upstream_error' }
  } finally {
    clearTimeout(timer)
  }
}
