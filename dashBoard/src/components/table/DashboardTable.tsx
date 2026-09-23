import { useState } from 'react'
import { Card, Table, Pagination } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getColumns } from './columns.tsx'
import { FileTextOutlined } from '@ant-design/icons'
import { apiClient } from '@/lib/apiClient'
import { useAuth } from '@/context/AuthContext'
import type { Expense } from '@/types'

type ExpenseResponse = {
  success: boolean
  data: Expense[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

const DashboardTable = () => {
  const { isAdmin, isSuperAdmin } = useAuth()

  const [activeTab, setActiveTab] = useState<'fixed' | 'operational'>('fixed')
  const [page, setPage] = useState(1)

  const { data: response, isLoading, refetch } = useQuery<ExpenseResponse>({
    queryKey: ['expenses', activeTab, page],
    queryFn: async () => {
      const endpoint =
        activeTab === 'fixed'
          ? '/expenses?expenseType=FIXED&sortBy=createdAt&sortOrder=asc'
          : '/expenses?expenseType=OPERATIONAL&sortBy=createdAt&sortOrder=asc'

      const res = await apiClient.get<ExpenseResponse>(`${endpoint}&page=${page}&pageSize=5`)
      return res.data
    },
  })

  const data = response?.data || []
  const total = response?.pagination?.total || 0

  const handleTabChange = (tab: 'fixed' | 'operational') => {
    setActiveTab(tab)
    setPage(1)
  }

  return (
    <Card
      className="w-full h-full flex flex-col"
      styles={{
        header: {
          padding: 0,
        },
        body: {
          padding: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
      title={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 pt-4 pb-2 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => handleTabChange('fixed')}
              className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'fixed'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Fixed Expenses
            </button>
            <button
              onClick={() => handleTabChange('operational')}
              className={`text-sm sm:text-base font-semibold pb-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'operational'
                  ? 'border-blue-600 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Operational Expenses
            </button>
          </div>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm text-blue-500 bg-blue-50 border border-blue-300 no-underline whitespace-nowrap self-start"
          >
            <FileTextOutlined />
            Generate Report
          </a>
        </div>
      }
    >
      <div className="flex-1 overflow-x-auto">
        <Table<Expense>
          columns={getColumns(
            isAdmin,
            isSuperAdmin,
            () => refetch(),
            () => refetch()
          )}
          dataSource={data}
          pagination={false}
          loading={isLoading}
          rowKey={(record) => record.id || Math.random().toString()}
          scroll={{
            x: 'max-content',
          }}
          size="middle"
          className="w-full"
          rowClassName="hover:bg-gray-50"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing{' '}
          <span className="font-semibold text-gray-900">
            {(page - 1) * 5 + Math.min(1, data.length)}
          </span>{' '}
          to <span className="font-semibold text-gray-900">{(page - 1) * 5 + data.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{total}</span> results
        </div>

        <div className="w-full sm:w-auto">
          <Pagination
            current={page}
            total={total}
            onChange={(newPage) => setPage(newPage)}
            className="flex justify-end"
            align="end"
            size="small"
            showSizeChanger={false}
          />
        </div>
      </div>
    </Card>
  )
}

export default DashboardTable