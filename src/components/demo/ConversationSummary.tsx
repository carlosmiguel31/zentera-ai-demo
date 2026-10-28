import { ChevronDown, Headset } from 'lucide-react'
import { Dialog } from 'radix-ui'

import { BRAND } from '#/config/site'
import { renderMarkdown } from '#/lib/markdown'
import {
  formatDuration,
  formatIntent,
  formatState,
  isClosedState,
} from '#/lib/operation-format'
import { formatTime } from '#/lib/utils'
import type { ChatMessage, OperationSnapshot } from '#/lib/types'

interface ConversationSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: Array<ChatMessage>
  /** Ultimo valor informado de cada campo, ja sanitizado. */
  operation: OperationSnapshot
}

interface Field {
  label: string
  value: string
}

/**
 * Resumo do atendimento (Visao da empresa).
 *
 * E apenas uma VISUALIZACAO: nao chama a API, nao encerra a sessao e nao
 * altera nada na aplicacao Zentera. Mostra somente o que existe de fato:
 * contagens e horarios derivados das mensagens, mais os campos operacionais
 * que o backend devolveu. O que nao veio simplesmente nao aparece.
 */
export function ConversationSummary({
  open,
  onOpenChange,
  messages,
  operation,
}: ConversationSummaryProps) {
  const customerCount = messages.filter(
    (message) => message.role === 'user',
  ).length
  const agentCount = messages.length - customerCount
  const first = messages.at(0)
  const last = messages.at(-1)
  const closed = isClosedState(operation.state)

  const identification: Array<Field> = []
  if (operation.intent) {
    identification.push({
      label: 'Motivo / intenção',
      value: formatIntent(operation.intent),
    })
  }
  if (operation.state) {
    identification.push({
      label: 'Estado',
      value: formatState(operation.state),
    })
  }

  const outcome: Array<Field> = []
  if (operation.handoff !== undefined) {
    outcome.push({
      label: 'Resultado',
      value: operation.handoff
        ? 'Necessita atendimento humano'
        : 'Atendimento humano não necessário no momento',
    })
  }
  if (operation.handoffReason) {
    outcome.push({
      label: 'Motivo do encaminhamento',
      value: operation.handoffReason,
    })
  }
  if (operation.department) {
    outcome.push({ label: 'Encaminhamento', value: operation.department })
  }
  if (operation.nextAction) {
    outcome.push({
      label: 'Próxima ação sugerida',
      value: operation.nextAction,
    })
  }

  const hasOperationalData =
    identification.length > 0 ||
    outcome.length > 0 ||
    operation.summary !== undefined ||
    operation.context !== undefined ||
    operation.actions !== undefined

  const hasHandoffDetails =
    operation.handoffReason !== undefined ||
    operation.department !== undefined ||
    operation.nextAction !== undefined

  // Contexto que esta disponivel nesta demonstracao para um eventual handoff.
  // Nao afirma que a integracao ja o enviou a uma fila ou atendente real.
  const availableHandoffContext: Array<string> = [
    `Histórico completo disponível nesta demonstração (${messages.length} mensagens)`,
  ]
  if (operation.intent) {
    availableHandoffContext.push(
      `Intenção detectada: ${formatIntent(operation.intent)}`,
    )
  }
  if (operation.state) {
    availableHandoffContext.push(
      `Estado atual: ${formatState(operation.state)}`,
    )
  }
  if (operation.context) {
    const total = operation.context.length
    availableHandoffContext.push(
      `Contexto retornado pela Zentera (${total} ${total === 1 ? 'item' : 'itens'})`,
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(88svh,46rem)] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-(--radius-panel) border border-line bg-surface shadow-[var(--shadow-panel)]">
          <div className="relative border-b border-line px-5 pt-6 pb-4 sm:px-6">
            <span
              aria-hidden="true"
              className="zen-gradient absolute inset-x-0 top-0 h-[2px] opacity-90"
            />
            <Dialog.Title className="font-display text-lg font-semibold text-fg">
              Resumo do atendimento
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-[0.875rem] leading-relaxed text-fg-muted">
              Compilado desta demonstração. Abrir o resumo não encerra nem
              altera o atendimento na Zentera.
            </Dialog.Description>
          </div>

          <div className="zen-scroll flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Fact
                label="Mensagens"
                value={String(messages.length)}
                hint={`${customerCount} do cliente · ${agentCount} da IA`}
              />
              <Fact
                label="Início"
                value={first ? formatTime(first.createdAt) : '—'}
              />
              <Fact
                label="Duração aproximada"
                value={
                  first && last
                    ? formatDuration(last.createdAt - first.createdAt)
                    : '—'
                }
              />
              <Fact
                label="Status"
                value={closed ? 'Concluído' : 'Em andamento'}
              />
            </dl>

            {hasOperationalData && (
              <section aria-labelledby="zentera-summary-operation">
                <h3
                  id="zentera-summary-operation"
                  className="text-[0.6875rem] font-semibold tracking-[0.08em] text-fg-subtle uppercase"
                >
                  Leitura operacional
                </h3>

                <div className="mt-3 space-y-4">
                  {identification.length > 0 && (
                    <FieldList fields={identification} />
                  )}
                  {operation.summary && (
                    <Block label="Resumo">
                      <p className="text-[0.9375rem] leading-relaxed text-fg">
                        {operation.summary}
                      </p>
                    </Block>
                  )}
                  {operation.context && (
                    <Block label="Contexto identificado">
                      <BulletList items={operation.context} />
                    </Block>
                  )}
                  {operation.actions && (
                    <Block label="Ações registradas">
                      <BulletList items={operation.actions} />
                    </Block>
                  )}
                  {outcome.length > 0 && <FieldList fields={outcome} />}
                  <p className="text-[0.75rem] leading-relaxed text-fg-subtle">
                    Exibimos somente informações retornadas pela aplicação
                    Zentera.
                  </p>
                </div>
              </section>
            )}

            {operation.handoff === true && (
              <section className="rounded-(--radius-card) border border-zen-400/35 bg-zen-400/[0.07] p-4">
                <p className="flex items-center gap-2 text-[0.9375rem] font-semibold text-fg">
                  <Headset
                    className="size-4 shrink-0 text-zen-500 dark:text-zen-300"
                    aria-hidden="true"
                  />
                  Atendimento humano recomendado
                </p>
                {!hasHandoffDetails && (
                  <p className="mt-1.5 text-[0.875rem] leading-relaxed text-fg-muted">
                    A aplicação sinalizou necessidade de atendimento humano.
                  </p>
                )}

                <p className="mt-3 text-[0.8125rem] font-semibold text-fg">
                  Contexto disponível para encaminhamento
                </p>
                <BulletList items={availableHandoffContext} />
              </section>
            )}

            <details className="group rounded-(--radius-card) border border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[0.875rem] font-medium text-fg [&::-webkit-details-marker]:hidden">
                Histórico da conversa
                <span className="flex items-center gap-2 text-[0.75rem] font-normal text-fg-subtle">
                  {messages.length}{' '}
                  {messages.length === 1 ? 'mensagem' : 'mensagens'}
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>

              <ol className="space-y-3 border-t border-line px-4 py-3">
                {messages.map((message) => (
                  <li key={message.id} className="min-w-0">
                    <p className="text-[0.6875rem] text-fg-subtle">
                      <span className="font-semibold text-fg-muted">
                        {message.role === 'user' ? 'Cliente' : BRAND.agentName}
                      </span>
                      {` · ${formatTime(message.createdAt)}`}
                    </p>
                    <div className="mt-0.5 text-[0.875rem] leading-relaxed break-words text-fg">
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        renderMarkdown(message.content)
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          </div>

          <div className="flex justify-end border-t border-line px-5 py-4 sm:px-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className="zen-btn zen-btn-secondary min-h-11 px-5 sm:min-h-10"
              >
                Voltar à conversa
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.625rem] font-semibold tracking-[0.08em] text-fg-subtle uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[0.9375rem] leading-snug font-semibold text-fg">
        {value}
      </dd>
      {hint && <dd className="text-[0.75rem] text-fg-subtle">{hint}</dd>}
    </div>
  )
}

function FieldList({ fields }: { fields: Array<Field> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <dt className="text-[0.75rem] text-fg-subtle">{field.label}</dt>
          <dd className="mt-0.5 text-[0.9375rem] leading-snug font-medium break-words text-fg">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function Block({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[0.75rem] text-fg-subtle">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function BulletList({ items }: { items: Array<string> }) {
  return (
    <ul className="mt-1 space-y-1 text-[0.875rem] leading-relaxed text-fg">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span
            aria-hidden="true"
            className="mt-[0.6em] size-1 shrink-0 rounded-full bg-zen-400"
          />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  )
}
