'use client'

import type { ComponentProps } from 'react'
import { clsx } from 'clsx'
import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const RESET_AFTER_MS = 1500

/**
 * Copies the text of the code block it is placed next to. Reads the
 * rendered <pre> instead of taking the source as a prop, so the code is not
 * shipped a second time in the page payload; line numbers are CSS
 * counters, never part of the text.
 */
export function CopyCodeButton({ className, ...props }: ComponentProps<'button'>) {
  const ref = useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied)
      return
    const timer = setTimeout(setCopied, RESET_AFTER_MS, false)
    return () => clearTimeout(timer)
  }, [copied])

  const copy = async () => {
    const code = ref.current?.parentElement?.querySelector('pre')?.textContent
    if (code === undefined || code === null)
      return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    }
    catch {
      // clipboard unavailable (insecure context, denied permission): the
      // reader can still select the text by hand
    }
  }

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={clsx(
        'grid size-7 cursor-pointer place-items-center rounded-md border',
        'border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800',
        'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100',
        'transition-[color,opacity] duration-200',
        className,
      )}
    >
      {copied
        ? <Check className="size-3.5 text-teal-700 dark:text-teal-500" aria-hidden />
        : <Copy className="size-3.5" aria-hidden />}
      <span className="sr-only" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </button>
  )
}
