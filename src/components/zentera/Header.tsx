import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import { Logo } from '#/components/zentera/Logo'
import { ThemeToggle } from '#/components/zentera/ThemeToggle'
import { CONTACT_URL, NAV_ANCHORS } from '#/config/site'
import { track } from '#/lib/analytics'
import { cn } from '#/lib/utils'

const NAV_LINKS = [
  { label: 'Como testar', href: NAV_ANCHORS.demo },
  { label: 'Capacidades', href: NAV_ANCHORS.capabilities },
] as const

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava a rolagem do documento enquanto o menu compacto esta aberto.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-colors duration-300',
        scrolled || menuOpen
          ? 'border-b border-line bg-bg/85 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[76rem] items-center gap-4 px-4 sm:px-6">
        <a
          href={NAV_ANCHORS.home}
          className="flex items-center"
          aria-label="Zentera Virtua — início"
        >
          <Logo />
        </a>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-[0.875rem] text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />

          <a
            href={CONTACT_URL}
            onClick={() => track('contact_cta_clicked', { source: 'header' })}
            className="zen-gradient hidden h-10 items-center rounded-full px-4 text-[0.875rem] font-semibold text-white md:inline-flex"
          >
            Falar com a Zentera
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls="menu-compacto"
            className="inline-flex size-10 items-center justify-center rounded-full border border-line text-fg-muted md:hidden"
          >
            {menuOpen ? (
              <X className="size-[18px]" aria-hidden="true" />
            ) : (
              <Menu className="size-[18px]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="menu-compacto"
          className="border-t border-line bg-bg px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-3 text-[0.9375rem] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {link.label}
              </a>
            ))}

            <a
              href={CONTACT_URL}
              onClick={() => {
                track('contact_cta_clicked', { source: 'header_mobile' })
                setMenuOpen(false)
              }}
              className="zen-gradient mt-2 flex min-h-12 items-center justify-center rounded-xl px-4 text-[0.9375rem] font-semibold text-white"
            >
              Falar com a Zentera
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
