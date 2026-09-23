import { useState } from "react";
import {
  Button,
  Popconfirm,
  Space,
  Tooltip,
  type TableColumnsType,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

type SiteEntry = {
  id?: string;
  _id?: string;
  name: string;
  userName: string;
  url?: string;
  password: string;
};

function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <Space>
      <span
        className={`font-mono text-[13px] text-gray-700 ${visible ? "tracking-normal" : "tracking-wide"}`}
      >
        {visible ? password : "•".repeat(Math.min(password.length, 10))}
      </span>
      <Tooltip title={visible ? "Hide password" : "Show password"}>
        <Button
          type="text"
          size="small"
          icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setVisible((v) => !v)}
          className="text-gray-500"
        />
      </Tooltip>
    </Space>
  );
}

type GetSiteManagementColumnsParams = {
  onEdit: (site: SiteEntry) => void;
  onDelete: (siteId: string) => void;
};

export function getSiteManagementColumns({
  onEdit,
  onDelete,
}: GetSiteManagementColumnsParams): TableColumnsType<SiteEntry> {
  return [
    {
      key: "sort",
      width: 50,
      align: "center" as const,
    },
    {
      title: "No.",
      key: "no",
      width: 70,
      render: (_: unknown, __: unknown, index: number) => (
        <span className="text-gray-500 font-medium">{index + 1}</span>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span className="font-semibold text-gray-800">{name}</span>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url?: string) => {
        if (!url) return <span className="text-gray-400 italic">No URL</span>;
        const isLink = url.startsWith("http://") || url.startsWith("https://");
        return isLink ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline break-all"
          >
            <GlobalOutlined className="text-xs" />
            {url}
          </a>
        ) : (
          <span className="text-gray-800 break-all">{url}</span>
        );
      },
    },
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      render: (userName: string) => (
        <span className="font-semibold text-gray-800">{userName}</span>
      ),
    },
    {
      title: "Password",
      dataIndex: "password",
      key: "password",
      render: (pwd: string) => <PasswordCell password={pwd} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "center" as const,
      render: (_: unknown, record: SiteEntry) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className="text-primary"
            />
          </Tooltip>

          <Popconfirm
            title="Delete this site?"
            description="This action cannot be undone."
            onConfirm={() => onDelete((record.id || record._id) as string)}
            okText="Delete"
            okButtonProps={{ danger: true }}
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];
}
