export type ProjectStatus = "backlog" | "in_progress" | "paused" | "done";

export type ClientProject = {
  id: string;
  name: string;
  companyName?: string;
  logoUrl?: string;
  status: ProjectStatus;
  summaryTitle?: string;
  summaryText?: string;
  memberIds: string[];
  startDate?: string;
  progress: number;
  payment: number;
};

export type ProjectMember = {
  publicId: string;
  name?: string;
  email?: string;
  profile?: { firstName: string; lastName: string };
};

export const PROJECT_STATUSES: Record<
  ProjectStatus,
  { label: string; variant: "secondary" | "warning-light" | "info-light" | "success-light" }
> = {
  backlog: { label: "Backlog", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning-light" },
  paused: { label: "Paused", variant: "info-light" },
  done: { label: "Done", variant: "success-light" },
};

export const memberName = (m: ProjectMember) =>
  m.profile ? `${m.profile.firstName} ${m.profile.lastName}`.trim() : m.name || m.email || "Unknown";

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
