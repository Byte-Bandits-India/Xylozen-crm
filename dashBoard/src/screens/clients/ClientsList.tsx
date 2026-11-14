import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { Archive, Download, ListFilter, Pencil, Trash2, Upload, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { message, Modal } from "antd";
import { apiClient } from "@/lib/apiClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
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
import {
  DataGridTable,
  DataGridTableRowExpand,
} from "@/components/reui/data-grid/data-grid-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientProjectsSubTable, ProgressBar, formatINR } from "./_components/ClientProjectsSubTable";
import { PROJECT_STATUSES, type ProjectMember } from "./_components/projects";
import { BulkImportDialog } from "./_components/BulkImportDialog";
import { ClientFormView } from "./_components/ClientFormView";
import { CLIENT_SOURCES, CLIENT_STATUSES, initialsOf } from "./_components/clients";
import type { Client, ClientStatus } from "@/types";
import type { AxiosError } from "axios";

const formatRelativeTime = (iso?: string) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const avgProgress = (projects?: Client["projects"]) =>
  projects?.length ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length : 0;

export default function ClientsList() {
  const { isSuperAdmin, canEditPage } = useAuth();
  const [view, setView] = useState<"list" | "form">("list");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [importOpen, setImportOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const canEdit = isSuperAdmin || canEditPage("clients");
  const canDelete = canEdit;

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await apiClient.get("/clients?page=1&pageSize=100");
      return res.data.data || res.data || [];
    },
    refetchInterval: 60_000, // pick up rows added by the live Google Sheet sync
  });

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/users");
      return res.data?.data || res.data || [];
    },
  });
  const membersById = useMemo(() => new Map(members.map((m) => [m.publicId, m])), [members]);

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

  const archiveMutation = useMutation({
    mutationFn: async (publicId: string) => {
      await apiClient.put(`/clients/${publicId}`, { status: "past" });
    },
    onSuccess: () => {
      message.success("Client archived (moved to Past)");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      message.error(error.response?.data?.message || "Failed to archive client");
    },
  });

  const [menuClient, setMenuClient] = useState<Client | null>(null);

  const confirmDelete = (client: Client) =>
    Modal.confirm({
      title: `Delete ${client.name}?`,
      content: "This client will be removed from your list.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutateAsync(client.publicId).catch(() => undefined),
    });

  const openForm = (client: Client | null) => {
    setEditingClient(client);
    setView("form");
  };

  const closeForm = () => {
    setEditingClient(null);
    setView("list");
  };

  const hasActiveFilters = search.trim() !== "" || sourceFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setSourceFilter("all");
  };

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (query && !c.name?.toLowerCase().includes(query) && !c.email?.toLowerCase().includes(query)) {
        return false;
      }
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
      return true;
    });
  }, [clients, search, statusFilter, sourceFilter]);

  const columns = useMemo<ColumnDef<DataGridFeatures, Client>[]>(
    () => [
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => <DataGridColumnHeader title="Name" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="w-7 shrink-0">
              {(row.original.projects?.length ?? 0) > 0 && <DataGridTableRowExpand row={row} indent={0} />}
            </span>
            <Avatar size="sm">
              <AvatarImage src={row.original.avatar} alt={row.original.name} />
              <AvatarFallback className="text-xs font-medium">
                {initialsOf(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-px">
              <div className="truncate text-sm font-medium text-foreground">{row.original.name}</div>
              <div className="truncate text-xs text-muted-foreground">{row.original.email || "—"}</div>
            </div>
          </div>
        ),
        size: 260,
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: "source",
        id: "source",
        header: ({ column }) => <DataGridColumnHeader title="Source" column={column} />,
        cell: ({ row }) =>
          row.original.source ? (
            <span className="text-sm text-foreground">{CLIENT_SOURCES[row.original.source] ?? row.original.source}</span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
        size: 160,
        enableSorting: true,
      },
      {
        accessorKey: "phone",
        id: "phone",
        header: ({ column }) => <DataGridColumnHeader title="Number" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.phone || <span className="text-muted-foreground">—</span>}</span>
        ),
        size: 150,
        enableSorting: true,
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        cell: ({ row }) => {
          const status = CLIENT_STATUSES[row.original.status];
          if (!status) return <span className="text-sm text-muted-foreground">—</span>;
          return (
            <Badge variant={status.badge} radius="full">
              {status.label}
            </Badge>
          );
        },
        size: 130,
        enableSorting: true,
      },
      {
        id: "projectCount",
        accessorFn: (c: Client) => c.projects?.length ?? 0,
        header: ({ column }) => <DataGridColumnHeader title="No. of Projects" column={column} />,
        cell: ({ row }) => <span className="text-sm text-foreground">{row.original.projects?.length ?? 0}</span>,
        size: 140,
        enableSorting: true,
        meta: {
          expandedContent: (client: Client) => <ClientProjectsSubTable projects={client.projects ?? []} membersById={membersById} />,
        },
      },
      {
        id: "progress",
        accessorFn: (c: Client) => avgProgress(c.projects),
        header: ({ column }) => <DataGridColumnHeader title="Progress" column={column} />,
        cell: ({ row }) =>
          row.original.projects?.length ? (
            <ProgressBar value={avgProgress(row.original.projects)} />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
        size: 180,
        enableSorting: true,
      },
      {
        id: "projectValue",
        accessorFn: (c: Client) => (c.projects ?? []).reduce((sum, p) => sum + (p.payment || 0), 0),
        header: ({ column }) => <DataGridColumnHeader title="Project Value (INR)" column={column} />,
        cell: ({ row }) =>
          row.original.projects?.length ? (
            <span className="text-sm text-foreground">
              {formatINR(row.original.projects.reduce((sum, p) => sum + (p.payment || 0), 0))}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
        size: 170,
        enableSorting: true,
      },
      {
        id: "projectStatus",
        header: "Project Status",
        cell: ({ row }) => {
          const projects = row.original.projects ?? [];
          if (!projects.length) return <span className="text-sm text-muted-foreground">—</span>;
          if (projects.length > 1) {
            return <span className="text-sm text-muted-foreground">{projects.length} projects</span>;
          }
          const s = PROJECT_STATUSES[projects[0].status];
          return <Badge variant={s.variant}>{s.label}</Badge>;
        },
        size: 150,
        enableSorting: false,
      },
      {
        accessorKey: "updatedAt",
        id: "lastActivity",
        header: ({ column }) => <DataGridColumnHeader title="Last Activity" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatRelativeTime(row.original.updatedAt)}</span>
        ),
        size: 150,
        enableSorting: true,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Client actions"
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => openForm(row.original)}>Edit</DropdownMenuItem>
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => archiveMutation.mutate(row.original.publicId)}>
                    Archive
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => confirmDelete(row.original)}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [canEdit, canDelete, deleteMutation, archiveMutation, membersById],
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: filteredClients,
    pageCount: Math.ceil(filteredClients.length / pagination.pageSize),
    getRowId: (row: Client) => row.publicId,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getRowCanExpand: (row: { original: Client }) => (row.original.projects?.length ?? 0) > 0,
  });

  const tabs = useMemo(
    () => [
      ...(Object.entries(CLIENT_STATUSES) as [ClientStatus, { label: string }][]).map(([value, st]) => ({
        value,
        label: st.label,
        count: clients.filter((c) => c.status === value).length,
      })),
      { value: "all" as const, label: "All Clients", count: clients.length },
    ],
    [clients],
  );

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Email", "Company", "Source", "Status", "Last Activity"],
      ...filteredClients.map((c) => [
        c.name,
        c.email,
        c.companyName,
        c.source ? (CLIENT_SOURCES[c.source] ?? c.source) : "",
        CLIENT_STATUSES[c.status]?.label ?? c.status,
        c.updatedAt,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (view === "form") {
    return <ClientFormView client={editingClient} clients={clients} onBack={closeForm} />;
  }

  return (
    <div className="min-h-screen w-full bg-muted/40 p-6">
      <div className="w-full space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground">View all of your Client information.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv} disabled={filteredClients.length === 0}>
              <Download className="size-4" /> Export
            </Button>
            {canEdit && (
              <Button className="!text-white" onClick={() => openForm(null)}>
                <Plus className="size-4" /> Add New Client
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background">
          <div className="flex flex-wrap items-center gap-6 border-b border-border px-6">
            {tabs.map((t) => {
              const active = statusFilter === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(t.value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  className={`-mb-px flex items-center gap-2 border-b-2 py-3 text-sm transition-colors ${
                    active
                      ? "border-primary font-medium text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for Clients"
                className="h-10 pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="size-4" /> Bulk Import
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <ListFilter className="size-4" /> Filters
                    {sourceFilter !== "all" && (
                      <Badge variant="primary-light" size="sm" radius="full">
                        1
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 space-y-3 p-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Source</label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sources</SelectItem>
                        {Object.entries(CLIENT_SOURCES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="size-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          <DataGrid
            table={table}
            recordCount={filteredClients.length}
            isLoading={isLoading}
            emptyMessage="No clients found."
            tableLayout={{ headerBackground: true, rowBorder: true }}
          >
            <div className="w-full space-y-2.5 px-6 pb-6">
              <DataGridContainer>
                <ContextMenu>
                  <ContextMenuTrigger
                    asChild
                    onContextMenu={(e: React.MouseEvent) => {
                      const id = (e.target as HTMLElement).closest("tr[data-row-id]")?.getAttribute("data-row-id");
                      const client = id ? filteredClients.find((c) => c.publicId === id) : undefined;
                      if (!client) {
                        // Not on a client row: don't open the menu.
                        e.preventDefault();
                        return;
                      }
                      setMenuClient(client);
                    }}
                  >
                    <div>
                      <DataGridScrollArea>
                        <DataGridTable />
                      </DataGridScrollArea>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-44">
                    <ContextMenuItem
                      disabled={!canEdit}
                      onSelect={() => menuClient && openForm(menuClient)}
                    >
                      <Pencil /> Edit
                    </ContextMenuItem>
                    <ContextMenuItem
                      disabled={!canEdit || menuClient?.status === "past"}
                      onSelect={() => menuClient && archiveMutation.mutate(menuClient.publicId)}
                    >
                      <Archive /> Archive
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      variant="destructive"
                      disabled={!canDelete}
                      onSelect={() => menuClient && confirmDelete(menuClient)}
                    >
                      <Trash2 /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </DataGridContainer>
              <DataGridPagination />
            </div>
          </DataGrid>
        </div>
      </div>
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
