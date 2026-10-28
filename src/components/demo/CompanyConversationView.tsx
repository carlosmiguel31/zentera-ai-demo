import { Building2, ClipboardList, User } from 'lucide-react'

import { OperationUpdate } from '#/components/demo/OperationPanel'
import { BrandMark } from '#/components/zentera/Logo'
import { BRAND } from '#/config/site'
import { renderMarkdown } from '#/lib/markdown'
import { cn, formatTime } from '#/lib/utils'
import type { TimelineEntry } from '#/lib/operation-format'
import type { ChatMessage } from '#/lib/types'

interface CompanyConversationViewProps {
  /** Mensagens da conversa atual, com as atualizacoes operacionais por turno. */
  entries: Array<TimelineEntry>
  isSending: boolean
  onShowClientView: () => void
}

/**
 * Visao da empresa: a MESMA conversa da Visao do cliente, espelhada e
 * somente leitura.
 *
 * Nao tem estado de conversa proprio, nao envia mensagens e nao chama a API.
 * Tudo vem de `useChatDemo`, o mesmo hook que alimenta a Visao do cliente.
 */
export function CompanyConversationView({
  entries,
  isSending,
  onShowClientView,
}: CompanyConversationViewProps) {
  if (entries.length === 0) {
    return <CompanyEmptyState onShowClientView={onShowClientView} />
  }

  const awaitingReply = !isSending && entries.at(-1)?.message.role === 'user'

  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Conversa espelhada" className="flex flex-col gap-4">
        {entries.map(({ message, change }) => (
          <li key={message.id} className="flex flex-col gap-1.5">
            <MirroredMessage message={message} />
            {change && <OperationUpdate change={change} />}
          </li>
        ))}
      </ol>

      {isSending && (
        <p className="flex items-center justify-end gap-2 text-[0.8125rem] text-fg-subtle">
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-zen-400"
          />
          {BRAND.agentName} está gerando a resposta
        </p>
      )}

      {awaitingReply && (
        <p className="text-center text-[0.8125rem] text-fg-subtle">
          A última mensagem do cliente ainda não foi respondida.
        </p>
      )}
    </div>
  )
}

function MirroredMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-start' : 'justify-end')}
    >
      <div className="max-w-[88%] min-w-0 sm:max-w-[76%]">
        <p
          className={cn(
            'mb-1 flex items-center gap-1.5 px-1 text-[0.6875rem] text-fg-subtle',
            !isUser && 'justify-end',
          )}
        >
          {isUser ? (
            <User className="size-3" aria-hidden="true" />
          ) : (
            <BrandMark className="size-4" />
          )}
          <span className="font-semibold text-fg-muted">
            {isUser ? 'Cliente' : BRAND.agentName}
          </span>
          <span aria-hidden="true">·</span>
          <time
            className="tabular-nums"
            dateTime={new Date(message.createdAt).toISOString()}
          >
            {formatTime(message.createdAt)}
          </time>
        </p>

        <div
          className={cn(
            'overflow-hidden rounded-2xl border px-4 py-3 text-[0.875rem] leading-[1.6] break-words hyphens-auto',
            isUser
              ? 'rounded-tl-md border-line bg-surface-2 text-fg'
              : 'rounded-tr-md border-zen-400/25 bg-bubble-ai text-fg',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>
      </div>
    </div>
  )
}

function CompanyEmptyState({
  onShowClientView,
}: {
  onShowClientView: () => void
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center sm:py-16">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-zen-500 shadow-[var(--shadow-card)] dark:text-zen-300"
      >
        <Building2 className="size-5" />
      </span>
      <p className="mt-4 font-display text-[1.0625rem] font-semibold text-fg">
        Aguardando início da conversa
      </p>
      <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-fg-muted">
        Quando o cliente enviar uma mensagem, o atendimento será espelhado aqui
        em tempo real.
      </p>
      <button
        type="button"
        onClick={onShowClientView}
        className="zen-btn zen-btn-secondary mt-5 min-h-11 px-5 sm:min-h-10"
      >
        Ir para a Visão do cliente
      </button>
    </div>
  )
}

interface CompanyMirrorBarProps {
  onOpenSummary: () => void
  canSummarize: boolean
}

/** Ocupa o lugar do composer na Visao da empresa: por aqui nada e enviado. */
export function CompanyMirrorBar({
  onOpenSummary,
  canSummarize,
}: CompanyMirrorBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line bg-surface-2/80 px-3 py-2.5 backdrop-blur-sm sm:px-4">
      <p className="flex items-center gap-2 px-1 text-[0.75rem] text-fg-subtle">
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-zen-300 shadow-[0_0_0_3px_rgb(79_178_198/0.2)]"
        />
        Espelhamento em tempo real
      </p>

      <button
        type="button"
        onClick={onOpenSummary}
        disabled={!canSummarize}
        className="zen-btn zen-btn-secondary min-h-11 shrink-0 px-4 text-[0.8125rem] disabled:pointer-events-none disabled:opacity-50 sm:min-h-10"
      >
        <ClipboardList className="size-4" aria-hidden="true" />
        Ver resumo do atendimento
      </button>
    </div>
  )
}
