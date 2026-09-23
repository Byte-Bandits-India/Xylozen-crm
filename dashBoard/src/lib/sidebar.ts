// src/lib/sidebar.ts
import {
  TrendingUp,
  BarChart,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { AppPagePermission } from "@/types"
import { APP_PAGES, type PageConfig } from "@/config/pages.config"

export type NavSubItem = {
  title: string
  url: string
  pageKey?: AppPagePermission
  roles?: string[]
}

export type NavMainItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  pageKey?: AppPagePermission
  isAdminOnly?: boolean
  items?: NavSubItem[]
}

/**
 * Dynamically constructs the sidebar navigation hierarchy from the centralized APP_PAGES configuration.
 */
export function buildNavMainFromPages(pages: PageConfig[]): NavMainItem[] {
  const navMain: NavMainItem[] = []
  const groupMap = new Map<string, NavMainItem>()

  for (const page of pages) {
    if (!page.sidebar) continue

    // 1. Standalone Top-Level Nav Item (e.g. Dashboard, Clients)
    if (page.sidebar.isStandalone) {
      navMain.push({
        title: page.sidebar.title || page.title,
        url: page.sidebar.url || page.path,
        icon: page.sidebar.icon,
        isActive: page.sidebar.isActive,
        pageKey: page.key,
        isAdminOnly: page.sidebar.isAdminOnly,
      })
      continue
    }

    // 2. Collapsible Group Navigation
    const groupName = page.sidebar.group || "General"
    if (!groupMap.has(groupName)) {
      const groupItem: NavMainItem = {
        title: groupName,
        url: "#",
        icon: page.sidebar.icon,
        isAdminOnly: page.sidebar.isAdminOnly,
        items: [],
      }
      groupMap.set(groupName, groupItem)
      navMain.push(groupItem)
    }

    const group = groupMap.get(groupName)!
    if (page.sidebar.icon && !group.icon) {
      group.icon = page.sidebar.icon
    }
    if (page.sidebar.isAdminOnly !== undefined) {
      group.isAdminOnly = page.sidebar.isAdminOnly
    }

    // Add primary item for this page
    group.items!.push({
      title: page.sidebar.title || page.title,
      url: page.sidebar.url || page.path,
      pageKey: page.key,
      roles: page.sidebar.roles,
    })

    // Add alias navigation items if explicitly specified
    if (page.aliases) {
      for (const alias of page.aliases) {
        if (alias.sidebarTitle) {
          group.items!.push({
            title: alias.sidebarTitle,
            url: alias.path,
            pageKey: page.key,
            roles: alias.allowedRoles?.map((r) => String(r)),
          })
        }
      }
    }
  }

  return navMain
}

export const data = {
  teams: [
    {
      name: "Sales Team",
      logo: TrendingUp,
      plan: "Enterprise",
    },
    {
      name: "Marketing Team",
      logo: BarChart,
      plan: "Pro",
    },
    {
      name: "Support Team",
      logo: Users,
      plan: "Free",
    },
  ],
  navMain: buildNavMainFromPages(APP_PAGES),
}