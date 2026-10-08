import { Logo } from '#/components/zentera/Logo'
import { BRAND, MAIN_SITE_URL, PRIVACY_URL, TERMS_URL } from '#/config/site'

const LINKS = [
  { label: 'Site institucional', href: MAIN_SITE_URL },
  { label: 'Política de privacidade', href: PRIVACY_URL },
  { label: 'Termos de uso', href: TERMS_URL },
] as const

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-2/40 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-[62rem] flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <a
            href={MAIN_SITE_URL}
            className="inline-flex rounded-xl"
            aria-label={`${BRAND.name} — site institucional`}
          >
            <Logo size="md" />
          </a>
          <p className="mt-4 text-[0.875rem] leading-relaxed text-fg-muted">
            {BRAND.tagline}
          </p>
        </div>

        <nav
          aria-label="Links institucionais"
          className="flex flex-wrap gap-x-6 gap-y-2 sm:pt-3"
        >
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

      <div className="mx-auto mt-10 flex max-w-[62rem] flex-col gap-2 border-t border-line pt-6 text-[0.75rem] text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {BRAND.name}. Todos os direitos
          reservados.
        </p>
        <p>Ambiente de demonstração.</p>
      </div>
    </footer>
  )
}
