import { Logo } from '#/components/zentera/Logo'
import { BRAND, MAIN_SITE_URL, PRIVACY_URL, TERMS_URL } from '#/config/site'

const LINKS = [
  { label: 'Site oficial', href: MAIN_SITE_URL },
  { label: 'Política de Privacidade', href: PRIVACY_URL },
  { label: 'Termos de Uso', href: TERMS_URL },
] as const

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-[62rem] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-[0.875rem] leading-relaxed text-fg-subtle">
            {BRAND.tagline}
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.875rem] text-fg-muted transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
