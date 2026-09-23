import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input, InputNumber, DatePicker, Select, Button, Switch, Row, Col, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { apiClient } from '@/lib/apiClient'
import { expenseSchema, type ExpenseFormValues } from './expense.schema'
import type { CardProps } from '@/types'
import type { AxiosError } from 'axios'

const { TextArea } = Input

type AddExpenseProps = {
  type: 'fixed' | 'operational'
}

type ExpensePayload = {
  expenseType: string
  title: string
  category: string
  amount: number
  expenseDate: string
  dueDate?: string
  status: string
  recurring: boolean
  frequency?: string
  vendorName?: string
  paymentMethod?: string
  notes?: string
  paidByPublicId?: string
}

const Card = ({ title, children }: CardProps) => (
  <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm mb-6">
    <h3 className="text-sm font-semibold text-gray-600 mb-4">{title}</h3>
    {children}
  </div>
)

export default function AddExpense({ type }: AddExpenseProps) {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      recurring: false,
    },
  })

  useEffect(() => {
    if (user && !isAdmin) {
      message.error('Unauthorized access. Admin role required to add expenses.')
      navigate('/')
    }
  }, [user, isAdmin, navigate])

  const expenseMutation = useMutation({
    mutationFn: async (payload: ExpensePayload) => {
      return await apiClient.post('/expenses', payload)
    },
    onSuccess: (_, variables) => {
      message.success('Expense added successfully')
      if (variables.status === 'PAID') {
        window.dispatchEvent(new CustomEvent('transactionsUpdated'))
      }
      navigate('/')
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || 'Failed to add expense')
    },
  })

  const isFixed = type === 'fixed'
  // eslint-disable-next-line react-hooks/incompatible-library
  const recurring = watch('recurring')

  if (!isAdmin) {
    return null
  }

  const onSubmit = handleSubmit((values) => {
    const payload: ExpensePayload = {
      expenseType: isFixed ? 'FIXED' : 'OPERATIONAL',
      title: values.title,
      category: values.category,
      amount: values.amount,
      expenseDate: values.date.toISOString(),
      dueDate: values.dueDate?.toISOString(),
      status: (values.status || 'pending').toUpperCase(),
      recurring: values.recurring || false,
      frequency: values.frequency,
      vendorName: values.vendor,
      paymentMethod: values.paymentMethod,
      notes: values.description,
      paidByPublicId: values.paidBy,
    }

    expenseMutation.mutate(payload)
  })

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-primary">
          {isFixed ? 'Add Fixed Expense' : 'Add Operational Expense'}
        </h1>
      </div>

      <form onSubmit={onSubmit}>
        <Card title="Basic Information">
          <Row gutter={16}>
            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Expense Name *</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="AWS Hosting / Salary / Rent" />
                  )}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
              </div>
            </Col>

            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="Select category" className="w-full">
                      {isFixed ? (
                        <>
                          <Select.Option value="salaries">Salaries</Select.Option>
                          <Select.Option value="professional">Professional Fees</Select.Option>
                        </>
                      ) : (
                        <>
                          <Select.Option value="technology">Technology</Select.Option>
                          <Select.Option value="utilities">Utilities</Select.Option>
                        </>
                      )}
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
              </div>
            </Col>
          </Row>
        </Card>

        <Card title="Financial Details">
          <Row gutter={16}>
            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} className="w-full" min={0} />
                  )}
                />
                {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
              </div>
            </Col>

            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Expense Date *</label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker {...field} className="w-full" />
                  )}
                />
                {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
              </div>
            </Col>
          </Row>
        </Card>

        <Card title="Additional Details">
          {isFixed ? (
            <Row gutter={16}>
              <Col span={8}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Recurring</label>
                  <Controller
                    name="recurring"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </Col>

              {recurring && (
                <Col span={8}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Frequency *</label>
                    <Controller
                      name="frequency"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} className="w-full">
                          <Select.Option value="monthly">Monthly</Select.Option>
                          <Select.Option value="yearly">Yearly</Select.Option>
                        </Select>
                      )}
                    />
                    {errors.frequency && <p className="text-xs text-destructive mt-1">{errors.frequency.message}</p>}
                  </div>
                </Col>
              )}

              <Col span={8}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Controller
                    name="dueDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker {...field} className="w-full" />
                    )}
                  />
                </div>
              </Col>
            </Row>
          ) : (
            <Row gutter={16}>
              <Col span={12}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Vendor</label>
                  <Controller
                    name="vendor"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="AWS / EB / etc." />
                    )}
                  />
                </div>
              </Col>

              <Col span={12}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} className="w-full">
                        <Select.Option value="cash">Cash</Select.Option>
                        <Select.Option value="bank">Bank Transfer</Select.Option>
                        <Select.Option value="upi">UPI</Select.Option>
                      </Select>
                    )}
                  />
                </div>
              </Col>
            </Row>
          )}
        </Card>

        <Card title="Assignment & Status">
          <Row gutter={16}>
            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Paid By</label>
                <Controller
                  name="paidBy"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="Select user" allowClear className="w-full">
                      <Select.Option value="0d1df965-ccdc-488d-9b5e-154e8143d619">
                        Abraham Clinton
                      </Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>

            <Col span={12}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className="w-full">
                      <Select.Option value="pending">Pending</Select.Option>
                      <Select.Option value="paid">Paid</Select.Option>
                    </Select>
                  )}
                />
              </div>
            </Col>
          </Row>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea {...field} rows={3} placeholder="Add notes..." />
              )}
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => navigate('/')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={expenseMutation.isPending}>
            Save Expense
          </Button>
        </div>
      </form>
    </div>
  )
}