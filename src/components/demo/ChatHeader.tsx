import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Dialog } from 'radix-ui'

import { BrandMark } from '#/components/zentera/Logo'
import { BRAND } from '#/config/site'

interface ChatHeaderProps {
  isSending: boolean
  mode: 'live' | 'mock' | null
  /** Decide entre reiniciar direto ou pedir confirmacao. */
  onRequestNew: () => void
  confirmOpen: boolean
  onConfirmOpenChange: (open: boolean) => void
  onConfirmNew: () => void
}

export function ChatHeader({
  isSending,
  mode,
  onRequestNew,
  confirmOpen,
  onConfirmOpenChange,
  onConfirmNew,
}: ChatHeaderProps) {
  return (
    <header className="relative flex items-center gap-3 border-b border-line bg-surface-2/80 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-3.5">
      {/* Filete do gradiente da marca no topo do chat */}
      <span
        aria-hidden="true"
        className="zen-gradient absolute inset-x-0 top-0 h-[2px] opacity-90"
      />

      <BrandMark className="size-10" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-[0.9375rem] font-semibold tracking-[-0.01em] text-fg">
          {BRAND.agentName}
        </p>
        <p className="flex items-center gap-1.5 text-[0.75rem] text-fg-subtle">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-zen-300 shadow-[0_0_0_3px_rgb(79_178_198/0.2)]"
          />
          Online
        </p>
      </div>

      {mode === 'mock' && (
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[0.6875rem] font-medium text-amber-700 sm:inline-flex dark:text-amber-300">
          <AlertTriangle className="size-3" aria-hidden="true" />
          Modo simulado
        </span>
      )}

      <button
        type="button"
        onClick={onRequestNew}
        disabled={isSending}
        aria-label="Iniciar uma nova conversa"
        className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[0.8125rem] font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg disabled:pointer-events-none disabled:opacity-50"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Nova conversa</span>
      </button>

      <Dialog.Root open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-(--radius-panel) border border-line bg-surface p-6 shadow-[var(--shadow-panel)]">
            <Dialog.Title className="font-display text-lg font-semibold text-fg">
              Começar uma nova conversa?
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-[0.9375rem] leading-relaxed text-fg-muted">
              As mensagens atuais serão apagadas e o agente voltará ao início,
              sem o contexto do que já foi conversado.
            </Dialog.Description>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="zen-btn zen-btn-secondary min-h-11 px-5 sm:min-h-10"
                >
                  Continuar conversando
                </button>
              </Dialog.Close>

              <button
                type="button"
                onClick={onConfirmNew}
                className="zen-btn zen-btn-primary min-h-11 px-5 sm:min-h-10"
              >
                Apagar e recomeçar
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  )
}
