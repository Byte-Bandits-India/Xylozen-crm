// Chart-related static data and color schemes

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--kanban-board-circle-purple)',
  'var(--kanban-board-circle-pink)',
] as const

export type SpendBreakdownItem = {
  name: string
  value: number
  share: string
  color?: string
}

export const SPEND_BREAKDOWN_FALLBACK_DATA = [
  { name: 'salaries', value: 0, share: '0.0' },
  { name: 'professional fees', value: 0, share: '0.0' },
  { name: 'technology', value: 0, share: '0.0' },
  { name: 'utilities', value: 0, share: '0.0' },
] satisfies Omit<SpendBreakdownItem, 'color'>[]
