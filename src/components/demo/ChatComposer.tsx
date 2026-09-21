import { useEffect, useImperativeHandle, useRef } from 'react'
import { Send } from 'lucide-react'

import { DEMO } from '#/config/site'
import { cn } from '#/lib/utils'

const MAX_TEXTAREA_HEIGHT = 148

export interface ComposerHandle {
  focus: () => void
}

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isSending: boolean
  disabled: boolean
  ref?: React.Ref<ComposerHandle>
}

/**
 * Campo de mensagem.
 *
 * Enter envia, Shift+Enter quebra linha. Durante uma requisicao o visitante
 * continua podendo digitar, mas o envio fica bloqueado: e a opcao segura
 * contra clique duplo e Enter repetido, sem prender o texto de quem ja esta
 * escrevendo a proxima pergunta.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isSending,
  disabled,
  ref,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  // Cresce com o conteudo ate um teto; depois rola internamente.
  useEffect(() => {
    const node = textareaRef.current
    if (!node) return

    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
    node.style.overflowY =
      node.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden'
  }, [value])

  const trimmed = value.trim()
  const tooLong = trimmed.length > DEMO.maxMessageLength
  const canSend = trimmed !== '' && !tooLong && !isSending && !disabled
  const nearLimit = trimmed.length > DEMO.maxMessageLength * 0.8

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey) return
    // Nao interrompe a composicao de acentos/IME.
    if (event.nativeEvent.isComposing) return

    event.preventDefault()
    if (canSend) onSubmit()
  }

  return (
    <div className="border-t border-line bg-surface-2/60 px-3 py-3 sm:px-4">
      <div
        className={cn(
          'flex items-end gap-2 rounded-2xl border bg-surface p-2 transition-colors',
          'focus-within:border-zen-400/60',
          tooLong ? 'border-red-500/50' : 'border-line',
        )}
      >
        <label htmlFor="zentera-chat-input" className="sr-live">
          Sua mensagem para a Zentera IA
        </label>

        <textarea
          id="zentera-chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled ? 'Demonstração encerrada' : 'Digite sua mensagem...'
          }
          aria-describedby={tooLong ? 'zentera-chat-limit' : undefined}
          className={cn(
            'zen-scroll max-h-[148px] flex-1 resize-none bg-transparent px-2.5 py-2.5',
            'text-[0.9375rem] leading-[1.55] text-fg placeholder:text-fg-subtle',
            'focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          aria-label={isSending ? 'Enviando mensagem' : 'Enviar mensagem'}
          className={cn(
            'inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-all sm:size-10',
            canSend
              ? 'zen-gradient text-white shadow-[0_6px_20px_-8px_rgb(71_156_181/0.9)]'
              : 'cursor-not-allowed bg-surface-3 text-fg-subtle',
          )}
        >
          {isSending ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : (
            <Send className="size-[18px]" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3 px-1">
        <p className="hidden text-[0.6875rem] text-fg-subtle sm:block">
          Enter envia · Shift + Enter quebra linha
        </p>

        {(nearLimit || tooLong) && (
          <p
            id="zentera-chat-limit"
            className={cn(
              'ml-auto text-[0.6875rem] tabular-nums',
              tooLong ? 'text-red-500' : 'text-fg-subtle',
            )}
          >
            {trimmed.length} / {DEMO.maxMessageLength}
          </p>
        )}
      </div>
    </div>
  )
}
