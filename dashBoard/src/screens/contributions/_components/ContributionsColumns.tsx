import { Tag, type TableColumnsType } from "antd";
import dayjs from "dayjs";

type ContributionRecord = {
  contributorId: string;
  contributor?: unknown;
  type: string;
  amount: number;
  currency?: string;
  contributionDate?: string;
  description?: string;
  referenceNo?: string;
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

type GetContributionsColumnsParams = {
  admins: AdminUser[];
};

export function getContributionsColumns({
  admins,
}: GetContributionsColumnsParams): TableColumnsType<ContributionRecord> {
  return [
    {
      title: "Contributor",
      key: "contributor",
      render: (_: unknown, record: ContributionRecord) => {
        const admin =
          admins.find((a) => a.publicId === record.contributorId) ||
          (record.contributor as AdminUser | undefined);
        const name = admin?.profile
          ? `${admin.profile.firstName} ${admin.profile.lastName}`
          : admin?.name || "Unknown";
        return <span className="font-medium text-gray-800">{name}</span>;
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        let color = "default";
        if (type === "EQUITY") color = "purple";
        if (type === "LOAN") color = "orange";
        if (type === "REVENUE") color = "green";
        return <Tag color={color}>{type}</Tag>;
      },
    },
    {
      title: "Amount",
      key: "amount",
      render: (_: unknown, record: ContributionRecord) => (
        <span className="font-semibold text-gray-700">
          {record.currency || "INR"} {record.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "contributionDate",
      key: "date",
      render: (date: string) =>
        date ? dayjs(date).format("MMM D, YYYY") : "-",
    },
    {
      title: "Reference",
      dataIndex: "referenceNo",
      key: "ref",
      render: (text: string) => (
        <span className="text-xs text-gray-500">{text || "-"}</span>
      ),
    },
  ];
}
