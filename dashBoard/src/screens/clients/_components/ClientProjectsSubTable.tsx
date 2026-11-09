import { useMemo, useState } from "react";
import { useTable, type ColumnDef, type PaginationState } from "@tanstack/react-table";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PROJECT_STATUSES, initialsOf, memberName, type ClientProject, type ProjectMember } from "./projects";

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export function ProgressBar({ value }: { value: number }) {
  const v = Math.min(Math.max(Math.round(value), 0), 100);
  return (
    <div className="flex w-full items-center gap-2">
      <Progress value={v} className="h-1 flex-1" />
      <span className="w-9 text-right text-xs text-muted-foreground">{v}%</span>
    </div>
  );
}

const MAX_VISIBLE_MEMBERS = 3;

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

export function ClientProjectsSubTable({
  projects,
  membersById,
}: {
  projects: ClientProject[];
  membersById: Map<string, ProjectMember>;
}) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });

  const columns = useMemo<ColumnDef<DataGridFeatures, ClientProject>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Project Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" className="rounded-md">
              <AvatarImage src={row.original.logoUrl} alt={row.original.name} />
              <AvatarFallback className="rounded-md text-xs font-medium">{initialsOf(row.original.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm text-foreground">{row.original.name}</span>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: "startDate",
        id: "startDate",
        header: ({ column }) => <DataGridColumnHeader title="Start Date" column={column} />,
        cell: ({ row }) => <span className="text-sm text-foreground">{formatDate(row.original.startDate)}</span>,
        size: 150,
      },
      {
        accessorKey: "payment",
        id: "payment",
        header: ({ column }) => <DataGridColumnHeader title="Price" column={column} />,
        cell: ({ row }) => <span className="text-sm text-foreground">{formatINR(row.original.payment)}</span>,
        size: 150,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const s = PROJECT_STATUSES[row.original.status];
          return <Badge variant={s.variant}>{s.label}</Badge>;
        },
        size: 130,
      },
      {
        id: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => {
          const ids = row.original.memberIds ?? [];
          if (!ids.length) return <span className="text-sm text-muted-foreground">-</span>;
          return (
            <AvatarGroup>
              {ids.slice(0, MAX_VISIBLE_MEMBERS).map((id) => {
                const member = membersById.get(id);
                const name = member ? memberName(member) : "?";
                return (
                  <Avatar key={id} className="size-7" title={name}>
                    <AvatarFallback className="text-[10px]">{initialsOf(name)}</AvatarFallback>
                  </Avatar>
                );
              })}
              {ids.length > MAX_VISIBLE_MEMBERS && (
                <AvatarGroupCount className="size-7 text-[10px]">+{ids.length - MAX_VISIBLE_MEMBERS}</AvatarGroupCount>
              )}
            </AvatarGroup>
          );
        },
        size: 150,
        enableSorting: false,
      },
    ],
    [membersById],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: projects,
    pageCount: Math.ceil(projects.length / pagination.pageSize),
    getRowId: (row: ClientProject) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
  });

  return (
    <div className="space-y-2.5 px-6 py-3">
      <DataGrid table={table} recordCount={projects.length} tableLayout={{ rowBorder: true }}>
        <div className="space-y-2.5">
          <DataGridContainer>
            <DataGridTable />
          </DataGridContainer>
          {projects.length > pagination.pageSize && <DataGridPagination />}
        </div>
      </DataGrid>
    </div>
  );
}
