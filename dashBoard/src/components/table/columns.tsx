import { Tag, Avatar, Space, Button, message, Popconfirm, type TableColumnsType } from 'antd'
import { useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { Expense } from '@/types'

export const getColumns = (
    isAdmin: boolean = false,
    isSuperAdmin: boolean = false,
    onPaySuccess?: () => void,
    onDeleteSuccess?: () => void
): TableColumnsType<Expense> => {
    const baseColumns: TableColumnsType<Expense> = [
        {
            title: "Expense ID",
            dataIndex: "expenseId",
            key: "expenseId",
            render: (id) => <a className="text-primary font-semibold">{id}</a>,
        },
        {
            title: "Paid by",
            key: "paidBy",
            render: (_, record) => {
                const profile = record.paidBy?.profile;
                let name = "Business Account";

                if (profile?.firstName || profile?.lastName) {
                    name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
                } else if (record.paidBy?.username) {
                    name = record.paidBy.username.split('@')[0];
                }

                const avatar = profile?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                return (
                    <Space>
                        <Avatar src={avatar}>{name.charAt(0).toUpperCase()}</Avatar>
                        <span>{name}</span>
                    </Space>
                );
            },
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
            ellipsis: true,
            width: 250,
        },
        {
            title: "Comments",
            dataIndex: "notes",
            key: "notes",
            render: (text) => text || "-",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount: string) => (
                <span className="text-green-600 font-medium">₹{Number(amount || 0).toLocaleString()}</span>
            ),
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            key: "dueDate",
            render: (dateStr: string) => {
                if (!dateStr) return "-";
                const date = new Date(dateStr);
                return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
        },
        {
            title: "Overdue by",
            key: "overdueByDays",
            render: (_, record) => {
                if (record.status === 'PAID') return <span className="text-green-600 font-medium">Paid</span>;

                const diffDays = record.overdueByDays || 0;
                if (diffDays <= 0) {
                    return <span className="text-green-600 font-medium">Not overdue</span>;
                }
                return <span className="text-red-500 font-medium">{diffDays} days</span>;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string | undefined) => {
                if (!status) return null;
                const statusUpper = status.toUpperCase();

                let className = "text-red-600 bg-red-50";
                if (statusUpper === "PAID") {
                    className = "text-green-700 bg-green-50";
                } else if (statusUpper === "APPROVED") {
                    className = "text-blue-700 bg-blue-50";
                } else if (statusUpper === "PENDING") {
                    className = "text-amber-600 bg-amber-50";
                }

                return (
                    <Tag className={`${className} border-none rounded-md font-medium`}>
                        {status}
                    </Tag>
                );
            },
        }];

    if (isAdmin || isSuperAdmin) {
        baseColumns.push({
            title: "Action",
            key: "action",
            render: (_, record) => {
                const PayButton = () => {
                    const [loading, setLoading] = useState(false);

                    const handlePay = async () => {
                        if (!record.publicId) return;
                        setLoading(true);
                        try {
                            await apiClient.patch(`/expenses/${record.publicId}/pay`);
                            message.success("Expense marked as paid!");
                            onPaySuccess?.();
                            window.dispatchEvent(new CustomEvent('expensePaid'));
                        } catch (err: unknown) {
                            const error = err as { response?: { data?: { message?: string } } }
                            const msg =
                                error?.response?.data?.message ||
                                "Failed to mark expense as paid";
                            message.error(msg);
                        } finally {
                            setLoading(false);
                        }
                    };

                    return (
                        <Button
                            size="small"
                            loading={loading}
                            disabled={record.status === "PAID" || record.status === "REJECTED" || loading}
                            onClick={handlePay}
                            className="border border-black text-xs px-4 py-0.5"
                        >
                            {record.status === "PAID" ? "Settled" : loading ? "Paying…" : "Pay"}
                        </Button>
                    );
                };
                
                const DeleteButton = () => {
                    const [delLoading, setDelLoading] = useState(false);
                    const handleDelete = async () => {
                        if (!record.publicId) return;
                        setDelLoading(true);
                        try {
                            await apiClient.delete(`/expenses/${record.publicId}`);
                            message.success("Expense deleted successfully!");
                            onDeleteSuccess?.();
                        } catch (err: unknown) {
                            const error = err as { response?: { data?: { message?: string } } }
                            message.error(error?.response?.data?.message || "Failed to delete expense");
                        } finally {
                            setDelLoading(false);
                        }
                    };
                    return (
                        <Popconfirm title="Delete expense" onConfirm={handleDelete} okText="Yes" cancelText="No">
                            <Button danger type="text" size="small" loading={delLoading}>Delete</Button>
                        </Popconfirm>
                    );
                };

                return (
                    <Space>
                        {(isAdmin || isSuperAdmin) && <PayButton />}
                        {isSuperAdmin && <DeleteButton />}
                    </Space>
                );
            },
        });
    }

    return baseColumns;
};
