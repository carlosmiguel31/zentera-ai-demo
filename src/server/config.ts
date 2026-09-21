/**
 * Configuracao PRIVADA (somente servidor).
 *
 * Este modulo e importado apenas por `src/server/*` e pela rota
 * `src/routes/api/chat.ts`. Nenhum valor daqui pode ser importado por um
 * componente do cliente: `AI_WEBHOOK_URL`, `AI_WEBHOOK_SECRET` e
 * `ZENTERA_DEMO_TENANT_ID` nunca entram no bundle do navegador.
 *
 * As variaveis sao lidas por requisicao (via `process.env`), entao mudar o
 * `.env` da VPS e reiniciar o processo ja aplica os novos valores, sem rebuild.
 */

function env(key: string): string | undefined {
  const value = process.env[key]
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined
}

function envNumber(key: string, fallback: number): number {
  const raw = env(key)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

export interface ServerConfig {
  /**
   * Endpoint da aplicacao Zentera. Vazio = demonstracao nao configurada.
   * Em producao: `http://127.0.0.1:3001/api/integrations/generic-webhook/incoming`
   */
  aiWebhookUrl: string | undefined
  /**
   * Enviado como `Authorization: Bearer ...` somente se existir.
   * A autenticacao do webhook Zentera sera ativada antes da publicacao.
   */
  aiWebhookSecret: string | undefined
  /** `tenantId` exigido pelo contrato da aplicacao Zentera. */
  tenantId: string
  aiRequestTimeoutMs: number
  demoMaxMessages: number
  demoMaxMessageLength: number
  rateLimitMax: number
  rateLimitWindowMs: number
}

export function getServerConfig(): ServerConfig {
  return {
    aiWebhookUrl: env('AI_WEBHOOK_URL'),
    aiWebhookSecret: env('AI_WEBHOOK_SECRET'),
    tenantId: env('ZENTERA_DEMO_TENANT_ID') ?? 'empresa_demo',
    aiRequestTimeoutMs: envNumber('AI_REQUEST_TIMEOUT_MS', 30_000),
    demoMaxMessages: envNumber('DEMO_MAX_MESSAGES', 15),
    demoMaxMessageLength: envNumber('DEMO_MAX_MESSAGE_LENGTH', 1500),
    rateLimitMax: envNumber('DEMO_RATE_LIMIT_MAX', 20),
    rateLimitWindowMs: envNumber('DEMO_RATE_LIMIT_WINDOW_MS', 600_000),
  }
}
