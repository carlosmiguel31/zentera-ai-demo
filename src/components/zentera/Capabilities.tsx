import {
  CalendarClock,
  HeadphonesIcon,
  HeartHandshake,
  Receipt,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { NAV_ANCHORS } from '#/config/site'
import { track } from '#/lib/analytics'
import { sendDemoCommand } from '#/lib/demo-bus'

interface Capability {
  name: string
  description: string
  /** Texto que vai para o campo de mensagem ao clicar no card. */
  prompt: string
  icon: LucideIcon
}

const CAPABILITIES: Array<Capability> = [
  {
    name: 'Comercial',
    description: 'Contratação, upgrade e escolha de planos.',
    prompt: 'Quais planos de internet vocês têm disponíveis?',
    icon: ShoppingCart,
  },
  {
    name: 'Suporte',
    description: 'Lentidão, oscilações e dificuldades técnicas.',
    prompt: 'Minha internet está caindo toda hora à noite',
    icon: HeadphonesIcon,
  },
  {
    name: 'Financeiro',
    description: 'Faturas, pagamentos e segunda via.',
    prompt: 'Preciso da segunda via da fatura deste mês',
    icon: Receipt,
  },
  {
    name: 'Cobrança',
    description: 'Negociação e regularização.',
    prompt: 'Estou com duas faturas atrasadas, consigo negociar?',
    icon: Wallet,
  },
  {
    name: 'Agendamento',
    description: 'Visitas técnicas e reagendamentos.',
    prompt: 'Quero remarcar a visita do técnico para sábado',
    icon: CalendarClock,
  },
  {
    name: 'Retenção',
    description: 'Insatisfação, cancelamento e alternativas.',
    prompt: 'Estou pensando em cancelar meu plano',
    icon: HeartHandshake,
  },
]

export function Capabilities() {
  function handleSelect(capability: Capability) {
    track('suggestion_clicked', {
      source: 'capabilities',
      category: capability.name,
    })
    sendDemoCommand({
      type: 'prefill',
      text: capability.prompt,
      category: capability.name,
    })
    // Leva o visitante de volta ao chat com o texto ja preenchido.
    document.querySelector(NAV_ANCHORS.demo)?.scrollIntoView({ block: 'start' })
  }

  return (
    <section
      id="capacidades"
      className="scroll-mt-24 border-t border-line px-4 py-20 sm:px-6"
    >
      <div className="mx-auto max-w-[62rem]">
        <p className="text-[0.75rem] font-medium tracking-[0.14em] text-zen-500 dark:text-zen-300">
          O QUE VOCÊ PODE TESTAR
        </p>

        <h2 className="mt-3 max-w-xl text-[1.625rem] leading-[1.2] sm:text-[2rem]">
          Experimente diferentes tipos de atendimento.
        </h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <button
              key={capability.name}
              type="button"
              onClick={() => handleSelect(capability)}
              className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-zen-400/45"
            >
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-zen-600 transition-colors group-hover:text-zen-400 dark:text-zen-300">
                <capability.icon className="size-4" aria-hidden="true" />
              </span>

              <span className="min-w-0">
                <span className="block font-display text-[0.9375rem] font-semibold text-fg">
                  {capability.name}
                </span>
                <span className="mt-1 block text-[0.875rem] leading-snug text-fg-muted">
                  {capability.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 max-w-[44rem] border-l-2 border-line pl-5">
          <p className="font-display text-[1.0625rem] font-semibold text-fg">
            Você não está navegando por respostas pré-programadas.
          </p>
          <p className="mt-2 leading-relaxed text-fg-muted">
            A demonstração foi criada para mostrar como um agente pode
            interpretar mensagens, manter o contexto da conversa e conduzir o
            atendimento.
          </p>
        </div>
      </div>
    </section>
  )
}
