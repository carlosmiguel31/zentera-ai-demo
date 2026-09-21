import { motion } from 'framer-motion'

import { BrandMark } from '#/components/zentera/Logo'
import { BRAND } from '#/config/site'
import { usePrefersReducedMotion } from '#/lib/utils'

/** "Zentera IA está digitando" com tres pontos, no lugar da proxima bolha. */
export function TypingIndicator() {
  const reduced = usePrefersReducedMotion()

  return (
    <div className="flex items-end gap-2.5">
      <BrandMark className="size-8" />

      <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-line bg-bubble-ai px-4 py-3">
        <span className="text-[0.8125rem] text-fg-subtle">
          {BRAND.agentName} está digitando
        </span>

        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="size-1.5 rounded-full bg-zen-400"
              animate={reduced ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                delay: index * 0.16,
                ease: 'easeInOut',
              }}
              style={reduced ? { opacity: 0.6 } : undefined}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
