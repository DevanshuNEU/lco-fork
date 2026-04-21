import type { HealthStatus } from '@/lib/tokens'
import { statusColor, statusLabel } from '@/lib/tokens'

interface SaarCardProps {
  inputTokens: number
  outputTokens: number
  cost: string
  status: HealthStatus
  totalRequests: number
  totalTokens: number
  totalCost: string
  model?: string
  className?: string
}

export default function SaarCard({
  inputTokens,
  outputTokens,
  cost,
  status,
  totalRequests,
  totalTokens,
  totalCost,
  model = 'Sonnet 4.6',
  className = '',
}: SaarCardProps) {
  const dot = statusColor[status]
  const label = statusLabel[status]

  return (
    <div
      className={`rounded-xl border border-saar-border bg-saar-card px-3.5 py-3 min-w-[220px] shadow-xl ${className}`}
    >
      <div className="mb-2">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-saar-accent font-semibold">
          S A A R
        </span>
      </div>

      <div className="text-[11px] text-saar-secondary font-mono mb-2">
        this reply{' '}
        <span className="text-saar-text">~{inputTokens} in</span>
        {' · '}
        <span className="text-saar-text">~{outputTokens} out</span>
        {' · '}
        <span className="text-saar-accent">{cost}</span>
      </div>

      <div className="flex items-center gap-1.5 mb-2.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: dot, boxShadow: `0 0 4px ${dot}88` }}
        />
        <span className="text-[12px] font-medium" style={{ color: dot }}>
          {label}
        </span>
      </div>

      <div className="h-px bg-saar-border mb-2.5" />

      <div className="text-[11px] text-saar-muted font-mono">
        <span className="text-saar-secondary">total</span>{' '}
        {totalRequests} req{' · '}~{totalTokens} tok{' · '}
        <span className="text-saar-secondary">{totalCost}</span>
      </div>

      {model && (
        <div className="mt-2 text-[10px] text-saar-muted font-mono">{model}</div>
      )}
    </div>
  )
}
