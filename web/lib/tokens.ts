// Design tokens mirrored from the extension's dashboard.css dark-mode variables.
// Single source of truth for any non-Tailwind usage (e.g. inline styles, SVG).

export const colors = {
  bg: '#1a1a1a',
  card: '#242424',
  hover: '#2e2e2e',
  border: '#333333',
  text: '#e8e6e3',
  secondary: '#a0a0a0',
  muted: '#6b6b6b',
  accent: '#c15f3c',
  accentLight: 'rgba(193, 95, 60, 0.15)',
  green: '#4caf50',
  yellow: '#f5a623',
  orange: '#ff9800',
  red: '#e53935',
} as const

export type HealthStatus = 'healthy' | 'degrading' | 'critical'

export const statusColor: Record<HealthStatus, string> = {
  healthy: colors.green,
  degrading: colors.yellow,
  critical: colors.red,
}

export const statusLabel: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  degrading: 'Degrading',
  critical: 'Critical',
}
