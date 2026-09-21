/**
 * Camada neutra de analytics.
 *
 * Hoje nao envia nada para lugar nenhum. Existe para que a instrumentacao
 * futura (GA4, Plausible, Umami, PostHog...) seja adicionada em um unico
 * lugar, sem tocar nos componentes.
 *
 * REGRA: o conteudo das mensagens NUNCA e enviado para analytics.
 */

export type AnalyticsEvent =
  | 'demo_started'
  | 'message_sent'
  | 'suggestion_clicked'
  | 'demo_limit_reached'
  | 'contact_cta_clicked'
  | 'new_conversation'
  | 'theme_changed'

/** Apenas metadados agregados. Nada de texto livre do visitante. */
export interface AnalyticsPayload {
  source?: string
  index?: number
  category?: string
  value?: number
  theme?: 'light' | 'dark'
  status?: string
}

type AnalyticsSink = (event: AnalyticsEvent, payload?: AnalyticsPayload) => void

let sink: AnalyticsSink | null = null

/**
 * Conecta um destino real de analytics.
 *
 * Exemplo de uso futuro, em `__root.tsx`:
 *
 * ```ts
 * setAnalyticsSink((event, payload) => {
 *   window.plausible?.(event, { props: payload })
 * })
 * ```
 */
export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next
}

export function track(event: AnalyticsEvent, payload?: AnalyticsPayload): void {
  if (typeof window === 'undefined') return

  try {
    sink?.(event, payload)
  } catch {
    // Analytics nunca pode derrubar a experiencia do visitante.
  }
}
