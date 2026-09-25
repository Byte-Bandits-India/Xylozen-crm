"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export interface ContributionData {
    contributorName?: string
    label?: string
    percent?: number
    percentage?: number
    color?: string
    amount?: number | string
    totalAmount?: number | string
}

export function ChartBarHorizontal({ data }: { data: ContributionData[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const safeData = Array.isArray(data) ? data : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Capital & Contributions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {safeData.slice(0, 2).map((item, index) => {
                    const label = item.contributorName || item.label || `Contributor ${index + 1}`;
                    const rawAmount = item.amount ?? item.totalAmount;
                    const amountStr = typeof rawAmount === 'number' ? `₹${rawAmount.toLocaleString()}` : rawAmount;

                    const color = item.color || '#3b82f6';
                    const isTailwindClass = typeof color === 'string' && (color.startsWith('bg-') || /^[a-z]+-\d{3}$/.test(color));
                    const safeColorClass = isTailwindClass ? (color.startsWith('bg-') ? color : `bg-${color}`) : '';

                    // Safely parse number ignoring symbols like ₹ or %
                    const parseNumber = (val: number | string | undefined): number => {
                        if (typeof val === 'number') return val
                        if (typeof val === 'string') return Number(val.replace(/[^0-9.-]+/g, "")) || 0
                        return 0
                    }

                    const numericAmount = parseNumber(rawAmount)
                    const totalAmount = safeData.reduce((sum, d) => sum + parseNumber(d.amount ?? d.totalAmount), 0)
                    const calculatedPercent = totalAmount > 0 ? (numericAmount / totalAmount) * 100 : 0

                    let percent = item.percent ?? item.percentage
                    percent = percent !== undefined ? parseNumber(percent) : calculatedPercent

                    return (
                        <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-foreground font-medium w-20 shrink-0 truncate" title={label}>
                                {label}
                            </span>
                            <div
                                className="flex-1 relative"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <div className="h-6 bg-muted rounded-sm overflow-hidden">
                                    <div
                                        className={`h-full rounded-sm transition-all duration-700 ease-out ${safeColorClass}`}
                                        style={{
                                            width: `${percent}%`,
                                            ...(safeColorClass ? {} : { backgroundColor: color || 'var(--brand-blue)' })
                                        }}
                                    />
                                </div>
                                {/* Tooltip */}
                                {hoveredIndex === index && (
                                    <div
                                        className="absolute -top-14 bg-popover border border-border text-popover-foreground text-sm rounded-lg shadow-md px-3 py-2 whitespace-nowrap z-10 pointer-events-none"
                                        style={{ left: `${percent / 2}%`, transform: 'translateX(-50%)' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="inline-block w-2.5 h-2.5 rounded-[2px] shrink-0"
                                                style={{ backgroundColor: color || 'var(--brand-blue)' }}
                                            />
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="font-semibold text-foreground ml-1">{amountStr}</span>
                                        </div>
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    )
}
