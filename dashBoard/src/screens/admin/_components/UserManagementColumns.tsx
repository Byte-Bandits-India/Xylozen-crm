import { Button, Dropdown, Modal, Tag, type MenuProps, type TableColumnsType } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import type { UserListItem } from "@/types";

type GetUserManagementColumnsParams = {
  onDelete: (publicId: string) => void;
  onEditAccess: (record: UserListItem) => void;
};

export function getUserManagementColumns({
  onDelete,
  onEditAccess,
}: GetUserManagementColumnsParams): TableColumnsType<UserListItem> {
  return [
    {
      title: "Name",
      dataIndex: "username",
      key: "username",
      render: (_: unknown, record: UserListItem) => (
        <div>
          <div className="font-medium text-gray-900">{record.username}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Role",
      key: "role",
      render: (_: unknown, record: UserListItem) => {
        const role = record.roles && record.roles[0];
        return <Tag>{role || "USER"}</Tag>;
      },
    },
    {
      title: "Supervising Manager",
      key: "managerName",
      render: (_: unknown, record: UserListItem) => {
        const role = record.roles && record.roles[0];
        const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
        if (isAdmin) {
          return <Tag>Top Level (Admin)</Tag>;
        }
        if (role === "MANAGER") {
          return <span>{record.managerName || "Admin"}</span>;
        }
        return <span>{record.managerName || "—"}</span>;
      },
    },
    {
      title: "Functional Role",
      key: "functionalRole",
      render: (_: unknown, record: UserListItem) => {
        if (record.functionalRole) {
          return <Tag>{record.functionalRole}</Tag>;
        }
        const role = record.roles && record.roles[0];
        if (role === "ADMIN" || role === "SUPER_ADMIN") {
          return <Tag>System Administrator</Tag>;
        }
        return <span>—</span>;
      },
    },
    {
      title: "Affiliation",
      dataIndex: "affiliation",
      key: "affiliation",
      render: (aff: string | undefined) => (
        <span>{aff ? String(aff).toUpperCase() : "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "ACTIVE" ? "green" : "red"}>
          {status || "ACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 80,
      render: (_: unknown, record: UserListItem) => {
        const items: MenuProps["items"] = [
          {
            key: "edit",
            label: "Edit",
            onClick: () => onEditAccess(record),
          },
          {
            key: "delete",
            label: "Delete",
            danger: true,
            onClick: () => {
              Modal.confirm({
                title: "Delete User",
                content: `Are you sure you want to delete ${record.username || record.email}?`,
                okText: "Delete",
                okType: "danger",
                cancelText: "Cancel",
                onOk: () => onDelete(record.publicId),
              });
            },
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" icon={<SettingOutlined />} />
          </Dropdown>
        );
      },
    },
  ];
}
