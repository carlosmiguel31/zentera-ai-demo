import { createHash } from 'node:crypto'

/**
 * Protecao de abuso da demonstracao publica.
 *
 * Duas camadas independentes, ambas em memoria do processo:
 *
 * 1. `checkRateLimit` — janela deslizante por IP + sessionId. Segura rajadas.
 * 2. `consumeDemoQuota` — limite comercial de mensagens por sessao.
 *
 * LIMITACAO CONHECIDA: o estado vive no processo. Com mais de uma instancia,
 * ou apos um restart, os contadores zeram. A interface `RateLimitStore` abaixo
 * existe justamente para trocar essa implementacao por Redis / Cloudflare /
 * Upstash sem mexer na rota `/api/chat`.
 */

export interface RateLimitDecision {
  allowed: boolean
  /** Segundos ate a janela liberar. Vira o header `Retry-After`. */
  retryAfterSeconds: number
  remaining: number
}

export interface RateLimitStore {
  hit: (key: string, windowMs: number, max: number) => RateLimitDecision
  increment: (key: string, ttlMs: number) => number
  peek: (key: string) => number
  /** Guarda um valor curto com TTL (usado pela idempotencia de retry). */
  remember: (key: string, value: string, ttlMs: number) => void
  recall: (key: string) => string | null
}

interface WindowEntry {
  hits: Array<number>
  expiresAt: number
}

interface CounterEntry {
  value: number
  expiresAt: number
}

interface NoteEntry {
  value: string
  expiresAt: number
}

const MAX_TRACKED_KEYS = 20_000

function createMemoryStore(): RateLimitStore {
  const windows = new Map<string, WindowEntry>()
  const counters = new Map<string, CounterEntry>()
  const notes = new Map<string, NoteEntry>()

  function sweep(now: number): void {
    for (const [key, entry] of windows) {
      if (entry.expiresAt <= now) windows.delete(key)
    }
    for (const [key, entry] of counters) {
      if (entry.expiresAt <= now) counters.delete(key)
    }
    for (const [key, entry] of notes) {
      if (entry.expiresAt <= now) notes.delete(key)
    }

    // Guarda-chuva contra crescimento ilimitado de memoria.
    if (windows.size > MAX_TRACKED_KEYS) windows.clear()
    if (counters.size > MAX_TRACKED_KEYS) counters.clear()
    if (notes.size > MAX_TRACKED_KEYS) notes.clear()
  }

  return {
    hit(key, windowMs, max) {
      const now = Date.now()
      sweep(now)

      const entry = windows.get(key) ?? { hits: [], expiresAt: now + windowMs }
      const cutoff = now - windowMs
      const hits = entry.hits.filter((time) => time > cutoff)

      if (hits.length >= max) {
        const oldest = hits[0] ?? now
        windows.set(key, { hits, expiresAt: oldest + windowMs })
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((oldest + windowMs - now) / 1000),
          ),
          remaining: 0,
        }
      }

      hits.push(now)
      windows.set(key, { hits, expiresAt: now + windowMs })

      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(0, max - hits.length),
      }
    },

    increment(key, ttlMs) {
      const now = Date.now()
      sweep(now)

      const entry = counters.get(key)
      const value = entry && entry.expiresAt > now ? entry.value + 1 : 1
      counters.set(key, { value, expiresAt: now + ttlMs })
      return value
    },

    peek(key) {
      const entry = counters.get(key)
      if (!entry || entry.expiresAt <= Date.now()) return 0
      return entry.value
    },

    remember(key, value, ttlMs) {
      const now = Date.now()
      sweep(now)
      notes.set(key, { value, expiresAt: now + ttlMs })
    },

    recall(key) {
      const entry = notes.get(key)
      if (!entry || entry.expiresAt <= Date.now()) return null
      return entry.value
    },
  }
}

const store: RateLimitStore = createMemoryStore()

/**
 * Aceita IPv4 e IPv6, com ou sem porta / colchetes.
 *
 * Um valor que nao se parece com um endereco e descartado em vez de virar
 * chave de rate limit, senao bastaria mandar lixo no header para ganhar um
 * balde novo a cada requisicao.
 */
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/
const IPV6 = /^[0-9a-f:]{3,45}$/i

function normalizeIp(raw: string | null): string | null {
  if (!raw) return null

  let value = raw.trim()
  if (value === '') return null

  // "[::1]:51234" -> "::1"
  if (value.startsWith('[')) {
    const end = value.indexOf(']')
    if (end > 0) value = value.slice(1, end)
  } else if (value.includes('.') && value.includes(':')) {
    // "203.0.113.9:51234" -> "203.0.113.9"
    value = value.slice(0, value.indexOf(':'))
  }

  if (IPV4.test(value) || IPV6.test(value)) return value.toLowerCase()
  return null
}

/**
 * Identificador aproximado do cliente.
 *
 * TOPOLOGIA DE PRODUCAO:
 *
 *   Internet -> Nginx proprio -> Node em 127.0.0.1:3200
 *
 * O Node nunca fica exposto diretamente, entao a unica fonte confiavel do IP e
 * o header que o NOSSO Nginx escreve. A ordem e:
 *
 *   1. `X-Real-IP` — escrito pelo Nginx como `$remote_addr`. Fonte principal.
 *   2. `X-Forwarded-For` — fallback. Como o Nginx tambem o reescreve com
 *      `$remote_addr`, normalmente ha um unico valor. Se vierem varios (cadeia
 *      forjada pelo navegador), usamos o ULTIMO, que e o mais proximo do proxy
 *      confiavel — o primeiro e justamente o que o cliente controla.
 *
 * Nenhum dos dois e aceito sem passar por `normalizeIp`.
 *
 * Nginx correspondente:
 *
 * ```nginx
 * proxy_set_header X-Real-IP $remote_addr;
 * proxy_set_header X-Forwarded-For $remote_addr;
 * ```
 */
export function getClientIp(request: Request): string {
  const realIp = normalizeIp(request.headers.get('x-real-ip'))
  if (realIp) return realIp

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const chain = forwarded.split(',')
    // Do mais proximo do proxy para o mais distante.
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const candidate = normalizeIp(chain[index])
      if (candidate) return candidate
    }
  }

  return 'unknown'
}

export function checkRateLimit(options: {
  ip: string
  sessionId: string
  max: number
  windowMs: number
}): RateLimitDecision {
  const byIp = store.hit(
    `ip:${options.ip}`,
    options.windowMs,
    // O IP cobre varias abas do mesmo visitante, entao recebe folga.
    options.max * 3,
  )
  if (!byIp.allowed) return byIp

  return store.hit(
    `sess:${options.ip}:${options.sessionId}`,
    options.windowMs,
    options.max,
  )
}

/** TTL do contador comercial: a sessao caduca em 6 horas de inatividade. */
const QUOTA_TTL_MS = 6 * 60 * 60 * 1000

export type QuotaOutcome =
  | 'consumed'
  /** Retry da MESMA mensagem: ja pagou a cota, nao paga de novo. */
  | 'already_counted'
  | 'exhausted'
  /** messageId conhecido chegou com outro conteudo: requisicao invalida. */
  | 'conflict'

export interface QuotaDecision {
  outcome: QuotaOutcome
  used: number
  remaining: number
}

/**
 * Impressao digital curta do conteudo.
 *
 * Serve so para responder "e exatamente a mesma mensagem?". Nao guardamos o
 * texto: apenas o tamanho e um SHA-256 truncado, o que mantem o log e a
 * memoria livres do conteudo da conversa.
 */
function fingerprint(message: string): string {
  const digest = createHash('sha256').update(message, 'utf8').digest('hex')
  return `${message.length}:${digest.slice(0, 32)}`
}

/**
 * Consome uma unidade da cota comercial da sessao — de forma IDEMPOTENTE.
 *
 * O problema que isto resolve: o visitante envia uma mensagem, a cota e
 * debitada, o webhook falha ou estoura o timeout, ele clica "Tentar novamente"
 * e perderia mais uma mensagem por um erro que nao foi dele.
 *
 * Como funciona:
 *   - cada mensagem do visitante carrega um `messageId` gerado no navegador;
 *   - o retry reenvia o MESMO `messageId` com o MESMO texto;
 *   - a primeira vez debita a cota e guarda `messageId -> impressao digital`;
 *   - repeticoes identicas devolvem `already_counted` sem debitar;
 *   - um `messageId` ja visto com texto diferente devolve `conflict`, entao
 *     nao da para reciclar um ID para enviar conteudos novos de graca;
 *   - o registro expira junto com a cota (`QUOTA_TTL_MS`).
 *
 * O rate limit de requisicoes continua contando retries normalmente: ele
 * protege a infraestrutura, e nao a cota comercial.
 */
export function consumeDemoQuota(options: {
  ip: string
  sessionId: string
  messageId: string
  message: string
  max: number
}): QuotaDecision {
  const quotaKey = `quota:${options.ip}:${options.sessionId}`
  const noteKey = `msg:${options.ip}:${options.sessionId}:${options.messageId}`
  const digest = fingerprint(options.message)

  const seen = store.recall(noteKey)
  if (seen !== null) {
    const used = store.peek(quotaKey)
    return {
      outcome: seen === digest ? 'already_counted' : 'conflict',
      used,
      remaining: Math.max(0, options.max - used),
    }
  }

  if (store.peek(quotaKey) >= options.max) {
    return { outcome: 'exhausted', used: options.max, remaining: 0 }
  }

  const used = store.increment(quotaKey, QUOTA_TTL_MS)
  store.remember(noteKey, digest, QUOTA_TTL_MS)

  return {
    outcome: used <= options.max ? 'consumed' : 'exhausted',
    used,
    remaining: Math.max(0, options.max - used),
  }
}
