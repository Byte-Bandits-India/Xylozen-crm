"use client"

import { useLocation, Link } from "react-router-dom"
import { Bell, ChevronRight, LayoutDashboard, Briefcase, Shield, Users, FileText, Image as ImageIcon, Settings as SettingsIcon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { NavUser } from "@/components/ui/nav-user"
import { useAuth } from "@/context/AuthContext"

type BreadcrumbInfo = {
  section?: string
  sectionIcon?: React.ReactNode
  sectionUrl?: string
  title: string
}

function getBreadcrumbInfo(pathname: string): BreadcrumbInfo {
  if (pathname === "/" || pathname === "") {
    return {
      section: "Overview",
      sectionIcon: <LayoutDashboard className="size-3.5 text-slate-400" />,
      title: "Financial Dashboard",
    }
  }
  if (pathname === "/add-fixed-cost") {
    return {
      section: "Finances",
      sectionIcon: <LayoutDashboard className="size-3.5 text-slate-400" />,
      sectionUrl: "/",
      title: "Add Fixed Cost",
    }
  }
  if (pathname === "/add-operational-cost") {
    return {
      section: "Finances",
      sectionIcon: <LayoutDashboard className="size-3.5 text-slate-400" />,
      sectionUrl: "/",
      title: "Add Operational Cost",
    }
  }
  if (pathname.startsWith("/work/status-board")) {
    return {
      section: "Work Management",
      sectionIcon: <Briefcase className="size-3.5 text-blue-500" />,
      sectionUrl: "/work/status-board",
      title: "Status Board",
    }
  }
  if (pathname.startsWith("/work/impact-board")) {
    return {
      section: "Work Management",
      sectionIcon: <Briefcase className="size-3.5 text-amber-500" />,
      sectionUrl: "/work/impact-board",
      title: "Impact Board",
    }
  }
  if (pathname.startsWith("/work/create")) {
    return {
      section: "Work Management",
      sectionIcon: <Briefcase className="size-3.5 text-emerald-500" />,
      sectionUrl: "/work/status-board",
      title: "Create Assessment",
    }
  }
  if (pathname.startsWith("/work/details") || pathname.startsWith("/work/assessment")) {
    return {
      section: "Work Management",
      sectionIcon: <Briefcase className="size-3.5 text-indigo-500" />,
      sectionUrl: "/work/status-board",
      title: "Assessment Details",
    }
  }
  if (pathname.startsWith("/admin/users")) {
    return {
      section: "Administration",
      sectionIcon: <Shield className="size-3.5 text-purple-500" />,
      sectionUrl: "/admin/users",
      title: "User Management",
    }
  }
  if (pathname.startsWith("/admin/sites")) {
    return {
      section: "Administration",
      sectionIcon: <Shield className="size-3.5 text-purple-500" />,
      sectionUrl: "/admin/sites",
      title: "Site Management",
    }
  }
  if (pathname.startsWith("/admin/contacts")) {
    return {
      section: "Administration",
      sectionIcon: <Shield className="size-3.5 text-purple-500" />,
      sectionUrl: "/admin/contacts",
      title: "Contact Messages",
    }
  }
  if (pathname.startsWith("/clients")) {
    return {
      section: "CRM",
      sectionIcon: <Users className="size-3.5 text-teal-500" />,
      sectionUrl: "/clients",
      title: "Clients",
    }
  }
  if (pathname.startsWith("/invoices")) {
    return {
      section: "Billing",
      sectionIcon: <FileText className="size-3.5 text-cyan-500" />,
      sectionUrl: "/invoices",
      title: "Invoices",
    }
  }
  if (pathname.startsWith("/image-converter")) {
    return {
      section: "Utilities",
      sectionIcon: <ImageIcon className="size-3.5 text-pink-500" />,
      sectionUrl: "/image-converter",
      title: "Image Converter",
    }
  }
  if (pathname.startsWith("/settings")) {
    return {
      section: "Account",
      sectionIcon: <SettingsIcon className="size-3.5 text-brand-blue" />,
      sectionUrl: "/settings",
      title: "Settings & Profile",
    }
  }

  return {
    section: "Dashboard",
    title: "Overview",
  }
}

export function TopNavbar() {
  const { user } = useAuth()
  const location = useLocation()
  const breadcrumb = getBreadcrumbInfo(location.pathname)

  const primaryRole = user?.roles?.[0] || "USER"

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100"
      case "ADMIN":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
    }
  }

  return (
    <header
      id="global-top-navbar"
      className="sticky top-0 z-30 w-full h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs transition-all"
    >
      {/* Left Section: Sidebar Trigger & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <SidebarTrigger
          id="global-sidebar-trigger"
          className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        />

        <Separator orientation="vertical" className="h-5 mx-1 bg-slate-200" />

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          {breadcrumb.section && (
            <div className="flex items-center gap-1.5 text-slate-500 hidden md:flex">
              {breadcrumb.sectionIcon}
              {breadcrumb.sectionUrl ? (
                <Link
                  to={breadcrumb.sectionUrl}
                  className="hover:text-slate-800 transition-colors font-medium text-xs uppercase tracking-wider"
                >
                  {breadcrumb.section}
                </Link>
              ) : (
                <span className="font-medium text-xs uppercase tracking-wider">
                  {breadcrumb.section}
                </span>
              )}
              <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
            </div>
          )}
          <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* Right Section: Notifications, Role Tag & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick notification trigger button */}
        <button
          id="top-navbar-notifications-btn"
          type="button"
          aria-label="View notifications"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Bell className="size-4.5" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Role badge */}
        <div className="hidden lg:block">
          <Badge
            variant="outline"
            className={`text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 border ${getRoleBadgeStyle(
              primaryRole
            )}`}
          >
            {primaryRole.replace("_", " ")}
          </Badge>
        </div>

        {/* Global User Nav Dropdown */}
        {user?.profile && <NavUser user={user} variant="header" />}
      </div>
    </header>
  )
}
export default TopNavbar
