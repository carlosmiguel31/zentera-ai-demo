/**
 * Validacao de entrada compartilhada.
 *
 * O cliente usa para dar feedback imediato; o servidor revalida tudo, porque
 * nada que vem do navegador e confiavel.
 */

export type ValidationFailure =
  'invalid_body' | 'invalid_message' | 'message_too_long'

export type ValidationResult =
  { ok: true; message: string } | { ok: false; reason: ValidationFailure }

/** Aceita apenas o formato `demo_<uuid>` gerado por `lib/session.ts`. */
const SESSION_ID_PATTERN = /^demo_[0-9a-f-]{8,64}$/i

export function isValidSessionId(value: unknown): value is string {
  return typeof value === 'string' && SESSION_ID_PATTERN.test(value)
}

/**
 * Aceita o que `createMessageId()` produz: um UUID v4 ou, em ambientes sem Web
 * Crypto, um identificador hexadecimal com hifens.
 */
const MESSAGE_ID_PATTERN = /^[0-9a-f][0-9a-f-]{7,63}$/i

export function isValidMessageId(value: unknown): value is string {
  return typeof value === 'string' && MESSAGE_ID_PATTERN.test(value)
}

/**
 * Normaliza e valida a mensagem do visitante.
 *
 * Remove caracteres de controle invisiveis (exceto quebras de linha), aplica
 * trim e limita o numero de linhas em branco consecutivas.
 */
export function validateMessage(
  value: unknown,
  maxLength: number,
): ValidationResult {
  if (typeof value !== 'string') {
    return { ok: false, reason: 'invalid_message' }
  }

  const normalized = value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (normalized.length === 0) {
    return { ok: false, reason: 'invalid_message' }
  }

  if (normalized.length > maxLength) {
    return { ok: false, reason: 'message_too_long' }
  }

  return { ok: true, message: normalized }
}
