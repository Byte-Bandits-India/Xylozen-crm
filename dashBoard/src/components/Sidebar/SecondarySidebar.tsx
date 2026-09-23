import { Drawer } from 'antd';
import { X } from 'lucide-react';
import type { RecentPayment } from './ResponsiveSidebar';

type SecondarySidebarProps = {
  open: boolean
  onClose: () => void
  payments: RecentPayment[]
  loading: boolean
}

const SidebarContent = ({ payments, loading }: { payments: RecentPayment[]; loading: boolean }) => (
    <div className="flex flex-col gap-6 p-2">
        {/* Recent Transactions */}
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

const SecondarySidebar = ({ open, onClose, payments, loading }: SecondarySidebarProps) => {
    return (
        <Drawer
            placement="right"
            onClose={onClose}
            open={open}
            width={280}
            closeIcon={<X className="h-4 w-4 text-gray-500" />}
            styles={{
                header: {
                    borderBottom: '1px solid hsl(var(--border))',
                    padding: '16px 20px',
                },
                body: {
                    padding: 0,
                },
                mask: {
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
            }}
            className="secondary-sidebar-drawer"
        >
            <SidebarContent payments={payments} loading={loading} />
        </Drawer>
    );
};

export default SecondarySidebar;
