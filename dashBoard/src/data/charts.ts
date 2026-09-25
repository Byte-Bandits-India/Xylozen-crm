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
  { name: 'salaries', value: 950, share: '35.8' },
  { name: 'professional fees', value: 680, share: '25.6' },
  { name: 'technology', value: 520, share: '19.6' },
  { name: 'utilities', value: 310, share: '11.7' },
] satisfies Omit<SpendBreakdownItem, 'color'>[]
