import { BRAND } from '#/config/site'
import { cn } from '#/lib/utils'

/**
 * LOGOS OFICIAIS DA ZENTERA VIRTUA
 *
 * Os arquivos ficam em `public/brand/` e sao usados como fornecidos (PNG com
 * fundo transparente): nao foram redesenhados, recoloridos nem convertidos.
 *
 * - `zentera-virtua-logo-wide.png` → logo horizontal (simbolo + "Zentera
 *                                    Virtua"), usada no Header e no Footer.
 * - `zentera-virtua-logo.png`      → mesma logo com respiro generoso ao redor;
 *                                    reservada para pecas que pedem area
 *                                    quadrada (nao e usada na interface).
 * - `zentera-virtua-symbol.png`    → apenas o simbolo: avatar da IA, header
 *                                    do chat e elementos pequenos.
 *
 * Como as imagens sao transparentes, nenhum container, placa ou fundo e
 * desenhado atras delas: a marca se integra direto a superficie da pagina,
 * nos dois temas. Nenhum filtro CSS e aplicado.
 */
export const LOGO_SRC = '/brand/zentera-virtua-logo-wide.png'
export const SYMBOL_SRC = '/brand/zentera-virtua-symbol.png'

interface LogoProps {
  className?: string
  /** Altura da imagem; a largura acompanha a proporcao original (723 x 239). */
  size?: 'sm' | 'md'
}

/**
 * Logo horizontal, com `alt` igual ao nome da marca.
 *
 * Quem envolve o componente em um link pode fornecer o proprio `aria-label`
 * se quiser um texto diferente.
 */
export function Logo({ className, size = 'sm' }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={BRAND.name}
      width={723}
      height={239}
      decoding="async"
      fetchPriority="high"
      draggable={false}
      className={cn(
        'block w-auto shrink-0 select-none',
        size === 'sm' ? 'h-9 sm:h-10' : 'h-11 sm:h-12',
        className,
      )}
    />
  )
}

interface BrandMarkProps {
  className?: string
  /**
   * `true` (padrao) quando o simbolo e puramente decorativo — por exemplo, ao
   * lado do nome do agente. Use `false` para dar um `alt` real.
   */
  decorative?: boolean
}

/**
 * Simbolo oficial, usado como avatar da IA e no header do chat.
 *
 * Sem caixa, fundo ou borda: o PNG e transparente. O tamanho padrao e
 * `size-9`; passe `className` com outro `size-*` quando precisar.
 */
export function BrandMark({ className, decorative = true }: BrandMarkProps) {
  return (
    <img
      src={SYMBOL_SRC}
      alt={decorative ? '' : `Símbolo da ${BRAND.name}`}
      aria-hidden={decorative ? 'true' : undefined}
      width={180}
      height={180}
      decoding="async"
      loading="lazy"
      draggable={false}
      className={cn(
        'block size-9 shrink-0 object-contain select-none',
        className,
      )}
    />
  )
}
