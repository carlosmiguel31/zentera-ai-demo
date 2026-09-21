import { useEffect, useState } from 'react'

/** Junta classes condicionais sem trazer uma dependencia extra. */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ')
}

/** Formata o horario curto da mensagem (pt-BR, 24h). */
export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

/** `true` quando o visitante pediu menos movimento no sistema operacional. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}
