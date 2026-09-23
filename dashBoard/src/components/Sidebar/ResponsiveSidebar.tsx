import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import SecondarySidebar from './SecondarySidebar'
import { apiClient } from '@/lib/apiClient'

type ResponsiveSidebarProps = {
  open: boolean
  onClose: () => void
}

export type RecentPayment = {
  id: string
  clientName: string
  avatar: string
  title: string
  amount: number
  type?: string
}

const SidebarContent = ({ payments, loading }: { payments: RecentPayment[]; loading: boolean }) => (
    <div className="flex flex-col gap-6 py-6 px-2 h-full">
        {/* Recent Payments */}
        <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Transactions</h3>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-gray-400">Loading...</span>
                </div>
            ) : payments.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <span className="text-sm text-gray-400">No recent transactions</span>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {payments.map((payment) => (
                        <div
                            key={payment.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <img
                                src={payment.avatar}
                                alt={payment.title}
                                className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {payment.title}
                                </span>
                                <span className="text-xs text-gray-400 truncate">
                                    {payment.clientName}
                                </span>
                            </div>
                            <span className={`text-sm font-semibold flex-shrink-0 ${payment.type === 'DEBIT' ? 'text-foreground' : 'text-foreground'}`}>
                                {payment.type === 'DEBIT' ? '-' : '+'}₹{payment.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

type TransactionItem = {
  publicId?: string
  id?: string
  expense?: { title?: string }
  invoice?: { invoiceNumber?: string }
  contribution?: { contributorName?: string }
  description?: string
  category?: string
  createdBy?: {
    username?: string
    profile?: {
      firstName?: string
      lastName?: string
      profileImage?: string
    }
  }
  amount?: number | string
  type?: string
}

type TransactionResponse = {
  success: boolean
  data: TransactionItem[]
}

const ResponsiveSidebar = ({ open, onClose }: ResponsiveSidebarProps) => {
  const [isXlScreen, setIsXlScreen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1700
    }
    return false
  })

  const { data: response, isLoading, refetch } = useQuery<TransactionResponse>({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const res = await apiClient.get<TransactionResponse>('/dashboard/table/recent-transactions?page=1')
      return res.data
    },
  })

  const payments: RecentPayment[] = (response?.data || []).map((item, idx) => {
    const title =
      item.expense?.title ||
      item.invoice?.invoiceNumber ||
      item.contribution?.contributorName ||
      item.description ||
      'Transaction'

    const createdBy = item.createdBy
    const profile = createdBy?.profile
    let name = item.category || 'Transaction'

    if (profile?.firstName || profile?.lastName) {
      name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    } else if (createdBy?.username) {
      name = createdBy.username.split('@')[0]
    }

    const avatar =
      profile?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`

    return {
      id: item.publicId || item.id || String(idx),
      clientName: name,
      avatar: avatar,
      title: title,
      amount: Number(item.amount || 0),
      type: item.type,
    }
  })

  useEffect(() => {
    const handleResize = () => {
      setIsXlScreen(window.innerWidth >= 1700)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleUpdate = () => refetch()
    window.addEventListener('expensePaid', handleUpdate)
    window.addEventListener('transactionsUpdated', handleUpdate)

    return () => {
      window.removeEventListener('expensePaid', handleUpdate)
      window.removeEventListener('transactionsUpdated', handleUpdate)
    }
  }, [refetch])

  if (!isXlScreen) {
    return <SecondarySidebar open={open} onClose={onClose} payments={payments} loading={isLoading} />
  }

  return (
    <div
      className={`
        fixed top-0 right-0 h-full w-[250px] bg-white border-l border-gray-200 shadow-xl z-50
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <SidebarContent payments={payments} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default ResponsiveSidebar