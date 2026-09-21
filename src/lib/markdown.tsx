import type { ReactNode } from 'react'

/**
 * Renderizador de Markdown minimo e seguro.
 *
 * Suporta apenas o que um atendimento costuma devolver: paragrafos, quebras de
 * linha, negrito, italico, codigo curto, listas (ordenadas e nao ordenadas) e
 * links.
 *
 * SEGURANCA: nada aqui usa `dangerouslySetInnerHTML`. A saida e sempre uma
 * arvore de elementos React, entao qualquer HTML vindo da IA e tratado como
 * texto literal e nunca executado. Links aceitam apenas http, https, mailto e
 * tel; qualquer outro esquema (javascript:, data:, ...) vira texto simples.
 */

const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

function sanitizeUrl(raw: string): string | null {
  const candidate = raw.trim()
  if (candidate === '') return null

  try {
    const url = new URL(candidate, 'https://zenteravirtua.com.br')
    if (!SAFE_PROTOCOLS.includes(url.protocol)) return null
    // Preserva links relativos como relativos.
    return candidate.startsWith('/') ? candidate : url.toString()
  } catch {
    return null
  }
}

interface InlineRule {
  pattern: RegExp
  render: (match: RegExpExecArray, key: string) => ReactNode
}

const INLINE_RULES: Array<InlineRule> = [
  {
    // `codigo`
    pattern: /`([^`\n]+)`/,
    render: (match, key) => (
      <code
        key={key}
        className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[0.85em]"
      >
        {match[1]}
      </code>
    ),
  },
  {
    // **negrito**
    pattern: /\*\*([^*\n]+)\*\*/,
    render: (match, key) => (
      <strong key={key} className="font-semibold">
        {match[1]}
      </strong>
    ),
  },
  {
    // [texto](url)
    pattern: /\[([^\]\n]+)\]\(([^)\s]+)\)/,
    render: (match, key) => {
      const href = sanitizeUrl(match[2])
      if (!href) return <span key={key}>{match[1]}</span>
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-zen-600 underline underline-offset-2 dark:text-zen-300"
        >
          {match[1]}
        </a>
      )
    },
  },
  {
    // URL solta
    pattern: /https?:\/\/[^\s<>"')]+/,
    render: (match, key) => {
      const href = sanitizeUrl(match[0])
      if (!href) return <span key={key}>{match[0]}</span>
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium break-all text-zen-600 underline underline-offset-2 dark:text-zen-300"
        >
          {match[0]}
        </a>
      )
    },
  },
  {
    // _italico_ (o asterisco simples fica de fora para nao brigar com listas)
    pattern: /_([^_\n]+)_/,
    render: (match, key) => <em key={key}>{match[1]}</em>,
  },
]

function renderInline(text: string, keyPrefix: string): Array<ReactNode> {
  const nodes: Array<ReactNode> = []
  let rest = text
  let cursor = 0
  let guard = 0

  while (rest !== '' && guard < 500) {
    guard += 1

    let bestIndex = -1
    let bestRule: InlineRule | null = null
    let bestMatch: RegExpExecArray | null = null

    for (const rule of INLINE_RULES) {
      const match = rule.pattern.exec(rest)
      if (match && (bestIndex === -1 || match.index < bestIndex)) {
        bestIndex = match.index
        bestRule = rule
        bestMatch = match
      }
    }

    if (!bestRule || !bestMatch || bestIndex === -1) break

    if (bestIndex > 0) {
      nodes.push(rest.slice(0, bestIndex))
    }
    nodes.push(bestRule.render(bestMatch, `${keyPrefix}-i${cursor}`))
    rest = rest.slice(bestIndex + bestMatch[0].length)
    cursor += 1
  }

  if (rest !== '') nodes.push(rest)
  return nodes
}

function renderLines(block: string, keyPrefix: string): Array<ReactNode> {
  const lines = block.split('\n')
  return lines.flatMap((line, index) => {
    const content = renderInline(line, `${keyPrefix}-l${index}`)
    return index === 0
      ? content
      : [<br key={`${keyPrefix}-br${index}`} />, ...content]
  })
}

const UNORDERED = /^\s*[-*•]\s+/
const ORDERED = /^\s*\d+[.)]\s+/

export function renderMarkdown(source: string): Array<ReactNode> {
  const blocks = source
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block !== '')

  return blocks.map((block, blockIndex) => {
    const key = `b${blockIndex}`
    const lines = block.split('\n')

    const isUnordered = lines.every((line) => UNORDERED.test(line))
    const isOrdered = lines.every((line) => ORDERED.test(line))

    if (isUnordered || isOrdered) {
      const items = lines.map((line, itemIndex) => (
        <li key={`${key}-li${itemIndex}`} className="pl-1">
          {renderInline(
            line.replace(isOrdered ? ORDERED : UNORDERED, ''),
            `${key}-li${itemIndex}`,
          )}
        </li>
      ))

      return isOrdered ? (
        <ol
          key={key}
          className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0 marker:text-fg-subtle"
        >
          {items}
        </ol>
      ) : (
        <ul
          key={key}
          className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0 marker:text-fg-subtle"
        >
          {items}
        </ul>
      )
    }

    // Titulo curto do tipo "### Planos"
    const heading = /^(#{1,4})\s+(.*)$/.exec(block)
    if (heading && lines.length === 1) {
      return (
        <p key={key} className="my-2 font-semibold first:mt-0 last:mb-0">
          {renderInline(heading[2], key)}
        </p>
      )
    }

    return (
      <p key={key} className="my-2 first:mt-0 last:mb-0">
        {renderLines(block, key)}
      </p>
    )
  })
}
