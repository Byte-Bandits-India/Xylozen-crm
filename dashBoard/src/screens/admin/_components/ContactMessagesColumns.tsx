import { Button, Popconfirm, Space, Tag, type TableColumnsType } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import type { ContactMessage } from "@/types";

type GetContactMessagesColumnsParams = {
  canDelete: boolean;
  onView: (contact: ContactMessage) => void;
  onDelete: (publicId: string) => void;
};

export function getContactMessagesColumns({
  canDelete,
  onView,
  onDelete,
}: GetContactMessagesColumnsParams): TableColumnsType<ContactMessage> {
  return [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="font-medium text-gray-800">{text}</div>
      ),
    },
    {
      title: "Contact Details",
      key: "contactDetails",
      render: (_: unknown, record: ContactMessage) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-700">{record.email}</span>
          {record.phone && (
            <span className="text-xs text-gray-500">{record.phone}</span>
          )}
        </div>
      ),
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (text: string) =>
        text ? (
          <a
            href={text.startsWith("http") ? text : `http://${text}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm truncate max-w-[150px] inline-block font-medium"
          >
            {text}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Submitted At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (text: string) => (text ? <Tag color="blue">{text}</Tag> : "-"),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, record: ContactMessage) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
            className="text-primary"
          />
          {canDelete && (
            <Popconfirm
              title="Delete contact message"
              description="Are you sure to delete this contact message?"
              onConfirm={() => onDelete(record.publicId || record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
}
