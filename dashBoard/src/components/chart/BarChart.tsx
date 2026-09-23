"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

export const description = "An interactive line chart"

export interface ChartDataPoint {
    date: string;
    revenue: number;
    expenses: number;
}

const chartConfig = {
    views: {
        label: "Amount",
    },
    revenue: {
        label: "Revenue",
        color: "hsl(142 71% 45%)", // Greenish
    },
    expenses: {
        label: "Expense",
        color: "hsl(348 100% 61%)", // Reddish
    },
} satisfies ChartConfig

export function ChartBarInteractive({ data = [] }: { data: ChartDataPoint[] }) {
    const [activeChart, setActiveChart] = React.useState<"revenue" | "expenses">("revenue")

    const total = React.useMemo(
        () => ({
            revenue: data.reduce((acc, curr) => acc + (curr.revenue || 0), 0),
            expenses: data.reduce((acc, curr) => acc + (curr.expenses || 0), 0),
        }),
        [data]
    )

    return (
        <Card className="py-0 h-full flex flex-col items-stretch">
            <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>
                        Timeline of Revenue and Expenses
                    </CardDescription>
                </div>
                <div className="flex">
                    {(["revenue", "expenses"] as const).map((key) => {
                        const chart = key as keyof typeof chartConfig
                        return (
                            <button
                                key={chart}
                                data-active={activeChart === chart}
                                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                                onClick={() => setActiveChart(key)}
                            >
                                <span className="text-muted-foreground text-xs">
                                    {chartConfig[chart].label}
                                </span>
                                <span className="text-lg leading-none font-bold sm:text-3xl">
                                    ₹{Number(total[key] || 0).toLocaleString()}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:p-6 flex-1">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                if (!value) return "";
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[150px]"
                                    nameKey="views"
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }}
                                />
                            }
                        />
                        {activeChart === "revenue" && (
                            <Line
                                dataKey="revenue"
                                type="natural"
                                stroke="var(--color-revenue)"
                                strokeWidth={2}
                                dot={{ fill: "var(--color-revenue)", r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        )}
                        <Line
                            dataKey="expenses"
                            type="natural"
                            stroke="var(--color-expenses)"
                            strokeWidth={2}
                            dot={{ fill: "var(--color-expenses)", r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
