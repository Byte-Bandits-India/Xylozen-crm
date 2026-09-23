"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";


type ChartDataPoint = {
    label: string
    value: number
}

type CustomDotProps = {
    cx?: number
    cy?: number
    value?: number
    index?: number
    data?: ChartDataPoint[]
}

const formatYAxis = (value: number) => `$${value / 1000}k`

const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, value, index, data } = props
    if (typeof index === 'undefined' || !data || typeof value === 'undefined') return null
    const prev = data[index - 1]?.value ?? 0
    const next = data[index + 1]?.value ?? 0
    if (value >= prev && value >= next && value > 3500) {
        return <circle cx={cx} cy={cy} r={5} fill="#2DA89A" stroke="white" strokeWidth={2} />
    }
    return null
}

type TotalExpenseChartProps = {
  data?: unknown[]
}

export default function TotalExpenseChart({ data: externalData }: TotalExpenseChartProps) {
    const [filter, setFilter] = useState<"days" | "week">("week")

    let chartData: ChartDataPoint[] = []
    let total = 0

    if (Array.isArray(externalData) && externalData.length > 0) {
        chartData = externalData.map((d: unknown) => {
            const item = d as Record<string, unknown>
            return {
                label: item.date ? String(item.date).substring(5) : (item.label as string || ""),
                value: Number(item.expenses ?? item.value ?? 0)
            }
        })
        total = chartData.reduce((sum, d) => sum + d.value, 0)
    }

    // Apply filtering based on "week" vs "days"
    let displayData = chartData

    if (filter === "week" && chartData.length > 7) {
        // Aggregate data into weekly buckets (aprox 4 weeks)
        const weeklyData: ChartDataPoint[] = []
        const bucketSize = Math.ceil(chartData.length / 4); // Dynamic split into 4 logical weeks
        
        for (let i = 0; i < chartData.length; i += bucketSize) {
            const chunk = chartData.slice(i, i + bucketSize);
            const sum = chunk.reduce((acc, curr) => acc + curr.value, 0);
            weeklyData.push({
                label: `Week ${weeklyData.length + 1}`,
                value: sum
            });
        }
        displayData = weeklyData;
    }

    const data = displayData;

    return (
        <Card className="w-full max-w-[960px] rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
                {/* Top section: title row + rupees box */}
                <div className="flex items-stretch">
                    {/* Left: title + switch */}
                    <div className="flex-1 flex items-center justify-between px-6 pt-5 pb-3">
                        <h2 className="text-[18px] font-semibold text-gray-800">
                            Total expence this month
                        </h2>

                        {/* Pill Switch */}
                        <div className="flex items-center bg-gray-100 rounded-full p-[3px]">
                            <button
                                onClick={() => setFilter("days")}
                                className={`px-4 py-[5px] rounded-full text-[13px] font-medium transition-all duration-200 ${filter === "days"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                days
                            </button>
                            <button
                                onClick={() => setFilter("week")}
                                className={`px-4 py-[5px] rounded-full text-[13px] font-medium transition-all duration-200 ${filter === "week"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-400 hover:text-gray-600"
                                    }`}
                            >
                                week
                            </button>
                        </div>
                    </div>

                    {/* Right: Rupees box — top-right corner, bordered left + bottom */}
                    <div className="border-l border-b border-gray-200 px-6 pt-4 pb-4 flex flex-col justify-center min-w-[150px]">
                        <span className="text-[13px] text-gray-500 font-medium leading-none mb-1">
                            Rupees
                        </span>
                        <span className="text-[34px] font-black text-gray-900 leading-none tracking-tight">
                            {total.toLocaleString("en-IN")}
                        </span>
                    </div>
                </div>

                {/* Chart */}
                <div className="px-2 pb-4">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.55} />
                                    <stop offset="100%" stopColor="#B2EBE8" stopOpacity={0.04} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="4 4" stroke="#e0e0e0" vertical={false} />

                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                                tickFormatter={(v) => v.replace(/\d+$/, "")}
                            />

                            <YAxis
                                tickFormatter={formatYAxis}
                                tick={{ fontSize: 12, fill: "#9ca3af" }}
                                axisLine={false}
                                tickLine={false}
                                domain={[1000, 6000]}
                                ticks={[1000, 2000, 3000, 4000, 5000, 6000]}
                            />

                            <Tooltip
                                formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]}
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid #e5e7eb",
                                    fontSize: 13,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                                cursor={{ stroke: "#2DA89A", strokeWidth: 1, strokeDasharray: "4 4" }}
                            />

                            <Area
                                type="linear"
                                dataKey="value"
                                stroke="#2DA89A"
                                strokeWidth={2}
                                fill="url(#tealGradient)"
                                dot={(props: CustomDotProps) => <CustomDot {...props} data={data} />}
                                activeDot={{ r: 5, fill: "#2DA89A", stroke: "white", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}