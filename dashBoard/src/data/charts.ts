// Chart-related static data and color schemes

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'oklch(0.6267 0.2325 303.86)', // purple
  'oklch(0.6559 0.2117 354.34)', // pink
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
