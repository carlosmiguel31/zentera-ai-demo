/** Tipos compartilhados entre o frontend e a rota `/api/chat`. */

export type ChatRole = 'user' | 'assistant'

/**
 * Leitura operacional de um turno, ja SANITIZADA.
 *
 * E a unica informacao operacional que sai do servidor. Todos os campos sao
 * opcionais e so existem quando a aplicacao Zentera os devolveu de fato: o
 * frontend nunca preenche nada por conta propria.
 *
 * - `state`, `intent`, `handoff`: contrato atual da Zentera
 *   (`conversationState`, `detectedIntent`, `shouldHandoffToHuman`).
 * - demais campos: objeto opcional `demoOperation`, voltado a demonstracao.
 *
 * A allowlist que produz este objeto vive em `src/lib/operation.ts`.
 */
export interface OperationSnapshot {
  /** Codigo do estado da conversa, ex.: `DIAGNOSING`. */
  state?: string
  /** Codigo da intencao detectada, ex.: `TECHNICAL_SUPPORT`. */
  intent?: string
  /** `true` quando a aplicacao recomenda atendimento humano. */
  handoff?: boolean
  summary?: string
  context?: Array<string>
  actions?: Array<string>
  handoffReason?: string
  department?: string
  nextAction?: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** Epoch em ms. Usado apenas para ordenacao e exibicao de horario. */
  createdAt: number
  /**
   * Snapshot operacional recebido NESTE turno. Somente respostas do
   * assistente o possuem, e sempre de forma opcional: historicos antigos
   * continuam validos sem ele.
   */
  operation?: OperationSnapshot
}

/** Corpo aceito por `POST /api/chat`. */
export interface ChatRequestBody {
  sessionId: string
  /**
   * Identificador da mensagem do visitante, gerado no navegador.
   *
   * O retry reenvia o MESMO `messageId`, o que permite ao servidor nao debitar
   * a cota comercial duas vezes pela mesma mensagem.
   */
  messageId: string
  message: string
  metadata?: {
    source?: string
  }
}

/**
 * Resposta de sucesso de `POST /api/chat`.
 *
 * O texto e, opcionalmente, o snapshot operacional SANITIZADO. A aplicacao
 * Zentera devolve metadata interna extensa (provider, engine, toolCalls,
 * fallback, policies, memory, idempotency, observability, webhookAuth,
 * estados internos) e NADA disso atravessa para o navegador: `operation` e
 * montado campo a campo, por allowlist, em `src/server/ai-client.ts`.
 *
 * Retrocompativel: sem `operation`, o chat funciona exatamente como antes.
 *
 * O selo "Modo simulado" do desenvolvimento viaja fora do corpo, no header
 * `X-Zentera-Demo-Mode`, justamente para manter este contrato limpo.
 */
export interface ChatSuccessResponse {
  reply: string
  operation?: OperationSnapshot
}

/** Header usado apenas em desenvolvimento para sinalizar a resposta simulada. */
export const DEMO_MODE_HEADER = 'X-Zentera-Demo-Mode'

/** Codigos de erro estaveis. O texto exibido ao visitante vem do servidor. */
export type ChatErrorCode =
  | 'invalid_body'
  | 'invalid_message'
  /** `messageId` ausente, malformado, ou reutilizado com outro conteudo. */
  | 'invalid_message_id'
  | 'message_too_long'
  | 'rate_limited'
  | 'demo_limit_reached'
  | 'demo_unavailable'
  | 'upstream_timeout'
  | 'upstream_error'

export interface ChatErrorResponse {
  error: {
    code: ChatErrorCode
    message: string
  }
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse

export function isChatError(value: ChatResponse): value is ChatErrorResponse {
  return 'error' in value
}
