import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { MAIN_SITE_URL, NAV_ANCHORS } from '#/config/site'
import { usePrefersReducedMotion } from '#/lib/utils'

/**
 * Hero deliberadamente curto: o chat precisa aparecer quase junto na primeira
 * tela. O unico ornamento e a regua vertical com o gradiente da marca, que
 * marca onde a Zentera "fala" — nada de titulo gigante ocupando a viewport.
 */
export function Hero() {
  const reduced = usePrefersReducedMotion()

  return (
    <section id="inicio" className="px-4 pt-28 pb-12 sm:px-6 sm:pt-32 sm:pb-16">
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

          <p className="text-[0.75rem] font-medium tracking-[0.14em] text-zen-500 dark:text-zen-300">
            DEMONSTRAÇÃO INTERATIVA
          </p>

          <h1 className="mt-4 text-[2rem] leading-[1.1] sm:text-[2.75rem] lg:text-[3.25rem]">
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
            <a
              href={NAV_ANCHORS.demo}
              className="zen-gradient inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-[0.9375rem] font-semibold text-white shadow-[0_12px_32px_-16px_rgb(71_156_181/0.9)]"
            >
              Testar a IA
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>

            <a
              href={MAIN_SITE_URL}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-6 text-[0.9375rem] font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Conhecer a Zentera Virtua
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
