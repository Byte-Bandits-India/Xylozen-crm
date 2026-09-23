import { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Card,
  Statistic,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { TableLayout } from "@/components/layout/TableLayout";
import { getContributionsColumns } from "./_components/ContributionsColumns";
import dayjs, { type Dayjs } from "dayjs";
import type { AxiosError } from "axios";

const { Option } = Select;
const { TextArea } = Input;

type ContributionRecord = {
  contributorId: string;
  contributor?: unknown;
  type: string;
  amount: number;
  currency?: string;
  contributionDate?: string;
  description?: string;
};

type ContributionSummary = {
  totalContributions?: number;
  totalEquity?: number;
  totalLoans?: number;
  totalCapital?: number;
};

type AdminUser = {
  publicId: string;
  name?: string;
  email?: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
};

export default function ContributionsList() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const canCreate = isAdmin || isSuperAdmin;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data: contributions = [], isLoading } = useQuery<
    ContributionRecord[]
  >({
    queryKey: ["contributions-list"],
    queryFn: async () => {
      const res = await apiClient.get("/contributions?page=1&pageSize=100");
      return res.data?.data || res.data || [];
    },
  });

  const { data: summary = null } = useQuery<ContributionSummary | null>({
    queryKey: ["contributions-summary"],
    queryFn: async () => {
      const res = await apiClient.get("/contributions/summary");
      return res.data?.data || res.data || null;
    },
  });

  const { data: admins = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/users");
      return res.data?.data || res.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const payload = {
        ...values,
        contributionDate: values.contributionDate
          ? (values.contributionDate as Dayjs).toISOString()
          : undefined,
      };
      await apiClient.post("/contributions", payload);
    },
    onSuccess: () => {
      message.success("Contribution recorded successfully!");
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["contributions-list"] });
      queryClient.invalidateQueries({ queryKey: ["contributions-summary"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(
        error.response?.data?.message || "Failed to record contribution",
      );
    },
  });

  const columns = getContributionsColumns({ admins });

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <TableLayout
        title="Capital & Contributions"
        actions={
          canCreate && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              Record Contribution
            </Button>
          )
        }
      >
        {/* Summary Cards */}
        <Row gutter={16} className="mb-4 px-6 pt-4">
          <Col span={8}>
            <Card size="small" className="shadow-sm border-gray-100">
              <Statistic
                title="Total Capital Pool"
                value={summary?.totalCapital || 0}
                prefix="₹"
                valueStyle={{ color: "#405189", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="shadow-sm border-gray-100">
              <Statistic
                title="Total Equity"
                value={summary?.totalEquity || 0}
                prefix="₹"
                valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" className="shadow-sm border-gray-100">
              <Statistic
                title="Total Loans"
                value={summary?.totalLoans || 0}
                prefix="₹"
                valueStyle={{ color: "#fa8c16", fontWeight: "bold" }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          dataSource={contributions}
          columns={columns}
          rowKey="publicId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </TableLayout>

      <Modal
        title="Record Contribution"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => createMutation.mutate(values)}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contributorId"
                label="Contributor"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select Admin">
                  {admins.map((a) => (
                    <Option key={a.publicId} value={a.publicId}>
                      {a.profile?.firstName} {a.profile?.lastName} ({a.email})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Contribution Type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="EQUITY">Equity / Capital Injection</Option>
                  <Option value="LOAN">Director/Partner Loan</Option>
                  <Option value="REVENUE">Direct Revenue</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true }]}
              >
                <InputNumber className="w-full" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="Currency" initialValue="INR">
                <Select>
                  <Option value="INR">INR</Option>
                  <Option value="USD">USD</Option>
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
                name="contributionDate"
                label="Date"
                initialValue={dayjs()}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={2} placeholder="Initial capital requirement..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
            >
              Record
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
