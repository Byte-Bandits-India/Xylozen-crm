import type { ClientStatus } from "@/types";

export const CLIENT_STATUSES: Record<
  ClientStatus,
  { label: string; dot: string; badge: "info-light" | "success-light" | "warning-light" | "secondary" | "destructive-light" }
> = {
  lead: { label: "Lead", dot: "bg-blue-500", badge: "info-light" },
  active: { label: "Active", dot: "bg-emerald-500", badge: "success-light" },
  on_hold: { label: "On hold", dot: "bg-amber-500", badge: "warning-light" },
  past: { label: "Past", dot: "bg-slate-400", badge: "secondary" },
  lost: { label: "Lost", dot: "bg-red-500", badge: "destructive-light" },
};

export const CLIENT_SOURCES: Record<string, string> = {
  rb_pranam: "RB Pranam",
  connection: "Connection",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  website: "Website enquiry",
  whatsapp_group: "WhatsApp group",
  other: "Other",
};

export const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
