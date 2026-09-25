import React from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, message } from 'antd';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/apiClient';
import { queryClient } from '@/lib/queryClient';
import type { InvoiceData } from '../types';
import { formatCurrency } from '../_utils/invoiceNumberGenerator';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData | null;
  onSuccess?: () => void;
}

export const PaymentRecordModal: React.FC<PaymentRecordModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const paymentMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!invoice) throw new Error('No invoice selected');
      const payload = {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        referenceNo: values.referenceNo || undefined,
        notes: values.notes || undefined,
        paidAt: values.paidAt ? (values.paidAt as dayjs.Dayjs).toISOString() : new Date().toISOString(),
      };
      await apiClient.post(`/invoices/${invoice.publicId}/payments`, payload);
    },
    onSuccess: () => {
      message.success('Payment recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      form.resetFields();
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Failed to record payment');
    },
  });

  const remainingBalance = Number(invoice?.balanceDue || 0);

  return (
    <Modal
      title={
        <div>
          <h3 className="text-base font-bold text-gray-900">Record Payment</h3>
          <p className="text-xs text-gray-500 font-normal">
            Invoice: <span className="font-semibold text-gray-800">{invoice?.invoiceNumber}</span> ·
            Balance Due:{' '}
            <span className="font-semibold text-blue-600">
              {formatCurrency(remainingBalance, invoice?.currency || 'INR')}
            </span>
          </p>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={paymentMutation.isPending}
      okText="Record Payment"
      destroyOnClose
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => paymentMutation.mutate(values)}
        className="mt-4"
        initialValues={{
          amount: remainingBalance > 0 ? remainingBalance : undefined,
          paymentMethod: 'BANK_TRANSFER',
          paidAt: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="amount"
              label="Amount Received"
              rules={[
                { required: true, message: 'Please enter amount' },
                {
                  type: 'number',
                  min: 0.01,
                  message: 'Amount must be greater than 0',
                },
              ]}
            >
              <InputNumber
                className="w-full"
                placeholder="Amount"
                min={0.01}
                max={remainingBalance > 0 ? remainingBalance : undefined}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</Select.Option>
                <Select.Option value="UPI">UPI / GPay / PhonePe</Select.Option>
                <Select.Option value="CARD">Credit/Debit Card</Select.Option>
                <Select.Option value="CASH">Cash</Select.Option>
                <Select.Option value="CHEQUE">Cheque</Select.Option>
                <Select.Option value="OTHER">Other</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="referenceNo" label="Reference No / Transaction ID / UTR">
              <Input placeholder="e.g. UTR12345678" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="paidAt" label="Payment Date" rules={[{ required: true }]}>
              <DatePicker className="w-full" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="Notes (optional)">
          <Input.TextArea rows={2} placeholder="Partial payment for phase 1..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};
