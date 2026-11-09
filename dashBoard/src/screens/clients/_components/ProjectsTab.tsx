import { useMemo, useState } from "react";
import { Avatar as AntAvatar, Dropdown } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { queryClient } from "@/lib/queryClient";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { CheckCircle2, MoreHorizontal, Plus } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/reui/badge";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { ProjectDrawer } from "./ProjectDrawer";
import {
  PROJECT_STATUSES,
  initialsOf,
  memberName,
  type ClientProject,
  type ProjectMember,
} from "./projects";

const MAX_VISIBLE_MEMBERS = 4;

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

function ProgressCell({ value }: { value: number }) {
  const done = value >= 100;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", done ? "bg-emerald-500" : "bg-orange-500")}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      {done ? (
        <CheckCircle2 className="size-4 text-emerald-500" />
      ) : (
        <span className="w-9 text-xs text-muted-foreground">{value}%</span>
      )}
    </div>
  );
}

export function ProjectsTab({ clientId }: { clientId?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/users");
      return res.data?.data || res.data || [];
    },
  });

  const { data: projects = [] } = useQuery<ClientProject[]>({
    queryKey: ["client-projects", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const res = await apiClient.get(`/clients/${clientId}/projects`);
      return res.data?.data || [];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["client-projects", clientId] });
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ values, id }: { values: Omit<ClientProject, "id">; id?: string }) =>
      id
        ? apiClient.put(`/clients/${clientId}/projects/${id}`, values)
        : apiClient.post(`/clients/${clientId}/projects`, values),
    onSuccess: () => {
      message.success("Project saved");
      setDrawerOpen(false);
      refresh();
    },
    onError: (e: any) => message.error(e?.response?.data?.message || "Failed to save project"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/clients/${clientId}/projects/${id}`),
    onSuccess: refresh,
    onError: (e: any) => message.error(e?.response?.data?.message || "Failed to delete project"),
  });

  const membersById = useMemo(() => new Map(members.map((m) => [m.publicId, m])), [members]);

  const openDrawer = (project: ClientProject | null) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const columns = useMemo<ColumnDef<DataGridFeatures, ClientProject>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <AntAvatar
              size={36}
              src={row.original.logoUrl}
              className="shrink-0 bg-brand-blue/10! text-xs! font-semibold! text-brand-blue!"
            >
              {initialsOf(row.original.name)}
            </AntAvatar>
            <div className="min-w-0 space-y-px">
              <div className="truncate font-medium text-foreground">{row.original.name}</div>
              <div className="truncate text-xs text-muted-foreground">{row.original.companyName || "—"}</div>
            </div>
          </div>
        ),
        size: 240,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const status = PROJECT_STATUSES[row.original.status];
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "summaryTitle",
        id: "summary",
        header: "Summary",
        cell: ({ row }) => (
          <div className="min-w-0 space-y-px">
            <div className="truncate text-foreground">{row.original.summaryTitle || "—"}</div>
            <div className="truncate text-xs text-muted-foreground">{row.original.summaryText}</div>
          </div>
        ),
        size: 280,
        enableSorting: false,
      },
      {
        id: "members",
        header: "Members",
        cell: ({ row }) => {
          const ids = row.original.memberIds;
          if (ids.length === 0) return <span className="text-xs text-muted-foreground">No members</span>;
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
                <AvatarGroupCount className="size-7 text-[10px]">
                  +{ids.length - MAX_VISIBLE_MEMBERS}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
          );
        },
        size: 150,
        enableSorting: false,
      },
      {
        accessorKey: "progress",
        id: "progress",
        header: ({ column }) => <DataGridColumnHeader title="Progress" column={column} />,
        cell: ({ row }) => <ProgressCell value={row.original.progress} />,
        size: 190,
        enableSorting: true,
      },
      {
        accessorKey: "payment",
        id: "payment",
        header: ({ column }) => <DataGridColumnHeader title="Payment" column={column} />,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{formatAmount(row.original.payment)}</span>
        ),
        size: 120,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => <span className="block text-center">Action</span>,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "edit", label: "Edit" },
                  { key: "delete", label: "Delete", danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === "edit") openDrawer(row.original);
                  if (key === "delete") deleteMutation.mutate(row.original.id);
                },
              }}
            >
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Project actions"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </Dropdown>
          </div>
        ),
        size: 80,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [membersById, deleteMutation],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: projects,
    pageCount: Math.ceil(projects.length / pagination.pageSize),
    getRowId: (row: ClientProject) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  });

  if (!clientId) {
    return (
      <p className="pb-6 text-sm text-muted-foreground">Save the client first, then you can add projects to it.</p>
    );
  }

  return (
    <div className="pb-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </p>
        <button
          type="button"
          onClick={() => openDrawer(null)}
          className="flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-sm font-medium text-white! hover:bg-brand-blue/90"
        >
          <Plus className="size-4" /> Create New Project
        </button>
      </div>

      <DataGrid
        table={table}
        recordCount={projects.length}
        emptyMessage="No projects yet. Create one to get started."
        tableLayout={{ headerBackground: true, rowBorder: true }}
      >
        <div className="w-full space-y-2.5">
          <DataGridContainer>
            <DataGridScrollArea>
              <DataGridTable />
            </DataGridScrollArea>
          </DataGridContainer>
          {projects.length > pagination.pageSize && <DataGridPagination />}
        </div>
      </DataGrid>

      <ProjectDrawer
        open={drawerOpen}
        project={selectedProject}
        members={members}
        onOpenChange={setDrawerOpen}
        saving={saveMutation.isPending}
        onSubmit={(values, id) => saveMutation.mutate({ values, id })}
      />
    </div>
  );
}
