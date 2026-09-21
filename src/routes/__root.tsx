import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { MotionConfig } from 'framer-motion'

import {
  DEFAULT_THEME,
  ThemeProvider,
  themeInitScript,
} from '#/components/zentera/ThemeProvider'
import { SITE_URL } from '#/config/site'
import appCss from '#/styles.css?url'

const TITLE = 'Teste a IA | Zentera Virtua'
const DESCRIPTION =
  'Converse com a inteligência artificial da Zentera Virtua e veja na prática como agentes inteligentes podem transformar o atendimento.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'theme-color', content: '#050609' },
      { name: 'robots', content: 'index, follow' },

      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Zentera Virtua' },
      { property: 'og:locale', content: 'pt_BR' },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:image', content: `${SITE_URL}/og-image.png` },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:image:alt',
        content: 'Converse com a IA da Zentera Virtua.',
      },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
      { name: 'twitter:image', content: `${SITE_URL}/og-image.png` },
      {
        name: 'twitter:image:alt',
        content: 'Converse com a IA da Zentera Virtua.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'canonical', href: SITE_URL },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={DEFAULT_THEME === 'dark' ? 'dark' : undefined}
    >
      <head>
        {/* Aplica o tema salvo antes da primeira pintura, evitando FOUC. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
