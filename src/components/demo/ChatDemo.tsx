import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { ChatComposer } from '#/components/demo/ChatComposer'
import type { ComposerHandle } from '#/components/demo/ChatComposer'
import { ChatHeader } from '#/components/demo/ChatHeader'
import { ChatMessageBubble } from '#/components/demo/ChatMessage'
import type { ChatView } from '#/components/demo/ChatViewToggle'
import {
  CompanyConversationView,
  CompanyMirrorBar,
} from '#/components/demo/CompanyConversationView'
import { ConversationSummary } from '#/components/demo/ConversationSummary'
import { DemoLimitNotice } from '#/components/demo/DemoLimitNotice'
import { OperationOverview } from '#/components/demo/OperationPanel'
import { SuggestedPrompts } from '#/components/demo/SuggestedPrompts'
import { TypingIndicator } from '#/components/demo/TypingIndicator'
import { BRAND, PRIVACY_URL } from '#/config/site'
import { track } from '#/lib/analytics'
import { onDemoCommand } from '#/lib/demo-bus'
import { buildOperationTimeline } from '#/lib/operation-format'
import { cn, usePrefersReducedMotion } from '#/lib/utils'
import { useChatDemo } from '#/hooks/useChatDemo'

export function ChatDemo() {
  const {
    messages,
    draft,
    isSending,
    error,
    remaining,
    limitReached,
    hasConversation,
    setDraft,
    send,
    retryLast,
    startNewConversation,
  } = useChatDemo()

  const reduced = usePrefersReducedMotion()
  const [confirmOpen, setConfirmOpen] = useState(false)

  /**
   * Perspectiva exibida. E apenas apresentacao: as duas visoes leem o MESMO
   * estado de `useChatDemo` (mesma sessao, mesmas mensagens, mesmo historico).
   * Trocar de visao nao dispara requisicao.
   */
  const [view, setView] = useState<ChatView>('client')
  const [summaryOpen, setSummaryOpen] = useState(false)

  const viewportRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<ComposerHandle>(null)
  const hasConversationRef = useRef(hasConversation)
  hasConversationRef.current = hasConversation
  const viewRef = useRef(view)
  viewRef.current = view
  /** Foco pendente no composer, aplicado assim que a Visao do cliente montar. */
  const focusComposerRef = useRef(false)

  // Leitura operacional derivada das proprias mensagens: nada e buscado de
  // novo, entao alternar entre as visoes e instantaneo.
  const timeline = useMemo(() => buildOperationTimeline(messages), [messages])

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
    // No estado inicial (boas-vindas + sugestoes) nao ha "ultima mensagem" a
    // mostrar: rolar para o fim esconderia a saudacao em telas pequenas.
    if (messages.length === 0 && !isSending && !error) return
    scrollToLatest()
  }, [messages, isSending, error, scrollToLatest])

  // Ao trocar de visao, mostra o ponto atual da conversa, sem animacao.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !hasConversationRef.current) return
    viewport.scrollTop = viewport.scrollHeight
  }, [view])

  // O composer so existe na Visao do cliente: o foco pedido espera ele montar.
  useEffect(() => {
    if (view !== 'client' || !focusComposerRef.current) return
    focusComposerRef.current = false
    composerRef.current?.focus()
  }, [view])

  /** Volta para a Visao do cliente e leva o foco ao campo de mensagem. */
  const showClientView = useCallback(() => {
    if (viewRef.current === 'client') {
      composerRef.current?.focus()
      return
    }
    focusComposerRef.current = true
    setView('client')
  }, [])

  /** Nova conversa: limpa tudo (inclusive snapshots) e volta ao cliente. */
  const resetConversation = useCallback(() => {
    if (!startNewConversation()) return
    setView('client')
    setSummaryOpen(false)
  }, [startNewConversation])

  /** Reinicia direto quando nao ha nada a perder; senao confirma antes. */
  const requestNewConversation = useCallback(() => {
    if (!hasConversationRef.current) {
      resetConversation()
      return
    }
    setConfirmOpen(true)
  }, [resetConversation])

  // Comandos vindos dos cards de capacidades e do CTA final.
  useEffect(
    () =>
      onDemoCommand((command) => {
        if (command.type === 'prefill') {
          setDraft(command.text)
          showClientView()
        } else {
          requestNewConversation()
        }
      }),
    [setDraft, requestNewConversation, showClientView],
  )

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')

  return (
    <section id="teste" className="scroll-mt-24 px-4 pb-20 sm:px-6 sm:pb-24">
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
          {/* Halo do gradiente da marca: o unico ornamento da secao. */}
          <div
            aria-hidden="true"
            className="zen-gradient pointer-events-none absolute -inset-x-4 -top-4 bottom-8 rounded-[2.5rem] opacity-[0.14] blur-3xl sm:-inset-x-8 dark:opacity-[0.2]"
          />

          <div className="relative flex h-[calc(100svh-13rem)] max-h-[720px] min-h-[500px] flex-col overflow-hidden rounded-(--radius-panel) border border-line bg-surface shadow-[var(--shadow-panel)] sm:h-[min(72vh,720px)]">
            <ChatHeader
              isSending={isSending}
              view={view}
              onViewChange={setView}
              onRequestNew={requestNewConversation}
              confirmOpen={confirmOpen}
              onConfirmOpenChange={setConfirmOpen}
              onConfirmNew={() => {
                setConfirmOpen(false)
                resetConversation()
              }}
            />

            {view === 'company' && hasConversation && (
              <OperationOverview operation={timeline.current} />
            )}

            <div
              ref={viewportRef}
              className="zen-scroll flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[radial-gradient(80%_60%_at_50%_0%,rgb(70_156_181/0.05),transparent_70%)] px-3 py-5 sm:px-5 sm:py-6"
            >
              {/*
                Visao do cliente. Continua montada quando oculta: voltar a ela
                e instantaneo e as bolhas nao reanimam.
              */}
              <div
                className={cn(
                  'mx-auto flex max-w-[44rem] flex-col gap-4',
                  view !== 'client' && 'hidden',
                )}
              >
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
                    className="flex flex-wrap items-center gap-3 rounded-(--radius-card) border border-red-500/25 bg-red-500/[0.06] px-4 py-3"
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
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] font-medium text-fg transition-colors hover:border-line-strong disabled:opacity-50"
                      >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        Tentar novamente
                      </button>
                    )}
                  </div>
                )}

                {limitReached && <DemoLimitNotice />}
              </div>

              {/* Visao da empresa: a mesma conversa, somente leitura. */}
              <div
                className={cn(
                  'mx-auto max-w-[44rem]',
                  view !== 'company' && 'hidden',
                )}
              >
                <CompanyConversationView
                  entries={timeline.entries}
                  isSending={isSending}
                  onShowClientView={showClientView}
                />
              </div>
            </div>

            {view === 'client' ? (
              <ChatComposer
                ref={composerRef}
                value={draft}
                onChange={setDraft}
                onSubmit={() => send(draft)}
                isSending={isSending}
                disabled={limitReached}
              />
            ) : (
              <CompanyMirrorBar
                onOpenSummary={() => setSummaryOpen(true)}
                canSummarize={hasConversation}
              />
            )}
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

        <ConversationSummary
          open={summaryOpen}
          onOpenChange={setSummaryOpen}
          messages={messages}
          operation={timeline.current}
        />

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
