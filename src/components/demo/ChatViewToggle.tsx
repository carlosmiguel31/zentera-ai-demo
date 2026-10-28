import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Building2, MessageCircle } from 'lucide-react'

import { cn } from '#/lib/utils'

/** Perspectivas da MESMA conversa. Trocar de visao nunca cria outro chat. */
export type ChatView = 'client' | 'company'

interface ViewOption {
  value: ChatView
  label: string
  shortLabel: string
  icon: React.ReactNode
}

const OPTIONS: ReadonlyArray<ViewOption> = [
  {
    value: 'client',
    label: 'Visão do cliente',
    shortLabel: 'Cliente',
    icon: <MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />,
  },
  {
    value: 'company',
    label: 'Visão da empresa',
    shortLabel: 'Empresa',
    icon: <Building2 className="size-3.5 shrink-0" aria-hidden="true" />,
  },
]

interface ChatViewToggleProps {
  value: ChatView
  onChange: (value: ChatView) => void
  className?: string
}

/**
 * Seletor "Visão do cliente | Visão da empresa".
 *
 * Botoes com `aria-pressed` dentro de um grupo rotulado: Tab alcanca cada
 * opcao, Enter/Espaco seleciona e as setas alternam entre elas. O nome
 * acessivel e sempre o rotulo completo, mesmo quando a tela mostra o curto.
 * A troca nao usa regiao viva: o proprio `aria-pressed` ja informa o estado,
 * sem anuncios extras.
 */
export function ChatViewToggle({
  value,
  onChange,
  className,
}: ChatViewToggleProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()

    const step = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + step + OPTIONS.length) % OPTIONS.length
    onChange(OPTIONS[nextIndex].value)
    buttonsRef.current[nextIndex]?.focus()
  }

  return (
    <div
      role="group"
      aria-label="Perspectiva da demonstração"
      className={cn(
        'relative inline-flex w-full items-center rounded-full border border-line bg-surface p-1 shadow-[var(--shadow-card)] sm:w-auto',
        className,
      )}
    >
      {OPTIONS.map((option, index) => {
        const active = option.value === value

        return (
          <button
            key={option.value}
            ref={(node) => {
              buttonsRef.current[index] = node
            }}
            type="button"
            aria-pressed={active}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'relative inline-flex min-h-10 flex-1 items-center justify-center rounded-full px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200 sm:min-h-8 sm:flex-none',
              active ? 'text-white' : 'text-fg-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId="zentera-chat-view-pill"
                aria-hidden="true"
                className="zen-gradient absolute inset-0 rounded-full shadow-[0_6px_18px_-10px_rgb(55_114_150/0.9)]"
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {option.icon}
              <span className="md:hidden">{option.shortLabel}</span>
              <span className="hidden md:inline">{option.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
