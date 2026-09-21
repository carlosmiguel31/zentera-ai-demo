import { Moon, Sun } from 'lucide-react'

import { useTheme } from '#/components/zentera/ThemeProvider'
import { cn } from '#/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const goingTo = theme === 'dark' ? 'claro' : 'escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Mudar para o tema ${goingTo}`}
      title={`Mudar para o tema ${goingTo}`}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full border border-line',
        'text-fg-muted transition-colors hover:border-line-strong hover:text-fg',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}
