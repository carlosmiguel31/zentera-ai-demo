import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { ChatComposer } from '#/components/demo/ChatComposer'
import type { ComposerHandle } from '#/components/demo/ChatComposer'
import { ChatHeader } from '#/components/demo/ChatHeader'
import { ChatMessageBubble } from '#/components/demo/ChatMessage'
import { DemoLimitNotice } from '#/components/demo/DemoLimitNotice'
import { SuggestedPrompts } from '#/components/demo/SuggestedPrompts'
import { TypingIndicator } from '#/components/demo/TypingIndicator'
import { BRAND, PRIVACY_URL } from '#/config/site'
import { track } from '#/lib/analytics'
import { onDemoCommand } from '#/lib/demo-bus'
import { usePrefersReducedMotion } from '#/lib/utils'
import { useChatDemo } from '#/hooks/useChatDemo'

export function ChatDemo() {
  const {
    messages,
    draft,
    isSending,
    error,
    remaining,
    limitReached,
    mode,
    hasConversation,
    setDraft,
    send,
    retryLast,
    startNewConversation,
  } = useChatDemo()

  const reduced = usePrefersReducedMotion()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<ComposerHandle>(null)
  const hasConversationRef = useRef(hasConversation)
  hasConversationRef.current = hasConversation

  /**
   * Rolagem automatica.
   *
   * Age apenas no container interno do chat. `scrollIntoView` foi evitado de
   * proposito: ele moveria o documento inteiro e faria a pagina pular a cada
   * mensagem recebida.
   */
  const scrollToLatest = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [reduced])

  useEffect(() => {
    scrollToLatest()
  }, [messages, isSending, error, scrollToLatest])

  /** Reinicia direto quando nao ha nada a perder; senao confirma antes. */
  const requestNewConversation = useCallback(() => {
    if (!hasConversationRef.current) {
      startNewConversation()
      return
    }
    setConfirmOpen(true)
  }, [startNewConversation])

  // Comandos vindos dos cards de capacidades e do CTA final.
  useEffect(
    () =>
      onDemoCommand((command) => {
        if (command.type === 'prefill') {
          setDraft(command.text)
          composerRef.current?.focus()
        } else {
          requestNewConversation()
        }
      }),
    [setDraft, requestNewConversation],
  )

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')

  return (
    <section id="teste" className="scroll-mt-24 px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-[62rem]">
        <div className="mb-7 max-w-2xl">
          <h2 className="text-[1.75rem] leading-[1.15] sm:text-[2.125rem]">
            Teste a IA em tempo real
          </h2>
          <p className="mt-3 leading-relaxed text-fg-muted">
            Converse como se você fosse um cliente. Faça perguntas, mude de
            assunto e veja como o agente conduz o atendimento.
          </p>
        </div>

        <div className="relative">
          {/* Halo do gradiente da marca: o unico ornamento da pagina. */}
          <div
            aria-hidden="true"
            className="zen-gradient pointer-events-none absolute -inset-x-6 -top-4 bottom-8 rounded-[2.5rem] opacity-[0.16] blur-3xl dark:opacity-[0.22]"
          />

          <div className="relative flex h-[calc(100svh-13rem)] max-h-[680px] min-h-[480px] flex-col overflow-hidden rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-panel)] sm:h-[min(70vh,680px)]">
            <ChatHeader
              isSending={isSending}
              mode={mode}
              onRequestNew={requestNewConversation}
              confirmOpen={confirmOpen}
              onConfirmOpenChange={setConfirmOpen}
              onConfirmNew={() => {
                setConfirmOpen(false)
                startNewConversation()
              }}
            />

            <div
              ref={viewportRef}
              className="zen-scroll flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 py-5 sm:px-5"
            >
              <div className="mx-auto flex max-w-[44rem] flex-col gap-4">
                {messages.length === 0 && (
                  <div className="flex flex-col gap-5 pt-2">
                    <div className="max-w-xl space-y-2.5">
                      <p className="font-display text-[1.25rem] font-semibold text-fg">
                        Olá! 👋
                      </p>
                      <p className="text-[0.9375rem] leading-relaxed text-fg-muted">
                        Sou a inteligência de demonstração da {BRAND.name}. Você
                        pode conversar comigo como se estivesse falando com o
                        atendimento de um provedor de internet.
                      </p>
                      <p className="text-[0.9375rem] font-medium text-fg">
                        O que você gostaria de testar?
                      </p>
                    </div>

                    <SuggestedPrompts
                      disabled={isSending || limitReached}
                      onSelect={(text, index) => {
                        track('suggestion_clicked', { index })
                        send(text, 'suggestion')
                      }}
                    />
                  </div>
                )}

                {messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))}

                {isSending && <TypingIndicator />}

                {error && (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3"
                  >
                    <AlertCircle
                      className="size-4 shrink-0 text-red-500"
                      aria-hidden="true"
                    />
                    <p className="min-w-0 flex-1 text-[0.875rem] leading-relaxed text-fg">
                      {error.message}
                    </p>

                    {error.retryable && (
                      <button
                        type="button"
                        onClick={retryLast}
                        disabled={isSending}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[0.8125rem] font-medium text-fg transition-colors hover:border-line-strong"
                      >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        Tentar novamente
                      </button>
                    )}
                  </div>
                )}

                {limitReached && <DemoLimitNotice />}
              </div>
            </div>

            <ChatComposer
              ref={composerRef}
              value={draft}
              onChange={setDraft}
              onSubmit={() => send(draft)}
              isSending={isSending}
              disabled={limitReached}
            />
          </div>
        </div>

        {/*
          Regiao viva enxuta: anuncia apenas o estado e a ultima resposta do
          agente, nunca a conversa inteira.
        */}
        <div aria-live="polite" aria-atomic="true" className="sr-live">
          {isSending
            ? `${BRAND.agentName} está digitando`
            : (lastAssistant?.content ?? '')}
        </div>

        <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-fg-subtle">
          Ambiente demonstrativo. Não envie senhas, dados bancários ou
          informações pessoais sensíveis.{' '}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-fg-muted"
          >
            Política de Privacidade
          </a>
          {remaining <= 5 && !limitReached && (
            <span className="mt-1 block">
              {remaining === 1
                ? 'Resta 1 mensagem nesta demonstração.'
                : `Restam ${remaining} mensagens nesta demonstração.`}
            </span>
          )}
        </p>
      </div>
    </section>
  )
}
