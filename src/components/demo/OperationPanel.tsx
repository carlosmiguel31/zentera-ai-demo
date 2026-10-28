import { Headset, Sparkles } from 'lucide-react'

import {
  formatHandoff,
  formatIntent,
  formatState,
  isClosedState,
} from '#/lib/operation-format'
import type { OperationChange } from '#/lib/operation-format'
import type { OperationSnapshot } from '#/lib/types'

/**
 * Pecas visuais da leitura operacional (Visao da empresa).
 *
 * Tudo aqui exibe APENAS o que veio da aplicacao Zentera, ja sanitizado.
 * Campo ausente simplesmente nao aparece; nunca recebe um valor presumido.
 */

interface OperationOverviewProps {
  /** Ultimo valor informado de cada campo (ver `buildOperationTimeline`). */
  operation: OperationSnapshot
}

interface OverviewPart {
  label: string
  value: string
  highlight?: boolean
}

/**
 * Faixa discreta entre o cabecalho e a conversa espelhada, no formato
 * `Suporte técnico · Diagnóstico · IA em atendimento`.
 *
 * Sem intencao, estado nem handoff informados pela aplicacao, nao
 * renderiza nada: a Visao da empresa nunca mostra um painel vazio.
 */
export function OperationOverview({ operation }: OperationOverviewProps) {
  const parts: Array<OverviewPart> = []

  if (operation.intent) {
    parts.push({ label: 'Intenção', value: formatIntent(operation.intent) })
  }
  if (operation.state) {
    parts.push({ label: 'Estado', value: formatState(operation.state) })
  }
  if (operation.handoff === true) {
    parts.push({
      label: 'Atendimento',
      value: operation.department
        ? `Humano recomendado · ${operation.department}`
        : 'Humano recomendado',
      highlight: true,
    })
  } else if (operation.handoff === false && !isClosedState(operation.state)) {
    // Leitura direta de `shouldHandoffToHuman === false`.
    parts.push({ label: 'Atendimento', value: 'IA em atendimento' })
  }

  if (parts.length === 0) return null

  return (
    <section
      aria-label="Leitura operacional do atendimento"
      className="border-b border-line bg-surface-2/40 px-3 py-2 sm:px-5"
    >
      <ul className="mx-auto flex max-w-[44rem] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[0.75rem] leading-snug">
        {parts.map((part, index) => (
          <li key={part.label} className="flex min-w-0 items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-fg-subtle">
                ·
              </span>
            )}
            <span
              className={
                part.highlight
                  ? 'inline-flex items-center gap-1 font-semibold text-zen-600 dark:text-zen-300'
                  : 'font-medium text-fg-muted'
              }
            >
              {part.highlight && (
                <Headset className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="sr-only">{`${part.label}: `}</span>
              {part.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Destaque de atendimento humano.
 *
 * Motivo, setor e proxima acao aparecem somente se a aplicacao os informou.
 * Sem eles, o texto se limita ao que de fato aconteceu: o sinal de handoff.
 */
export function HandoffNotice({ operation }: { operation: OperationSnapshot }) {
  const details = [
    { label: 'Motivo', value: operation.handoffReason },
    { label: 'Encaminhamento', value: operation.department },
    { label: 'Próxima ação sugerida', value: operation.nextAction },
  ].filter(
    (detail): detail is { label: string; value: string } =>
      detail.value !== undefined,
  )

  return (
    <div className="mt-1.5 rounded-lg bg-zen-400/[0.08] px-2.5 py-2">
      <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-fg">
        <Headset
          className="size-4 shrink-0 text-zen-500 dark:text-zen-300"
          aria-hidden="true"
        />
        Atendimento humano recomendado
      </p>

      {details.length > 0 ? (
        <dl className="mt-1.5 space-y-1 text-[0.8125rem] leading-relaxed">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="inline text-fg-subtle">{`${detail.label}: `}</dt>
              <dd className="inline text-fg">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
          A aplicação sinalizou necessidade de atendimento humano.
        </p>
      )}
    </div>
  )
}

/**
 * Pequena atualizacao abaixo da resposta que trouxe dados novos.
 *
 * Mostra so o que MUDOU naquele turno, para nao repetir cartoes a cada
 * mensagem. O quadro completo fica na faixa do topo e no resumo.
 */
export function OperationUpdate({ change }: { change: OperationChange }) {
  const items: Array<{ label: string; value: string; highlight: boolean }> = []

  if (change.intent !== undefined) {
    items.push({
      label: 'Intenção',
      value: formatIntent(change.intent),
      highlight: false,
    })
  }
  if (change.state !== undefined) {
    items.push({
      label: 'Estado',
      value: formatState(change.state),
      highlight: false,
    })
  }
  // Quando o handoff acaba de ser recomendado, o aviso abaixo ja diz isso.
  if (change.handoff !== undefined && !change.handoffRaised) {
    items.push({
      label: 'Atendimento humano',
      value: formatHandoff(change.handoff),
      highlight: change.handoff,
    })
  }

  return (
    <div className="flex justify-end pr-1">
      <div className="w-fit max-w-[88%] min-w-0 border-l-2 border-zen-400/40 py-0.5 pl-3 sm:max-w-[76%]">
        <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-fg-subtle">
          <Sparkles className="size-3 text-zen-400" aria-hidden="true" />
          Contexto atualizado
        </p>

        {items.length > 0 && (
          <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[0.8125rem]">
            {items.map((item) => (
              <div key={item.label} className="flex gap-1">
                <dt className="text-fg-subtle">{`${item.label}:`}</dt>
                <dd
                  className={
                    item.highlight
                      ? 'font-semibold text-zen-600 dark:text-zen-300'
                      : 'text-fg'
                  }
                >
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {(change.newContext.length > 0 || change.newActions.length > 0) && (
          <div className="mt-1.5 space-y-1.5">
            {change.newContext.length > 0 && (
              <div>
                <p className="text-[0.6875rem] font-medium text-fg-subtle">
                  Contexto identificado
                </p>
                <ul className="mt-0.5 space-y-0.5 text-[0.8125rem] text-fg-muted">
                  {change.newContext.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-[0.6em] size-1 shrink-0 rounded-full bg-zen-400"
                      />
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {change.newActions.length > 0 && (
              <div>
                <p className="text-[0.6875rem] font-medium text-fg-subtle">
                  Ações registradas
                </p>
                <ul className="mt-0.5 space-y-0.5 text-[0.8125rem] text-fg-muted">
                  {change.newActions.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-[0.6em] size-1 shrink-0 rounded-full bg-zen-400"
                      />
                      <span className="min-w-0 break-words">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {change.handoffRaised && <HandoffNotice operation={change.snapshot} />}
      </div>
    </div>
  )
}
