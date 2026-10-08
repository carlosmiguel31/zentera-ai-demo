import { ArrowRight } from 'lucide-react'

import { CONTACT_URL } from '#/config/site'
import { track } from '#/lib/analytics'

/** Fim da demonstracao: encerra o teste e leva para a conversa comercial. */
export function DemoLimitNotice() {
  return (
    <div className="rounded-(--radius-card) border border-zen-400/30 bg-surface-2 p-5 text-center shadow-[var(--shadow-card)] sm:p-6">
      <p className="font-display text-[1.0625rem] font-semibold text-fg">
        Você chegou ao final desta demonstração.
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-fg-muted">
        Quer ver como um agente como este pode funcionar na sua operação?
      </p>

      <a
        href={CONTACT_URL}
        onClick={() => track('contact_cta_clicked', { source: 'demo_limit' })}
        className="zen-btn zen-btn-primary mt-5 min-h-11 px-5"
      >
        Falar com a Zentera Virtua
        <ArrowRight className="size-4" aria-hidden="true" />
      </a>
    </div>
  )
}
