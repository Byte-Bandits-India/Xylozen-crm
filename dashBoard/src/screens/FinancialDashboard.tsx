import { TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigProvider, theme } from 'antd'
import 'antd/dist/reset.css'
import { ChartBarHorizontal } from '@/components/chart/HorizontalBarChart'
import DashboardTable from '@/components/table/DashboardTable'
import { DatePickerWithRange } from '@/components/DatePickerWithRange'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import ResponsiveSidebar from '@/components/Sidebar/ResponsiveSidebar'
import SpendBreakdown from '@/components/chart/SpendBreakdownChart'
import TotalExpenseChart from '@/components/chart/TotalExpenseChart'
import { ThunderboltOutlined } from '@ant-design/icons'
import type { DashboardOverview, Contribution, ChartData } from '@/types'

const SummaryCard = ({
    title,
    value,
    change,
    isPositive,
}: {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
}) => (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full">
        <div>
            <p className="text-sm font-medium text-muted-foreground mb-1.5">{title}</p>
            <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">{value}</h3>
        </div>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/60">
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                    isPositive 
                        ? 'bg-success-light text-emerald-600 dark:text-emerald-400' 
                        : 'bg-destructive-light text-destructive'
                }`}
            >
                {isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
                {change}
            </span>
            <a
                href="#"
                className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium transition-colors"
                onClick={(e) => e.preventDefault()}
            >
                View details
            </a>
        </div>
    </div>
);

const FinancialDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 2880
        }
        return false
    })

    const { data: overview } = useQuery<DashboardOverview>({
        queryKey: ['dashboard-overview'],
        queryFn: async () => {
            const res = await apiClient.get('/dashboard/overview')
            return res.data?.data || res.data || null
        },
    })

    const { data: contributions = [] } = useQuery<Contribution[]>({
        queryKey: ['dashboard-contributions'],
        queryFn: async () => {
            const res = await apiClient.get('/dashboard/contributions')
            if (res.data?.success && Array.isArray(res.data?.data)) {
                return res.data.data
            }
            return Array.isArray(res.data) ? res.data : []
        },
    })

    const { data: chartDataPayload } = useQuery<ChartData>({
        queryKey: ['dashboard-chart-data'],
        queryFn: async () => {
            const res = await apiClient.get('/dashboard/chart-data')
            return res.data?.data || res.data || null
        },
    })

    useEffect(() => {
        const handleResize = () => {
            const isXlScreen = window.innerWidth >= 1700
            if (isXlScreen && !sidebarOpen) {
                setSidebarOpen(true)
            } else if (!isXlScreen && sidebarOpen) {
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [sidebarOpen])

    return (
        <div className="flex w-full min-h-screen bg-background text-foreground">
            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'xl:mr-[250px]' : ''}`}>
                <div className="space-y-6 relative overflow-x-hidden p-4 md:p-6 max-w-[1800px] mx-auto">
                    {/* Header Banner */}
                    <div className="flex flex-col px-5 py-4 sm:flex-row sm:items-center justify-between gap-4 bg-card text-card-foreground rounded-xl border border-border shadow-xs">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                Expenditure Control Center
                            </h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <DatePickerWithRange />
                            <Button
                                size="sm"
                                className="h-9 bg-brand-blue text-primary-foreground hover:bg-brand-blue/90 shadow-xs cursor-pointer"
                                onClick={() => setSidebarOpen((prev) => !prev)}
                            >
                                <ThunderboltOutlined className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Overview & Summary Section */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-4 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-xs h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-sm font-medium text-muted-foreground">Total Expenditure</p>
                                    {(() => {
                                        const changeStr = overview?.expenditureChange !== undefined ? `${overview.expenditureChange}%` : "+ 0%";
                                        const isPositive = !String(changeStr).includes('-');
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                                                isPositive ? 'bg-success-light text-emerald-600 dark:text-emerald-400' : 'bg-destructive-light text-destructive'
                                            }`}>
                                                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                {changeStr}
                                            </span>
                                        );
                                    })()}
                                </div>

                                <div className="mt-4">
                                    <h2 className="text-4xl font-extrabold text-foreground tracking-tight">
                                        ₹{(overview?.totalExpenditure || 0).toLocaleString()}
                                    </h2>
                                </div>
                            </div>

                            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <SummaryCard
                                    title="Fixed Costs"
                                    value={`₹${(overview?.fixedCosts || 0).toLocaleString()}`}
                                    change={overview?.fixedCostsChange !== undefined ? `${overview.fixedCostsChange}%` : "0%"}
                                    isPositive={!String(overview?.fixedCostsChange || "0").includes('-')}
                                />
                                <SummaryCard
                                    title="Operational Costs"
                                    value={`₹${(overview?.operationalCosts || 0).toLocaleString()}`}
                                    change={overview?.operationalCostsChange !== undefined ? `${overview.operationalCostsChange}%` : "0%"}
                                    isPositive={!String(overview?.operationalCostsChange || "0").includes('-')}
                                />
                                <ChartBarHorizontal data={contributions} />
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-4">
                                <SpendBreakdown data={chartDataPayload?.pieChartData as {name: string; value: number; share: string; color: string}[] | undefined} />
                            </div>

                            <div className="lg:col-span-8 bg-card text-card-foreground rounded-xl border border-border shadow-xs overflow-hidden">
                                <TotalExpenseChart data={chartDataPayload?.barChartData as unknown[] | undefined} />
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-xs p-4 md:p-5">
                            <ConfigProvider
                                theme={{
                                    algorithm: theme.defaultAlgorithm,
                                    components: {
                                        Table: {
                                            fontSize: 14,
                                            padding: 12,
                                            paddingContentVerticalLG: 12,
                                            paddingContentHorizontalLG: 16,
                                        },
                                        Pagination: {
                                            colorPrimary: 'var(--brand-blue)',
                                        },
                                    },
                                }}
                            >
                                <DashboardTable />
                            </ConfigProvider>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive Sidebar (Right side) */}
            <ResponsiveSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
    );
};

export default FinancialDashboard;