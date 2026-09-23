"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { CHART_COLORS, SPEND_BREAKDOWN_FALLBACK_DATA, type SpendBreakdownItem } from "@/data/charts";

type SpendBreakdownProps = {
  data?: SpendBreakdownItem[]
}

export default function SpendBreakdown({ data: externalData }: SpendBreakdownProps) {
    let data: SpendBreakdownItem[] = SPEND_BREAKDOWN_FALLBACK_DATA.map((item, i) => ({
        ...item,
        color: CHART_COLORS[i % CHART_COLORS.length]
    }))

    if (Array.isArray(externalData)) {
        const totalValue = externalData.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
        data = externalData.map((d, i) => ({
            name: d.name,
            value: Number(d.value) || 0,
            share: totalValue > 0 ? ((Number(d.value) / totalValue) * 100).toFixed(1) : "0.0",
            color: d.color || CHART_COLORS[i % CHART_COLORS.length]
        }))
    }

    const TOTAL = data.reduce((sum, d) => sum + d.value, 0);
    return (
        <Card className="w-full rounded-2xl shadow-sm border border-gray-100 bg-white py-3.5 px-5">
            <CardContent className="p-0 flex flex-col items-center gap-4">

                {/* Donut Chart with center label overlay */}
                <div className="relative flex items-center justify-center w-[200px] h-[200px]">
                    <PieChart width={200} height={200}>
                        <Pie
                            data={data}
                            cx={96}
                            cy={96}
                            innerRadius={62}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`]}
                            contentStyle={{ borderRadius: 8, fontSize: 13 }}
                        />
                    </PieChart>

                    {/* Absolute center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[22px] font-bold text-gray-900 leading-tight">
                            ${TOTAL.toLocaleString()}
                        </span>
                        <span className="text-[12px] text-gray-400 mt-0.5">total spend</span>
                    </div>
                </div>

                {/* Legend / Table */}
                <div className="w-full">
                    {/* Header Row */}
                    <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                            Team
                        </span>
                        <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                            Amount / Share
                        </span>
                    </div>

                    <div className="border-t border-gray-100" />

                    {/* Data Rows */}
                    {data.map((item, i) => (
                        <div key={i}>
                            <div className="flex items-center justify-between py-[10px]">
                                {/* Left: color bar + name */}
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="inline-block w-1.5 h-5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[15px] text-gray-800">{item.name}</span>
                                </div>

                                {/* Right: amount + share */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[15px] font-semibold text-gray-900">
                                        ${item.value.toLocaleString()}
                                    </span>
                                    <span className="text-[13px] text-gray-400 w-10 text-right">
                                        {item.share}%
                                    </span>
                                </div>
                            </div>
                            {i < data.length - 1 && <div className="border-t border-gray-100" />}
                        </div>
                    ))}
                </div>

            </CardContent>
        </Card>
    );
}