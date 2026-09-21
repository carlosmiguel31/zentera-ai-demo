import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import { THEME_STORAGE_KEY } from '#/config/site'
import { track } from '#/lib/analytics'

export type Theme = 'light' | 'dark'

/** Tema aplicado quando o visitante ainda nao escolheu. */
export const DEFAULT_THEME: Theme = 'dark'

/**
 * Script inserido no `<head>` para evitar FOUC.
 *
 * Roda antes da primeira pintura: le a preferencia salva e ajusta a classe do
 * `<html>` (que o SSR ja entregou como `dark`). Sem isso, quem escolheu o tema
 * claro veria um flash escuro a cada carregamento.
 */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(
  THEME_STORAGE_KEY,
)};var s=localStorage.getItem(k);var t=s==='light'||s==='dark'?s:${JSON.stringify(
  DEFAULT_THEME,
)};var e=document.documentElement;e.classList.toggle('dark',t==='dark');e.style.colorScheme=t;}catch(e){}})();`

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // No servidor renderizamos sempre o padrao; o script acima corrige antes da
  // pintura e este estado sincroniza na hidratacao.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME)

  useEffect(() => {
    setThemeState(readStoredTheme())
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)

    const root = document.documentElement
    root.classList.toggle('dark', next === 'dark')
    root.style.colorScheme = next

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage bloqueado: o tema vale apenas para esta visita.
    }

    track('theme_changed', { theme: next })
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme precisa estar dentro de <ThemeProvider>.')
  }
  return context
}
