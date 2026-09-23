import { useState } from "react";
import { Table, Button, Modal, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { TableLayout } from "@/components/layout/TableLayout";
import { getClientsColumns } from "./_components/ClientsColumns";
import type { Client } from "@/types";
import type { AxiosError } from "axios";

type ClientFormValues = {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  billingAddressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
};

export default function ClientsList() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form] = Form.useForm();

  const canEdit = isAdmin || isSuperAdmin;
  const canDelete = isSuperAdmin;

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await apiClient.get("/clients?page=1&pageSize=100");
      return res.data.data || res.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.delete(`/clients/${publicId}`);
    },
    onSuccess: () => {
      message.success("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || "Failed to delete client");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ClientFormValues & { id?: string }) => {
      if (editingClient) {
        await apiClient.put(`/clients/${editingClient.id}`, values);
      } else {
        await apiClient.post("/clients", values);
      }
    },
    onSuccess: () => {
      message.success(
        editingClient
          ? "Client updated successfully!"
          : "Client created successfully!",
      );
      setIsModalVisible(false);
      form.resetFields();
      setEditingClient(null);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || "Failed to save client");
    },
  });

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setIsModalVisible(true);
  };

  const columns = getClientsColumns({
    canEdit,
    canDelete,
    onEdit: openEditModal,
    onDelete: (clientId: string) => deleteMutation.mutate(clientId),
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen w-full">
      <TableLayout
        title="Clients"
        actions={
          canEdit && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingClient(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              Add Client
            </Button>
          )
        }
      >
        <Table
          dataSource={clients}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </TableLayout>

      <Modal
        title={editingClient ? "Edit Client" : "Add New Client"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingClient(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={(values) => saveMutation.mutate(values)}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Primary Contact Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="company" label="Company Name">
              <Input placeholder="Acme Corp" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[{ type: "email" }, { required: true }]}
            >
              <Input placeholder="contact@acme.com" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input placeholder="+919876543210" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saveMutation.isPending}
            >
              {editingClient ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
