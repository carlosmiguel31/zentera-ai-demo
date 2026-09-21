import { ArrowUpRight } from 'lucide-react'

/**
 * Atalhos do estado inicial.
 *
 * Sao apenas atalhos de digitacao: ao clicar, o texto e enviado como se o
 * visitante tivesse digitado. A conversa segue livre a partir dai — a IA nao
 * fica presa a estas opcoes.
 */
export const SUGGESTIONS = [
  'Quero contratar internet',
  'Minha internet está lenta',
  'Preciso da segunda via da fatura',
  'Quero mudar meu plano',
  'Quero cancelar',
] as const

interface SuggestedPromptsProps {
  onSelect: (text: string, index: number) => void
  disabled: boolean
}

export function SuggestedPrompts({
  onSelect,
  disabled,
}: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map((suggestion, index) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion, index)}
          className="group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-left text-[0.875rem] text-fg-muted transition-colors hover:border-zen-400/50 hover:text-fg disabled:pointer-events-none disabled:opacity-50"
        >
          {suggestion}
          <ArrowUpRight
            className="size-3.5 text-fg-subtle transition-colors group-hover:text-zen-400"
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}
