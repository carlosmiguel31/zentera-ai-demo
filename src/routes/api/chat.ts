import { createFileRoute } from '@tanstack/react-router'

import {
  isValidMessageId,
  isValidSessionId,
  validateMessage,
} from '#/lib/validation'
import { sendToAi } from '#/server/ai-client'
import { getServerConfig } from '#/server/config'
import { log, sessionRef } from '#/server/logger'
import {
  checkRateLimit,
  consumeDemoQuota,
  getClientIp,
} from '#/server/rate-limit'
import { DEMO_MODE_HEADER } from '#/lib/types'
import type {
  ChatErrorCode,
  ChatErrorResponse,
  ChatSuccessResponse,
} from '#/lib/types'

/**
 * `POST /api/chat` — unica ponte entre o navegador e a IA.
 *
 * O navegador jamais fala com o provedor de IA. Ele chama esta rota, que roda
 * no servidor Node, valida tudo de novo, aplica rate limit e limite comercial,
 * e so entao aciona o adapter em `src/server/ai-client.ts`.
 *
 * Nenhuma resposta desta rota contem stack trace, URL interna, variavel de
 * ambiente ou erro bruto do provedor. O visitante recebe apenas um `code`
 * estavel e uma frase em portugues.
 *
 * No sucesso o corpo e estritamente `{ reply }`: a metadata interna da
 * aplicacao Zentera para no servidor.
 */

/** Textos exibidos ao visitante. Sao os unicos detalhes que saem do servidor. */
const MESSAGES: Record<ChatErrorCode, string> = {
  invalid_body: 'Não conseguimos ler sua mensagem. Tente novamente.',
  invalid_message: 'Escreva uma mensagem antes de enviar.',
  invalid_message_id:
    'Não conseguimos identificar sua mensagem. Tente novamente.',
  message_too_long: 'Sua mensagem é muito longa para esta demonstração.',
  rate_limited:
    'Você enviou muitas mensagens em pouco tempo. Aguarde alguns segundos e tente novamente.',
  demo_limit_reached: 'Você chegou ao final desta demonstração.',
  demo_unavailable: 'A demonstração está temporariamente indisponível.',
  upstream_timeout:
    'A resposta está demorando mais que o esperado. Tente novamente em alguns instantes.',
  upstream_error: 'Não conseguimos falar com a IA agora. Tente novamente.',
}

const STATUS: Record<ChatErrorCode, number> = {
  invalid_body: 400,
  invalid_message: 400,
  invalid_message_id: 400,
  message_too_long: 413,
  rate_limited: 429,
  demo_limit_reached: 429,
  demo_unavailable: 503,
  upstream_timeout: 504,
  upstream_error: 502,
}

function fail(
  code: ChatErrorCode,
  extraHeaders?: Record<string, string>,
): Response {
  const body: ChatErrorResponse = {
    error: { code, message: MESSAGES[code] },
  }

  return Response.json(body, {
    status: STATUS[code],
    headers: { 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const config = getServerConfig()

        // 1. Corpo precisa ser JSON valido.
        let payload: unknown
        try {
          payload = await request.json()
        } catch {
          return fail('invalid_body')
        }

        if (typeof payload !== 'object' || payload === null) {
          return fail('invalid_body')
        }

        const body = payload as Record<string, unknown>

        // 2. sessionId precisa ter o formato que o cliente gera.
        if (!isValidSessionId(body.sessionId)) {
          return fail('invalid_body')
        }
        const sessionId = body.sessionId
        const ref = sessionRef(sessionId)

        // 2b. messageId identifica a mensagem do visitante e torna o retry
        //     idempotente do ponto de vista da cota comercial.
        if (!isValidMessageId(body.messageId)) {
          return fail('invalid_message_id')
        }
        const messageId = body.messageId

        // 3. Mensagem: string, nao vazia, dentro do limite.
        const validated = validateMessage(
          body.message,
          config.demoMaxMessageLength,
        )
        if (!validated.ok) {
          return fail(validated.reason)
        }

        // 4. Rate limit por IP + sessao. O sessionId sozinho nao e confiavel.
        const ip = getClientIp(request)
        const limit = checkRateLimit({
          ip,
          sessionId,
          max: config.rateLimitMax,
          windowMs: config.rateLimitWindowMs,
        })

        if (!limit.allowed) {
          log('warn', { event: 'rate_limited', sessionRef: ref })
          return fail('rate_limited', {
            'Retry-After': String(limit.retryAfterSeconds),
          })
        }

        // 5. Limite comercial da demonstracao.
        //
        //    Validado no servidor porque a contagem do navegador pode ser
        //    manipulada, e idempotente por `messageId`: um retry da mesma
        //    mensagem nao debita a cota de novo.
        const quota = consumeDemoQuota({
          ip,
          sessionId,
          messageId,
          message: validated.message,
          max: config.demoMaxMessages,
        })

        if (quota.outcome === 'conflict') {
          log('warn', {
            event: 'message_id_conflict',
            sessionRef: ref,
            code: 'invalid_message_id',
          })
          return fail('invalid_message_id')
        }

        if (quota.outcome === 'exhausted') {
          log('info', { event: 'demo_limit_reached', sessionRef: ref })
          return fail('demo_limit_reached')
        }

        if (quota.outcome === 'already_counted') {
          log('info', { event: 'quota_retry_free', sessionRef: ref })
        }

        // 6. Adapter da aplicacao Zentera.
        //
        //    `messageId` segue como `externalMessageId`, o que permite a
        //    idempotencia do lado da Zentera tambem. Nenhum ID novo e gerado.
        const result = await sendToAi({
          sessionId,
          messageId,
          message: validated.message,
        })

        if (!result.ok) {
          // `invalid_response` (corpo fora do contrato) tambem vira
          // `upstream_error`: para o visitante, a diferenca nao importa.
          const code: ChatErrorCode =
            result.reason === 'not_configured'
              ? 'demo_unavailable'
              : result.reason === 'timeout'
                ? 'upstream_timeout'
                : 'upstream_error'

          return fail(code)
        }

        const success: ChatSuccessResponse = { reply: result.reply }

        const headers: Record<string, string> = { 'Cache-Control': 'no-store' }
        if (result.mode === 'mock') headers[DEMO_MODE_HEADER] = 'mock'

        return Response.json(success, { headers })
      },

      // Qualquer outro verbo recebe uma negativa curta, sem detalhes.
      GET: async () =>
        new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        }),
    },
  },
})
