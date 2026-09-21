/**
 * Configuracao PUBLICA do projeto.
 *
 * Tudo aqui chega ao navegador. Nenhum segredo pode ser adicionado neste
 * arquivo. Variaveis de ambiente lidas aqui usam obrigatoriamente o prefixo
 * `VITE_`, que e a convencao do Vite/TanStack Start para valores publicos.
 * Segredos ficam apenas em `src/server/config.ts`.
 */

function publicEnv(key: string): string | undefined {
  const value = import.meta.env[key as keyof ImportMetaEnv]
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined
}

function publicNumber(key: string, fallback: number): number {
  const raw = publicEnv(key)
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

/** URL onde esta demonstracao sera publicada (canonical / Open Graph). */
export const SITE_URL =
  publicEnv('VITE_PUBLIC_SITE_URL') ?? 'https://teste.zenteravirtua.com.br'

/** Site institucional da Zentera Virtua. */
export const MAIN_SITE_URL =
  publicEnv('VITE_PUBLIC_MAIN_SITE_URL') ?? 'https://zenteravirtua.com.br'

/** Destino comercial de todos os CTAs de contato. */
export const CONTACT_URL = `${MAIN_SITE_URL}/#contato`
export const PRIVACY_URL = `${MAIN_SITE_URL}/politica-de-privacidade`
export const TERMS_URL = `${MAIN_SITE_URL}/termos-de-uso`

export const BRAND = {
  name: 'Zentera Virtua',
  agentName: 'Zentera IA',
  tagline: 'Desenvolvido para um atendimento ágil, autônomo e inteligente.',
} as const

/**
 * Limites da demonstracao.
 *
 * O servidor tambem aplica esses limites (ver `src/server/config.ts`). Os
 * valores aqui sao apenas para a experiencia do visitante; mantenha
 * `VITE_DEMO_MAX_MESSAGES` e `DEMO_MAX_MESSAGES` com o mesmo valor.
 */
export const DEMO = {
  /** Mensagens que o visitante pode enviar por sessao. */
  maxUserMessages: publicNumber('VITE_DEMO_MAX_MESSAGES', 15),
  /** Tamanho maximo de cada mensagem, em caracteres. */
  maxMessageLength: publicNumber('VITE_DEMO_MAX_MESSAGE_LENGTH', 1500),
  /** Mensagens mantidas no historico local da sessao. */
  maxStoredMessages: 30,
  /** Guarda do lado do cliente; o timeout real e aplicado no servidor. */
  clientTimeoutMs: 35_000,
} as const

export const SESSION_STORAGE_KEYS = {
  sessionId: 'zentera-demo-session-id',
  history: 'zentera-demo-history',
} as const

export const THEME_STORAGE_KEY = 'zentera-demo-theme'

export const NAV_ANCHORS = {
  home: '#inicio',
  demo: '#teste',
  capabilities: '#capacidades',
  contact: '#contato',
} as const
