import { Button, Popconfirm, Tag, type TableColumnsType } from "antd";
import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

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

type GetInvoicesColumnsParams = {
  clients: ClientData[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (invoice: InvoiceData) => void;
  onDelete: (publicId: string) => void;
  onPayment: (publicId: string) => void;
};

export function getInvoicesColumns({
  clients,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onPayment,
}: GetInvoicesColumnsParams): TableColumnsType<InvoiceData> {
  return [
    {
      title: "Invoice",
      key: "title",
      render: (_: unknown, record: InvoiceData) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{record.title}</span>
          <span className="text-xs text-gray-400">
            Client:{" "}
            {clients.find((c) => c.publicId === record.clientPublicId)?.name ||
              "Unknown"}
          </span>
        </div>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_: unknown, record: InvoiceData) => (
        <div className="flex flex-col text-sm">
          <span>
            Issued:{" "}
            {record.issuedDate
              ? dayjs(record.issuedDate).format("MMM D, YYYY")
              : "-"}
          </span>
          <span className="text-red-500">
            Due:{" "}
            {record.dueDate ? dayjs(record.dueDate).format("MMM D, YYYY") : "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "PAID") color = "success";
        else if (status === "PARTIAL") color = "processing";
        else if (status === "PENDING") color = "warning";
        else if (status === "OVERDUE") color = "error";
        return <Tag color={color}>{status || "DRAFT"}</Tag>;
      },
    },
    {
      title: "Total Amount",
      key: "total",
      render: (_: unknown, record: InvoiceData) => {
        const total =
          record.items?.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0,
          ) || 0;
        return (
          <span className="font-semibold text-gray-700">
            {record.currency || "INR"} {total.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: InvoiceData) => (
        <div className="flex gap-2">
          {canEdit && record.status !== "PAID" && (
            <Button
              type="text"
              size="small"
              icon={<DollarOutlined />}
              onClick={() => onPayment(record.publicId)}
              title="Record Payment"
            />
          )}
          {canEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Delete invoice"
              onConfirm={() => onDelete(record.publicId)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                type="text"
                size="small"
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];
}
