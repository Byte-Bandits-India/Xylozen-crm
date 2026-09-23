import { useEffect, useState } from "react"
import { Card, Row, Col, Statistic, Alert, Spin, message, Divider } from "antd"
import { LineChartOutlined, FileSyncOutlined } from "@ant-design/icons"
import api from "@/api/axios"

type FinancialSummary = {
    totalRevenue?: number
    totalExpenses?: number
    netIncome?: number
    totalIncome?: number
    netProfit?: number
}

type TaxSummary = {
    estimatedTax?: number
    taxableIncome?: number
    totalTaxCollected?: number
    totalTaxPaid?: number
    netTaxLiability?: number
}

export default function ReportsDashboard() {
    const [finSummary, setFinSummary] = useState<FinancialSummary | null>(null)
    const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const [finRes, taxRes] = await Promise.all([
                    api.get('/reports/financial-summary').catch(() => ({ data: null })),
                    api.get('/reports/tax-summary').catch(() => ({ data: null }))
                ]);

                setFinSummary(finRes.data?.data || finRes.data || {})
                setTaxSummary(taxRes.data?.data || taxRes.data || {})
            } catch {
                message.error("Failed to fetch report data")
            } finally {
                setLoading(false)
            }
        }

        fetchReports()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Spin size="large" tip="Loading Reports..." />
            </div>
        );
    }

    if (!finSummary && !taxSummary) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <Alert message="Report Data Unavailable" description="Unable to load financial and tax summaries from the server." type="warning" showIcon />
            </div>
        );
    }

    const { totalIncome = 0, totalExpenses = 0, netProfit = 0 } = finSummary || {};
    const { totalTaxCollected = 0, totalTaxPaid = 0, netTaxLiability = 0 } = taxSummary || {};

    const profitColor = netProfit >= 0 ? '#10b981' : '#ef4444';
    const taxColor = netTaxLiability >= 0 ? '#fa8c16' : '#10b981';

    return (
        <div className="p-6 bg-gray-50 min-h-screen w-full">
            <h1 className="text-2xl font-semibold text-brand-blue mb-6">Financial Reports</h1>

            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card title={<><LineChartOutlined /> Financial Summary</>} className="h-full shadow-sm rounded-xl border-gray-100">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic title="Total Income (Invoices PAID)" value={totalIncome} prefix="₹" precision={2} valueStyle={{ color: '#405189' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Total Expenses (PAID)" value={totalExpenses} prefix="₹" precision={2} valueStyle={{ color: '#d97706' }} />
                            </Col>
                            <Divider className="my-2" />
                            <Col span={24}>
                                <Statistic title="Net Profit/Loss" value={netProfit} prefix="₹" precision={2} valueStyle={{ color: profitColor, fontWeight: 'bold' }} />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title={<><FileSyncOutlined /> Tax Summary (Estimated)</>} className="h-full shadow-sm rounded-xl border-gray-100">
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Statistic title="Tax Collected (from Invoices)" value={totalTaxCollected} prefix="₹" precision={2} valueStyle={{ color: '#405189' }} />
                            </Col>
                            <Col span={12}>
                                <Statistic title="Tax Paid (on Expenses)" value={totalTaxPaid} prefix="₹" precision={2} valueStyle={{ color: '#10b981' }} />
                            </Col>
                            <Divider className="my-2" />
                            <Col span={24}>
                                <Statistic title="Net Tax Liability" value={netTaxLiability} prefix="₹" precision={2} valueStyle={{ color: taxColor, fontWeight: 'bold' }} />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            <h2 className="text-xl font-semibold text-brand-blue mb-4 mt-8">Recent Cash Flow Sync</h2>
            <Card className="shadow-sm rounded-xl border-gray-100 p-2 text-center text-gray-500">
                Detailed ledger views are currently maintained via third-party accounting software integration overrides.
                Full ledger and P&L export features will be available in v2.0.
            </Card>
        </div>
    );
}
