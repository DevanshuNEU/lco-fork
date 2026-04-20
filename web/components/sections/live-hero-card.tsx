'use client'

import { useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import SaarCard from '@/components/ui/saar-card'
import type { HealthStatus } from '@/lib/tokens'

interface CardState {
  inputTokens: number
  outputTokens: number
  cost: string
  status: HealthStatus
  totalRequests: number
  totalTokens: number
  totalCost: string
}

const stages: CardState[] = [
  {
    inputTokens: 2,
    outputTokens: 30,
    cost: '$0.0002',
    status: 'healthy',
    totalRequests: 2,
    totalTokens: 52,
    totalCost: '$0.0002',
  },
  {
    inputTokens: 18,
    outputTokens: 210,
    cost: '$0.0038',
    status: 'healthy',
    totalRequests: 12,
    totalTokens: 4218,
    totalCost: '$0.0692',
  },
  {
    inputTokens: 41,
    outputTokens: 380,
    cost: '$0.0094',
    status: 'degrading',
    totalRequests: 24,
    totalTokens: 19440,
    totalCost: '$0.3188',
  },
  {
    inputTokens: 88,
    outputTokens: 650,
    cost: '$0.0237',
    status: 'critical',
    totalRequests: 38,
    totalTokens: 52800,
    totalCost: '$1.0416',
  },
]

export default function LiveHeroCard() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const [stageIndex, setStageIndex] = useState(0)
  const [prefersReduced, setPrefersReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (prefersReduced) return
    const unsubscribe = scrollY.on('change', (y) => {
      const vh = window.innerHeight
      // Map 0-2.5 viewport heights of scroll to the 4 stages
      const progress = Math.min(y / (vh * 2.5), 1)
      const idx = Math.min(Math.floor(progress * stages.length), stages.length - 1)
      setStageIndex(idx)
    })
    return unsubscribe
  }, [scrollY, prefersReduced])

  const stage = stages[stageIndex]

  return (
    <div ref={ref}>
      <SaarCard
        inputTokens={stage.inputTokens}
        outputTokens={stage.outputTokens}
        cost={stage.cost}
        status={stage.status}
        totalRequests={stage.totalRequests}
        totalTokens={stage.totalTokens}
        totalCost={stage.totalCost}
        className="transition-all duration-500"
      />
    </div>
  )
}
