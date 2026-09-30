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

const formatYAxis = (value: number) => {
    if (value === 0) return "₹0";
    if (value >= 1000) return `₹${value / 1000}k`;
    return `₹${value}`;
};

const DEFAULT_WEEKLY_ZERO_DATA: ChartDataPoint[] = [
    { label: "Week 1", value: 0 },
    { label: "Week 2", value: 0 },
    { label: "Week 3", value: 0 },
    { label: "Week 4", value: 0 },
];

const DEFAULT_DAYS_ZERO_DATA: ChartDataPoint[] = [
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 },
];

const CustomDot = (props: CustomDotProps) => {
    const { cx, cy, value, index, data } = props;
    if (typeof index === 'undefined' || !data || typeof value === 'undefined' || value === 0) return null;
    const prev = data[index - 1]?.value ?? 0;
    const next = data[index + 1]?.value ?? 0;
    if (value >= prev && value >= next && value > 0) {
        return <circle cx={cx} cy={cy} r={5} fill="#2DA89A" stroke="white" strokeWidth={2} />;
    }
    return null;
};

type TotalExpenseChartProps = {
  data?: unknown[];
};

export default function TotalExpenseChart({ data: externalData }: TotalExpenseChartProps) {
    const [filter, setFilter] = useState<"days" | "week">("week");

    let chartData: ChartDataPoint[] = [];
    let total = 0;

    if (Array.isArray(externalData) && externalData.length > 0) {
        chartData = externalData.map((d: unknown) => {
            const item = d as Record<string, unknown>;
            return {
                label: item.date ? String(item.date).substring(5) : (item.label as string || ""),
                value: Number(item.expenses ?? item.value ?? 0),
            };
        });
        total = chartData.reduce((sum, d) => sum + d.value, 0);
    }

    // Apply filtering based on "week" vs "days"
    let displayData: ChartDataPoint[] = [];

    if (chartData.length === 0) {
        displayData = filter === "week" ? DEFAULT_WEEKLY_ZERO_DATA : DEFAULT_DAYS_ZERO_DATA;
    } else if (filter === "week") {
        if (chartData.length > 7) {
            // Aggregate data into weekly buckets (approx 4 weeks)
            const weeklyData: ChartDataPoint[] = [];
            const bucketSize = Math.ceil(chartData.length / 4);
            
            for (let i = 0; i < chartData.length; i += bucketSize) {
                const chunk = chartData.slice(i, i + bucketSize);
                const sum = chunk.reduce((acc, curr) => acc + curr.value, 0);
                weeklyData.push({
                    label: `Week ${weeklyData.length + 1}`,
                    value: sum,
                });
            }
            displayData = weeklyData;
        } else {
            displayData = chartData;
        }
    } else {
        displayData = chartData;
    }

    const data = displayData;
    const maxValue = Math.max(...data.map((d) => d.value), 0);
    const yAxisDomain = maxValue === 0 ? [0, 5000] : [0, Math.ceil((maxValue * 1.2) / 1000) * 1000];
    const yAxisTicks = maxValue === 0 ? [0, 1000, 2000, 3000, 4000, 5000] : undefined;

    return (
        <Card className="w-full max-w-[960px] rounded-xl border border-border shadow-xs bg-card text-card-foreground overflow-hidden">
            <CardContent className="p-0">
                {/* Top section: title row + rupees box */}
                <div className="flex items-stretch">
                    {/* Left: title + switch */}
                    <div className="flex-1 flex items-center justify-between px-6 pt-5 pb-3">
                        <h2 className="text-[18px] font-semibold text-foreground">
                            Total expense this month
                        </h2>

                        {/* Pill Switch */}
                        <div className="flex items-center bg-muted rounded-full p-[3px]">
                            <button
                                onClick={() => setFilter("days")}
                                className={`px-4 py-[5px] rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer ${filter === "days"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                days
                            </button>
                            <button
                                onClick={() => setFilter("week")}
                                className={`px-4 py-[5px] rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer ${filter === "week"
                                    ? "bg-card text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                week
                            </button>
                        </div>
                    </div>

                    {/* Right: Rupees box — top-right corner, bordered left + bottom */}
                    <div className="border-l border-b border-border px-6 pt-4 pb-4 flex flex-col justify-center min-w-[150px]">
                        <span className="text-[13px] text-muted-foreground font-medium leading-none mb-1">
                            Rupees
                        </span>
                        <span className="text-[34px] font-black text-foreground leading-none tracking-tight">
                            ₹{total.toLocaleString("en-IN")}
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
                                    <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.4} />
                                    <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />

                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                                tickFormatter={(v) => String(v)}
                            />

                            <YAxis
                                tickFormatter={formatYAxis}
                                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                                axisLine={false}
                                tickLine={false}
                                domain={yAxisDomain}
                                ticks={yAxisTicks}
                            />

                            <Tooltip
                                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Spend"]}
                                contentStyle={{
                                    borderRadius: 8,
                                    border: "1px solid var(--border)",
                                    background: "var(--popover)",
                                    color: "var(--popover-foreground)",
                                    fontSize: 13,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                                cursor={{ stroke: "var(--brand-blue)", strokeWidth: 1, strokeDasharray: "4 4" }}
                            />

                            <Area
                                type="linear"
                                dataKey="value"
                                stroke="var(--brand-blue)"
                                strokeWidth={2}
                                fill="url(#tealGradient)"
                                dot={(props: CustomDotProps) => <CustomDot {...props} data={data} />}
                                activeDot={{ r: 5, fill: "var(--brand-blue)", stroke: "white", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}