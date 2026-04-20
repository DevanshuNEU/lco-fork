'use client'

import { useEffect, useRef, useState } from 'react'
import ContextMeter from '@/components/ui/context-meter'
import type { HealthStatus } from '@/lib/tokens'

interface Turn {
  n: number
  user: string
  fill: number
  coaching?: string
  status: HealthStatus
}

const turns: Turn[] = [
  { n: 1, user: 'Build me a React component for the dashboard.', fill: 2, status: 'healthy' },
  { n: 4, user: 'Add TypeScript types and error handling.', fill: 8, status: 'healthy' },
  { n: 8, user: 'Now refactor the state management.', fill: 16, status: 'healthy' },
  { n: 12, user: 'Add unit tests using Vitest.', fill: 24, status: 'healthy' },
  { n: 16, user: 'Make it responsive for mobile.', fill: 34, status: 'healthy' },
  {
    n: 20,
    user: 'Add dark mode support.',
    fill: 46,
    status: 'healthy',
    coaching: 'Context at 46%. Still healthy, but this conversation is growing.',
  },
  {
    n: 24,
    user: 'Now add animations.',
    fill: 58,
    status: 'healthy',
    coaching: 'Consider starting a focused chat for the animation work.',
  },
  {
    n: 28,
    user: 'Integrate with the backend API.',
    fill: 70,
    status: 'degrading',
    coaching: 'Context degrading. Models lose precision past this threshold.',
  },
  {
    n: 32,
    user: 'Add authentication.',
    fill: 82,
    status: 'degrading',
    coaching: 'Start a new chat now. Carry only what the next task needs.',
  },
  {
    n: 36,
    user: 'Write the full test suite.',
    fill: 91,
    status: 'critical',
    coaching: 'Context nearly full. Start a new chat, or use Claude Projects.',
  },
  {
    n: 40,
    user: 'Oh wait, what were the TypeScript types from turn 4?',
    fill: 98,
    status: 'critical',
    coaching: 'The model has forgotten. This conversation is spent.',
  },
]

export default function ContextRotDemo() {
  const ref = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let count = 0
          const interval = setInterval(() => {
            count++
            setVisibleCount(count)
            if (count >= turns.length) clearInterval(interval)
          }, 220)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const current = turns[Math.min(visibleCount - 1, turns.length - 1)]

  return (
    <section className="py-24 border-t border-saar-border" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-xl mb-12">
          <p className="font-mono text-xs text-saar-muted uppercase tracking-widest mb-4">
            Context rot in real time
          </p>
          <h2 className="font-serif text-4xl text-saar-text leading-tight">
            You start fresh. The model doesn&apos;t stay that way.
          </h2>
          <p className="mt-4 text-saar-secondary leading-relaxed">
            Every message you send adds to a context window with a hard limit.
            Past 70% utilization, frontier models start forgetting early context.
            Saar tracks it so you don&apos;t have to guess.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Simulated chat */}
          <div className="space-y-2.5 max-h-96 overflow-hidden relative">
            {turns.slice(0, visibleCount).map((turn) => (
              <div key={turn.n} className="rounded-lg border border-saar-border bg-saar-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-saar-muted">turn {turn.n}</span>
                </div>
                <p className="text-sm text-saar-text">{turn.user}</p>
              </div>
            ))}
            {/* Fade at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-saar-bg to-transparent" />
          </div>

          {/* Live meter + coaching */}
          <div className="rounded-xl border border-saar-border bg-saar-card p-5">
            <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-saar-accent mb-4">
              S A A R
            </div>

            {current && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        current.status === 'healthy'
                          ? '#4caf50'
                          : current.status === 'degrading'
                          ? '#f5a623'
                          : '#e53935',
                    }}
                  />
                  <span className="text-sm capitalize text-saar-secondary">
                    {current.status}
                  </span>
                  <span className="ml-auto font-mono text-xs text-saar-muted">
                    turn {current.n} / 40
                  </span>
                </div>

                <ContextMeter
                  fill={current.fill}
                  status={current.status}
                  label={`${current.fill}% context`}
                  className="mb-4"
                />

                {current.coaching && (
                  <div className="rounded-md bg-saar-hover border border-saar-border p-3 text-sm text-saar-secondary leading-relaxed">
                    {current.coaching}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
