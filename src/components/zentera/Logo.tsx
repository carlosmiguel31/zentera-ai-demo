import { BRAND } from '#/config/site'
import { cn } from '#/lib/utils'

/**
 * LOGO DA ZENTERA VIRTUA
 *
 * Nenhum arquivo oficial de logo foi fornecido, entao a marca aparece como
 * texto ("Zentera Virtua"), conforme combinado. A logo NAO foi redesenhada,
 * recolorida nem recriada em CSS.
 *
 * PARA USAR O ARQUIVO OFICIAL — basta UMA constante:
 *   1. copie o arquivo para `public/` (nome sugerido:
 *      `public/zentera-virtua-logo.png`; SVG ou WebP tambem servem);
 *   2. troque `LOGO_SRC` abaixo de `null` para `'/zentera-virtua-logo.png'`;
 *   3. se a proporcao pedir, ajuste `LOGO_HEIGHT_CLASS`.
 *
 * Nada mais muda: o componente troca o texto pela imagem sozinho, no header e
 * no footer, e o `alt` ja e o nome da marca.
 */
const LOGO_SRC: string | null = null
const LOGO_HEIGHT_CLASS = 'h-7 w-auto'

export function Logo({ className }: { className?: string }) {
  if (LOGO_SRC) {
    return (
      <img
        src={LOGO_SRC}
        alt={BRAND.name}
        className={cn(LOGO_HEIGHT_CLASS, className)}
        decoding="async"
      />
    )
  }

  return (
    <span
      className={cn(
        'font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-fg',
        className,
      )}
    >
      {BRAND.name}
    </span>
  )
}

/**
 * Marca compacta usada como avatar do agente no chat.
 *
 * Proposital: apenas o gradiente da marca, sem letra, sem simbolo e sem
 * qualquer desenho que possa ser confundido com a logo oficial.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'zen-gradient inline-block size-9 shrink-0 rounded-full',
        'ring-1 ring-white/25 ring-inset',
        className,
      )}
    />
  )
}
