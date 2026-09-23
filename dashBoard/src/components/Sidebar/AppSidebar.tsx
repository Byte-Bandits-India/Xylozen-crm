import { ChevronRight } from "lucide-react"
import { NavUser } from "../ui/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "../ui/sidebar"
import { data, type NavMainItem, type NavSubItem } from "@/lib/sidebar"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAdmin, hasPageAccess, user } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute = location.pathname

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url !== "#") {
      e.preventDefault()
      navigate(url)
    }
  }

  const primaryRole = user?.roles?.[0] || "USER"
  const roleDisplay =
    primaryRole === "ADMIN" || primaryRole === "SUPER_ADMIN"
      ? "Administrator"
      : primaryRole === "MANAGER"
      ? "Team Manager"
      : primaryRole === "INTERNAL_USER"
      ? "Internal Staff"
      : primaryRole === "EXTERNAL_USER"
      ? "External Partner"
      : "User"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">ByteBandits Portal</span>
            <span className="text-xs text-white/70">{roleDisplay}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="gap-3">
            {data.navMain.map((item: NavMainItem) => {
              if (item.isAdminOnly && !isAdmin) {
                return null
              }

              // Check single item page access
              if (item.pageKey && !hasPageAccess(item.pageKey)) {
                return null
              }

              // Filter sub-items if present
              const accessibleSubItems = item.items?.filter((subItem: NavSubItem) => {
                if ((subItem as any).roles && (subItem as any).roles.length > 0) {
                  const allowed = (subItem as any).roles as string[]
                  const userRoles = (user?.roles || []).map((r) => r.toUpperCase())
                  if (!isAdmin && !allowed.some((r) => userRoles.includes(r.toUpperCase()))) {
                    return false
                  }
                }
                if (!subItem.pageKey) return true
                return hasPageAccess(subItem.pageKey)
              })

              // If it's a parent menu item with subitems, but none are accessible, skip parent
              if (item.items && (!accessibleSubItems || accessibleSubItems.length === 0)) {
                return null
              }

              return item.items?.length ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={
                    item.isActive ||
                    accessibleSubItems?.some((sub: NavSubItem) => sub.url === currentRoute)
                  }
                  className="group/collapsible"
                >
                  <SidebarMenuItem className="gap-3">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon className="h-5 w-5" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down gap-3">
                      <SidebarMenuSub className="gap-3">
                        {accessibleSubItems?.map((subItem: NavSubItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild isActive={currentRoute === subItem.url}>
                              <a
                                href={subItem.url}
                                onClick={(e) => handleNavigation(e, subItem.url)}
                              >
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={
                      currentRoute === item.url || (item.url === "/" && currentRoute === "/")
                    }
                  >
                    <a href={item.url} onClick={(e) => handleNavigation(e, item.url)}>
                      {item.icon && <item.icon className="h-5 w-5" />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {user?.profile && <NavUser user={user} variant="sidebar" />}
      </SidebarFooter>
    </Sidebar>
  )
}
