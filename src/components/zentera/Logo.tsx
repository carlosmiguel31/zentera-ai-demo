import { BRAND } from '#/config/site'
import { cn } from '#/lib/utils'

/**
 * LOGOS OFICIAIS DA ZENTERA VIRTUA
 *
 * Os arquivos ficam em `public/brand/` e sao usados como fornecidos: nao foram
 * redesenhados, recoloridos nem convertidos para SVG.
 *
 * - `zentera-virtua-logo.jpeg`   → logo completa (simbolo + "Zentera Virtua"),
 *                                  usada no Header, no Footer e em areas
 *                                  institucionais.
 * - `zentera-virtua-symbol.jpeg` → apenas o simbolo, usado como avatar da IA,
 *                                  no header do chat e em elementos pequenos.
 *
 * Como os JPEGs tem fundo claro, os dois componentes abaixo exibem a imagem
 * sobre uma pequena placa clara (`zen-brand-plate`). No tema claro ela se
 * funde com a pagina; no tema escuro vira um cartao discreto. Nenhum filtro
 * CSS e aplicado sobre a imagem.
 */
export const LOGO_SRC = '/brand/zentera-virtua-logo.jpeg'
export const SYMBOL_SRC = '/brand/zentera-virtua-symbol.jpeg'

/** Proporcao real do arquivo da logo completa (723 x 239). */
const LOGO_ASPECT = '723 / 239'

interface LogoProps {
  className?: string
  /** Altura da imagem. O container cresce junto, mantendo a proporcao. */
  size?: 'sm' | 'md'
}

/**
 * Logo completa sobre placa clara.
 *
 * `alt` recebe o nome da marca; quem envolve o componente em um link deve
 * fornecer o proprio `aria-label` se quiser um texto diferente.
 */
export function Logo({ className, size = 'sm' }: LogoProps) {
  return (
    <span
      className={cn(
        'zen-brand-plate inline-flex shrink-0 items-center overflow-hidden rounded-xl',
        size === 'sm' ? 'h-10 px-2.5 py-1' : 'h-12 px-3 py-1.5',
        className,
      )}
    >
      <img
        src={LOGO_SRC}
        alt={BRAND.name}
        width={723}
        height={239}
        decoding="async"
        className="block h-full w-auto select-none"
        style={{ aspectRatio: LOGO_ASPECT }}
        draggable={false}
      />
    </span>
  )
}

interface BrandMarkProps {
  className?: string
  /**
   * `true` (padrao) quando o simbolo e puramente decorativo — por exemplo, ao
   * lado do texto "Zentera IA". Use `false` para dar um `alt` real.
   */
  decorative?: boolean
}

/**
 * Simbolo oficial, usado como avatar da IA e no header do chat.
 *
 * O tamanho padrao e `size-9`; passe `className` com outro `size-*` quando
 * precisar (as bolhas usam `size-8`).
 */
export function BrandMark({ className, decorative = true }: BrandMarkProps) {
  return (
    <span
      aria-hidden={decorative ? 'true' : undefined}
      className={cn(
        // Fundo branco puro: e exatamente o fundo do JPEG do simbolo, entao a
        // imagem se funde com a placa em vez de mostrar um quadrado interno.
        'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-plate-border bg-white',
        className,
      )}
    >
      <img
        src={SYMBOL_SRC}
        alt={decorative ? '' : `Símbolo da ${BRAND.name}`}
        width={456}
        height={456}
        decoding="async"
        loading="lazy"
        className="block size-full scale-[0.78] object-contain select-none"
        draggable={false}
      />
    </span>
  )
}
