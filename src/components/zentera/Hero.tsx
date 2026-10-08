import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { MAIN_SITE_URL, NAV_ANCHORS } from '#/config/site'
import { usePrefersReducedMotion } from '#/lib/utils'

/**
 * Hero deliberadamente curto: o chat precisa aparecer quase junto na primeira
 * tela. Os unicos ornamentos sao a regua vertical com o gradiente da marca e
 * um brilho suave ao fundo, no mesmo tom da landing institucional — nada de
 * ilustracao ou titulo gigante ocupando a viewport.
 */
export function Hero() {
  const reduced = usePrefersReducedMotion()

  return (
    <section
      id="inicio"
      className="relative overflow-hidden px-4 pt-32 pb-12 sm:px-6 sm:pt-36 sm:pb-16"
    >
      {/* Brilho de fundo: discreto, sem particulas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_55%_at_50%_0%,rgb(70_156_181/0.16),transparent_70%)] dark:bg-[radial-gradient(60%_55%_at_50%_0%,rgb(70_156_181/0.14),transparent_70%)]"
      />

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[62rem]"
      >
        <div className="relative max-w-[48rem] pl-5 sm:pl-7">
          <span
            aria-hidden="true"
            className="zen-gradient absolute top-1 left-0 h-[calc(100%-0.5rem)] w-[3px] rounded-full"
          />

          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.14em] text-zen-600 backdrop-blur-sm dark:text-zen-300">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-zen-400"
            />
            DEMONSTRAÇÃO INTERATIVA
          </p>

          <h1 className="mt-5 text-[2rem] leading-[1.08] sm:text-[2.75rem] lg:text-[3.375rem]">
            Converse com a IA da Zentera Virtua.
          </h1>

          <p className="zen-gradient-text mt-3 font-display text-[1.125rem] font-semibold sm:text-[1.375rem]">
            Teste agora. Sem apresentação. Sem roteiro.
          </p>

          <p className="mt-5 max-w-[42rem] text-[1rem] leading-[1.65] text-fg-muted sm:text-[1.0625rem]">
            Veja na prática como agentes inteligentes entendem intenções, mantêm
            contexto e conduzem atendimentos de ponta a ponta.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={NAV_ANCHORS.demo} className="zen-btn zen-btn-primary">
              Testar a IA
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>

            <a href={MAIN_SITE_URL} className="zen-btn zen-btn-secondary">
              Conhecer a Zentera Virtua
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
