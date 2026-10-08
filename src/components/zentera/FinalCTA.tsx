import { ArrowRight } from 'lucide-react'

import { CONTACT_URL, NAV_ANCHORS } from '#/config/site'
import { track } from '#/lib/analytics'
import { sendDemoCommand } from '#/lib/demo-bus'

export function FinalCTA() {
  /**
   * "Testar novamente" volta para o chat. A nova conversa so acontece depois
   * da confirmacao do visitante quando ja existe historico — quem decide isso
   * e o proprio `ChatDemo`, que recebe este comando.
   */
  function handleRestart() {
    document.querySelector(NAV_ANCHORS.demo)?.scrollIntoView({ block: 'start' })
    sendDemoCommand({ type: 'restart' })
  }

  return (
    <section
      id="contato"
      className="scroll-mt-24 border-t border-line px-4 py-20 sm:px-6 sm:py-24"
    >
      <div className="relative mx-auto max-w-[62rem] overflow-hidden rounded-(--radius-panel) border border-line bg-surface p-8 shadow-[var(--shadow-panel)] sm:p-12 lg:p-14">
        <span
          aria-hidden="true"
          className="zen-gradient absolute inset-x-0 top-0 h-[3px]"
        />
        {/* Brilho suave no canto, no tom da landing institucional */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(70_156_181/0.18),transparent)] dark:bg-[radial-gradient(closest-side,rgb(70_156_181/0.16),transparent)]"
        />

        <div className="relative">
          <h2 className="max-w-2xl text-[1.625rem] leading-[1.2] sm:text-[2.25rem]">
            Agora imagine essa experiência na sua operação.
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1rem] leading-relaxed text-fg-muted sm:text-[1.0625rem]">
            A Zentera Virtua desenvolve agentes inteligentes adaptados aos
            processos, sistemas e regras do seu atendimento.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={CONTACT_URL}
              onClick={() =>
                track('contact_cta_clicked', { source: 'final_cta' })
              }
              className="zen-btn zen-btn-primary"
            >
              Falar com a Zentera Virtua
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={handleRestart}
              className="zen-btn zen-btn-secondary"
            >
              Testar novamente
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
