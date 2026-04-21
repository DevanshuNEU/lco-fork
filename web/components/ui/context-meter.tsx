import type { HealthStatus } from '@/lib/tokens'
import { statusColor } from '@/lib/tokens'

interface ContextMeterProps {
  fill: number
  status: HealthStatus
  label?: string
  className?: string
}

export default function ContextMeter({
  fill,
  status,
  label,
  className = '',
}: ContextMeterProps) {
  const color = statusColor[status]
  const clampedFill = Math.min(100, Math.max(0, fill))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-saar-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${clampedFill}%`,
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}55`,
          }}
        />
      </div>
      {label && (
        <span className="font-mono text-[11px] text-saar-muted whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}
