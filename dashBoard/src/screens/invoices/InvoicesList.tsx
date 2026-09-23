import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  InputNumber,
  Row,
  Col,
  Card,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { TableLayout } from "@/components/layout/TableLayout";
import { getInvoicesColumns } from "./_components/InvoicesColumns";
import dayjs from "dayjs";
import type { AxiosError } from "axios";

const { Option } = Select;
const { TextArea } = Input;

type InvoiceData = {
  publicId: string;
  title: string;
  clientPublicId?: string;
  issuedDate?: string;
  dueDate?: string;
  status?: string;
  currency?: string;
  description?: string;
  items?: Array<{
    itemName: string;
    quantity: number;
    unitPrice: number;
    taxPercent?: number;
  }>;
};

type ClientData = {
  publicId: string;
  name: string;
  companyName?: string;
};

export default function InvoicesList() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(
    null,
  );
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [invoiceForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  const canEdit = isAdmin || isSuperAdmin;
  const canDelete = isSuperAdmin;

  const { data: invoices = [], isLoading } = useQuery<InvoiceData[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await apiClient.get("/invoices?page=1&pageSize=100");
      return res.data.data || res.data || [];
    },
  });

  const { data: clients = [] } = useQuery<ClientData[]>({
    queryKey: ["clients-invoices"],
    queryFn: async () => {
      const res = await apiClient.get("/clients?page=1&pageSize=100");
      return res.data.data || res.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) =>
      await apiClient.delete(`/invoices/${publicId}`),
    onSuccess: () => {
      message.success("Invoice deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      message.error(
        error.response?.data?.message || "Failed to delete invoice",
      ),
  });

  const saveMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        ...values,
        issuedDate: values.issuedDate
          ? (values.issuedDate as dayjs.Dayjs).toISOString()
          : undefined,
        dueDate: values.dueDate
          ? (values.dueDate as dayjs.Dayjs).toISOString()
          : undefined,
      };
      if (editingInvoice) {
        await apiClient.put(`/invoices/${editingInvoice.publicId}`, payload);
      } else {
        await apiClient.post("/invoices", payload);
      }
    },
    onSuccess: () => {
      message.success(
        editingInvoice
          ? "Invoice updated successfully!"
          : "Invoice created successfully!",
      );
      setIsInvoiceModalVisible(false);
      invoiceForm.resetFields();
      setEditingInvoice(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      message.error(error.response?.data?.message || "Failed to save invoice"),
  });

  const paymentMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        ...values,
        paidAt: values.paidAt
          ? (values.paidAt as dayjs.Dayjs).toISOString()
          : new Date().toISOString(),
      };
      await apiClient.post(`/invoices/${paymentInvoiceId}/payments`, payload);
    },
    onSuccess: () => {
      message.success("Payment recorded successfully!");
      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
      setPaymentInvoiceId(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: AxiosError<{ message?: string }>) =>
      message.error(
        error.response?.data?.message || "Failed to record payment",
      ),
  });

  const openEditModal = (invoice: InvoiceData) => {
    setEditingInvoice(invoice);
    invoiceForm.setFieldsValue({
      ...invoice,
      issuedDate: invoice.issuedDate ? dayjs(invoice.issuedDate) : null,
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : null,
    });
    setIsInvoiceModalVisible(true);
  };

  const openPaymentModal = (publicId: string) => {
    setPaymentInvoiceId(publicId);
    setIsPaymentModalVisible(true);
  };

  const columns = getInvoicesColumns({
    clients,
    canEdit,
    canDelete,
    onEdit: openEditModal,
    onDelete: (publicId) => deleteMutation.mutate(publicId),
    onPayment: openPaymentModal,
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <TableLayout
        title="Invoices"
        actions={
          canEdit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingInvoice(null);
                invoiceForm.resetFields();
                setIsInvoiceModalVisible(true);
              }}
            >
              Create Invoice
            </Button>
          )
        }
      >
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="publicId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </TableLayout>

      {/* Invoice Creation/Edit Modal */}
      <Modal
        title={editingInvoice ? "Edit Invoice" : "Create New Invoice"}
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={invoiceForm}
          onFinish={(values) => saveMutation.mutate(values)}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Invoice Title"
                rules={[{ required: true }]}
              >
                <Input placeholder="Website Development" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="clientPublicId"
                label="Client"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select Client"
                  showSearch
                  optionFilterProp="children"
                >
                  {clients.map((c) => (
                    <Option key={c.publicId} value={c.publicId}>
                      {c.name} ({c.companyName})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="currency" label="Currency" initialValue="INR">
                <Select>
                  <Option value="INR">INR</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="issuedDate"
                label="Issue Date"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dueDate"
                label="Due Date"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Project details..." />
          </Form.Item>

          {/* Dynamic Line Items */}
          <Card size="small" title="Line Items" className="mb-4">
            <Form.List name="items" initialValue={[{}]}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={8} key={key} className="items-end mb-2">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "itemName"]}
                          label={key === 0 ? "Item Name" : ""}
                          rules={[{ required: true }]}
                        >
                          <Input placeholder="Service" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          label={key === 0 ? "Qty" : ""}
                          rules={[{ required: true }]}
                          initialValue={1}
                        >
                          <InputNumber className="w-full" min={1} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "unitPrice"]}
                          label={key === 0 ? "Unit Price" : ""}
                          rules={[{ required: true }]}
                        >
                          <InputNumber className="w-full" min={0} />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, "taxPercent"]}
                          label={key === 0 ? "Tax %" : ""}
                          initialValue={0}
                        >
                          <InputNumber className="w-full" min={0} max={100} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          className={key === 0 ? "mt-7" : ""}
                        />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Line Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsInvoiceModalVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saveMutation.isPending}
            >
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        title="Record Payment"
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={paymentForm}
          onFinish={(values) => paymentMutation.mutate(values)}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount Captured"
                rules={[{ required: true }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true }]}
                initialValue="BANK_TRANSFER"
              >
                <Select>
                  <Option value="BANK_TRANSFER">Bank Transfer</Option>
                  <Option value="CASH">Cash</Option>
                  <Option value="CARD">Card</Option>
                  <Option value="UPI">UPI</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="referenceNo" label="Reference No / UTR">
                <Input placeholder="TXN-1234..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paidAt"
                label="Payment Date"
                initialValue={dayjs()}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Partial payment for..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsPaymentModalVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={paymentMutation.isPending}
            >
              Record Payment
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
