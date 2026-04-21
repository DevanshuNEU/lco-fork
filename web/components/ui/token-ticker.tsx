'use client'

import { useEffect, useRef, useState } from 'react'

interface TokenTickerProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export default function TokenTicker({
  value,
  prefix = '',
  suffix = '',
  duration = 320,
  className = '',
}: TokenTickerProps) {
  const [displayed, setDisplayed] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = 0
    const end = value

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // cubic-bezier ease-out approximation
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(start + (end - start) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      startRef.current = null
    }
  }, [value, duration])

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayed.toLocaleString()}
      {suffix}
    </span>
  )
}
