import { motion } from 'framer-motion'

import { BrandMark } from '#/components/zentera/Logo'
import { renderMarkdown } from '#/lib/markdown'
import { cn, formatTime, usePrefersReducedMotion } from '#/lib/utils'
import type { ChatMessage as Message } from '#/lib/types'

export function ChatMessageBubble({ message }: { message: Message }) {
  const reduced = usePrefersReducedMotion()
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex w-full items-end gap-2.5',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && <BrandMark className="size-8" />}

      <div
        className={cn(
          'max-w-[85%] min-w-0 sm:max-w-[76%]',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-[0.9375rem] leading-[1.6]',
            'overflow-hidden break-words hyphens-auto',
            isUser
              ? 'rounded-br-md bg-zen-800 text-white shadow-[0_8px_24px_-12px_rgb(48_69_122/0.7)] dark:bg-zen-700'
              : 'rounded-bl-md border border-line bg-bubble-ai text-fg',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        <span
          className={cn(
            'mt-1 block px-1 text-[0.6875rem] tabular-nums text-fg-subtle',
            isUser ? 'text-right' : 'text-left',
          )}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  )
}
