import { useEffect, useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { workService } from "@/services/workService"
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

type TeamMember = { id: string; name: string; avatar?: string }

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"))
  useEffect(() => {
    try {
      if (localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark")
        setDark(true)
      }
    } catch {
      /* storage unavailable */
    }
  }, [])
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    setDark(next)
    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch {
      /* storage unavailable */
    }
  }
  return { dark, toggle }
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAdmin, hasPageAccess, user } = useAuth()

  const { dark, toggle } = useDarkMode()
  const [query, setQuery] = useState("")
  const [team, setTeam] = useState<TeamMember[]>([])
  useEffect(() => {
    workService
      .getAssignableUsers()
      .then((users) => setTeam(users.filter((u: any) => u.publicId !== user?.publicId) as TeamMember[]))
      .catch(() => setTeam([]))
  }, [user?.publicId])

  const navigate = useNavigate()
  const location = useLocation()
  const currentRoute = location.pathname

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    if (url !== "#") {
      e.preventDefault()
      navigate(url)
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="gap-3 px-3 pt-4">
        {user?.profile && <NavUser user={user} variant="sidebar" />}
        <div className="flex h-11 items-center gap-3 rounded-xl bg-sidebar-accent px-3">
          <Search className="h-5 w-5 shrink-0 text-sidebar-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/60"
          />
        </div>
        <span className="px-2 pt-1 text-xs text-sidebar-foreground/60">Pages</span>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="gap-3">
            {data.navMain.map((item: NavMainItem) => {
              if (item.isAdminOnly && !isAdmin) {
                return null
              }
              if (query && !item.title.toLowerCase().includes(query.toLowerCase())) {
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

        {team.length > 0 && (
          <SidebarGroup>
            <div className="px-2 pb-2 text-xs text-sidebar-foreground/60">Team</div>
            <SidebarMenu className="gap-1">
              {team.map((m) => (
                <SidebarMenuItem key={m.id}>
                  <SidebarMenuButton className="h-11 gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={m.avatar || ""} alt={m.name} />
                      <AvatarFallback>{m.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{m.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-2 py-2 text-sm text-sidebar-foreground">
          <span>Dark mode</span>
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            onClick={toggle}
            className={`relative h-6 w-11 rounded-full transition-colors ${dark ? "bg-sidebar-primary" : "bg-sidebar-foreground/20"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${dark ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
